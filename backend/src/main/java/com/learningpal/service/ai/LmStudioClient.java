package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Communicates with a local OpenAI-compatible LM Studio server using JDK HttpClient.
 * Strictly avoids logging prompt content, extracted text, or model outputs at INFO or above.
 */
@Component
public class LmStudioClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(LmStudioClient.class);

    private final AiConfigProperties aiConfig;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public LmStudioClient(AiConfigProperties aiConfig, ObjectMapper objectMapper) {
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public boolean isAvailable() {
        if (!aiConfig.isEnabled()) {
            return false;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiConfig.getBaseUrl() + "/v1/models"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("LM Studio availability check failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public List<String> listModels() {
        if (!aiConfig.isEnabled()) {
            return Collections.emptyList();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiConfig.getBaseUrl() + "/v1/models"))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return Collections.emptyList();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode dataNode = root.get("data");
            if (dataNode == null || !dataNode.isArray()) {
                return Collections.emptyList();
            }

            List<String> models = new ArrayList<>();
            for (JsonNode item : dataNode) {
                JsonNode idNode = item.get("id");
                if (idNode != null && !idNode.asText().isBlank()) {
                    models.add(idNode.asText());
                }
            }
            return models;
        } catch (Exception e) {
            log.debug("Failed to list models from LM Studio: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public String generateChatCompletion(String systemPrompt, String userPrompt, double temperature, int timeoutSeconds) {
        if (!aiConfig.isEnabled()) {
            throw new IllegalStateException("AI question drafting is currently disabled in server configuration.");
        }

        try {
            Map<String, Object> payload = buildPayload(systemPrompt, userPrompt, temperature);
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiConfig.getBaseUrl() + "/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(timeoutSeconds > 0 ? timeoutSeconds : aiConfig.getRequestTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("LM Studio returned non-200 status code: {}", response.statusCode());
                throw new IllegalStateException("LM Studio returned error code: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode choices = root.get("choices");
            if (choices == null || !choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException("Empty or malformed completion response from local LLM.");
            }

            JsonNode firstChoice = choices.get(0);
            JsonNode message = firstChoice.get("message");
            if (message == null || message.get("content") == null) {
                throw new IllegalStateException("Missing message content in completion choice.");
            }

            return message.get("content").asText();
        } catch (Exception e) {
            log.warn("LM Studio completion request failed: {}", e.getMessage());
            throw new RuntimeException("LLM generation request failed: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> buildPayload(String systemPrompt, String userPrompt, double temperature) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", aiConfig.getModel());
        payload.put("temperature", temperature);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        payload.put("messages", messages);

        // Structured JSON schema enforcement for OpenAI/LM Studio compatible endpoints
        Map<String, Object> questionItemProperties = new LinkedHashMap<>();
        questionItemProperties.put("question", Map.of("type", "string"));
        questionItemProperties.put("choices", Map.of("type", "array", "items", Map.of("type", "string")));
        questionItemProperties.put("correctIndex", Map.of("type", "integer"));
        questionItemProperties.put("explanation", Map.of("type", "string"));
        questionItemProperties.put("difficulty", Map.of("type", "string", "enum", List.of("EASY", "MEDIUM", "HARD")));
        questionItemProperties.put("evidenceQuote", Map.of("type", "string"));

        Map<String, Object> questionItemSchema = new LinkedHashMap<>();
        questionItemSchema.put("type", "object");
        questionItemSchema.put("properties", questionItemProperties);
        questionItemSchema.put("required", List.of("question", "choices", "correctIndex", "explanation", "difficulty", "evidenceQuote"));

        Map<String, Object> questionsArrayProperty = new LinkedHashMap<>();
        questionsArrayProperty.put("type", "array");
        questionsArrayProperty.put("items", questionItemSchema);

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", Map.of("questions", questionsArrayProperty));
        schema.put("required", List.of("questions"));

        Map<String, Object> jsonSchema = new LinkedHashMap<>();
        jsonSchema.put("name", "questions_response");
        jsonSchema.put("schema", schema);

        payload.put("response_format", Map.of("type", "json_schema", "json_schema", jsonSchema));

        return payload;
    }
}

package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Communicates with an OpenAI-compatible LLM endpoint (local LM Studio or Google Gemini API)
 * using JDK HttpClient.
 * Strictly avoids logging prompt content, extracted text, model outputs, or API keys.
 */
@Component
public class LmStudioClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(LmStudioClient.class);

    @FunctionalInterface
    public interface Sleeper {
        void sleep(long millis) throws InterruptedException;
    }

    private final AiConfigProperties aiConfig;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Sleeper sleeper;

    @Autowired
    public LmStudioClient(AiConfigProperties aiConfig, ObjectMapper objectMapper) {
        this(
                aiConfig,
                objectMapper,
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(Duration.ofSeconds(5))
                        .build(),
                Thread::sleep
        );
    }

    public LmStudioClient(AiConfigProperties aiConfig, ObjectMapper objectMapper, HttpClient httpClient, Sleeper sleeper) {
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.sleeper = sleeper;
    }

    private String resolveEndpoint(String path) {
        String base = aiConfig.getActiveBaseUrl().trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (aiConfig.isGeminiProvider()) {
            return base + path;
        } else {
            if (base.endsWith("/v1")) {
                return base + path;
            }
            return base + "/v1" + path;
        }
    }

    private HttpRequest.Builder createRequestBuilder(String endpoint, Duration timeout) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(timeout);

        if (aiConfig.isGeminiProvider()) {
            String key = aiConfig.getGeminiApiKey();
            if (key != null && !key.isBlank()) {
                builder.header("Authorization", "Bearer " + key.trim());
            }
        }
        return builder;
    }

    @Override
    public boolean isAvailable() {
        if (!aiConfig.isEnabled()) {
            return false;
        }
        if (aiConfig.isGeminiProvider() && (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isBlank())) {
            return false;
        }
        try {
            String endpoint = resolveEndpoint("/models");
            HttpRequest request = createRequestBuilder(endpoint, Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.debug("LLM availability check failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public List<String> listModels() {
        if (!aiConfig.isEnabled()) {
            return Collections.emptyList();
        }
        if (aiConfig.isGeminiProvider() && (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isBlank())) {
            return Collections.emptyList();
        }
        try {
            String endpoint = resolveEndpoint("/models");
            HttpRequest request = createRequestBuilder(endpoint, Duration.ofSeconds(5))
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
            log.debug("Failed to list models from LLM endpoint: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public String generateChatCompletion(String systemPrompt, String userPrompt, double temperature, int timeoutSeconds) {
        if (!aiConfig.isEnabled()) {
            throw new IllegalStateException("AI question drafting is currently disabled in server configuration.");
        }
        if (aiConfig.isGeminiProvider() && (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isBlank())) {
            throw new IllegalStateException("AI question drafting is unavailable: Gemini API key is not configured.");
        }

        int maxRetries = aiConfig.isGeminiProvider() ? Math.max(0, aiConfig.getGeminiMaxRetries()) : 0;
        int attempt = 0;

        while (true) {
            attempt++;
            try {
                Map<String, Object> payload = buildPayload(systemPrompt, userPrompt, temperature);
                String jsonBody = objectMapper.writeValueAsString(payload);
                String endpoint = resolveEndpoint("/chat/completions");

                HttpRequest request = createRequestBuilder(
                        endpoint,
                        Duration.ofSeconds(timeoutSeconds > 0 ? timeoutSeconds : aiConfig.getRequestTimeoutSeconds())
                )
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int statusCode = response.statusCode();

                if (statusCode == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode choices = root.get("choices");
                    if (choices == null || !choices.isArray() || choices.isEmpty()) {
                        throw new IllegalStateException("Empty or malformed completion response from LLM.");
                    }

                    JsonNode firstChoice = choices.get(0);
                    JsonNode message = firstChoice.get("message");
                    if (message == null || message.get("content") == null) {
                        throw new IllegalStateException("Missing message content in completion choice.");
                    }

                    return message.get("content").asText();
                }

                if (aiConfig.isGeminiProvider() && (statusCode == 429 || statusCode == 503)) {
                    if (attempt <= maxRetries) {
                        long backoffMs = extractRetryAfterMs(response, attempt);
                        log.warn("Gemini returned HTTP {} (attempt {}/{}). Backing off for {} ms before retry.",
                                statusCode, attempt, maxRetries, backoffMs);
                        try {
                            sleeper.sleep(backoffMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Interrupted during rate limit backoff", ie);
                        }
                        continue;
                    } else {
                        log.warn("Gemini rate limit exceeded after {} retries (status {}).", maxRetries, statusCode);
                        throw new LlmRateLimitException("Google's free limit was reached. Try again later.");
                    }
                }

                String errorDetail = extractErrorDetail(response.body());
                log.warn("LLM endpoint returned non-200 status code: {}{}", statusCode, errorDetail.isBlank() ? "" : " - " + errorDetail);
                throw new IllegalStateException("LLM endpoint returned error code: " + statusCode + (errorDetail.isBlank() ? "" : " (" + errorDetail + ")"));

            } catch (LlmRateLimitException rle) {
                throw rle;
            } catch (Exception e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                log.warn("LLM completion request failed: {}", e.getMessage());
                throw new RuntimeException("LLM generation request failed: " + e.getMessage(), e);
            }
        }
    }

    private String extractErrorDetail(String body) {
        if (body == null || body.isBlank()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.isArray() && !root.isEmpty()) {
                root = root.get(0);
            }
            JsonNode errorNode = root.get("error");
            if (errorNode != null) {
                if (errorNode.isTextual()) {
                    return errorNode.asText();
                }
                if (errorNode.has("message")) {
                    return errorNode.get("message").asText();
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    private long extractRetryAfterMs(HttpResponse<?> response, int attempt) {
        Optional<String> retryHeader = response.headers().firstValue("Retry-After");
        if (retryHeader.isPresent()) {
            try {
                long sec = Long.parseLong(retryHeader.get().trim());
                if (sec > 0) {
                    return Math.min(sec * 1000L, 30000L); // capped at 30s
                }
            } catch (NumberFormatException ignored) {}
        }
        return Math.min(attempt * 1000L, 10000L);
    }

    private Map<String, Object> buildPayload(String systemPrompt, String userPrompt, double temperature) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", aiConfig.getActiveModel());
        payload.put("temperature", temperature);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        payload.put("messages", messages);

        // Structured JSON schema enforcement for OpenAI/LM Studio/Gemini compatible endpoints
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

package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.entity.DifficultyLevel;

import java.util.*;

/**
 * Parses and strictly validates question batches produced by the local LLM.
 * Strips reasoning blocks (<think>...</think>) before parsing.
 */
public class AiResponseParser {

    private final ObjectMapper objectMapper;

    public AiResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record ParsedQuestion(
            String question,
            List<String> choices,
            int correctIndex,
            String explanation,
            DifficultyLevel difficulty,
            String evidenceQuote
    ) {}

    public static String stripThinkBlocks(String text) {
        if (text == null) {
            return "";
        }
        // Remove <think>...</think> including multiline contents
        return text.replaceAll("(?is)<think>.*?</think>", "").trim();
    }

    /**
     * Parses and validates raw LLM output into validated question drafts.
     * Throws IllegalArgumentException if JSON is completely malformed or missing questions array.
     */
    public List<ParsedQuestion> parseAndValidate(String rawOutput, Set<String> seenNormalizedQuestions) throws Exception {
        String cleanText = stripThinkBlocks(rawOutput);

        // Find JSON boundaries in case model outputs leading/trailing text outside schema
        int firstBrace = cleanText.indexOf('{');
        int lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        JsonNode root = objectMapper.readTree(cleanText);
        JsonNode questionsNode = root.get("questions");
        if (questionsNode == null || !questionsNode.isArray()) {
            throw new IllegalArgumentException("Response missing required 'questions' array.");
        }

        List<ParsedQuestion> result = new ArrayList<>();

        for (JsonNode qNode : questionsNode) {
            ParsedQuestion parsed = validateSingleQuestion(qNode);
            if (parsed != null) {
                String normQ = EvidenceVerifier.normalizeForComparison(parsed.question());
                // Drop near-duplicate questions within the same job
                if (!seenNormalizedQuestions.contains(normQ)) {
                    seenNormalizedQuestions.add(normQ);
                    result.add(parsed);
                }
            }
        }

        return result;
    }

    private ParsedQuestion validateSingleQuestion(JsonNode node) {
        if (node == null || !node.isObject()) {
            return null;
        }

        JsonNode qTextNode = node.get("question");
        if (qTextNode == null || qTextNode.asText().isBlank()) {
            return null;
        }
        String questionText = qTextNode.asText().trim();
        if (questionText.length() > 1000) {
            questionText = questionText.substring(0, 1000);
        }

        JsonNode choicesNode = node.get("choices");
        if (choicesNode == null || !choicesNode.isArray() || choicesNode.size() != 4) {
            return null;
        }

        List<String> choices = new ArrayList<>(4);
        for (JsonNode c : choicesNode) {
            String choiceText = c.asText().trim();
            if (choiceText.isEmpty()) {
                return null;
            }
            if (choiceText.length() > 500) {
                choiceText = choiceText.substring(0, 500);
            }
            choices.add(choiceText);
        }

        JsonNode correctIndexNode = node.get("correctIndex");
        if (correctIndexNode == null || !correctIndexNode.isInt()) {
            return null;
        }
        int correctIndex = correctIndexNode.asInt();
        if (correctIndex < 0 || correctIndex > 3) {
            return null;
        }

        JsonNode explNode = node.get("explanation");
        if (explNode == null || explNode.asText().isBlank()) {
            return null;
        }
        String explanation = explNode.asText().trim();
        if (explanation.length() > 1000) {
            explanation = explanation.substring(0, 1000);
        }

        DifficultyLevel difficulty = DifficultyLevel.MEDIUM;
        JsonNode diffNode = node.get("difficulty");
        if (diffNode != null && !diffNode.asText().isBlank()) {
            try {
                difficulty = DifficultyLevel.valueOf(diffNode.asText().trim().toUpperCase(Locale.ROOT));
            } catch (Exception ignored) {
                difficulty = DifficultyLevel.MEDIUM;
            }
        }

        JsonNode quoteNode = node.get("evidenceQuote");
        String evidenceQuote = quoteNode != null ? quoteNode.asText().trim() : "";
        if (evidenceQuote.length() > 1000) {
            evidenceQuote = evidenceQuote.substring(0, 1000);
        }

        return new ParsedQuestion(questionText, choices, correctIndex, explanation, difficulty, evidenceQuote);
    }
}

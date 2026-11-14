package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.dto.AiCriterionSuggestionDto;
import com.learningpal.dto.EssayRubricCriterionDto;
import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.EssayRubricCriterion;
import com.learningpal.entity.QuestionType;

import java.util.*;

/**
 * Parses and strictly validates question batches produced by the LLM.
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

    public record ParsedDraft(
            QuestionType questionType,
            String question,
            List<String> choices,
            int correctIndex,
            List<String> acceptedAnswers,
            List<EssayRubricCriterionDto> rubricCriteria,
            double points,
            String explanation,
            DifficultyLevel difficulty,
            String evidenceQuote
    ) {}

    public record ParseBatchResult(
            List<ParsedDraft> accepted,
            int droppedCount
    ) {}

    public record ParsedEssaySuggestion(
            List<AiCriterionSuggestionDto> criteria,
            String overallFeedback
    ) {}

    public static String stripThinkBlocks(String text) {
        if (text == null) {
            return "";
        }
        // Remove <think>...</think> including multiline contents
        return text.replaceAll("(?is)<think>.*?</think>", "").trim();
    }

    /**
     * Backward-compatible MCQ parser.
     */
    public List<ParsedQuestion> parseAndValidate(String rawOutput, Set<String> seenNormalizedQuestions) throws Exception {
        ParseBatchResult batch = parseAndValidate(rawOutput, QuestionType.MULTIPLE_CHOICE, seenNormalizedQuestions);
        return batch.accepted().stream()
                .map(d -> new ParsedQuestion(
                        d.question(),
                        d.choices(),
                        d.correctIndex(),
                        d.explanation(),
                        d.difficulty(),
                        d.evidenceQuote()
                ))
                .toList();
    }

    /**
     * Parses and validates raw LLM output for the given QuestionType, returning accepted drafts and dropped count.
     * Throws IllegalArgumentException if JSON is completely malformed or missing questions array.
     */
    public ParseBatchResult parseAndValidate(
            String rawOutput,
            QuestionType questionType,
            Set<String> seenNormalizedQuestions) throws Exception {
        QuestionType effectiveType = questionType != null ? questionType.canonical() : QuestionType.MULTIPLE_CHOICE;
        String cleanText = extractJsonPayload(rawOutput);

        JsonNode root = objectMapper.readTree(cleanText);
        JsonNode questionsNode = root.get("questions");
        if (questionsNode == null && root.isArray()) {
            questionsNode = root;
        }
        if (questionsNode == null || !questionsNode.isArray()) {
            throw new IllegalArgumentException("Response missing required 'questions' array.");
        }

        List<ParsedDraft> result = new ArrayList<>();
        int dropped = 0;

        for (JsonNode qNode : questionsNode) {
            ParsedDraft parsed = switch (effectiveType) {
                case ENUMERATION -> validateEnumeration(qNode);
                case ESSAY -> validateEssay(qNode);
                default -> validateMultipleChoice(qNode);
            };
            if (parsed == null) {
                dropped++;
                continue;
            }
            String normQ = EvidenceVerifier.normalizeForComparison(parsed.question());
            // Drop near-duplicate questions within the same job
            if (seenNormalizedQuestions.contains(normQ)) {
                dropped++;
                continue;
            }
            seenNormalizedQuestions.add(normQ);
            result.add(parsed);
        }

        return new ParseBatchResult(result, dropped);
    }

    private String extractJsonPayload(String rawOutput) {
        String cleanText = stripThinkBlocks(rawOutput);

        // Strip markdown code fences if present (e.g. ```json ... ```)
        if (cleanText.contains("```")) {
            cleanText = cleanText.replaceAll("(?s)```(?:json)?\\s*(.*?)\\s*```", "$1").trim();
        }

        int firstObj = cleanText.indexOf('{');
        int firstArr = cleanText.indexOf('[');

        if (firstArr >= 0 && (firstObj < 0 || firstArr < firstObj)) {
            int lastArr = cleanText.lastIndexOf(']');
            if (lastArr > firstArr) {
                cleanText = cleanText.substring(firstArr, lastArr + 1);
            }
        } else if (firstObj >= 0) {
            int lastObj = cleanText.lastIndexOf('}');
            if (lastObj > firstObj) {
                cleanText = cleanText.substring(firstObj, lastObj + 1);
            }
        }
        return cleanText;
    }

    private ParsedDraft validateMultipleChoice(JsonNode node) {
        if (node == null || !node.isObject()) {
            return null;
        }
        String questionText = readRequiredText(node, "question", 1000);
        if (questionText == null) {
            return null;
        }

        JsonNode choicesNode = node.get("choices");
        if (choicesNode == null || !choicesNode.isArray() || choicesNode.size() != 4) {
            return null;
        }

        List<String> choices = new ArrayList<>(4);
        for (JsonNode c : choicesNode) {
            if (c == null || !c.isTextual()) {
                return null;
            }
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

        String explanation = readRequiredText(node, "explanation", 1000);
        if (explanation == null) {
            return null;
        }

        return new ParsedDraft(
                QuestionType.MULTIPLE_CHOICE,
                questionText,
                choices,
                correctIndex,
                List.of(),
                List.of(),
                1.0,
                explanation,
                parseDifficulty(node),
                parseEvidenceQuote(node)
        );
    }

    private ParsedDraft validateEnumeration(JsonNode node) {
        if (node == null || !node.isObject()) {
            return null;
        }
        String questionText = readRequiredText(node, "question", 2000);
        if (questionText == null) {
            return null;
        }

        JsonNode answersNode = node.get("acceptedAnswers");
        if (answersNode == null || !answersNode.isArray() || answersNode.isEmpty() || answersNode.size() > 10) {
            return null;
        }

        List<String> variants = new ArrayList<>(answersNode.size());
        for (JsonNode a : answersNode) {
            if (a == null || !a.isTextual()) {
                return null;
            }
            String variant = a.asText().trim();
            if (variant.isEmpty() || variant.length() > 100) {
                return null;
            }
            variants.add(variant);
        }

        double points = 1.0;
        JsonNode pointsNode = node.get("points");
        if (pointsNode != null && !pointsNode.isNull()) {
            if (!pointsNode.isNumber() || pointsNode.asDouble() <= 0) {
                return null;
            }
            points = pointsNode.asDouble();
        }

        String explanation = readRequiredText(node, "explanation", 2000);
        if (explanation == null) {
            return null;
        }

        return new ParsedDraft(
                QuestionType.ENUMERATION,
                questionText,
                List.of(),
                0,
                variants,
                List.of(),
                points,
                explanation,
                parseDifficulty(node),
                parseEvidenceQuote(node)
        );
    }

    private ParsedDraft validateEssay(JsonNode node) {
        if (node == null || !node.isObject()) {
            return null;
        }
        String questionText = readRequiredText(node, "question", 2000);
        if (questionText == null) {
            return null;
        }

        JsonNode rubricNode = node.get("rubricCriteria");
        if (rubricNode == null || !rubricNode.isArray() || rubricNode.size() < 2 || rubricNode.size() > 5) {
            return null;
        }

        List<EssayRubricCriterionDto> criteria = new ArrayList<>(rubricNode.size());
        int totalPoints = 0;
        for (JsonNode cNode : rubricNode) {
            if (cNode == null || !cNode.isObject()) {
                return null;
            }
            String name = readRequiredText(cNode, "name", 100);
            if (name == null) {
                return null;
            }
            String description = "";
            JsonNode descNode = cNode.get("description");
            if (descNode != null && !descNode.isNull()) {
                if (!descNode.isTextual()) {
                    return null;
                }
                description = descNode.asText().trim();
                if (description.length() > 500) {
                    return null;
                }
            }
            JsonNode maxPtsNode = cNode.get("maxPoints");
            if (maxPtsNode == null || !maxPtsNode.isInt()) {
                return null;
            }
            int maxPts = maxPtsNode.asInt();
            if (maxPts <= 0) {
                return null;
            }
            totalPoints += maxPts;
            criteria.add(new EssayRubricCriterionDto(null, name, description, maxPts, criteria.size()));
        }

        String modelNote = null;
        JsonNode noteNode = node.get("modelAnswerNote");
        if (noteNode == null || noteNode.isNull()) {
            noteNode = node.get("explanation");
        }
        if (noteNode != null && !noteNode.isNull()) {
            if (!noteNode.isTextual()) {
                return null;
            }
            String trimmed = noteNode.asText().trim();
            if (trimmed.length() > 2000) {
                return null;
            }
            if (!trimmed.isEmpty()) {
                modelNote = trimmed;
            }
        }

        return new ParsedDraft(
                QuestionType.ESSAY,
                questionText,
                List.of(),
                0,
                List.of(),
                criteria,
                totalPoints,
                modelNote,
                parseDifficulty(node),
                parseEvidenceQuote(node)
        );
    }

    private String readRequiredText(JsonNode node, String field, int maxLength) {
        JsonNode val = node.get(field);
        if (val == null || val.isNull() || !val.isTextual()) {
            return null;
        }
        String text = val.asText().trim();
        if (text.isEmpty() || text.length() > maxLength) {
            return null;
        }
        return text;
    }

    private DifficultyLevel parseDifficulty(JsonNode node) {
        DifficultyLevel difficulty = DifficultyLevel.MEDIUM;
        JsonNode diffNode = node.get("difficulty");
        if (diffNode != null && !diffNode.asText().isBlank()) {
            try {
                difficulty = DifficultyLevel.valueOf(diffNode.asText().trim().toUpperCase(Locale.ROOT));
            } catch (Exception ignored) {
                difficulty = DifficultyLevel.MEDIUM;
            }
        }
        return difficulty;
    }

    private String parseEvidenceQuote(JsonNode node) {
        JsonNode quoteNode = node.get("evidenceQuote");
        String evidenceQuote = quoteNode != null && !quoteNode.isNull() ? quoteNode.asText().trim() : "";
        if (evidenceQuote.length() > 1000) {
            evidenceQuote = evidenceQuote.substring(0, 1000);
        }
        return evidenceQuote;
    }

    /**
     * Strictly parses and validates an AI essay grade suggestion against the question's rubric criteria.
     */
    public ParsedEssaySuggestion parseAndValidateEssaySuggestion(
            String rawOutput,
            List<EssayRubricCriterion> rubricCriteria) throws Exception {
        if (rubricCriteria == null || rubricCriteria.isEmpty()) {
            throw new IllegalArgumentException("Essay question has no rubric criteria.");
        }
        String cleanText = extractJsonPayload(rawOutput);
        JsonNode root = objectMapper.readTree(cleanText);
        if (root == null || !root.isObject()) {
            throw new IllegalArgumentException("Response must be a JSON object.");
        }

        JsonNode criteriaNode = root.get("criteria");
        if (criteriaNode == null || !criteriaNode.isArray() || criteriaNode.size() != rubricCriteria.size()) {
            throw new IllegalArgumentException("Expected exactly " + rubricCriteria.size() + " criterion entries.");
        }

        Map<Long, EssayRubricCriterion> byId = new LinkedHashMap<>();
        for (EssayRubricCriterion c : rubricCriteria) {
            byId.put(c.getId(), c);
        }

        Map<Long, AiCriterionSuggestionDto> parsedById = new LinkedHashMap<>();
        for (JsonNode item : criteriaNode) {
            if (item == null || !item.isObject()) {
                throw new IllegalArgumentException("Criterion entry must be an object.");
            }
            JsonNode idNode = item.get("criterionId");
            if (idNode == null || !idNode.isIntegralNumber()) {
                throw new IllegalArgumentException("Missing or non-integer criterionId.");
            }
            long cid = idNode.asLong();
            EssayRubricCriterion expected = byId.get(cid);
            if (expected == null) {
                throw new IllegalArgumentException("Unknown criterionId: " + cid);
            }
            if (parsedById.containsKey(cid)) {
                throw new IllegalArgumentException("Duplicate criterionId: " + cid);
            }

            JsonNode ptsNode = item.get("points");
            if (ptsNode == null || !ptsNode.isInt()) {
                throw new IllegalArgumentException("Points for criterion " + cid + " must be an integer.");
            }
            int pts = ptsNode.asInt();
            if (pts < 0 || pts > expected.getMaxPoints()) {
                throw new IllegalArgumentException("Points for criterion " + cid + " out of bounds [0, " + expected.getMaxPoints() + "].");
            }

            String reason = readRequiredText(item, "reason", 300);
            if (reason == null) {
                throw new IllegalArgumentException("Reason for criterion " + cid + " must be non-blank and <= 300 chars.");
            }

            parsedById.put(cid, new AiCriterionSuggestionDto(cid, pts, reason));
        }

        if (parsedById.size() != rubricCriteria.size()) {
            throw new IllegalArgumentException("Not all rubric criteria were scored.");
        }

        JsonNode feedbackNode = root.get("overallFeedback");
        if (feedbackNode == null || feedbackNode.isNull() || !feedbackNode.isTextual()) {
            throw new IllegalArgumentException("Missing overallFeedback string.");
        }
        String overallFeedback = feedbackNode.asText().trim();
        if (overallFeedback.length() > 600) {
            throw new IllegalArgumentException("overallFeedback exceeds 600 characters.");
        }

        List<AiCriterionSuggestionDto> ordered = new ArrayList<>(rubricCriteria.size());
        for (EssayRubricCriterion c : rubricCriteria) {
            ordered.add(parsedById.get(c.getId()));
        }
        return new ParsedEssaySuggestion(ordered, overallFeedback);
    }
}

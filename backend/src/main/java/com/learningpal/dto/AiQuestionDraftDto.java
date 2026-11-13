package com.learningpal.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.entity.AiDraftStatus;
import com.learningpal.entity.AiQuestionDraft;
import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.QuestionType;

import java.time.Instant;
import java.util.List;

public record AiQuestionDraftDto(
        Long id,
        Long jobId,
        int sectionIndex,
        QuestionType questionType,
        String questionText,
        List<String> choices,
        int correctIndex,
        List<String> acceptedAnswers,
        List<EssayRubricCriterionDto> rubricCriteria,
        double points,
        String explanation,
        String modelAnswerNote,
        DifficultyLevel difficulty,
        String evidenceQuote,
        boolean evidenceVerified,
        AiDraftStatus status,
        Long approvedQuestionId,
        Instant createdAt,
        Instant updatedAt
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static AiQuestionDraftDto fromEntity(AiQuestionDraft d) {
        QuestionType type = d.getQuestionType();
        List<String> acceptedAnswers = parseJsonList(d.getAcceptedAnswersJson(), new TypeReference<>() {});
        List<EssayRubricCriterionDto> rubricCriteria = parseJsonList(d.getRubricCriteriaJson(), new TypeReference<>() {});
        String modelAnswerNote = type == QuestionType.ESSAY ? d.getExplanation() : null;

        return new AiQuestionDraftDto(
                d.getId(),
                d.getJob().getId(),
                d.getSectionIndex(),
                type,
                d.getQuestionText(),
                d.getChoicesList(),
                d.getCorrectIndex(),
                acceptedAnswers,
                rubricCriteria,
                d.getPoints(),
                d.getExplanation(),
                modelAnswerNote,
                d.getDifficulty(),
                d.getEvidenceQuote(),
                d.isEvidenceVerified(),
                d.getStatus(),
                d.getApprovedQuestion() != null ? d.getApprovedQuestion().getId() : null,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }

    private static <T> List<T> parseJsonList(String json, TypeReference<List<T>> typeRef) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<T> parsed = MAPPER.readValue(json, typeRef);
            return parsed != null ? parsed : List.of();
        } catch (Exception ignored) {
            return List.of();
        }
    }
}

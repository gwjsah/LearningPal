package com.learningpal.dto;

import java.time.Instant;
import java.util.List;

public record TeacherAnswerReviewDto(
        Long answerId,
        Long questionId,
        String questionText,
        Long topicId,
        String topicName,
        Double pointsPossible,
        List<ChoiceReviewDto> choices,
        Long studentChoiceId,
        String studentChoiceLabel,
        String studentChoiceText,
        Long correctChoiceId,
        String correctChoiceLabel,
        String correctChoiceText,
        String explanation,
        Double autoScore,
        Double teacherScore,
        Double finalScore,
        String teacherComment,
        Instant gradedAt,
        boolean adjusted,
        String type,
        String studentTextAnswer,
        List<String> acceptedAnswers,
        List<TeacherRubricCriterionScoreDto> rubricCriteria,
        boolean graded,
        AiGradeSuggestionDto aiSuggestion
) {
    public TeacherAnswerReviewDto(
            Long answerId,
            Long questionId,
            String questionText,
            Long topicId,
            String topicName,
            Double pointsPossible,
            List<ChoiceReviewDto> choices,
            Long studentChoiceId,
            String studentChoiceLabel,
            String studentChoiceText,
            Long correctChoiceId,
            String correctChoiceLabel,
            String correctChoiceText,
            String explanation,
            Double autoScore,
            Double teacherScore,
            Double finalScore,
            String teacherComment,
            Instant gradedAt,
            boolean adjusted,
            String type,
            String studentTextAnswer,
            List<String> acceptedAnswers,
            List<TeacherRubricCriterionScoreDto> rubricCriteria,
            boolean graded
    ) {
        this(answerId, questionId, questionText, topicId, topicName, pointsPossible, choices,
                studentChoiceId, studentChoiceLabel, studentChoiceText, correctChoiceId,
                correctChoiceLabel, correctChoiceText, explanation, autoScore, teacherScore,
                finalScore, teacherComment, gradedAt, adjusted,
                type, studentTextAnswer, acceptedAnswers, rubricCriteria, graded, null);
    }

    public TeacherAnswerReviewDto(
            Long answerId,
            Long questionId,
            String questionText,
            Long topicId,
            String topicName,
            Double pointsPossible,
            List<ChoiceReviewDto> choices,
            Long studentChoiceId,
            String studentChoiceLabel,
            String studentChoiceText,
            Long correctChoiceId,
            String correctChoiceLabel,
            String correctChoiceText,
            String explanation,
            Double autoScore,
            Double teacherScore,
            Double finalScore,
            String teacherComment,
            Instant gradedAt,
            boolean adjusted
    ) {
        this(answerId, questionId, questionText, topicId, topicName, pointsPossible, choices,
                studentChoiceId, studentChoiceLabel, studentChoiceText, correctChoiceId,
                correctChoiceLabel, correctChoiceText, explanation, autoScore, teacherScore,
                finalScore, teacherComment, gradedAt, adjusted,
                "MULTIPLE_CHOICE", null, List.of(), List.of(), finalScore != null, null);
    }
}


package com.learningpal.dto;

import java.util.List;

public record QuestionReviewDto(
        Long questionId,
        String questionText,
        String topicName,
        List<ChoiceReviewDto> choices,
        Long studentChoiceId,
        Long correctChoiceId,
        String explanation,
        Double pointsEarned,
        Double pointsPossible,
        boolean isCorrect,
        boolean adjusted,
        String teacherComment,
        Double autoScore,
        Double teacherScore
) {
    public QuestionReviewDto(
            Long questionId,
            String questionText,
            String topicName,
            List<ChoiceReviewDto> choices,
            Long studentChoiceId,
            Long correctChoiceId,
            String explanation,
            Double pointsEarned,
            Double pointsPossible,
            boolean isCorrect
    ) {
        this(questionId, questionText, topicName, choices, studentChoiceId, correctChoiceId, explanation, pointsEarned, pointsPossible, isCorrect, false, null, pointsEarned, null);
    }
}

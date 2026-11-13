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
        Double teacherScore,
        String type,
        String studentTextAnswer,
        List<String> acceptedAnswers,
        List<StudentRubricScoreDto> rubricScores,
        boolean graded
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
        this(questionId, questionText, topicName, choices, studentChoiceId, correctChoiceId, explanation,
                pointsEarned, pointsPossible, isCorrect, false, null, pointsEarned, null,
                "MULTIPLE_CHOICE", null, List.of(), List.of(), true);
    }

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
            boolean isCorrect,
            boolean adjusted,
            String teacherComment,
            Double autoScore,
            Double teacherScore
    ) {
        this(questionId, questionText, topicName, choices, studentChoiceId, correctChoiceId, explanation,
                pointsEarned, pointsPossible, isCorrect, adjusted, teacherComment, autoScore, teacherScore,
                "MULTIPLE_CHOICE", null, List.of(), List.of(), true);
    }
}

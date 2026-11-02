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
        boolean isCorrect
) {}


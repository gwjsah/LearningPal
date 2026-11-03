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
        boolean adjusted
) {}


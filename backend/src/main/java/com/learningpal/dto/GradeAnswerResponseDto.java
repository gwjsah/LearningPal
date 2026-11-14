package com.learningpal.dto;

import com.learningpal.entity.MasteryStatus;

public record GradeAnswerResponseDto(
        TeacherAnswerReviewDto answer,
        Double newAttemptTotalScore,
        Double newAttemptPercentage,
        Long affectedTopicId,
        String affectedTopicName,
        Double newTopicMasteryPercent,
        MasteryStatus newTopicStatus
) {}


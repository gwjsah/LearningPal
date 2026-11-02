package com.learningpal.dto;

import java.time.Instant;
import java.util.List;

public record AttemptResultDto(
        Long attemptId,
        Long assessmentId,
        String assessmentTitle,
        Double score,
        Double maxScore,
        Double percentage,
        Instant submittedAt,
        List<TopicBreakdownDto> topicBreakdowns,
        List<QuestionReviewDto> questionReviews
) {}


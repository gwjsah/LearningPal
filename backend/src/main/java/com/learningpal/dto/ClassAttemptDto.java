package com.learningpal.dto;

import java.time.Instant;

public record ClassAttemptDto(
        Long attemptId,
        Long assessmentId,
        String assessmentTitle,
        Instant submittedAt,
        Double score,
        Double maxScore,
        Double percent
) {}


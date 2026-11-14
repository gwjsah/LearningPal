package com.learningpal.dto;

import java.time.Instant;

public record DiagnosticTrendPointDto(
        Long attemptId,
        Instant submittedAt,
        Double percent
) {}


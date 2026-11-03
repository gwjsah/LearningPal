package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary of a student's latest Comprehensive Diagnostic assessment attempt within a class.
 */
public record LatestDiagnosticDto(
        Double score,
        Double maxScore,
        Double percent,
        Instant submittedAt
) {}


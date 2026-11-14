package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary of a student's latest Comprehensive Diagnostic assessment or latest quiz attempt within a class.
 */
public record LatestDiagnosticDto(
        Double score,
        Double maxScore,
        Double percent,
        Instant submittedAt,
        String label
) {
    public LatestDiagnosticDto(Double score, Double maxScore, Double percent, Instant submittedAt) {
        this(score, maxScore, percent, submittedAt, "Diagnostic");
    }
}

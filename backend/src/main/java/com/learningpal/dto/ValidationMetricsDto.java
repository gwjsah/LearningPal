package com.learningpal.dto;

/**
 * Statistical agreement metrics over usable student-topic pairs.
 */
public record ValidationMetricsDto(
        double accuracyPercent,
        double precisionPercent,
        double recallPercent,
        double f1Percent,
        double cohenKappa,
        int studentExactMatchCount,
        double studentExactMatchPercent
) {}


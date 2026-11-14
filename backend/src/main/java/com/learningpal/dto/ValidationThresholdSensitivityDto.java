package com.learningpal.dto;

/**
 * Performance simulation at alternative gap thresholds (mastery < threshold -> WEAK).
 */
public record ValidationThresholdSensitivityDto(
        double threshold,
        double agreementPercent,
        double recallPercent,
        int tp,
        int fp,
        int tn,
        int fn
) {}


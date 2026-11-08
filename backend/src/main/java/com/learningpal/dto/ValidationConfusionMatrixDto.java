package com.learningpal.dto;

/**
 * 2x2 binary classification confusion matrix:
 * Positive = WEAK, Negative = NOT_WEAK.
 * TP: Teacher WEAK & System GAP
 * FP: Teacher NOT_WEAK & System GAP
 * TN: Teacher NOT_WEAK & System DEVELOPING/STRENGTH
 * FN: Teacher WEAK & System DEVELOPING/STRENGTH
 */
public record ValidationConfusionMatrixDto(
        int tp,
        int fp,
        int tn,
        int fn
) {}


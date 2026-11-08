package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary of a student's blind labeling progress within a class.
 * CRITICAL: Contains zero system output (no mastery, status, trend, needsAttention).
 */
public record ValidationStudentSummaryDto(
        Long studentId,
        String fullName,
        String email,
        int labeledTopicsCount,
        int totalTopicsCount,
        boolean isStale,
        Instant lastLabeledAt
) {}


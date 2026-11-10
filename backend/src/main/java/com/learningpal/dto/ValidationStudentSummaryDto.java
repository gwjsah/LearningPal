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
        int assignedTopicsCount,
        int totalTopicsCount,
        String progressState, // "UNLABELED", "IN_PROGRESS", "COMPLETED", "NOT_ELIGIBLE"
        boolean isStale,
        Instant lastLabeledAt
) {
    /**
     * Backwards-compatible constructor for existing 7-argument calls.
     */
    public ValidationStudentSummaryDto(
            Long studentId,
            String fullName,
            String email,
            int labeledTopicsCount,
            int totalTopicsCount,
            boolean isStale,
            Instant lastLabeledAt) {
        this(studentId, fullName, email, labeledTopicsCount,
             totalTopicsCount, totalTopicsCount,
             labeledTopicsCount == 0 ? "UNLABELED" : (labeledTopicsCount >= totalTopicsCount ? "COMPLETED" : "IN_PROGRESS"),
             isStale, lastLabeledAt);
    }

    /**
     * Alias for studentName to ensure seamless frontend compatibility.
     */
    public String studentName() {
        return fullName;
    }
}

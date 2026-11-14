package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary DTO of a published assessment shown on the student dashboard,
 * including class-scoped schedule windows and retake availability status.
 */
public record StudentAssessmentDto(
        Long id,
        String title,
        String description,
        String subjectName,
        int questionCount,
        String latestAttemptStatus,
        Double latestAttemptScore,
        Double latestAttemptMaxScore,
        Long latestAttemptId,
        Instant latestAttemptSubmittedAt,
        String accessStatus,     // "OPEN", "NOT_OPEN_YET", "CLOSED", "RETAKE_LOCKED", "CLASS_ARCHIVED"
        String lockReason,       // Friendly explanation when locked
        boolean canStart,        // true if attempt can be started/resumed/retaken
        boolean awaitingTeacherGrading
) {
    public StudentAssessmentDto(
            Long id,
            String title,
            String description,
            String subjectName,
            int questionCount,
            String latestAttemptStatus,
            Double latestAttemptScore,
            Double latestAttemptMaxScore,
            Long latestAttemptId,
            Instant latestAttemptSubmittedAt
    ) {
        this(id, title, description, subjectName, questionCount, latestAttemptStatus,
             latestAttemptScore, latestAttemptMaxScore, latestAttemptId, latestAttemptSubmittedAt,
             "OPEN", null, true, false);
    }

    public StudentAssessmentDto(
            Long id,
            String title,
            String description,
            String subjectName,
            int questionCount,
            String latestAttemptStatus,
            Double latestAttemptScore,
            Double latestAttemptMaxScore,
            Long latestAttemptId,
            Instant latestAttemptSubmittedAt,
            String accessStatus,
            String lockReason,
            boolean canStart
    ) {
        this(id, title, description, subjectName, questionCount, latestAttemptStatus,
             latestAttemptScore, latestAttemptMaxScore, latestAttemptId, latestAttemptSubmittedAt,
             accessStatus, lockReason, canStart, false);
    }
}

package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary DTO of a published assessment shown on the student dashboard.
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
        Instant latestAttemptSubmittedAt
) {}


package com.learningpal.dto;

import java.time.Instant;

/**
 * Request payload for an instructor reopening assessment access for an individual student.
 */
public record UnlockStudentAssessmentRequest(
        Long studentId,
        String reason,
        Instant extendedUntil
) {}


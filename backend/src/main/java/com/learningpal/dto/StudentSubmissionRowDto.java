package com.learningpal.dto;

import java.time.Instant;

/**
 * Per-student submission status and score summary for an assessment within a class.
 */
public record StudentSubmissionRowDto(
        Long studentId,
        String studentName,
        String studentEmail,
        String initials,
        String status,
        Long attemptId,
        Integer attemptNumber,
        Instant submittedAt,
        Double autoScore,
        Double teacherScore,
        Double finalScore,
        Double maxScore,
        Double percentage,
        int ungradedEssayCount
) {
}

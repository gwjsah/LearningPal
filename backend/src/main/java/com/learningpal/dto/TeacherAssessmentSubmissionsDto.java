package com.learningpal.dto;

import java.time.Instant;
import java.util.List;

/**
 * Class-scoped assessment submissions roster with summary metrics and per-student rows.
 */
public record TeacherAssessmentSubmissionsDto(
        Long classId,
        String className,
        Long assessmentId,
        String title,
        String description,
        double totalPoints,
        double passingScore,
        Instant availableFrom,
        Instant availableUntil,
        Integer timeLimitMinutes,
        int questionCount,
        int essayCount,
        String status,
        int totalEnrolled,
        int submittedCount,
        int needsGradingCount,
        int gradedCount,
        int inProgressCount,
        int notStartedCount,
        Double classAverage,
        List<StudentSubmissionRowDto> submissions
) {
}

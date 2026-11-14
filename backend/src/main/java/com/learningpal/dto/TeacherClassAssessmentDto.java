package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary of an assessment and its class-scoped schedule & retake policies.
 */
public record TeacherClassAssessmentDto(
        Long assessmentId,
        String title,
        String description,
        Integer timeLimitMinutes,
        Instant availableFrom,
        Instant availableUntil,
        boolean allowRetakes,
        boolean hasCustomSetting,
        int ungradedEssayCount,
        String status,
        int totalQuestions,
        int attemptCount,
        int enrolledCount,
        int submittedStudentCount
) {
    public TeacherClassAssessmentDto(
            Long assessmentId,
            String title,
            String description,
            Integer timeLimitMinutes,
            Instant availableFrom,
            Instant availableUntil,
            boolean allowRetakes,
            boolean hasCustomSetting,
            int ungradedEssayCount,
            String status,
            int totalQuestions,
            int attemptCount
    ) {
        this(assessmentId, title, description, timeLimitMinutes, availableFrom, availableUntil,
                allowRetakes, hasCustomSetting, ungradedEssayCount, status, totalQuestions, attemptCount, 0, 0);
    }

    public TeacherClassAssessmentDto(
            Long assessmentId,
            String title,
            String description,
            Integer timeLimitMinutes,
            Instant availableFrom,
            Instant availableUntil,
            boolean allowRetakes,
            boolean hasCustomSetting,
            int ungradedEssayCount
    ) {
        this(assessmentId, title, description, timeLimitMinutes, availableFrom, availableUntil,
                allowRetakes, hasCustomSetting, ungradedEssayCount, "PUBLISHED", 0, 0, 0, 0);
    }

    public TeacherClassAssessmentDto(
            Long assessmentId,
            String title,
            String description,
            Integer timeLimitMinutes,
            Instant availableFrom,
            Instant availableUntil,
            boolean allowRetakes,
            boolean hasCustomSetting
    ) {
        this(assessmentId, title, description, timeLimitMinutes, availableFrom, availableUntil,
                allowRetakes, hasCustomSetting, 0, "PUBLISHED", 0, 0, 0, 0);
    }
}


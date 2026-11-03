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
        boolean hasCustomSetting
) {}


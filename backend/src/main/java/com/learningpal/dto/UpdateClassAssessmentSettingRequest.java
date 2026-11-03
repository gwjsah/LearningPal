package com.learningpal.dto;

import java.time.Instant;

/**
 * Payload for updating class-scoped assessment availability window and retake allowance.
 */
public record UpdateClassAssessmentSettingRequest(
        Instant availableFrom,
        Instant availableUntil,
        Boolean allowRetakes
) {}


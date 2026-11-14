package com.learningpal.dto;

import java.time.Instant;

/**
 * Confirmation payload returned after rating a topic feedback or resource.
 */
public record RatingSavedDto(
        Long id,
        Long targetId,
        String targetType,
        Integer rating,
        String comment,
        Instant updatedAt
) {}

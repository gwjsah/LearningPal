package com.learningpal.dto;

import java.time.Instant;

/**
 * Embedded student feedback rating detail for topic progress view.
 */
public record FeedbackRatingDto(
        Integer rating,
        String comment,
        Instant updatedAt
) {}

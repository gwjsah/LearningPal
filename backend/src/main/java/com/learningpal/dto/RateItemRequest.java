package com.learningpal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload for submitting or updating a 1-to-5 helpfulness rating.
 */
public record RateItemRequest(
        @NotNull(message = "Rating score is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        Integer rating,

        @Size(max = 300, message = "Comment cannot exceed 300 characters")
        String comment
) {}

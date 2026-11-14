package com.learningpal.dto;

/**
 * Response payload confirming resource completion state change.
 */
public record ResourceCompletionResponseDto(
        Long resourceId,
        boolean completed,
        String message
) {}


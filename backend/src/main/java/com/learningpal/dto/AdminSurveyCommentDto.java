package com.learningpal.dto;

import java.time.Instant;

/**
 * Anonymous comment from a survey response.
 */
public record AdminSurveyCommentDto(
        String role,
        String comment,
        Instant createdAt
) {}

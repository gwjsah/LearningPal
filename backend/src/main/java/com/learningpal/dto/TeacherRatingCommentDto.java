package com.learningpal.dto;

import java.time.Instant;

/**
 * Anonymized feedback/resource rating comment (no student name or email).
 */
public record TeacherRatingCommentDto(
        String itemType, // TOPIC_FEEDBACK or RESOURCE
        String itemTitle,
        Integer rating,
        String comment,
        Instant ratedAt
) {}

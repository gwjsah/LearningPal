package com.learningpal.dto;

import com.learningpal.entity.ValidationLabel;
import java.time.Instant;

/**
 * Response after saving a teacher validation label.
 * Returns confirmation without leaking system analytics.
 */
public record ValidationLabelSavedDto(
        Long topicId,
        ValidationLabel label,
        String note,
        Instant labeledAt,
        boolean isStale
) {}


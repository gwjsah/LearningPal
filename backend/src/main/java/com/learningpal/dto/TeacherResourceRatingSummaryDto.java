package com.learningpal.dto;

/**
 * Helpfulness rating summary for an educational resource.
 */
public record TeacherResourceRatingSummaryDto(
        Long resourceId,
        String resourceTitle,
        String resourceType,
        int totalRatings,
        double averageRating,
        double helpfulPercentage
) {}

package com.learningpal.dto;

/**
 * Helpfulness rating summary for a curricular topic.
 */
public record TeacherTopicRatingSummaryDto(
        Long topicId,
        String topicName,
        int totalRatings,
        double averageRating,
        double helpfulPercentage
) {}

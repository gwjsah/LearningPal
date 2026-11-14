package com.learningpal.dto;

/**
 * Breakdown of validation agreement per topic.
 */
public record ValidationTopicMetricDto(
        Long topicId,
        String topicName,
        int usableCount,
        int matchCount,
        double accuracyPercent,
        int teacherWeakCount,
        int systemWeakCount
) {}


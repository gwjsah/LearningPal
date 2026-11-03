package com.learningpal.dto;

/**
 * Topic breakdown summarizing student counts per mastery tier and overall class average.
 * Ranked by number of students experiencing a learning gap in this topic.
 */
public record ClassTopicOverviewDto(
        Long topicId,
        String topicName,
        int strengthCount,
        int developingCount,
        int gapCount,
        int insufficientDataCount,
        int noDataCount,
        Double averageMasteryPercent,
        int rank
) {}


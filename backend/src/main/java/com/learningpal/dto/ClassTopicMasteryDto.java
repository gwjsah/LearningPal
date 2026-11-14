package com.learningpal.dto;

/**
 * Projection of a student's mastery in a specific topic.
 * Status is NO_DATA if the student has not yet answered questions on this topic.
 */
public record ClassTopicMasteryDto(
        Long topicId,
        String topicName,
        Double masteryPercent,
        String status
) {}


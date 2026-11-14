package com.learningpal.dto;

import com.learningpal.entity.MasteryStatus;
import java.time.Instant;

/**
 * Summary DTO of a student's progress and mastery in a single topic.
 */
public record TopicProgressDto(
        Long topicId,
        String topicName,
        Double masteryPercent,
        MasteryStatus status,
        String trend,
        int questionsAnswered,
        Instant lastUpdated,
        int resourcesCompleted,
        int resourcesRecommended
) {
    public TopicProgressDto(
            Long topicId,
            String topicName,
            Double masteryPercent,
            MasteryStatus status,
            String trend,
            int questionsAnswered,
            Instant lastUpdated) {
        this(topicId, topicName, masteryPercent, status, trend, questionsAnswered, lastUpdated, 0, 0);
    }
}

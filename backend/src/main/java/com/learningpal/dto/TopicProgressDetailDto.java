package com.learningpal.dto;

import com.learningpal.entity.MasteryStatus;
import java.time.Instant;
import java.util.List;

/**
 * Detailed topic mastery review with chronological answer history, feedback, and recommended resources.
 */
public record TopicProgressDetailDto(
        Long topicId,
        String topicName,
        String topicDescription,
        Double masteryPercent,
        MasteryStatus status,
        String trend,
        int questionsAnswered,
        Instant lastUpdated,
        List<StudentAnswerHistoryDto> history,
        FeedbackDto feedback,
        List<RecommendedResourceDto> resources,
        int resourcesCompleted,
        int resourcesRecommended
) {
    public TopicProgressDetailDto(
            Long topicId,
            String topicName,
            String topicDescription,
            Double masteryPercent,
            MasteryStatus status,
            String trend,
            int questionsAnswered,
            Instant lastUpdated,
            List<StudentAnswerHistoryDto> history) {
        this(topicId, topicName, topicDescription, masteryPercent, status, trend, questionsAnswered, lastUpdated, history, null, List.of(), 0, 0);
    }
}

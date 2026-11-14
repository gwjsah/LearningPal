package com.learningpal.dto;

import com.learningpal.entity.MasteryStatus;
import java.time.Instant;
import java.util.List;

/**
 * Detailed topic mastery review with answer history, feedback, recommended resources, and student rating.
 */
public record TopicProgressDetailDto(
        Long topicId,
        Long subjectId,
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
        int resourcesRecommended,
        FeedbackRatingDto studentFeedbackRating
) {
    public TopicProgressDetailDto(
            Long topicId,
            Long subjectId,
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
            int resourcesRecommended) {
        this(topicId, subjectId, topicName, topicDescription, masteryPercent, status, trend, questionsAnswered, lastUpdated, history, feedback, resources, resourcesCompleted, resourcesRecommended, null);
    }

    public TopicProgressDetailDto(
            Long topicId,
            Long subjectId,
            String topicName,
            String topicDescription,
            Double masteryPercent,
            MasteryStatus status,
            String trend,
            int questionsAnswered,
            Instant lastUpdated,
            List<StudentAnswerHistoryDto> history) {
        this(topicId, subjectId, topicName, topicDescription, masteryPercent, status, trend, questionsAnswered, lastUpdated, history, null, List.of(), 0, 0, null);
    }
}

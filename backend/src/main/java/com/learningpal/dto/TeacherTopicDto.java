package com.learningpal.dto;

import com.learningpal.entity.Topic;
import com.learningpal.entity.TopicStatus;

import java.time.Instant;

public record TeacherTopicDto(
        Long id,
        Long subjectId,
        String name,
        String description,
        Integer displayOrder,
        TopicStatus status,
        Instant createdAt,
        long questionCount,
        long resourceCount
) {
    public static TeacherTopicDto fromEntity(Topic topic, long questionCount, long resourceCount) {
        return new TeacherTopicDto(
                topic.getId(),
                topic.getSubject() != null ? topic.getSubject().getId() : null,
                topic.getName(),
                topic.getDescription(),
                topic.getDisplayOrder(),
                topic.getStatus(),
                topic.getCreatedAt(),
                questionCount,
                resourceCount
        );
    }
}

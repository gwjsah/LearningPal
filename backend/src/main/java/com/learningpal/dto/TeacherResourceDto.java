package com.learningpal.dto;

import com.learningpal.entity.Resource;
import com.learningpal.entity.ResourceStatus;
import com.learningpal.entity.ResourceType;

import java.net.URI;
import java.time.Instant;

public record TeacherResourceDto(
        Long id,
        Long subjectId,
        Long topicId,
        String topicName,
        String title,
        String description,
        ResourceType type,
        String url,
        String domain,
        ResourceStatus status,
        Instant createdAt
) {
    public static TeacherResourceDto fromEntity(Resource r) {
        String domain = "";
        if (r.getUrl() != null && !r.getUrl().isBlank()) {
            try {
                URI uri = new URI(r.getUrl());
                domain = uri.getHost() != null ? uri.getHost().replaceFirst("^www\\.", "") : "";
            } catch (Exception ignored) {
            }
        }
        return new TeacherResourceDto(
                r.getId(),
                r.getSubject() != null ? r.getSubject().getId() : null,
                r.getTopic() != null ? r.getTopic().getId() : null,
                r.getTopic() != null ? r.getTopic().getName() : null,
                r.getTitle(),
                r.getDescription(),
                r.getType(),
                r.getUrl(),
                domain,
                r.getStatus(),
                r.getCreatedAt()
        );
    }
}

package com.learningpal.dto;

import com.learningpal.entity.ResourceType;

/**
 * Educational resource recommended for a topic with completion and student rating.
 */
public record RecommendedResourceDto(
        Long id,
        String title,
        ResourceType type,
        String description,
        String content,
        String url,
        boolean completed,
        Integer studentRating,
        String studentComment
) {
    public RecommendedResourceDto(
            Long id,
            String title,
            ResourceType type,
            String description,
            String content,
            String url,
            boolean completed) {
        this(id, title, type, description, content, url, completed, null, null);
    }
}

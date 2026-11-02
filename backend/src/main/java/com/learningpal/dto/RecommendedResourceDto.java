package com.learningpal.dto;

import com.learningpal.entity.ResourceType;

/**
 * Educational resource recommended for a topic with individual student completion status.
 */
public record RecommendedResourceDto(
        Long id,
        String title,
        ResourceType type,
        String description,
        String content,
        String url,
        boolean completed
) {}


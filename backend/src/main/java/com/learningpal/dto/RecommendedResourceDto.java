package com.learningpal.dto;

import com.learningpal.entity.ResourceType;

/**
 * Educational resource recommended for a topic or class workspace with completion,
 * student rating, and optional file metadata if the resource is a file download.
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
        String studentComment,
        String fileName,
        Long fileSizeBytes,
        String fileContentType,
        String downloadUrl
) {
    public RecommendedResourceDto(
            Long id,
            String title,
            ResourceType type,
            String description,
            String content,
            String url,
            boolean completed) {
        this(id, title, type, description, content, url, completed, null, null, null, null, null, null);
    }

    public RecommendedResourceDto(
            Long id,
            String title,
            ResourceType type,
            String description,
            String content,
            String url,
            boolean completed,
            Integer studentRating,
            String studentComment) {
        this(id, title, type, description, content, url, completed, studentRating, studentComment, null, null, null, null);
    }
}

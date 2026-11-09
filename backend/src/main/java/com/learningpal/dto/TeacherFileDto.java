package com.learningpal.dto;

import com.learningpal.entity.ExtractionStatus;
import com.learningpal.entity.Resource;
import com.learningpal.entity.ResourceFile;
import com.learningpal.entity.ResourceStatus;

import java.time.Instant;

/**
 * Metadata representation of a file resource for teacher management views.
 * Excludes extractedText to keep payloads lightweight and private.
 */
public record TeacherFileDto(
        Long id,
        Long resourceId,
        String title,
        String description,
        String fileName,
        String contentType,
        long sizeBytes,
        ResourceStatus status,
        Long topicId,
        String topicName,
        Instant createdAt,
        Instant uploadedAt,
        ExtractionStatus extractionStatus,
        int extractedCharCount,
        Integer pageCount,
        String extractionNote
) {
    public static TeacherFileDto fromEntity(ResourceFile rf) {
        Resource r = rf.getResource();
        return new TeacherFileDto(
                rf.getId(),
                r.getId(),
                r.getTitle(),
                r.getDescription(),
                rf.getFileName(),
                rf.getContentType(),
                rf.getSizeBytes(),
                r.getStatus(),
                r.getTopic() != null ? r.getTopic().getId() : null,
                r.getTopic() != null ? r.getTopic().getName() : null,
                r.getCreatedAt(),
                rf.getUploadedAt(),
                rf.getExtractionStatus(),
                rf.getExtractedCharCount(),
                rf.getPageCount(),
                rf.getExtractionNote()
        );
    }
}

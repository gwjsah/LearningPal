package com.learningpal.dto;

import com.learningpal.entity.ExtractionStatus;

/**
 * Preview DTO for the first 3,000 characters of extracted document text.
 * Displayed exclusively to the owning teacher as a preview of what AI drafting reads.
 */
public record FileTextPreviewDto(
        Long id,
        String fileName,
        ExtractionStatus extractionStatus,
        int totalCharCount,
        String previewText,
        String extractionNote
) {}

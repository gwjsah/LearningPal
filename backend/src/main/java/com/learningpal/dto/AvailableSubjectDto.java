package com.learningpal.dto;

/**
 * Summary view of a subject available for self-enrollment.
 */
public record AvailableSubjectDto(
        Long subjectId,
        String code,
        String name,
        String description,
        int topicCount,
        int assessmentCount
) {}


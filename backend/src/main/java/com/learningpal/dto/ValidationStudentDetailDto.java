package com.learningpal.dto;

import java.util.List;

/**
 * Full blind evaluation sheet for a student across all topics in a class's subject.
 * CRITICAL: Contains zero system output.
 */
public record ValidationStudentDetailDto(
        Long studentId,
        String studentName,
        String studentEmail,
        Long classId,
        String className,
        List<ValidationTopicEvidenceDto> topics
) {}


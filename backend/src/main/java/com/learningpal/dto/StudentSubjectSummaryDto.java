package com.learningpal.dto;

import java.time.Instant;

/**
 * Summary view of a subject the student is currently enrolled in,
 * displayed on the "My Subjects" dashboard (/student).
 */
public record StudentSubjectSummaryDto(
        Long subjectId,
        String code,
        String name,
        String description,
        String oneLineStatus, // e.g. "2 gaps, 4 strengths" or "Not started yet"
        TopicProgressDto studyNextTopic,
        Instant enrolledAt,
        int totalTopics,
        int masteredTopics
) {}


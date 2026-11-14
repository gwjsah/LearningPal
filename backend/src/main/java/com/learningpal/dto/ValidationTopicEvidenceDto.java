package com.learningpal.dto;

import com.learningpal.entity.ValidationLabel;
import java.time.Instant;
import java.util.List;

/**
 * Per-topic raw evidence and teacher's existing label for blind evaluation.
 * CRITICAL: Contains zero system output.
 */
public record ValidationTopicEvidenceDto(
        Long topicId,
        String topicName,
        String description,
        ValidationLabel currentLabel,
        String currentNote,
        Instant labeledAt,
        boolean isStale,
        List<ValidationQuestionEvidenceDto> evidence
) {}


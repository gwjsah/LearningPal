package com.learningpal.dto;

import java.util.List;

/**
 * Payload returned when starting or resuming an assessment attempt.
 */
public record StartAttemptResponseDto(
        Long attemptId,
        Long assessmentId,
        String assessmentTitle,
        String description,
        Integer attemptNumber,
        List<QuestionItemDto> questions
) {}


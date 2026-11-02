package com.learningpal.dto;

import jakarta.validation.constraints.NotNull;

/**
 * An individual answer response submitted by a student.
 */
public record AnswerSubmissionDto(
        @NotNull(message = "Question ID is required")
        Long questionId,
        Long selectedChoiceId
) {}


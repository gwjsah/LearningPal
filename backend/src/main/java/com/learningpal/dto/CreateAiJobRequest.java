package com.learningpal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateAiJobRequest(
        @NotNull(message = "Topic ID is required")
        Long topicId,

        @Min(value = 1, message = "Question count must be at least 1")
        @Max(value = 30, message = "Question count cannot exceed 30")
        Integer count
) {}

package com.learningpal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * Payload for submitting survey answers.
 */
public record SubmitSurveyRequest(
        String surveyVersion,

        @NotNull(message = "Answers map is required")
        Map<String, Integer> answers,

        @Size(max = 500, message = "Comment cannot exceed 500 characters")
        String comment
) {}

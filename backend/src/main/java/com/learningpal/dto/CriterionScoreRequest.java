package com.learningpal.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CriterionScoreRequest(
        @NotNull(message = "Criterion ID is required")
        Long criterionId,

        @NotNull(message = "Points are required")
        @Min(value = 0, message = "Criterion points cannot be negative")
        Integer points
) {}

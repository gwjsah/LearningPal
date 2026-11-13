package com.learningpal.dto;

public record AiCriterionSuggestionDto(
        Long criterionId,
        Integer points,
        String reason
) {}

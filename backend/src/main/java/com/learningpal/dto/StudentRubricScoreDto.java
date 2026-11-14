package com.learningpal.dto;

public record StudentRubricScoreDto(
        Long criterionId,
        String name,
        String description,
        Integer maxPoints,
        Integer pointsAwarded
) {}

package com.learningpal.dto;

public record TeacherRubricCriterionScoreDto(
        Long criterionId,
        String name,
        String description,
        Integer maxPoints,
        Integer pointsAwarded
) {}

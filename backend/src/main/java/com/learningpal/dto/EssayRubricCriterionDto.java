package com.learningpal.dto;

import com.learningpal.entity.EssayRubricCriterion;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EssayRubricCriterionDto(
        Long id,

        @NotBlank(message = "Criterion name is required")
        @Size(max = 100, message = "Criterion name must be 100 characters or fewer")
        String name,

        @Size(max = 500, message = "Criterion description must be 500 characters or fewer")
        String description,

        @NotNull(message = "Criterion max points is required")
        @Min(value = 1, message = "Criterion max points must be at least 1")
        @Max(value = 100, message = "Criterion max points must be 100 or fewer")
        Integer maxPoints,

        Integer displayOrder
) {
    public static EssayRubricCriterionDto fromEntity(EssayRubricCriterion c) {
        return new EssayRubricCriterionDto(
                c.getId(),
                c.getName(),
                c.getDescription(),
                c.getMaxPoints(),
                c.getDisplayOrder()
        );
    }
}

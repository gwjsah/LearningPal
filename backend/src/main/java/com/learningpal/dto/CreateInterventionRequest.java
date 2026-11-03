package com.learningpal.dto;

import com.learningpal.entity.InterventionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateInterventionRequest(
        @NotNull(message = "Topic ID is required")
        Long topicId,

        @NotNull(message = "Intervention type is required")
        InterventionType type,

        @NotBlank(message = "Note is required")
        @Size(max = 1000, message = "Note cannot exceed 1000 characters")
        String note,

        LocalDate followUpDate
) {}


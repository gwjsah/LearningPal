package com.learningpal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateClassRequest(
        @NotNull(message = "Subject ID is required")
        Long subjectId,

        @NotBlank(message = "Class section name is required")
        @Size(max = 60, message = "Class section name must be 60 characters or fewer")
        String name
) {}


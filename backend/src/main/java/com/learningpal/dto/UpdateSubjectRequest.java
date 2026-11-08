package com.learningpal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSubjectRequest(
        @NotBlank(message = "Subject name is required")
        @Size(max = 80, message = "Subject name must be 80 characters or fewer")
        String name,

        @Size(max = 1000, message = "Description must be 1000 characters or fewer")
        String description
) {}

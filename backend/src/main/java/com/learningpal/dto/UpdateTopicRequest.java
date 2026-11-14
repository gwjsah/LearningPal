package com.learningpal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTopicRequest(
        @NotBlank(message = "Topic name is required")
        @Size(max = 120, message = "Topic name must be 120 characters or fewer")
        String name,

        @Size(max = 1000, message = "Description must be 1000 characters or fewer")
        String description
) {}

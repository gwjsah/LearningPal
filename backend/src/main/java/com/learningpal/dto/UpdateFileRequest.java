package com.learningpal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateFileRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title cannot exceed 120 characters")
        String title,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        Long topicId
) {}

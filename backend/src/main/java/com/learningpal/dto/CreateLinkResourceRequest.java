package com.learningpal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateLinkResourceRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be 120 characters or fewer")
        String title,

        @NotBlank(message = "URL is required")
        @Size(max = 2000, message = "URL must be 2000 characters or fewer")
        @Pattern(regexp = "^(?i)https?://.*$", message = "URL must start with http:// or https://")
        String url,

        @Size(max = 500, message = "Description must be 500 characters or fewer")
        String description,

        Long topicId
) {}

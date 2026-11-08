package com.learningpal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateClassRequest(
        @Size(max = 80, message = "Subject name must be 80 characters or fewer")
        String subjectName,

        @NotBlank(message = "Class section name is required")
        @Size(max = 60, message = "Class section name must be 60 characters or fewer")
        String name,

        Long subjectId
) {
    public CreateClassRequest(Long subjectId, String name) {
        this(null, name, subjectId);
    }

    public CreateClassRequest(String subjectName, String name) {
        this(subjectName, name, null);
    }
}

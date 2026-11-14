package com.learningpal.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request payload for reassigning a class to a new teacher within the same institution.
 */
public record ReassignTeacherRequest(
        @NotNull(message = "Teacher ID is required")
        Long teacherId
) {
}


package com.learningpal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record GradeAnswerRequest(
        @DecimalMin(value = "0.0", message = "Score cannot be negative")
        Double teacherScore,

        @Size(max = 500, message = "Comment cannot exceed 500 characters")
        String teacherComment
) {}


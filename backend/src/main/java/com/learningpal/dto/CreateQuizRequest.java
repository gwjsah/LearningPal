package com.learningpal.dto;

import com.learningpal.entity.AssessmentKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateQuizRequest(
        @NotBlank(message = "Quiz title is required")
        @Size(max = 120, message = "Quiz title must be 120 characters or fewer")
        String title,

        @Size(max = 1000, message = "Description must be 1000 characters or fewer")
        String description,

        AssessmentKind kind,

        Integer timeLimitMinutes,

        @NotEmpty(message = "A quiz must contain at least one question")
        List<Long> questionIds
) {}

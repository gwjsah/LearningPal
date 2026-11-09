package com.learningpal.dto;

import com.learningpal.entity.DifficultyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateDraftRequest(
        @NotBlank(message = "Question text cannot be blank")
        @Size(max = 1000, message = "Question text cannot exceed 1000 characters")
        String questionText,

        @NotNull(message = "Choices list is required")
        @Size(min = 4, max = 4, message = "Exactly 4 choices are required")
        List<String> choices,

        @NotNull(message = "Correct index is required")
        Integer correctIndex,

        @NotBlank(message = "Explanation cannot be blank")
        @Size(max = 1000, message = "Explanation cannot exceed 1000 characters")
        String explanation,

        DifficultyLevel difficulty
) {}

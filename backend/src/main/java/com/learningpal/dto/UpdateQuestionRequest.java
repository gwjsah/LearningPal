package com.learningpal.dto;

import com.learningpal.entity.DifficultyLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateQuestionRequest(
        @NotNull(message = "Topic ID is required")
        Long topicId,

        @NotBlank(message = "Question text is required")
        @Size(max = 1000, message = "Question text must be 1000 characters or fewer")
        String text,

        @NotBlank(message = "Explanation is required")
        @Size(max = 1000, message = "Explanation must be 1000 characters or fewer")
        String explanation,

        @NotNull(message = "Difficulty level is required")
        DifficultyLevel difficulty,

        Double points,

        @NotEmpty(message = "Choices list cannot be empty")
        @Size(min = 2, max = 6, message = "Questions must have between 2 and 6 choices")
        List<@Valid ChoiceDto> choices
) {}

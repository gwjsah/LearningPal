package com.learningpal.dto;

import com.learningpal.entity.DifficultyLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateDraftRequest(
        @NotBlank(message = "Question text cannot be blank")
        @Size(max = 2000, message = "Question text cannot exceed 2000 characters")
        String questionText,

        List<String> choices,

        Integer correctIndex,

        List<String> acceptedAnswers,

        @Valid
        List<EssayRubricCriterionDto> rubricCriteria,

        Double points,

        @Size(max = 2000, message = "Explanation cannot exceed 2000 characters")
        String explanation,

        @Size(max = 2000, message = "Model answer note cannot exceed 2000 characters")
        String modelAnswerNote,

        DifficultyLevel difficulty
) {
    // Backward-compatible 5-arg constructor for existing MULTIPLE_CHOICE tests
    public UpdateDraftRequest(
            String questionText,
            List<String> choices,
            Integer correctIndex,
            String explanation,
            DifficultyLevel difficulty) {
        this(questionText, choices, correctIndex, null, null, null, explanation, null, difficulty);
    }
}

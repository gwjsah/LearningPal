package com.learningpal.dto;

import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateQuestionRequest(
        @NotNull(message = "Topic ID is required")
        Long topicId,

        @NotBlank(message = "Question text is required")
        @Size(max = 2000, message = "Question text must be 2000 characters or fewer")
        String text,

        @Size(max = 2000, message = "Explanation must be 2000 characters or fewer")
        String explanation,

        @NotNull(message = "Difficulty level is required")
        DifficultyLevel difficulty,

        Double points,

        List<@Valid ChoiceDto> choices,

        QuestionType type,

        List<String> acceptedAnswers,

        List<@Valid EssayRubricCriterionDto> rubricCriteria
) {
    /** Backward-compatible 6-arg constructor for existing MCQ callers and tests. */
    public UpdateQuestionRequest(
            Long topicId,
            String text,
            String explanation,
            DifficultyLevel difficulty,
            Double points,
            List<ChoiceDto> choices
    ) {
        this(topicId, text, explanation, difficulty, points, choices, null, null, null);
    }
}

package com.learningpal.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.learningpal.entity.QuestionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateAiJobRequest(
        @NotNull(message = "Topic ID is required")
        Long topicId,

        @JsonAlias({"requestedCount", "questionCount"})
        @Min(value = MIN_QUESTIONS, message = "Question count must be between " + MIN_QUESTIONS + " and " + MAX_QUESTIONS)
        @Max(value = MAX_QUESTIONS, message = "Question count must be between " + MIN_QUESTIONS + " and " + MAX_QUESTIONS)
        Integer count,

        @JsonAlias({"type"})
        QuestionType questionType
) {
    public static final int MIN_QUESTIONS = 5;
    public static final int DEFAULT_QUESTIONS = 10;
    public static final int MAX_QUESTIONS = 30;
    public static final int MAX_ESSAY_QUESTIONS = 10;

    public CreateAiJobRequest(Long topicId, Integer count) {
        this(topicId, count, QuestionType.MULTIPLE_CHOICE);
    }
}

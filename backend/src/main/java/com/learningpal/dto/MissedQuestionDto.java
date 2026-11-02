package com.learningpal.dto;

/**
 * Details of a question the student answered incorrectly or left blank.
 * Includes student response, correct answer, and conceptual explanation.
 */
public record MissedQuestionDto(
        Long questionId,
        String questionText,
        String studentAnswer,
        String correctAnswer,
        String explanation
) {}


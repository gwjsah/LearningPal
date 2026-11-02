package com.learningpal.dto;

import java.time.Instant;

/**
 * Historical record of an answered question in a submitted attempt.
 * Does NOT leak choices, correct answers for unsubmitted questions, or explanations.
 */
public record StudentAnswerHistoryDto(
        Long questionId,
        String questionText,
        boolean isCorrect,
        Double scoreEarned,
        Double pointsPossible,
        Instant submittedAt
) {}


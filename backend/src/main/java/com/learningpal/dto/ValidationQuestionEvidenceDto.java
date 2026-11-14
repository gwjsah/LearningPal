package com.learningpal.dto;

import java.time.Instant;

/**
 * Raw test response evidence for a question answered in submitted class attempts.
 * CRITICAL: Contains zero system output.
 */
public record ValidationQuestionEvidenceDto(
        Long questionId,
        String questionText,
        String studentAnswer,
        boolean isCorrect,
        Double earnedScore,
        Double maxPoints,
        Instant submittedAt,
        Integer attemptNumber,
        String assessmentTitle
) {}


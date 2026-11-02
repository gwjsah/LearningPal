package com.learningpal.dto;

/**
 * Multiple-choice option delivered to the test taker.
 * SECURITY: Absolutely does NOT contain the 'isCorrect' field.
 */
public record ChoiceItemDto(
        Long id,
        String label,
        String text
) {}


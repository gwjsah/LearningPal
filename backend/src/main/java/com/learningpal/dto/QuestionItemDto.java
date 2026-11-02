package com.learningpal.dto;

import java.util.List;

/**
 * Question presented to the test taker.
 * SECURITY: Absolutely does NOT contain the 'explanation' field.
 */
public record QuestionItemDto(
        Long id,
        String topicName,
        String text,
        Double points,
        List<ChoiceItemDto> choices
) {}


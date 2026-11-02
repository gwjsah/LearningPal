package com.learningpal.dto;

import java.util.List;

/**
 * Diagnostic feedback for a topic: headline, plain-language guidance, and missed question review.
 */
public record FeedbackDto(
        String headline,
        String message,
        List<MissedQuestionDto> whatToReview
) {}


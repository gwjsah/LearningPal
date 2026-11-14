package com.learningpal.dto;

/**
 * Topic breakdown with plain count of correct answers vs total questions.
 */
public record TopicBreakdownDto(
        String topicName,
        int correctCount,
        int totalCount
) {}


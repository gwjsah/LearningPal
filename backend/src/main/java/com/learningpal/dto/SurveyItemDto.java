package com.learningpal.dto;

/**
 * Statement definition for an in-app usability survey item.
 */
public record SurveyItemDto(
        String key,
        String statement
) {}

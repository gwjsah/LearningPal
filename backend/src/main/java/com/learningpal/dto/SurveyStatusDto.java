package com.learningpal.dto;

import java.util.List;

/**
 * Usability survey status payload for the authenticated student or teacher.
 */
public record SurveyStatusDto(
        String surveyVersion,
        String role,
        boolean alreadyResponded,
        List<SurveyItemDto> items
) {}

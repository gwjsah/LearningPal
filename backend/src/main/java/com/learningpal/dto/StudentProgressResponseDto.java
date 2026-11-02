package com.learningpal.dto;

import java.util.List;

/**
 * Overview response of a student's strengths, gaps, and next study recommendation.
 */
public record StudentProgressResponseDto(
        List<TopicProgressDto> topics,
        List<TopicProgressDto> strengths,
        List<TopicProgressDto> gaps,
        TopicProgressDto studyNext
) {}


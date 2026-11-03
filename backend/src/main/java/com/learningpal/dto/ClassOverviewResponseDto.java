package com.learningpal.dto;

import java.util.List;

/**
 * Full class overview response containing totals and per-topic diagnostic aggregates.
 */
public record ClassOverviewResponseDto(
        Long classId,
        String className,
        ClassOverviewTotalsDto totals,
        List<ClassTopicOverviewDto> topics
) {}


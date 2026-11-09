package com.learningpal.dto;

public record AiStatusDto(
        boolean enabled,
        boolean reachable,
        String configuredModel,
        boolean modelFound
) {}

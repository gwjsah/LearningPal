package com.learningpal.dto;

public record AiStatusDto(
        boolean enabled,
        boolean reachable,
        String configuredModel,
        boolean modelFound,
        String provider
) {
    public AiStatusDto(boolean enabled, boolean reachable, String configuredModel, boolean modelFound) {
        this(enabled, reachable, configuredModel, modelFound, "local");
    }
}

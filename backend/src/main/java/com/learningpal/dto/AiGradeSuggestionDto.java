package com.learningpal.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.entity.AiGradeSuggestion;
import com.learningpal.entity.AiGradeSuggestionStatus;

import java.time.Instant;
import java.util.List;

public record AiGradeSuggestionDto(
        Long id,
        Long answerId,
        List<AiCriterionSuggestionDto> criteria,
        String overallFeedback,
        String providerName,
        String modelName,
        AiGradeSuggestionStatus status,
        Instant createdAt,
        Instant resolvedAt
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static AiGradeSuggestionDto fromEntity(AiGradeSuggestion s) {
        List<AiCriterionSuggestionDto> criteriaList = List.of();
        if (s.getCriterionSuggestionsJson() != null && !s.getCriterionSuggestionsJson().isBlank()) {
            try {
                List<AiCriterionSuggestionDto> parsed = MAPPER.readValue(
                        s.getCriterionSuggestionsJson(),
                        new TypeReference<>() {}
                );
                if (parsed != null) {
                    criteriaList = parsed;
                }
            } catch (Exception ignored) {}
        }
        return new AiGradeSuggestionDto(
                s.getId(),
                s.getAnswer().getId(),
                criteriaList,
                s.getOverallFeedback(),
                s.getProviderName(),
                s.getModelName(),
                s.getStatus(),
                s.getCreatedAt(),
                s.getResolvedAt()
        );
    }
}

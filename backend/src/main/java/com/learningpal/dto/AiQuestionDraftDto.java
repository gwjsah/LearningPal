package com.learningpal.dto;

import com.learningpal.entity.AiDraftStatus;
import com.learningpal.entity.AiQuestionDraft;
import com.learningpal.entity.DifficultyLevel;

import java.time.Instant;
import java.util.List;

public record AiQuestionDraftDto(
        Long id,
        Long jobId,
        int sectionIndex,
        String questionText,
        List<String> choices,
        int correctIndex,
        String explanation,
        DifficultyLevel difficulty,
        String evidenceQuote,
        boolean evidenceVerified,
        AiDraftStatus status,
        Long approvedQuestionId,
        Instant createdAt,
        Instant updatedAt
) {
    public static AiQuestionDraftDto fromEntity(AiQuestionDraft d) {
        return new AiQuestionDraftDto(
                d.getId(),
                d.getJob().getId(),
                d.getSectionIndex(),
                d.getQuestionText(),
                d.getChoicesList(),
                d.getCorrectIndex(),
                d.getExplanation(),
                d.getDifficulty(),
                d.getEvidenceQuote(),
                d.isEvidenceVerified(),
                d.getStatus(),
                d.getApprovedQuestion() != null ? d.getApprovedQuestion().getId() : null,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}

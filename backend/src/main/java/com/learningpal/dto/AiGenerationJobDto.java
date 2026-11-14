package com.learningpal.dto;

import com.learningpal.entity.AiGenerationJob;
import com.learningpal.entity.AiJobStatus;
import com.learningpal.entity.QuestionType;

import java.time.Instant;

public record AiGenerationJobDto(
        Long id,
        Long subjectId,
        String subjectName,
        Long topicId,
        String topicName,
        Long sourceFileId,
        String sourceFileName,
        int requestedCount,
        QuestionType questionType,
        int droppedCount,
        AiJobStatus status,
        int sectionsDone,
        int sectionsTotal,
        String modelName,
        String shortNote,
        long draftsCount,
        Instant createdAt,
        Instant startedAt,
        Instant completedAt
) {
    public static AiGenerationJobDto fromEntity(AiGenerationJob job, long draftsCount) {
        return new AiGenerationJobDto(
                job.getId(),
                job.getSubject().getId(),
                job.getSubject().getName(),
                job.getTopic().getId(),
                job.getTopic().getName(),
                job.getSourceFile().getId(),
                job.getSourceFile().getFileName(),
                job.getRequestedCount(),
                job.getQuestionType(),
                job.getDroppedCount(),
                job.getStatus(),
                job.getSectionsDone(),
                job.getSectionsTotal(),
                job.getModelName(),
                job.getShortNote(),
                draftsCount,
                job.getCreatedAt(),
                job.getStartedAt(),
                job.getCompletedAt()
        );
    }
}

package com.learningpal.dto;

import com.learningpal.entity.Subject;
import com.learningpal.entity.SubjectStatus;

import java.time.Instant;

public record TeacherSubjectDto(
        Long id,
        String code,
        String name,
        String description,
        SubjectStatus status,
        Instant createdAt,
        long topicCount,
        long questionCount,
        long quizCount,
        long resourceCount,
        long classCount,
        boolean isOwner
) {
    public static TeacherSubjectDto fromEntity(
            Subject subject,
            long topicCount,
            long questionCount,
            long quizCount,
            long resourceCount,
            long classCount,
            boolean isOwner
    ) {
        return new TeacherSubjectDto(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.getDescription(),
                subject.getStatus(),
                subject.getCreatedAt(),
                topicCount,
                questionCount,
                quizCount,
                resourceCount,
                classCount,
                isOwner
        );
    }
}

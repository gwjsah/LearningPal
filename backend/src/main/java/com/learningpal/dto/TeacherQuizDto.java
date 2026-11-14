package com.learningpal.dto;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.AssessmentKind;
import com.learningpal.entity.AssessmentStatus;

import java.time.Instant;
import java.util.List;

public record TeacherQuizDto(
        Long id,
        Long subjectId,
        String title,
        String description,
        AssessmentStatus status,
        AssessmentKind kind,
        Integer timeLimitMinutes,
        boolean randomizeQuestions,
        boolean randomizeChoices,
        Instant createdAt,
        long questionCount,
        long attemptCount,
        List<QuizQuestionItemDto> questions
) {
    public static TeacherQuizDto fromEntity(
            Assessment a,
            long attemptCount,
            List<QuizQuestionItemDto> questions
    ) {
        return new TeacherQuizDto(
                a.getId(),
                a.getSubject() != null ? a.getSubject().getId() : null,
                a.getTitle(),
                a.getDescription(),
                a.getStatus(),
                a.getKind(),
                a.getTimeLimitMinutes(),
                a.isRandomizeQuestions(),
                a.isRandomizeChoices(),
                a.getCreatedAt(),
                questions != null ? questions.size() : 0,
                attemptCount,
                questions
        );
    }
}

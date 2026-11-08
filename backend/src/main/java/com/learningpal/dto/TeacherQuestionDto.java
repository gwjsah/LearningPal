package com.learningpal.dto;

import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.Question;
import com.learningpal.entity.QuestionOrigin;
import com.learningpal.entity.QuestionStatus;
import com.learningpal.entity.QuestionType;

import java.time.Instant;
import java.util.List;

public record TeacherQuestionDto(
        Long id,
        Long subjectId,
        Long topicId,
        String topicName,
        QuestionType type,
        String text,
        String explanation,
        DifficultyLevel difficulty,
        Double points,
        QuestionStatus status,
        Integer version,
        Long lineageId,
        Long supersedesId,
        QuestionOrigin origin,
        Instant createdAt,
        List<ChoiceDto> choices,
        boolean hasAnswers,
        boolean inQuiz
) {
    public static TeacherQuestionDto fromEntity(
            Question q,
            List<ChoiceDto> choices,
            boolean hasAnswers,
            boolean inQuiz
    ) {
        return new TeacherQuestionDto(
                q.getId(),
                q.getSubject() != null ? q.getSubject().getId() : (q.getTopic() != null && q.getTopic().getSubject() != null ? q.getTopic().getSubject().getId() : null),
                q.getTopic() != null ? q.getTopic().getId() : null,
                q.getTopic() != null ? q.getTopic().getName() : "Unassigned",
                q.getType(),
                q.getText(),
                q.getExplanation(),
                q.getDifficulty(),
                q.getPoints(),
                q.getStatus(),
                q.getVersion(),
                q.getLineageId(),
                q.getSupersedes() != null ? q.getSupersedes().getId() : null,
                q.getOrigin(),
                q.getCreatedAt(),
                choices,
                hasAnswers,
                inQuiz
        );
    }
}

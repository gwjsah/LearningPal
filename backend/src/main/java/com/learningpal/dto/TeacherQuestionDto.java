package com.learningpal.dto;

import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.Question;
import com.learningpal.entity.QuestionOrigin;
import com.learningpal.entity.QuestionStatus;
import com.learningpal.entity.QuestionType;

import java.time.Instant;
import java.util.Collections;
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
        List<String> acceptedAnswers,
        List<EssayRubricCriterionDto> rubricCriteria,
        boolean hasAnswers,
        boolean inQuiz
) {
    public static TeacherQuestionDto fromEntity(
            Question q,
            List<ChoiceDto> choices,
            boolean hasAnswers,
            boolean inQuiz
    ) {
        return fromEntity(q, choices, Collections.emptyList(), Collections.emptyList(), hasAnswers, inQuiz);
    }

    public static TeacherQuestionDto fromEntity(
            Question q,
            List<ChoiceDto> choices,
            List<String> acceptedAnswers,
            List<EssayRubricCriterionDto> rubricCriteria,
            boolean hasAnswers,
            boolean inQuiz
    ) {
        QuestionType canonicalType = q.getType() != null ? q.getType().canonical() : QuestionType.MULTIPLE_CHOICE;
        return new TeacherQuestionDto(
                q.getId(),
                q.getSubject() != null ? q.getSubject().getId() : (q.getTopic() != null && q.getTopic().getSubject() != null ? q.getTopic().getSubject().getId() : null),
                q.getTopic() != null ? q.getTopic().getId() : null,
                q.getTopic() != null ? q.getTopic().getName() : "Unassigned",
                canonicalType,
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
                choices != null ? choices : Collections.emptyList(),
                acceptedAnswers != null ? acceptedAnswers : Collections.emptyList(),
                rubricCriteria != null ? rubricCriteria : Collections.emptyList(),
                hasAnswers,
                inQuiz
        );
    }
}

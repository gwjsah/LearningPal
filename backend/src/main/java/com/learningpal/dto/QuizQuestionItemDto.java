package com.learningpal.dto;

import com.learningpal.entity.AssessmentQuestion;
import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.Question;

public record QuizQuestionItemDto(
        Long questionId,
        Integer position,
        String text,
        String topicName,
        DifficultyLevel difficulty,
        Double points,
        Integer version,
        Long lineageId
) {
    public static QuizQuestionItemDto fromEntity(AssessmentQuestion aq) {
        Question q = aq.getQuestion();
        return new QuizQuestionItemDto(
                q.getId(),
                aq.getPosition(),
                q.getText(),
                q.getTopic() != null ? q.getTopic().getName() : "Unassigned",
                q.getDifficulty(),
                q.getPoints(),
                q.getVersion(),
                q.getLineageId()
        );
    }
}

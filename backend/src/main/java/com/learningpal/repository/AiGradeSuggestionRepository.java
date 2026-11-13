package com.learningpal.repository;

import com.learningpal.entity.AiGradeSuggestion;
import com.learningpal.entity.AiGradeSuggestionStatus;
import com.learningpal.entity.Answer;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;

public interface AiGradeSuggestionRepository extends JpaRepository<AiGradeSuggestion, Long> {
    Optional<AiGradeSuggestion> findTopByAnswerAndStatusInOrderByCreatedAtDesc(
            Answer answer,
            Collection<AiGradeSuggestionStatus> statuses
    );

    Optional<AiGradeSuggestion> findTopByAnswerOrderByCreatedAtDesc(Answer answer);

    long countByTeacherAndCreatedAtAfter(User teacher, Instant after);
}

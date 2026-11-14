package com.learningpal.repository;

import com.learningpal.entity.Answer;
import com.learningpal.entity.AnswerRubricScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRubricScoreRepository extends JpaRepository<AnswerRubricScore, Long> {
    List<AnswerRubricScore> findByAnswer(Answer answer);
    void deleteByAnswer(Answer answer);
}

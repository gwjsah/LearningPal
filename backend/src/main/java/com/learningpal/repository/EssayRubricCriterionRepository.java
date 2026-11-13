package com.learningpal.repository;

import com.learningpal.entity.EssayRubricCriterion;
import com.learningpal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EssayRubricCriterionRepository extends JpaRepository<EssayRubricCriterion, Long> {
    List<EssayRubricCriterion> findByQuestionOrderByDisplayOrderAsc(Question question);
    void deleteByQuestion(Question question);
}

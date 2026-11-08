package com.learningpal.repository;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.AssessmentQuestion;
import com.learningpal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, Long> {
    List<AssessmentQuestion> findByAssessmentOrderByPositionAsc(Assessment assessment);
    List<AssessmentQuestion> findByAssessmentIdOrderByPositionAsc(Long assessmentId);
    long countByAssessmentId(Long assessmentId);
    boolean existsByQuestion(Question question);
    long countByQuestion(Question question);
    void deleteByAssessment(Assessment assessment);
}


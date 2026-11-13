package com.learningpal.repository;

import com.learningpal.entity.Question;
import com.learningpal.entity.QuestionAcceptedAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAcceptedAnswerRepository extends JpaRepository<QuestionAcceptedAnswer, Long> {
    List<QuestionAcceptedAnswer> findByQuestionOrderByDisplayOrderAsc(Question question);
    void deleteByQuestion(Question question);
}

package com.learningpal.repository;

import com.learningpal.entity.Choice;
import com.learningpal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChoiceRepository extends JpaRepository<Choice, Long> {
    List<Choice> findByQuestion(Question question);
    List<Choice> findByQuestionId(Long questionId);
}


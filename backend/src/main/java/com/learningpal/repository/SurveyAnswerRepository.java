package com.learningpal.repository;

import com.learningpal.entity.SurveyAnswer;
import com.learningpal.entity.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, Long> {

    List<SurveyAnswer> findByResponse(SurveyResponse response);
}

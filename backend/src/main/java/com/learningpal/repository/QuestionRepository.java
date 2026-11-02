package com.learningpal.repository;

import com.learningpal.entity.Question;
import com.learningpal.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByTopic(Topic topic);
    List<Question> findByTopicId(Long topicId);
    long countByTopicId(Long topicId);
}


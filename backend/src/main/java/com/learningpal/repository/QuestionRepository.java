package com.learningpal.repository;

import com.learningpal.entity.Question;
import com.learningpal.entity.QuestionStatus;
import com.learningpal.entity.Subject;
import com.learningpal.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByTopic(Topic topic);
    List<Question> findByTopicId(Long topicId);
    List<Question> findByTopicAndStatus(Topic topic, QuestionStatus status);
    List<Question> findBySubject(Subject subject);
    List<Question> findBySubjectAndStatus(Subject subject, QuestionStatus status);
    List<Question> findBySubjectOrderByCreatedAtDesc(Subject subject);
    List<Question> findByLineageIdOrderByVersionDesc(Long lineageId);
    long countByTopic(Topic topic);
    long countByTopicId(Long topicId);
    long countBySubject(Subject subject);
    long countBySubjectAndStatus(Subject subject, QuestionStatus status);
}


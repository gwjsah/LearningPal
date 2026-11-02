package com.learningpal.repository;

import com.learningpal.entity.Resource;
import com.learningpal.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByTopic(Topic topic);
    List<Resource> findByTopicId(Long topicId);
    List<Resource> findBySubjectId(Long subjectId);
    long countByTopicId(Long topicId);
}


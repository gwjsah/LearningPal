package com.learningpal.repository;

import com.learningpal.entity.Resource;
import com.learningpal.entity.ResourceStatus;
import com.learningpal.entity.Subject;
import com.learningpal.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByTopic(Topic topic);
    List<Resource> findByTopicAndStatus(Topic topic, ResourceStatus status);
    List<Resource> findByTopicId(Long topicId);
    List<Resource> findBySubjectId(Long subjectId);
    List<Resource> findBySubjectAndStatus(Subject subject, ResourceStatus status);
    List<Resource> findBySubjectAndTopicIsNullAndStatus(Subject subject, ResourceStatus status);
    long countByTopicId(Long topicId);
    long countByTopic(Topic topic);
    long countBySubject(Subject subject);
    long countBySubjectAndStatus(Subject subject, ResourceStatus status);
}


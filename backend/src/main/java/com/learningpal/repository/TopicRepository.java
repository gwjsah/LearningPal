package com.learningpal.repository;

import com.learningpal.entity.Subject;
import com.learningpal.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findAllByOrderByDisplayOrderAsc();
    List<Topic> findBySubjectOrderByDisplayOrderAsc(Subject subject);
    List<Topic> findBySubjectIdOrderByDisplayOrderAsc(Long subjectId);
    long countBySubject(Subject subject);
    long countBySubjectId(Long subjectId);
    Optional<Topic> findBySubjectAndName(Subject subject, String name);
}


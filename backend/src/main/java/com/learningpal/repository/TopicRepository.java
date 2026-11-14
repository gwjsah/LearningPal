package com.learningpal.repository;

import com.learningpal.entity.Subject;
import com.learningpal.entity.Topic;
import com.learningpal.entity.TopicStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findAllByOrderByDisplayOrderAsc();
    List<Topic> findBySubjectOrderByDisplayOrderAsc(Subject subject);
    List<Topic> findBySubjectAndStatusOrderByDisplayOrderAsc(Subject subject, TopicStatus status);
    List<Topic> findBySubjectIdOrderByDisplayOrderAsc(Long subjectId);
    long countBySubject(Subject subject);
    long countBySubjectId(Long subjectId);
    long countBySubjectAndStatus(Subject subject, TopicStatus status);
    Optional<Topic> findBySubjectAndName(Subject subject, String name);
    Optional<Topic> findBySubjectAndNameIgnoreCase(Subject subject, String name);
    boolean existsBySubjectAndNameIgnoreCase(Subject subject, String name);
    boolean existsBySubjectAndNameIgnoreCaseAndIdNot(Subject subject, String name, Long id);
}


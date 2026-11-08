package com.learningpal.repository;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.AssessmentStatus;
import com.learningpal.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findBySubject(Subject subject);
    List<Assessment> findBySubjectId(Long subjectId);
    List<Assessment> findBySubjectOrderByCreatedAtDesc(Subject subject);
    List<Assessment> findByStatus(AssessmentStatus status);
    List<Assessment> findBySubjectAndStatus(Subject subject, AssessmentStatus status);
    List<Assessment> findBySubjectAndStatusOrderByCreatedAtDesc(Subject subject, AssessmentStatus status);
    List<Assessment> findBySubjectIdAndStatus(Long subjectId, AssessmentStatus status);
    long countBySubject(Subject subject);
    long countBySubjectAndStatus(Subject subject, AssessmentStatus status);
    Optional<Assessment> findByTitle(String title);
}


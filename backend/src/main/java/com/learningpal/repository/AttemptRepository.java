package com.learningpal.repository;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.Attempt;
import com.learningpal.entity.AttemptStatus;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByStudent(User student);
    List<Attempt> findByStudentId(Long studentId);
    List<Attempt> findByStudentAndStatusOrderBySubmittedAtAsc(User student, AttemptStatus status);
    List<Attempt> findByStudentIdAndStatusOrderBySubmittedAtAsc(Long studentId, AttemptStatus status);
    List<Attempt> findByAssessment(Assessment assessment);
    List<Attempt> findByStudentAndAssessmentOrderByAttemptNumberDesc(User student, Assessment assessment);
    long countByStudentIdAndAssessmentId(Long studentId, Long assessmentId);
    List<Attempt> findByClassId(Long classId);
    boolean existsByStudentIdAndClassIdAndStatusAndSubmittedAtAfter(Long studentId, Long classId, AttemptStatus status, Instant submittedAt);
}


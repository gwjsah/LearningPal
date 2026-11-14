package com.learningpal.repository;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.AssessmentAccess;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAccessRepository extends JpaRepository<AssessmentAccess, Long> {
    Optional<AssessmentAccess> findByAssessmentAndStudent(Assessment assessment, User student);
    Optional<AssessmentAccess> findByAssessmentIdAndStudentId(Long assessmentId, Long studentId);
    List<AssessmentAccess> findByStudentId(Long studentId);
    List<AssessmentAccess> findByAssessmentId(Long assessmentId);
}


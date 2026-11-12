package com.csit321g2.codebuds.learningpal.repository;

import com.csit321g2.codebuds.learningpal.entity.Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByStudentId(Long studentId);
    List<Attempt> findByAssessmentId(Long assessmentId);
}

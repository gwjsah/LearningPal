package com.csit321g2.codebuds.learningpal.repository;

import com.csit321g2.codebuds.learningpal.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
}

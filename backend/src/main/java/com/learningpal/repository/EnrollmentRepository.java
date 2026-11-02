package com.learningpal.repository;

import com.learningpal.entity.Enrollment;
import com.learningpal.entity.Subject;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentAndSubject(User student, Subject subject);

    boolean existsByStudentIdAndSubjectId(Long studentId, Long subjectId);

    List<Enrollment> findByStudentOrderByEnrolledAtDesc(User student);

    List<Enrollment> findByStudentId(Long studentId);

    Optional<Enrollment> findByStudentAndSubject(User student, Subject subject);

    Optional<Enrollment> findByStudentIdAndSubjectId(Long studentId, Long subjectId);

    long countBySubjectId(Long subjectId);
}


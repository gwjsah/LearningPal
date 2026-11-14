package com.learningpal.repository;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.AssessmentStatus;
import com.learningpal.entity.Institution;
import com.learningpal.entity.Subject;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * Scoped assessment query for student catalog:
     * Only returns published assessments for subjects where the student has an ACTIVE class enrollment
     * within the student's institution, and excludes assessments created by foreign teachers.
     */
    @Query("SELECT DISTINCT a FROM Assessment a " +
           "JOIN Enrollment e ON e.classEntity.subject = a.subject " +
           "WHERE e.student = :student " +
           "AND e.classEntity.status = com.learningpal.entity.ClassStatus.ACTIVE " +
           "AND e.classEntity.institution = :institution " +
           "AND a.status = :status " +
           "AND (a.createdBy IS NULL OR a.createdBy.institution = :institution)")
    List<Assessment> findPublishedForStudentActiveEnrollments(
            @Param("student") User student,
            @Param("institution") Institution institution,
            @Param("status") AssessmentStatus status
    );
}


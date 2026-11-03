package com.learningpal.repository;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.Enrollment;
import com.learningpal.entity.Subject;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentAndClassEntity(User student, ClassEntity classEntity);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e LEFT JOIN e.classEntity c WHERE e.student = :student AND (c.subject = :subject OR e.subject = :subject)")
    boolean existsByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e LEFT JOIN e.classEntity c WHERE e.student.id = :studentId AND (c.subject.id = :subjectId OR e.subject.id = :subjectId)")
    boolean existsByStudentIdAndSubjectId(@Param("studentId") Long studentId, @Param("subjectId") Long subjectId);

    List<Enrollment> findByStudentOrderByEnrolledAtDesc(User student);

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findByClassEntity(ClassEntity classEntity);

    Optional<Enrollment> findByStudentAndClassEntity(User student, ClassEntity classEntity);

    @Query("SELECT e FROM Enrollment e LEFT JOIN e.classEntity c WHERE e.student = :student AND (c.subject = :subject OR e.subject = :subject)")
    Optional<Enrollment> findByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    @Query("SELECT e FROM Enrollment e LEFT JOIN e.classEntity c WHERE e.student.id = :studentId AND (c.subject.id = :subjectId OR e.subject.id = :subjectId)")
    Optional<Enrollment> findByStudentIdAndSubjectId(@Param("studentId") Long studentId, @Param("subjectId") Long subjectId);

    @Query("SELECT c.id FROM Enrollment e LEFT JOIN e.classEntity c WHERE e.student = :student AND (c.subject = :subject OR e.subject = :subject)")
    Optional<Long> findClassIdByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    long countByClassEntity(ClassEntity classEntity);

    @Query("SELECT COUNT(e) FROM Enrollment e LEFT JOIN e.classEntity c WHERE (c.subject.id = :subjectId OR e.subject.id = :subjectId)")
    long countBySubjectId(@Param("subjectId") Long subjectId);

    List<Enrollment> findByClassEntityIsNull();
}
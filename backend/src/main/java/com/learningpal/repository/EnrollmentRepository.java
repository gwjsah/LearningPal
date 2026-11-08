package com.learningpal.repository;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.ClassStatus;
import com.learningpal.entity.Enrollment;
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
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    boolean existsByStudentAndClassEntity(User student, ClassEntity classEntity);

    boolean existsByStudentIdAndClassEntityId(Long studentId, Long classId);

    Optional<Enrollment> findByStudentAndClassEntity(User student, ClassEntity classEntity);

    List<Enrollment> findByClassEntity(ClassEntity classEntity);

    List<Enrollment> findByClassEntityOrderByEnrolledAtDesc(ClassEntity classEntity);

    long countByClassEntity(ClassEntity classEntity);

    List<Enrollment> findByStudent(User student);

    List<Enrollment> findByStudentOrderByEnrolledAtDesc(User student);

    List<Enrollment> findByStudentId(Long studentId);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e WHERE e.student = :student AND e.classEntity.subject = :subject")
    boolean existsByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e WHERE e.student.id = :studentId AND e.classEntity.subject.id = :subjectId")
    boolean existsByStudentIdAndSubjectId(@Param("studentId") Long studentId, @Param("subjectId") Long subjectId);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e WHERE e.student = :student AND e.classEntity.subject = :subject AND e.classEntity.status = com.learningpal.entity.ClassStatus.ACTIVE")
    boolean existsActiveEnrollmentByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    @Query("SELECT e.classEntity FROM Enrollment e WHERE e.student = :student AND e.classEntity.subject = :subject AND e.classEntity.status = com.learningpal.entity.ClassStatus.ACTIVE")
    Optional<ClassEntity> findActiveClassByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    @Query("SELECT e.classEntity.id FROM Enrollment e WHERE e.student = :student AND e.classEntity.subject = :subject ORDER BY CASE WHEN e.classEntity.status = com.learningpal.entity.ClassStatus.ACTIVE THEN 0 ELSE 1 END, e.enrolledAt DESC")
    List<Long> findClassIdsByStudentAndSubject(@Param("student") User student, @Param("subject") Subject subject);

    default Optional<Long> findClassIdByStudentAndSubject(User student, Subject subject) {
        List<Long> ids = findClassIdsByStudentAndSubject(student, subject);
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.get(0));
    }

    @Query("SELECT e FROM Enrollment e WHERE e.student = :student ORDER BY CASE WHEN e.classEntity.status = com.learningpal.entity.ClassStatus.ACTIVE THEN 0 ELSE 1 END, e.enrolledAt DESC")
    List<Enrollment> findByStudentOrderedForDashboard(@Param("student") User student);

    @Query("SELECT COUNT(e) > 0 FROM Enrollment e WHERE e.student = :student AND e.classEntity.teacher = :teacher AND e.classEntity.institution = :institution")
    boolean existsByStudentAndTeacherAndInstitution(
            @Param("student") User student,
            @Param("teacher") User teacher,
            @Param("institution") Institution institution
    );

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.classEntity.subject.id = :subjectId")
    long countBySubjectId(@Param("subjectId") Long subjectId);

    List<Enrollment> findByClassEntityIsNull();
}

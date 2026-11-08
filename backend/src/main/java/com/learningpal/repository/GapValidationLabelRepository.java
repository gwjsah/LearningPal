package com.learningpal.repository;

import com.learningpal.entity.GapValidationLabel;
import com.learningpal.entity.ValidationSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GapValidationLabelRepository extends JpaRepository<GapValidationLabel, Long> {

    Optional<GapValidationLabel> findByStudentIdAndTopicIdAndSource(Long studentId, Long topicId, ValidationSource source);

    Optional<GapValidationLabel> findByStudentIdAndClassroomIdAndTopicIdAndSource(Long studentId, Long classId, Long topicId, ValidationSource source);

    List<GapValidationLabel> findByStudentId(Long studentId);

    List<GapValidationLabel> findByStudentIdAndSource(Long studentId, ValidationSource source);

    List<GapValidationLabel> findByStudentInAndSource(java.util.Collection<com.learningpal.entity.User> students, ValidationSource source);

    List<GapValidationLabel> findByTopicId(Long topicId);

    List<GapValidationLabel> findBySource(ValidationSource source);

    long countBySource(ValidationSource source);

    @Query("SELECT g FROM GapValidationLabel g WHERE (g.classroom.id = :classId OR (g.student IN (SELECT e.student FROM Enrollment e WHERE e.classEntity.id = :classId) AND g.topic.subject = (SELECT c.subject FROM ClassEntity c WHERE c.id = :classId))) AND g.source = :source")
    List<GapValidationLabel> findByClassIdAndSource(@Param("classId") Long classId, @Param("source") ValidationSource source);

    @Query("SELECT g FROM GapValidationLabel g WHERE g.student.institution.id = :institutionId AND g.source = :source")
    List<GapValidationLabel> findByInstitutionIdAndSource(@Param("institutionId") Long institutionId, @Param("source") ValidationSource source);

    @Modifying
    @Query("DELETE FROM GapValidationLabel g WHERE g.student.email LIKE :emailPattern")
    void deleteByStudentEmailLike(@Param("emailPattern") String emailPattern);
}


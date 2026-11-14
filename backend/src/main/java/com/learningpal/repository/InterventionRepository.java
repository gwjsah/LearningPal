package com.learningpal.repository;

import com.learningpal.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findByStudent(User student);
    List<Intervention> findByStudentId(Long studentId);
    List<Intervention> findByTeacher(User teacher);
    List<Intervention> findByTeacherId(Long teacherId);
    List<Intervention> findByTopic(Topic topic);

    List<Intervention> findByClassEntityId(Long classId);
    List<Intervention> findByClassEntityIdAndStatus(Long classId, InterventionStatus status);
    List<Intervention> findByClassEntityIdAndStudentId(Long classId, Long studentId);
    List<Intervention> findByClassEntityIdAndStudentIdAndStatus(Long classId, Long studentId, InterventionStatus status);

    long countByClassEntityIdAndStatus(Long classId, InterventionStatus status);
    long countByClassEntityIdAndStudentIdAndStatus(Long classId, Long studentId, InterventionStatus status);

    @Query("SELECT i.student.id, COUNT(i) FROM Intervention i WHERE i.classEntity.id = :classId AND i.status = :status GROUP BY i.student.id")
    List<Object[]> countOpenInterventionsByClassGroupedByStudent(
            @Param("classId") Long classId,
            @Param("status") InterventionStatus status
    );
}

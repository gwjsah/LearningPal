package com.learningpal.repository;

import com.learningpal.entity.StudentValidationAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentValidationAssignmentRepository extends JpaRepository<StudentValidationAssignment, Long> {

    List<StudentValidationAssignment> findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(Long studentId, Long classId);

    List<StudentValidationAssignment> findByClassroomId(Long classId);

    boolean existsByStudentIdAndClassroomId(Long studentId, Long classId);

    Optional<StudentValidationAssignment> findByStudentIdAndClassroomIdAndTopicId(Long studentId, Long classId, Long topicId);

    @Query("SELECT a.topic.id, COUNT(a) FROM StudentValidationAssignment a WHERE a.classroom.id = :classId GROUP BY a.topic.id")
    List<Object[]> countTopicAssignmentsByClassroom(@Param("classId") Long classId);
}

package com.learningpal.repository;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.StudentTopicMastery;
import com.learningpal.entity.Topic;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentTopicMasteryRepository extends JpaRepository<StudentTopicMastery, Long> {
    List<StudentTopicMastery> findByStudent(User student);
    List<StudentTopicMastery> findByStudentOrderByTopicDisplayOrderAsc(User student);
    List<StudentTopicMastery> findByStudentId(Long studentId);
    List<StudentTopicMastery> findByStudentIdOrderByTopicDisplayOrderAsc(Long studentId);
    Optional<StudentTopicMastery> findByStudentAndTopic(User student, Topic topic);
    Optional<StudentTopicMastery> findByStudentIdAndTopicId(Long studentId, Long topicId);

    // Class-scoped mastery queries
    Optional<StudentTopicMastery> findByStudentAndClassroomAndTopic(User student, ClassEntity classroom, Topic topic);
    Optional<StudentTopicMastery> findByStudentIdAndClassroomIdAndTopicId(Long studentId, Long classId, Long topicId);
    List<StudentTopicMastery> findByStudentAndClassroom(User student, ClassEntity classroom);
    List<StudentTopicMastery> findByStudentAndClassroomOrderByTopicDisplayOrderAsc(User student, ClassEntity classroom);
    List<StudentTopicMastery> findByStudentIdAndClassroomIdOrderByTopicDisplayOrderAsc(Long studentId, Long classId);
    List<StudentTopicMastery> findByStudentIdAndClassroomId(Long studentId, Long classId);
    List<StudentTopicMastery> findByClassroom(ClassEntity classroom);
    List<StudentTopicMastery> findByClassroomId(Long classId);

    @Query("SELECT m FROM StudentTopicMastery m WHERE m.student IN :students AND m.classroom = :classroom ORDER BY m.topic.displayOrder ASC")
    List<StudentTopicMastery> findByStudentsAndClassroom(
            @Param("students") Collection<User> students,
            @Param("classroom") ClassEntity classroom
    );

    @Query("SELECT m FROM StudentTopicMastery m WHERE m.student = :student AND m.topic.subject = :subject ORDER BY m.topic.displayOrder ASC")
    List<StudentTopicMastery> findByStudentAndSubject(
            @Param("student") User student,
            @Param("subject") com.learningpal.entity.Subject subject
    );

    @Query("SELECT m FROM StudentTopicMastery m WHERE m.student IN :students AND m.topic.subject = :subject")
    List<StudentTopicMastery> findByStudentsAndSubject(
            @Param("students") Collection<User> students,
            @Param("subject") com.learningpal.entity.Subject subject
    );
}


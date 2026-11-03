package com.learningpal.repository;

import com.learningpal.entity.StudentTopicMastery;
import com.learningpal.entity.Topic;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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

    @org.springframework.data.jpa.repository.Query("SELECT m FROM StudentTopicMastery m WHERE m.student = :student AND m.topic.subject = :subject ORDER BY m.topic.displayOrder ASC")
    List<StudentTopicMastery> findByStudentAndSubject(
            @org.springframework.data.repository.query.Param("student") User student,
            @org.springframework.data.repository.query.Param("subject") com.learningpal.entity.Subject subject
    );

    @org.springframework.data.jpa.repository.Query("SELECT m FROM StudentTopicMastery m WHERE m.student IN :students AND m.topic.subject = :subject")
    List<StudentTopicMastery> findByStudentsAndSubject(
            @org.springframework.data.repository.query.Param("students") java.util.Collection<User> students,
            @org.springframework.data.repository.query.Param("subject") com.learningpal.entity.Subject subject
    );
}


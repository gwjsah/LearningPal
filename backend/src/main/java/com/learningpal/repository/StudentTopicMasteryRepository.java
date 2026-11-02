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
}


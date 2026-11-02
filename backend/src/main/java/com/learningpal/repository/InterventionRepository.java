package com.learningpal.repository;

import com.learningpal.entity.Intervention;
import com.learningpal.entity.Topic;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findByStudent(User student);
    List<Intervention> findByStudentId(Long studentId);
    List<Intervention> findByTeacher(User teacher);
    List<Intervention> findByTeacherId(Long teacherId);
    List<Intervention> findByTopic(Topic topic);
}


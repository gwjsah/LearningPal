package com.learningpal.repository;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.Resource;
import com.learningpal.entity.ResourceProgress;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceProgressRepository extends JpaRepository<ResourceProgress, Long> {
    List<ResourceProgress> findByStudent(User student);
    List<ResourceProgress> findByStudentId(Long studentId);
    Optional<ResourceProgress> findByStudentAndResource(User student, Resource resource);
    Optional<ResourceProgress> findByStudentIdAndResourceId(Long studentId, Long resourceId);

    // Class-scoped progress queries
    Optional<ResourceProgress> findByStudentAndClassroomAndResource(User student, ClassEntity classroom, Resource resource);
    Optional<ResourceProgress> findByStudentIdAndClassroomIdAndResourceId(Long studentId, Long classId, Long resourceId);
    List<ResourceProgress> findByStudentAndClassroom(User student, ClassEntity classroom);
    List<ResourceProgress> findByStudentIdAndClassroomId(Long studentId, Long classId);
}


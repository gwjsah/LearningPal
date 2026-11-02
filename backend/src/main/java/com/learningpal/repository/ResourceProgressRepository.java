package com.learningpal.repository;

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
}


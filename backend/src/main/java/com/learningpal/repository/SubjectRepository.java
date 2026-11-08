package com.learningpal.repository;

import com.learningpal.entity.Subject;
import com.learningpal.entity.SubjectStatus;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByCode(String code);
    Optional<Subject> findByCodeIgnoreCase(String code);
    boolean existsByCode(String code);

    List<Subject> findByOwnerOrderByCreatedAtDesc(User owner);
    List<Subject> findByOwnerAndStatusOrderByCreatedAtDesc(User owner, SubjectStatus status);
    Optional<Subject> findByOwnerAndStatusAndNameIgnoreCase(User owner, SubjectStatus status, String name);
    List<Subject> findByOwnerAndStatus(User owner, SubjectStatus status);
}


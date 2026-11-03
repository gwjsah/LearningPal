package com.learningpal.repository;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.ClassStatus;
import com.learningpal.entity.Institution;
import com.learningpal.entity.Subject;
import com.learningpal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassEntityRepository extends JpaRepository<ClassEntity, Long> {

    Optional<ClassEntity> findByInstitutionAndJoinCode(Institution institution, String joinCode);

    Optional<ClassEntity> findByJoinCode(String joinCode);

    boolean existsByInstitutionAndJoinCode(Institution institution, String joinCode);

    List<ClassEntity> findByInstitutionOrderByCreatedAtDesc(Institution institution);

    List<ClassEntity> findByInstitutionAndStatus(Institution institution, ClassStatus status);

    List<ClassEntity> findByTeacherOrderByCreatedAtDesc(User teacher);

    boolean existsByTeacherAndSubjectAndNameIgnoreCase(User teacher, Subject subject, String name);

    Optional<ClassEntity> findFirstByInstitutionAndSubjectAndStatus(Institution institution, Subject subject, ClassStatus status);

    Optional<ClassEntity> findFirstByInstitutionAndSubject(Institution institution, Subject subject);

    long countByInstitution(Institution institution);
}

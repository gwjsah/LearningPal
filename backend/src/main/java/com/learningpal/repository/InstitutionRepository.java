package com.learningpal.repository;

import com.learningpal.entity.Institution;
import com.learningpal.entity.InstitutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long> {

    Optional<Institution> findByCode(String code);

    Optional<Institution> findByCodeAndStatus(String code, InstitutionStatus status);

    boolean existsByCode(String code);
}


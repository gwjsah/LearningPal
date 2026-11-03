package com.learningpal.repository;

import com.learningpal.entity.Institution;
import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access layer for User entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);

    List<User> findByRoleAndStatusOrderByCreatedAtDesc(Role role, UserStatus status);

    List<User> findByInstitutionAndRoleAndStatusOrderByCreatedAtDesc(Institution institution, Role role, UserStatus status);

    List<User> findByInstitutionOrderByCreatedAtDesc(Institution institution);

    List<User> findByInstitutionAndRoleOrderByCreatedAtDesc(Institution institution, Role role);

    List<User> findByInstitutionAndStatusOrderByCreatedAtDesc(Institution institution, UserStatus status);

    List<User> findByInstitutionAndRoleAndStatus(Institution institution, Role role, UserStatus status);

    Optional<User> findFirstByInstitutionAndRoleAndStatus(Institution institution, Role role, UserStatus status);

    long countByInstitution(Institution institution);

    List<User> findByInstitutionIsNullAndRoleNot(Role role);

    List<User> findByInstitutionIsNull();
}

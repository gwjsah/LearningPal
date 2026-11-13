package com.learningpal.service;

import com.learningpal.dto.AdminClassDto;
import com.learningpal.dto.MessageResponse;
import com.learningpal.dto.PendingTeacherDto;
import com.learningpal.dto.ReassignTeacherRequest;
import com.learningpal.dto.UserDto;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.ClassEntityRepository;
import com.learningpal.repository.EnrollmentRepository;
import com.learningpal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing administrator operations, strictly scoped to the calling admin's institution.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ClassEntityRepository classEntityRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TenantAccess tenantAccess;

    public AdminService(
            UserRepository userRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            TenantAccess tenantAccess) {
        this.userRepository = userRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Lists all teacher registrations currently awaiting approval in the caller's institution.
     */
    @Transactional(readOnly = true)
    public List<PendingTeacherDto> getPendingTeachers(String adminEmail) {
        User admin = getAdminUser(adminEmail);
        Institution inst = tenantAccess.requireCallerInstitution(admin);

        return userRepository.findByInstitutionAndRoleAndStatusOrderByCreatedAtDesc(inst, Role.TEACHER, UserStatus.PENDING)
                .stream()
                .map(PendingTeacherDto::fromEntity)
                .toList();
    }

    /**
     * Approves a pending teacher account, transitioning status to ACTIVE.
     * Enforces that the teacher belongs to the caller's institution (throws 404 otherwise).
     */
    @Transactional
    public MessageResponse approveTeacher(Long id, String adminEmail) {
        User admin = getAdminUser(adminEmail);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        tenantAccess.requireSameInstitution(admin, user);

        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("User with id " + id + " is not a teacher");
        }

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return new MessageResponse("Teacher account approved successfully");
    }

    /**
     * Rejects a pending teacher account, transitioning status to REJECTED.
     * Enforces that the teacher belongs to the caller's institution (throws 404 otherwise).
     */
    @Transactional
    public MessageResponse rejectTeacher(Long id, String adminEmail) {
        User admin = getAdminUser(adminEmail);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        tenantAccess.requireSameInstitution(admin, user);

        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("User with id " + id + " is not a teacher");
        }

        user.setStatus(UserStatus.REJECTED);
        userRepository.save(user);

        return new MessageResponse("Teacher account rejected");
    }

    /**
     * Lists users in the admin's institution, with optional filtering by role and status.
     */
    @Transactional(readOnly = true)
    public List<UserDto> getUsers(String adminEmail, Role role, UserStatus status) {
        User admin = getAdminUser(adminEmail);
        Institution inst = tenantAccess.requireCallerInstitution(admin);

        List<User> users;
        if (role != null && status != null) {
            users = userRepository.findByInstitutionAndRoleAndStatus(inst, role, status);
        } else if (role != null) {
            users = userRepository.findByInstitutionAndRoleOrderByCreatedAtDesc(inst, role);
        } else if (status != null) {
            users = userRepository.findByInstitutionAndStatusOrderByCreatedAtDesc(inst, status);
        } else {
            users = userRepository.findByInstitutionOrderByCreatedAtDesc(inst);
        }

        return users.stream().map(UserDto::fromEntity).toList();
    }

    /**
     * Deactivates a user in the caller's institution.
     * Cannot deactivate self, cannot deactivate SUPER_ADMIN, cross-tenant throws 404.
     */
    @Transactional
    public MessageResponse deactivateUser(Long targetUserId, String adminEmail) {
        User admin = getAdminUser(adminEmail);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        // Enforce tenant boundary before role/self checks so foreign or SUPER_ADMIN IDs return uniform 404
        tenantAccess.requireSameInstitution(admin, target);

        if (target.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        if (target.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot deactivate a platform super administrator");
        }

        target.setStatus(UserStatus.DEACTIVATED);
        userRepository.save(target);

        return new MessageResponse("User " + target.getFullName() + " deactivated successfully");
    }

    /**
     * Reactivates a deactivated or pending user in the caller's institution.
     */
    @Transactional
    public MessageResponse reactivateUser(Long targetUserId, String adminEmail) {
        User admin = getAdminUser(adminEmail);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        tenantAccess.requireSameInstitution(admin, target);

        target.setStatus(UserStatus.ACTIVE);
        userRepository.save(target);

        return new MessageResponse("User " + target.getFullName() + " reactivated successfully");
    }

    /**
     * Lists classes in the admin's institution, including teacher info and student count.
     */
    @Transactional(readOnly = true)
    public List<AdminClassDto> getClasses(String adminEmail) {
        User admin = getAdminUser(adminEmail);
        Institution inst = tenantAccess.requireCallerInstitution(admin);

        List<ClassEntity> classes = classEntityRepository.findByInstitutionOrderByCreatedAtDesc(inst);
        return classes.stream().map(cls -> {
            long studentCount = enrollmentRepository.countByClassEntity(cls);
            return AdminClassDto.fromEntity(cls, studentCount);
        }).toList();
    }

    /**
     * Reassigns a class to an ACTIVE teacher of the same institution.
     */
    @Transactional
    public MessageResponse reassignClassTeacher(Long classId, ReassignTeacherRequest request, String adminEmail) {
        User admin = getAdminUser(adminEmail);
        ClassEntity classEntity = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        tenantAccess.requireSameInstitution(admin, classEntity.getInstitution());

        User teacher = userRepository.findById(request.teacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + request.teacherId()));

        tenantAccess.requireSameInstitution(admin, teacher);

        if (teacher.getRole() != Role.TEACHER) {
            throw new BadRequestException("User is not a teacher");
        }
        if (teacher.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Teacher must have ACTIVE status to be assigned to a class");
        }

        classEntity.setTeacher(teacher);
        classEntityRepository.save(classEntity);

        return new MessageResponse("Class " + classEntity.getName() + " successfully reassigned to " + teacher.getFullName());
    }

    private User getAdminUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with email: " + email));
    }
}

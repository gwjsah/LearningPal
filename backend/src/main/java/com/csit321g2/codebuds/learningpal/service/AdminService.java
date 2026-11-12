package com.csit321g2.codebuds.learningpal.service;

import com.csit321g2.codebuds.learningpal.dto.MessageResponse;
import com.csit321g2.codebuds.learningpal.dto.PendingTeacherDto;
import com.csit321g2.codebuds.learningpal.entity.Role;
import com.csit321g2.codebuds.learningpal.entity.User;
import com.csit321g2.codebuds.learningpal.entity.UserStatus;
import com.csit321g2.codebuds.learningpal.exception.BadRequestException;
import com.csit321g2.codebuds.learningpal.exception.ResourceNotFoundException;
import com.csit321g2.codebuds.learningpal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing administrator operations, including teacher approval workflows.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lists all teacher registrations currently awaiting approval.
     */
    @Transactional(readOnly = true)
    public List<PendingTeacherDto> getPendingTeachers() {
        return userRepository.findByRoleAndStatusOrderByCreatedAtDesc(Role.TEACHER, UserStatus.PENDING)
                .stream()
                .map(PendingTeacherDto::fromEntity)
                .toList();
    }

    /**
     * Approves a pending teacher account, transitioning status to ACTIVE.
     */
    @Transactional
    public MessageResponse approveTeacher(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("User with id " + id + " is not a teacher");
        }

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        return new MessageResponse("Teacher account approved successfully");
    }

    /**
     * Rejects a pending teacher account, transitioning status to REJECTED.
     */
    @Transactional
    public MessageResponse rejectTeacher(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("User with id " + id + " is not a teacher");
        }

        user.setStatus(UserStatus.REJECTED);
        userRepository.save(user);

        return new MessageResponse("Teacher account rejected");
    }
}


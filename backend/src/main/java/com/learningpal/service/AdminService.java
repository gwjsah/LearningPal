package com.learningpal.service;

import com.learningpal.dto.MessageResponse;
import com.learningpal.dto.PendingTeacherDto;
import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.UserRepository;
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


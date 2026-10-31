package com.learningpal.controller;

import com.learningpal.dto.MessageResponse;
import com.learningpal.dto.PendingTeacherDto;
import com.learningpal.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for administrator operations.
 * Protected by Spring Security to require ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Lists all teachers with PENDING status awaiting review.
     */
    @GetMapping("/teachers/pending")
    public ResponseEntity<List<PendingTeacherDto>> getPendingTeachers() {
        List<PendingTeacherDto> pending = adminService.getPendingTeachers();
        return ResponseEntity.ok(pending);
    }

    /**
     * Approves a pending teacher registration.
     */
    @PostMapping("/teachers/{id}/approve")
    public ResponseEntity<MessageResponse> approveTeacher(@PathVariable Long id) {
        MessageResponse response = adminService.approveTeacher(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Rejects a pending teacher registration.
     */
    @PostMapping("/teachers/{id}/reject")
    public ResponseEntity<MessageResponse> rejectTeacher(@PathVariable Long id) {
        MessageResponse response = adminService.rejectTeacher(id);
        return ResponseEntity.ok(response);
    }
}


package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.entity.Role;
import com.learningpal.entity.UserStatus;
import com.learningpal.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for administrator operations, scoped strictly to the calling admin's institution.
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
     * Lists all teachers with PENDING status awaiting review in this admin's institution.
     */
    @GetMapping("/teachers/pending")
    public ResponseEntity<List<PendingTeacherDto>> getPendingTeachers(Principal principal) {
        List<PendingTeacherDto> pending = adminService.getPendingTeachers(principal.getName());
        return ResponseEntity.ok(pending);
    }

    /**
     * Approves a pending teacher registration.
     */
    @PostMapping("/teachers/{id}/approve")
    public ResponseEntity<MessageResponse> approveTeacher(@PathVariable Long id, Principal principal) {
        MessageResponse response = adminService.approveTeacher(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Rejects a pending teacher registration.
     */
    @PostMapping("/teachers/{id}/reject")
    public ResponseEntity<MessageResponse> rejectTeacher(@PathVariable Long id, Principal principal) {
        MessageResponse response = adminService.rejectTeacher(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Lists users in this admin's institution, optionally filtered by role and status.
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            Principal principal) {
        List<UserDto> users = adminService.getUsers(principal.getName(), role, status);
        return ResponseEntity.ok(users);
    }

    /**
     * Deactivates a user in this admin's institution.
     */
    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<MessageResponse> deactivateUser(@PathVariable Long id, Principal principal) {
        MessageResponse response = adminService.deactivateUser(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Reactivates a user in this admin's institution.
     */
    @PostMapping("/users/{id}/reactivate")
    public ResponseEntity<MessageResponse> reactivateUser(@PathVariable Long id, Principal principal) {
        MessageResponse response = adminService.reactivateUser(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Lists classes in this admin's institution.
     */
    @GetMapping("/classes")
    public ResponseEntity<List<AdminClassDto>> getClasses(Principal principal) {
        List<AdminClassDto> classes = adminService.getClasses(principal.getName());
        return ResponseEntity.ok(classes);
    }

    /**
     * Reassigns a class to an active teacher in this admin's institution.
     */
    @PutMapping("/classes/{id}/teacher")
    public ResponseEntity<MessageResponse> reassignClassTeacher(
            @PathVariable Long id,
            @Valid @RequestBody ReassignTeacherRequest request,
            Principal principal) {
        MessageResponse response = adminService.reassignClassTeacher(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }
}

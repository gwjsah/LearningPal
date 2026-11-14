package com.learningpal.controller;

import com.learningpal.dto.CreateInstitutionRequest;
import com.learningpal.dto.InstitutionDetailDto;
import com.learningpal.dto.InstitutionSummaryDto;
import com.learningpal.dto.MessageResponse;
import com.learningpal.dto.UserDto;
import com.learningpal.entity.Role;
import com.learningpal.entity.UserStatus;
import com.learningpal.service.SuperAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for platform super-administrator capabilities.
 * Guarded under /api/super/** requiring ROLE_SUPER_ADMIN.
 */
@RestController
@RequestMapping("/api/super")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    /**
     * Provisions a new educational institution along with its initial administrator account.
     */
    @PostMapping("/institutions")
    public ResponseEntity<InstitutionDetailDto> createInstitution(@Valid @RequestBody CreateInstitutionRequest request) {
        InstitutionDetailDto created = superAdminService.createInstitution(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lists all platform institutions with associated user and class counts.
     */
    @GetMapping("/institutions")
    public ResponseEntity<List<InstitutionSummaryDto>> getInstitutions() {
        return ResponseEntity.ok(superAdminService.getInstitutions());
    }

    /**
     * Lists platform users with optional filtering by role, institutionId, status, and name/email search.
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Long institutionId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(superAdminService.getUsers(role, institutionId, status, search));
    }

    /**
     * Deactivates a user account on the platform.
     */
    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<MessageResponse> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.deactivateUser(id));
    }

    /**
     * Reactivates a user account on the platform.
     */
    @PostMapping("/users/{id}/reactivate")
    public ResponseEntity<MessageResponse> reactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.reactivateUser(id));
    }
}


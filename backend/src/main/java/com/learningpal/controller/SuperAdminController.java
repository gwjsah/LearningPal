package com.learningpal.controller;

import com.learningpal.dto.CreateInstitutionRequest;
import com.learningpal.dto.InstitutionDetailDto;
import com.learningpal.dto.InstitutionSummaryDto;
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
}


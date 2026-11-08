package com.learningpal.controller;

import com.learningpal.dto.ValidationReportDto;
import com.learningpal.service.ValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Controller providing institution-wide Validation Lab reporting for school administrators.
 */
@RestController
@RequestMapping("/api/admin/validation")
public class AdminValidationController {

    private final ValidationService validationService;

    public AdminValidationController(ValidationService validationService) {
        this.validationService = validationService;
    }

    /**
     * Retrieves the institution-wide validation agreement report across all classes.
     */
    @GetMapping("/report")
    public ResponseEntity<ValidationReportDto> getAdminValidationReport(
            @RequestParam(required = false, defaultValue = "TEACHER") String source,
            @RequestParam(required = false, defaultValue = "false") boolean includeStale,
            Principal principal) {
        return ResponseEntity.ok(validationService.getAdminValidationReport(source, includeStale, principal.getName()));
    }
}


package com.learningpal.controller;

import com.learningpal.dto.AdminSurveySummaryDto;
import com.learningpal.service.MeasurementSurveyService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.Principal;

/**
 * Controller for institution administrator survey aggregations and CSV exports.
 * All routes require ROLE_ADMIN under /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/survey")
public class AdminSurveyController {

    private final MeasurementSurveyService measurementSurveyService;

    public AdminSurveyController(MeasurementSurveyService measurementSurveyService) {
        this.measurementSurveyService = measurementSurveyService;
    }

    /**
     * Retrieves institution usability survey summary and 4.0 target check.
     */
    @GetMapping("/summary")
    public ResponseEntity<AdminSurveySummaryDto> getSummary(Principal principal) {
        AdminSurveySummaryDto summary = measurementSurveyService.getAdminSurveySummary(principal.getName());
        return ResponseEntity.ok(summary);
    }

    /**
     * Exports institution survey responses to a formula-safe CSV with pseudonymous codes.
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(Principal principal) {
        String csv = measurementSurveyService.exportAdminSurveyCsv(principal.getName());
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"survey-export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}

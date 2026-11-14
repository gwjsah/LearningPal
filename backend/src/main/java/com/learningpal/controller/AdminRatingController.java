package com.learningpal.controller;

import com.learningpal.dto.AdminRatingsSummaryDto;
import com.learningpal.service.MeasurementRatingService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.Principal;

/**
 * Controller for institution administrator rating summaries and CSV exports.
 * All routes require ROLE_ADMIN under /api/admin/**.
 */
@RestController
@RequestMapping("/api/admin/ratings")
public class AdminRatingController {

    private final MeasurementRatingService measurementRatingService;

    public AdminRatingController(MeasurementRatingService measurementRatingService) {
        this.measurementRatingService = measurementRatingService;
    }

    /**
     * Retrieves institution-wide helpfulness rating summary and 80% target check.
     */
    @GetMapping("/summary")
    public ResponseEntity<AdminRatingsSummaryDto> getSummary(Principal principal) {
        AdminRatingsSummaryDto summary = measurementRatingService.getAdminRatingsSummary(principal.getName());
        return ResponseEntity.ok(summary);
    }

    /**
     * Exports institution ratings to a formula-safe CSV with pseudonymous student codes.
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(Principal principal) {
        String csv = measurementRatingService.exportAdminRatingsCsv(principal.getName());
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ratings-export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}

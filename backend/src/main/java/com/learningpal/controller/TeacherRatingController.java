package com.learningpal.controller;

import com.learningpal.dto.TeacherRatingsSummaryDto;
import com.learningpal.service.MeasurementRatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller for educator classroom rating quality summaries.
 * All routes require ROLE_TEACHER under /api/teacher/**.
 */
@RestController
@RequestMapping("/api/teacher/classes/{classId}")
public class TeacherRatingController {

    private final MeasurementRatingService measurementRatingService;

    public TeacherRatingController(MeasurementRatingService measurementRatingService) {
        this.measurementRatingService = measurementRatingService;
    }

    /**
     * Retrieves helpfulness ratings summary for an educator's classroom section.
     */
    @GetMapping("/ratings-summary")
    public ResponseEntity<TeacherRatingsSummaryDto> getRatingsSummary(
            @PathVariable Long classId,
            Principal principal) {
        TeacherRatingsSummaryDto summary = measurementRatingService.getTeacherRatingsSummary(classId, principal.getName());
        return ResponseEntity.ok(summary);
    }
}

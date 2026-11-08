package com.learningpal.controller;

import com.learningpal.dto.RateItemRequest;
import com.learningpal.dto.RatingSavedDto;
import com.learningpal.service.MeasurementRatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller for student helpfulness ratings on feedback and educational resources.
 * All routes require ROLE_STUDENT under /api/student/**.
 */
@RestController
@RequestMapping("/api/student")
public class StudentRatingController {

    private final MeasurementRatingService measurementRatingService;

    public StudentRatingController(MeasurementRatingService measurementRatingService) {
        this.measurementRatingService = measurementRatingService;
    }

    /**
     * Submits or updates a student's helpfulness rating for diagnostic topic feedback.
     */
    @PutMapping("/topics/{topicId}/feedback-rating")
    public ResponseEntity<RatingSavedDto> rateTopicFeedback(
            @PathVariable Long topicId,
            @Valid @RequestBody RateItemRequest request,
            Principal principal) {
        RatingSavedDto result = measurementRatingService.saveTopicFeedbackRating(
                topicId, request.rating(), request.comment(), principal.getName()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Submits or updates a student's helpfulness rating for an educational resource.
     */
    @PutMapping("/resources/{resourceId}/rating")
    public ResponseEntity<RatingSavedDto> rateResource(
            @PathVariable Long resourceId,
            @Valid @RequestBody RateItemRequest request,
            Principal principal) {
        RatingSavedDto result = measurementRatingService.saveResourceRating(
                resourceId, request.rating(), request.comment(), principal.getName()
        );
        return ResponseEntity.ok(result);
    }
}

package com.learningpal.controller;

import com.learningpal.dto.SubmitSurveyRequest;
import com.learningpal.dto.SurveyStatusDto;
import com.learningpal.service.MeasurementSurveyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * REST controller for in-app usability survey evaluations.
 * Accessible to authenticated STUDENT and TEACHER accounts.
 */
@RestController
@RequestMapping("/api/survey")
public class SurveyController {

    private final MeasurementSurveyService measurementSurveyService;

    public SurveyController(MeasurementSurveyService measurementSurveyService) {
        this.measurementSurveyService = measurementSurveyService;
    }

    /**
     * Retrieves survey status and role-specific items for caller.
     */
    @GetMapping
    public ResponseEntity<SurveyStatusDto> getSurveyStatus(Principal principal) {
        SurveyStatusDto status = measurementSurveyService.getSurveyStatus(principal.getName());
        return ResponseEntity.ok(status);
    }

    /**
     * Submits survey answers for caller.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> submitSurvey(
            @Valid @RequestBody SubmitSurveyRequest request,
            Principal principal) {
        measurementSurveyService.submitSurvey(request, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Survey submitted successfully"));
    }
}

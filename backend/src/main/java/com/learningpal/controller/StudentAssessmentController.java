package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.service.StudentAssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing student assessment endpoints.
 * All routes are guarded under /api/student/** requiring ROLE_STUDENT.
 */
@RestController
@RequestMapping("/api/student")
public class StudentAssessmentController {

    private final StudentAssessmentService studentAssessmentService;

    public StudentAssessmentController(StudentAssessmentService studentAssessmentService) {
        this.studentAssessmentService = studentAssessmentService;
    }

    /**
     * Lists all published assessments with the calling student's latest attempt status.
     * Optionally filtered by subjectId.
     */
    @GetMapping("/assessments")
    public ResponseEntity<List<StudentAssessmentDto>> getAssessments(
            @RequestParam(required = false) Long subjectId,
            Principal principal) {
        if (subjectId != null) {
            return ResponseEntity.ok(studentAssessmentService.getAvailableAssessmentsBySubject(subjectId, principal.getName()));
        }
        return ResponseEntity.ok(studentAssessmentService.getAvailableAssessments(principal.getName()));
    }

    /**
     * Lists published assessments scoped to a specific subject after verifying enrollment.
     */
    @GetMapping("/subjects/{subjectId}/assessments")
    public ResponseEntity<List<StudentAssessmentDto>> getSubjectAssessments(
            @PathVariable Long subjectId,
            Principal principal) {
        return ResponseEntity.ok(studentAssessmentService.getAvailableAssessmentsBySubject(subjectId, principal.getName()));
    }

    /**
     * Starts a new attempt or resumes an existing IN_PROGRESS attempt.
     */
    @PostMapping("/assessments/{id}/attempts")
    public ResponseEntity<StartAttemptResponseDto> startAttempt(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentAssessmentService.startOrResumeAttempt(id, principal.getName()));
    }

    /**
     * Submits an attempt and triggers atomic auto-grading.
     */
    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<SubmitAttemptResponse> submitAttempt(
            @PathVariable Long attemptId,
            @Valid @RequestBody SubmitAttemptRequest request,
            Principal principal) {
        return ResponseEntity.ok(studentAssessmentService.submitAttempt(attemptId, request, principal.getName()));
    }

    /**
     * Retrieves the auto-graded result and question-by-question review for a finalized attempt.
     */
    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<AttemptResultDto> getResult(
            @PathVariable Long attemptId,
            Principal principal) {
        return ResponseEntity.ok(studentAssessmentService.getAttemptResult(attemptId, principal.getName()));
    }
}


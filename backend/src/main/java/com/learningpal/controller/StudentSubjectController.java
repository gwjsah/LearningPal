package com.learningpal.controller;

import com.learningpal.dto.StudentSubjectSummaryDto;
import com.learningpal.service.StudentEnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing student enrolled subject summaries.
 * Direct subject self-enrollment has been retired in favor of join-code classroom onboarding.
 */
@RestController
@RequestMapping("/api/student/subjects")
public class StudentSubjectController {

    private final StudentEnrollmentService studentEnrollmentService;

    public StudentSubjectController(StudentEnrollmentService studentEnrollmentService) {
        this.studentEnrollmentService = studentEnrollmentService;
    }

    /**
     * Lists all subjects the calling student is enrolled in with diagnostic summaries.
     */
    @GetMapping
    public ResponseEntity<List<StudentSubjectSummaryDto>> getEnrolledSubjects(Principal principal) {
        return ResponseEntity.ok(studentEnrollmentService.getEnrolledSubjects(principal.getName()));
    }
}

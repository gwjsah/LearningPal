package com.learningpal.controller;

import com.learningpal.dto.AvailableSubjectDto;
import com.learningpal.dto.StudentSubjectSummaryDto;
import com.learningpal.service.StudentEnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing student subject enrollment and dashboard endpoints.
 * All routes are guarded under /api/student/** requiring ROLE_STUDENT.
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

    /**
     * Lists all subjects available for self-enrollment.
     */
    @GetMapping("/available")
    public ResponseEntity<List<AvailableSubjectDto>> getAvailableSubjects(Principal principal) {
        return ResponseEntity.ok(studentEnrollmentService.getAvailableSubjects(principal.getName()));
    }

    /**
     * Self-enrolls the calling student into the specified subject.
     */
    @PostMapping("/{subjectId}/enroll")
    public ResponseEntity<StudentSubjectSummaryDto> enroll(
            @PathVariable Long subjectId,
            Principal principal) {
        return ResponseEntity.ok(studentEnrollmentService.enrollSubject(subjectId, principal.getName()));
    }
}


package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.service.StudentClassService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller exposing student classroom membership and "My Classes" endpoints.
 * Guarded under /api/student/** requiring ROLE_STUDENT and ACTIVE account status.
 */
@RestController
@RequestMapping("/api/student/classes")
public class StudentClassController {

    private final StudentClassService studentClassService;

    public StudentClassController(StudentClassService studentClassService) {
        this.studentClassService = studentClassService;
    }

    /**
     * Joins a class using an institution-scoped join code.
     */
    @PostMapping("/join")
    public ResponseEntity<StudentClassSummaryDto> joinClass(
            @RequestBody JoinClassRequest request,
            Principal principal) {
        StudentClassSummaryDto summary = studentClassService.joinClass(principal.getName(), request);
        return ResponseEntity.ok(summary);
    }

    /**
     * Lists the authenticated student's enrolled classes (active first, then archived).
     */
    @GetMapping
    public ResponseEntity<List<StudentClassSummaryDto>> getStudentClasses(Principal principal) {
        return ResponseEntity.ok(studentClassService.getStudentClasses(principal.getName()));
    }

    /**
     * Retrieves class workspace header and attempt permission details.
     */
    @GetMapping("/{classId}")
    public ResponseEntity<StudentClassWorkspaceDto> getStudentClassWorkspace(
            @PathVariable Long classId,
            Principal principal) {
        return ResponseEntity.ok(studentClassService.getStudentClassWorkspace(principal.getName(), classId));
    }

    /**
     * Resolves the student's enrolled class ID for a given subject.
     */
    @GetMapping("/resolve-by-subject/{subjectId}")
    public ResponseEntity<Map<String, Long>> resolveClassForSubject(
            @PathVariable Long subjectId,
            Principal principal) {
        Long classId = studentClassService.resolveClassIdForSubject(principal.getName(), subjectId);
        if (classId == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("classId", classId));
    }
}


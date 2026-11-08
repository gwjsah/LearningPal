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
    private final com.learningpal.service.StudentResourceService studentResourceService;

    public StudentClassController(
            StudentClassService studentClassService,
            com.learningpal.service.StudentResourceService studentResourceService) {
        this.studentClassService = studentClassService;
        this.studentResourceService = studentResourceService;
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
     * Lists active study materials (notes, practice, link resources) for the class.
     */
    @GetMapping("/{classId}/materials")
    public ResponseEntity<List<RecommendedResourceDto>> getClassStudyMaterials(
            @PathVariable Long classId,
            Principal principal) {
        return ResponseEntity.ok(studentClassService.getClassStudyMaterials(principal.getName(), classId));
    }

    /**
     * Marks an educational resource as completed within a class.
     */
    @PostMapping("/{classId}/resources/{resourceId}/complete")
    public ResponseEntity<ResourceCompletionResponseDto> markCompleteInClass(
            @PathVariable Long classId,
            @PathVariable Long resourceId,
            Principal principal) {
        return ResponseEntity.ok(studentResourceService.markCompleteInClass(classId, resourceId, principal.getName()));
    }

    /**
     * Unmarks completion for an educational resource within a class.
     */
    @DeleteMapping("/{classId}/resources/{resourceId}/complete")
    public ResponseEntity<ResourceCompletionResponseDto> markIncompleteInClass(
            @PathVariable Long classId,
            @PathVariable Long resourceId,
            Principal principal) {
        return ResponseEntity.ok(studentResourceService.markIncompleteInClass(classId, resourceId, principal.getName()));
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


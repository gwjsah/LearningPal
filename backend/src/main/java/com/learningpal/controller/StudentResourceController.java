package com.learningpal.controller;

import com.learningpal.dto.ResourceCompletionResponseDto;
import com.learningpal.service.StudentResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST controller for student educational resource interactions.
 * Endpoints are guarded under /api/student/** requiring ROLE_STUDENT.
 */
@RestController
@RequestMapping("/api/student/resources")
public class StudentResourceController {

    private final StudentResourceService studentResourceService;

    public StudentResourceController(StudentResourceService studentResourceService) {
        this.studentResourceService = studentResourceService;
    }

    /**
     * Marks an educational resource as completed for the authenticated student.
     */
    @PostMapping("/{resourceId}/complete")
    public ResponseEntity<ResourceCompletionResponseDto> markComplete(
            @PathVariable Long resourceId,
            Principal principal) {
        return ResponseEntity.ok(studentResourceService.markComplete(resourceId, principal.getName()));
    }

    /**
     * Unmarks completion for an educational resource for the authenticated student.
     */
    @DeleteMapping("/{resourceId}/complete")
    public ResponseEntity<ResourceCompletionResponseDto> markIncomplete(
            @PathVariable Long resourceId,
            Principal principal) {
        return ResponseEntity.ok(studentResourceService.markIncomplete(resourceId, principal.getName()));
    }
}


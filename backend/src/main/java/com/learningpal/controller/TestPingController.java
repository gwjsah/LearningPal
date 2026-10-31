package com.learningpal.controller;

import com.learningpal.dto.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ==============================================================================
 * TEMPORARY TEST ENDPOINTS
 * ==============================================================================
 * These endpoints exist solely to verify that role-based access rules work:
 * - GET /api/student/ping requires ROLE_STUDENT
 * - GET /api/teacher/ping requires ROLE_TEACHER
 *
 * NOTE FOR PRODUCTION: This entire controller class is safe to delete once
 * domain-specific feature endpoints are implemented.
 * ==============================================================================
 */
@RestController
public class TestPingController {

    /**
     * Temporary endpoint to prove student role access.
     * DELETABLE: Safe to delete in production.
     */
    @GetMapping("/api/student/ping")
    public ResponseEntity<MessageResponse> studentPing(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "Anonymous";
        return ResponseEntity.ok(new MessageResponse(
                "Student role authorization confirmed. Active session email: " + email
        ));
    }

    /**
     * Temporary endpoint to prove teacher role access.
     * DELETABLE: Safe to delete in production.
     */
    @GetMapping("/api/teacher/ping")
    public ResponseEntity<MessageResponse> teacherPing(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "Anonymous";
        return ResponseEntity.ok(new MessageResponse(
                "Teacher role authorization confirmed. Active session email: " + email
        ));
    }
}


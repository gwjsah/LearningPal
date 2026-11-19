package com.learningpal.controller;

import com.learningpal.dto.PalUpdateRequest;
import com.learningpal.dto.UserDto;
import com.learningpal.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Allows authenticated students to customize their LearningPal mascot preferences.
 */
@RestController
@RequestMapping("/api/student/pal")
public class StudentPalController {

    private final AuthService authService;

    public StudentPalController(AuthService authService) {
        this.authService = authService;
    }

    @PatchMapping
    public ResponseEntity<UserDto> updatePal(
            Authentication authentication,
            @RequestBody PalUpdateRequest request) {
        UserDto updated = authService.updateStudentPal(authentication.getName(), request);
        return ResponseEntity.ok(updated);
    }
}

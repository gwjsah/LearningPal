package com.learningpal.controller;

import com.learningpal.dto.StudentProgressResponseDto;
import com.learningpal.dto.TopicProgressDetailDto;
import com.learningpal.service.GapAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller exposing student diagnostic gap analysis and topic mastery endpoints.
 * All routes are guarded under /api/student/** requiring ROLE_STUDENT.
 */
@RestController
@RequestMapping("/api/student")
public class StudentProgressController {

    private final GapAnalysisService gapAnalysisService;

    public StudentProgressController(GapAnalysisService gapAnalysisService) {
        this.gapAnalysisService = gapAnalysisService;
    }

    /**
     * Retrieves overall curriculum topic mastery, categorized strengths, gaps, and study suggestions.
     * Optionally scoped by subjectId.
     */
    @GetMapping("/progress")
    public ResponseEntity<StudentProgressResponseDto> getProgress(
            @RequestParam(required = false) Long subjectId,
            Principal principal) {
        if (subjectId != null) {
            return ResponseEntity.ok(gapAnalysisService.getStudentProgressForSubject(subjectId, principal.getName()));
        }
        return ResponseEntity.ok(gapAnalysisService.getStudentProgress(principal.getName()));
    }

    /**
     * Retrieves curriculum topic mastery scoped to a subject after verifying enrollment.
     */
    @GetMapping("/subjects/{subjectId}/progress")
    public ResponseEntity<StudentProgressResponseDto> getSubjectProgress(
            @PathVariable Long subjectId,
            Principal principal) {
        return ResponseEntity.ok(gapAnalysisService.getStudentProgressForSubject(subjectId, principal.getName()));
    }

    /**
     * Retrieves detailed mastery and answer history for a single topic.
     */
    @GetMapping("/progress/topics/{topicId}")
    public ResponseEntity<TopicProgressDetailDto> getTopicProgressDetail(
            @PathVariable Long topicId,
            Principal principal) {
        return ResponseEntity.ok(gapAnalysisService.getTopicProgressDetail(topicId, principal.getName()));
    }
}


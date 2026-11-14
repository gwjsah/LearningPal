package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.service.ValidationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;

/**
 * Controller powering the Teacher Validation Lab.
 * Enables blind evaluation of student topic mastery and agreement reporting.
 */
@RestController
@RequestMapping("/api/teacher/classes/{classId}/validation")
public class TeacherValidationController {

    private final ValidationService validationService;

    public TeacherValidationController(ValidationService validationService) {
        this.validationService = validationService;
    }

    /**
     * Lists enrolled students with blind validation progress and staleness flags.
     * CRITICAL: Strictly zero system outputs.
     */
    @GetMapping("/students")
    public ResponseEntity<List<ValidationStudentSummaryDto>> getValidationStudents(
            @PathVariable Long classId,
            Principal principal) {
        return ResponseEntity.ok(validationService.getValidationStudents(classId, principal.getName()));
    }

    /**
     * Retrieves per-topic question evidence and existing teacher labels for a single student.
     * CRITICAL: Strictly zero system outputs.
     */
    @GetMapping("/students/{studentId}")
    public ResponseEntity<ValidationStudentDetailDto> getValidationStudentDetail(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            Principal principal) {
        return ResponseEntity.ok(validationService.getValidationStudentDetail(classId, studentId, principal.getName()));
    }

    /**
     * Upserts a teacher validation label for a student-topic pair and snapshots system mastery.
     */
    @PutMapping("/students/{studentId}/topics/{topicId}")
    public ResponseEntity<ValidationLabelSavedDto> saveValidationLabel(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            @PathVariable Long topicId,
            @Valid @RequestBody SaveValidationLabelRequest request,
            Principal principal) {
        return ResponseEntity.ok(validationService.saveValidationLabel(
                classId, studentId, topicId, request, principal.getName()
        ));
    }

    /**
     * Retrieves the Validation Lab agreement and statistical metrics report for this class.
     */
    @GetMapping("/report")
    public ResponseEntity<ValidationReportDto> getClassValidationReport(
            @PathVariable Long classId,
            @RequestParam(required = false, defaultValue = "TEACHER") String source,
            @RequestParam(required = false, defaultValue = "false") boolean includeStale,
            Principal principal) {
        return ResponseEntity.ok(validationService.getClassValidationReport(
                classId, source, includeStale, principal.getName()
        ));
    }

    /**
     * Exports validation records for this class to a pseudonymized, formula-safe CSV file.
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportValidationCsv(
            @PathVariable Long classId,
            @RequestParam(required = false, defaultValue = "TEACHER") String source,
            @RequestParam(required = false, defaultValue = "false") boolean includeStale,
            Principal principal) {
        String csvContent = validationService.exportValidationCsv(classId, source, includeStale, principal.getName());
        byte[] bytes = csvContent.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"validation-class-" + classId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}


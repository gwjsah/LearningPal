package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.entity.InterventionStatus;
import com.learningpal.repository.SubjectRepository;
import com.learningpal.service.TeacherClassService;
import com.learningpal.service.ai.AiGradeSuggestionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller exposing educator classroom management APIs.
 * Guarded under /api/teacher/** requiring ROLE_TEACHER and ACTIVE account status.
 */
@RestController
@RequestMapping("/api/teacher")
public class TeacherClassController {

    private final TeacherClassService teacherClassService;
    private final SubjectRepository subjectRepository;
    private final AiGradeSuggestionService aiGradeSuggestionService;

    public TeacherClassController(
            TeacherClassService teacherClassService,
            SubjectRepository subjectRepository,
            AiGradeSuggestionService aiGradeSuggestionService) {
        this.teacherClassService = teacherClassService;
        this.subjectRepository = subjectRepository;
        this.aiGradeSuggestionService = aiGradeSuggestionService;
    }


    /**
     * Creates a new class section.
     */
    @PostMapping("/classes")
    public ResponseEntity<TeacherClassDto> createClass(
            @Valid @RequestBody CreateClassRequest request,
            Principal principal) {
        TeacherClassDto created = teacherClassService.createClass(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lists all classes taught by the authenticated teacher.
     */
    @GetMapping("/classes")
    public ResponseEntity<List<TeacherClassDto>> getTeacherClasses(Principal principal) {
        return ResponseEntity.ok(teacherClassService.getTeacherClasses(principal.getName()));
    }

    /**
     * Retrieves detailed information and student roster for an owned class.
     */
    @GetMapping("/classes/{id}")
    public ResponseEntity<TeacherClassDetailDto> getTeacherClassDetail(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getTeacherClassDetail(principal.getName(), id));
    }

    /**
     * Retrieves the class student roster with diagnostic attempt scores and topic mastery tiers.
     */
    @GetMapping("/classes/{id}/roster")
    public ResponseEntity<List<ClassRosterStudentDto>> getClassRoster(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getClassRoster(principal.getName(), id));
    }

    /**
     * Retrieves class overview analytics including student totals and ranked topic gap distributions.
     */
    @GetMapping("/classes/{id}/overview")
    public ResponseEntity<ClassOverviewResponseDto> getClassOverview(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getClassOverview(principal.getName(), id));
    }

    /**
     * Archives an owned class.
     */
    @RequestMapping(value = "/classes/{id}/archive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherClassDto> archiveClass(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.archiveClass(principal.getName(), id));
    }

    /**
     * Regenerates the join code for an owned class.
     */
    @PostMapping("/classes/{id}/regenerate-code")
    public ResponseEntity<TeacherClassDto> regenerateJoinCode(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.regenerateJoinCode(principal.getName(), id));
    }

    /**
     * Toggles enrollment open/closed for an owned class.
     */
    @PutMapping("/classes/{id}/enrollment")
    public ResponseEntity<TeacherClassDto> toggleEnrollment(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            Principal principal) {
        boolean open = body != null && Boolean.TRUE.equals(body.get("open"));
        return ResponseEntity.ok(teacherClassService.toggleEnrollment(principal.getName(), id, open));
    }

    /**
     * Lists subject assessments with class-scoped schedule and retake settings.
     */
    @GetMapping("/classes/{id}/assessments")
    public ResponseEntity<List<TeacherClassAssessmentDto>> getClassAssessments(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getClassAssessments(principal.getName(), id));
    }

    /**
     * Updates class-scoped schedule window and retake rules for an assessment.
     */
    @PutMapping("/classes/{id}/assessments/{assessmentId}")
    public ResponseEntity<TeacherClassAssessmentDto> updateClassAssessmentSetting(
            @PathVariable Long id,
            @PathVariable Long assessmentId,
            @RequestBody UpdateClassAssessmentSettingRequest request,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.updateClassAssessmentSetting(principal.getName(), id, assessmentId, request));
    }

    /**
     * Reopens an assessment attempt for an individual student in the class.
     */
    @PostMapping("/classes/{id}/assessments/{assessmentId}/unlock-student")
    public ResponseEntity<Map<String, String>> unlockStudentAssessment(
            @PathVariable Long id,
            @PathVariable Long assessmentId,
            @RequestBody UnlockStudentAssessmentRequest request,
            Principal principal) {
        teacherClassService.unlockStudentAssessment(principal.getName(), id, assessmentId, request);
        return ResponseEntity.ok(Map.of("message", "Assessment successfully reopened for student"));
    }

    /**
     * Retrieves comprehensive student profile, topic masteries, missed questions, attempts, and interventions.
     */
    @GetMapping("/classes/{classId}/students/{studentId}")
    public ResponseEntity<TeacherStudentDetailDto> getStudentDetail(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getStudentDetail(principal.getName(), classId, studentId));
    }

    /**
     * Retrieves per-answer attempt review for grading and manual score overrides.
     */
    @GetMapping("/classes/{classId}/attempts/{attemptId}")
    public ResponseEntity<TeacherAttemptReviewDto> getAttemptReview(
            @PathVariable Long classId,
            @PathVariable Long attemptId,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getAttemptReview(principal.getName(), classId, attemptId));
    }

    /**
     * Overrides or reverts a student's score on a question answer.
     */
    @PutMapping("/classes/{classId}/attempts/{attemptId}/answers/{answerId}/grade")
    public ResponseEntity<GradeAnswerResponseDto> gradeAnswer(
            @PathVariable Long classId,
            @PathVariable Long attemptId,
            @PathVariable Long answerId,
            @Valid @RequestBody GradeAnswerRequest request,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.gradeAnswer(principal.getName(), classId, attemptId, answerId, request));
    }

    /**
     * Requests an on-demand AI rubric grade suggestion for an ESSAY answer.
     * Never writes any final score; only TeacherClassService.gradeAnswer sets grades.
     */
    @PostMapping("/classes/{classId}/attempts/{attemptId}/answers/{answerId}/ai-suggest")
    public ResponseEntity<AiGradeSuggestionDto> suggestEssayGrade(
            @PathVariable Long classId,
            @PathVariable Long attemptId,
            @PathVariable Long answerId,
            Principal principal) {
        return ResponseEntity.ok(aiGradeSuggestionService.suggestEssayGrade(principal.getName(), classId, attemptId, answerId));
    }

    /**
     * Discards an active AI grade suggestion for an ESSAY answer.
     */
    @PostMapping("/classes/{classId}/attempts/{attemptId}/answers/{answerId}/ai-suggest/{suggestionId}/discard")
    public ResponseEntity<AiGradeSuggestionDto> discardEssaySuggestion(
            @PathVariable Long classId,
            @PathVariable Long attemptId,
            @PathVariable Long answerId,
            @PathVariable Long suggestionId,
            Principal principal) {
        return ResponseEntity.ok(aiGradeSuggestionService.discardSuggestion(
                principal.getName(), classId, attemptId, answerId, suggestionId));
    }

    /**
     * Creates a pedagogical intervention for a student in this active class.
     */
    @PostMapping("/classes/{classId}/students/{studentId}/interventions")
    public ResponseEntity<TeacherInterventionDto> createIntervention(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            @Valid @RequestBody CreateInterventionRequest request,
            Principal principal) {
        TeacherInterventionDto created = teacherClassService.createIntervention(principal.getName(), classId, studentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lists interventions for this class, optionally filtered by status and student.
     */
    @GetMapping("/classes/{classId}/interventions")
    public ResponseEntity<List<TeacherInterventionDto>> getClassInterventions(
            @PathVariable Long classId,
            @RequestParam(required = false) InterventionStatus status,
            @RequestParam(required = false) Long studentId,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.getClassInterventions(principal.getName(), classId, status, studentId));
    }

    /**
     * Updates an intervention (note, follow-up date, or marks DONE/CANCELLED).
     */
    @PutMapping("/classes/{classId}/interventions/{id}")
    public ResponseEntity<TeacherInterventionDto> updateIntervention(
            @PathVariable Long classId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateInterventionRequest request,
            Principal principal) {
        return ResponseEntity.ok(teacherClassService.updateIntervention(principal.getName(), classId, id, request));
    }
}

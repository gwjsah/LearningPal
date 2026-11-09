package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.service.ai.TeacherAiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing teacher AI question drafting and review workflows.
 * Rejects all unauthorized callers with HTTP 404 (never 403).
 */
@RestController
public class TeacherAiController {

    private final TeacherAiService aiService;

    public TeacherAiController(TeacherAiService aiService) {
        this.aiService = aiService;
    }

    /**
     * Inquires whether AI drafting is enabled, whether LM Studio is reachable,
     * and whether the configured model is available.
     */
    @GetMapping("/api/teacher/ai/status")
    public ResponseEntity<AiStatusDto> getAiStatus(Principal principal) {
        return ResponseEntity.ok(aiService.getAiStatus(principal.getName()));
    }

    /**
     * Enqueues an AI generation job from an uploaded file and topic.
     */
    @PostMapping("/api/teacher/subjects/{subjectId}/files/{fileId}/ai/generate")
    public ResponseEntity<AiGenerationJobDto> createJob(
            @PathVariable Long subjectId,
            @PathVariable Long fileId,
            @Valid @RequestBody CreateAiJobRequest request,
            Principal principal) {
        AiGenerationJobDto job = aiService.createJob(principal.getName(), subjectId, fileId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }

    /**
     * Retrieves status and progress of an AI generation job.
     */
    @GetMapping("/api/teacher/ai/jobs/{jobId}")
    public ResponseEntity<AiGenerationJobDto> getJob(
            @PathVariable Long jobId,
            Principal principal) {
        return ResponseEntity.ok(aiService.getJob(principal.getName(), jobId));
    }

    /**
     * Cancels an active or queued generation job.
     */
    @PostMapping("/api/teacher/ai/jobs/{jobId}/cancel")
    public ResponseEntity<AiGenerationJobDto> cancelJob(
            @PathVariable Long jobId,
            Principal principal) {
        return ResponseEntity.ok(aiService.cancelJob(principal.getName(), jobId));
    }

    /**
     * Lists generation jobs for the teacher, optionally filtered by subject.
     */
    @GetMapping("/api/teacher/ai/jobs")
    public ResponseEntity<List<AiGenerationJobDto>> listJobs(
            @RequestParam(value = "subjectId", required = false) Long subjectId,
            Principal principal) {
        return ResponseEntity.ok(aiService.listTeacherJobs(principal.getName(), subjectId));
    }

    /**
     * Lists all question drafts associated with a generation job.
     */
    @GetMapping("/api/teacher/ai/jobs/{jobId}/drafts")
    public ResponseEntity<List<AiQuestionDraftDto>> getJobDrafts(
            @PathVariable Long jobId,
            Principal principal) {
        return ResponseEntity.ok(aiService.getJobDrafts(principal.getName(), jobId));
    }

    /**
     * Edits draft question text, choices, explanation, or difficulty prior to approval.
     */
    @PatchMapping("/api/teacher/ai/drafts/{draftId}")
    public ResponseEntity<AiQuestionDraftDto> updateDraft(
            @PathVariable Long draftId,
            @Valid @RequestBody UpdateDraftRequest request,
            Principal principal) {
        return ResponseEntity.ok(aiService.updateDraft(principal.getName(), draftId, request));
    }

    /**
     * Approves an AI question draft, promoting it to an official question in the question bank.
     */
    @PostMapping("/api/teacher/ai/drafts/{draftId}/approve")
    public ResponseEntity<TeacherQuestionDto> approveDraft(
            @PathVariable Long draftId,
            Principal principal) {
        return ResponseEntity.ok(aiService.approveDraft(principal.getName(), draftId));
    }

    /**
     * Rejects an AI question draft.
     */
    @PostMapping("/api/teacher/ai/drafts/{draftId}/reject")
    public ResponseEntity<AiQuestionDraftDto> rejectDraft(
            @PathVariable Long draftId,
            Principal principal) {
        return ResponseEntity.ok(aiService.rejectDraft(principal.getName(), draftId));
    }

    /**
     * Bulk-approves selected drafts. Strictly requires evidenceQuote verification for all drafts.
     */
    @PostMapping("/api/teacher/ai/jobs/{jobId}/approve-selected")
    public ResponseEntity<List<TeacherQuestionDto>> approveSelectedDrafts(
            @PathVariable Long jobId,
            @Valid @RequestBody ApproveSelectedRequest request,
            Principal principal) {
        return ResponseEntity.ok(aiService.approveSelectedDrafts(principal.getName(), jobId, request));
    }
}

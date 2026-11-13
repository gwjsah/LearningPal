package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.entity.DifficultyLevel;
import com.learningpal.entity.QuestionStatus;
import com.learningpal.entity.QuestionType;
import com.learningpal.entity.ResourceStatus;
import com.learningpal.service.TeacherContentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/subjects")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherSubjectController {

    private final TeacherContentService teacherContentService;

    public TeacherSubjectController(TeacherContentService teacherContentService) {
        this.teacherContentService = teacherContentService;
    }

    // =========================================================================
    // 1. SUBJECTS
    // =========================================================================

    @GetMapping
    public ResponseEntity<List<TeacherSubjectDto>> getMySubjects(Principal principal) {
        return ResponseEntity.ok(teacherContentService.getMySubjects(principal.getName()));
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<String>> getSubjectSuggestions(Principal principal) {
        return ResponseEntity.ok(teacherContentService.getSubjectSuggestions(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<TeacherSubjectDto> createSubject(
            @Valid @RequestBody CreateSubjectRequest request,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.createSubject(principal.getName(), request));
    }

    @PostMapping("/copy-sample")
    public ResponseEntity<TeacherSubjectDto> copySampleSubject(Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.copySampleSubject(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherSubjectDto> getSubject(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getSubject(principal.getName(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherSubjectDto> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSubjectRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.updateSubject(principal.getName(), id, request));
    }

    @RequestMapping(value = "/{id}/archive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherSubjectDto> archiveSubject(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.archiveSubject(principal.getName(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long id,
            Principal principal
    ) {
        teacherContentService.deleteSubject(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 2. TOPICS
    // =========================================================================

    @GetMapping("/{subjectId}/topics")
    public ResponseEntity<List<TeacherTopicDto>> getTopics(
            @PathVariable Long subjectId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getTopics(principal.getName(), subjectId));
    }

    @PostMapping("/{subjectId}/topics")
    public ResponseEntity<TeacherTopicDto> createTopic(
            @PathVariable Long subjectId,
            @Valid @RequestBody CreateTopicRequest request,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.createTopic(principal.getName(), subjectId, request));
    }

    @PutMapping("/{subjectId}/topics/{topicId}")
    public ResponseEntity<TeacherTopicDto> updateTopic(
            @PathVariable Long subjectId,
            @PathVariable Long topicId,
            @Valid @RequestBody UpdateTopicRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.updateTopic(principal.getName(), subjectId, topicId, request));
    }

    @PutMapping("/{subjectId}/topics/reorder")
    public ResponseEntity<List<TeacherTopicDto>> reorderTopics(
            @PathVariable Long subjectId,
            @Valid @RequestBody ReorderTopicsRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.reorderTopics(principal.getName(), subjectId, request));
    }

    @RequestMapping(value = "/{subjectId}/topics/{topicId}/archive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherTopicDto> archiveTopic(
            @PathVariable Long subjectId,
            @PathVariable Long topicId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.archiveTopic(principal.getName(), subjectId, topicId));
    }

    @DeleteMapping("/{subjectId}/topics/{topicId}")
    public ResponseEntity<Void> deleteTopic(
            @PathVariable Long subjectId,
            @PathVariable Long topicId,
            Principal principal
    ) {
        teacherContentService.deleteTopic(principal.getName(), subjectId, topicId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 3. QUESTIONS
    // =========================================================================

    @GetMapping("/{subjectId}/questions")
    public ResponseEntity<List<TeacherQuestionDto>> getQuestions(
            @PathVariable Long subjectId,
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) DifficultyLevel difficulty,
            @RequestParam(required = false) QuestionStatus status,
            @RequestParam(required = false) QuestionType type,
            @RequestParam(required = false) String search,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getQuestions(
                principal.getName(), subjectId, topicId, difficulty, status, type, search
        ));
    }

    @GetMapping("/{subjectId}/questions/{questionId}")
    public ResponseEntity<TeacherQuestionDto> getQuestion(
            @PathVariable Long subjectId,
            @PathVariable Long questionId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getQuestion(principal.getName(), subjectId, questionId));
    }

    @PostMapping("/{subjectId}/questions")
    public ResponseEntity<TeacherQuestionDto> createQuestion(
            @PathVariable Long subjectId,
            @Valid @RequestBody CreateQuestionRequest request,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.createQuestion(principal.getName(), subjectId, request));
    }

    @PutMapping("/{subjectId}/questions/{questionId}")
    public ResponseEntity<TeacherQuestionDto> updateQuestion(
            @PathVariable Long subjectId,
            @PathVariable Long questionId,
            @Valid @RequestBody UpdateQuestionRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.updateQuestion(principal.getName(), subjectId, questionId, request));
    }

    @PostMapping("/{subjectId}/questions/{questionId}/duplicate")
    public ResponseEntity<TeacherQuestionDto> duplicateQuestion(
            @PathVariable Long subjectId,
            @PathVariable Long questionId,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.duplicateQuestion(principal.getName(), subjectId, questionId));
    }

    @RequestMapping(value = "/{subjectId}/questions/{questionId}/retire", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherQuestionDto> retireQuestion(
            @PathVariable Long subjectId,
            @PathVariable Long questionId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.retireQuestion(principal.getName(), subjectId, questionId));
    }

    @DeleteMapping("/{subjectId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long subjectId,
            @PathVariable Long questionId,
            Principal principal
    ) {
        teacherContentService.deleteQuestion(principal.getName(), subjectId, questionId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 4. QUIZZES
    // =========================================================================

    @GetMapping("/{subjectId}/quizzes")
    public ResponseEntity<List<TeacherQuizDto>> getQuizzes(
            @PathVariable Long subjectId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getQuizzes(principal.getName(), subjectId));
    }

    @GetMapping("/{subjectId}/quizzes/{quizId}")
    public ResponseEntity<TeacherQuizDto> getQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getQuiz(principal.getName(), subjectId, quizId));
    }

    @PostMapping("/{subjectId}/quizzes")
    public ResponseEntity<TeacherQuizDto> createQuiz(
            @PathVariable Long subjectId,
            @Valid @RequestBody CreateQuizRequest request,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.createQuiz(principal.getName(), subjectId, request));
    }

    @PutMapping("/{subjectId}/quizzes/{quizId}")
    public ResponseEntity<TeacherQuizDto> updateQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            @Valid @RequestBody UpdateQuizRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.updateQuiz(principal.getName(), subjectId, quizId, request));
    }

    @RequestMapping(value = "/{subjectId}/quizzes/{quizId}/publish", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherQuizDto> publishQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.publishQuiz(principal.getName(), subjectId, quizId));
    }

    @RequestMapping(value = "/{subjectId}/quizzes/{quizId}/unpublish", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherQuizDto> unpublishQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.unpublishQuiz(principal.getName(), subjectId, quizId));
    }

    @PostMapping("/{subjectId}/quizzes/{quizId}/duplicate")
    public ResponseEntity<TeacherQuizDto> duplicateQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.duplicateQuiz(principal.getName(), subjectId, quizId));
    }

    @RequestMapping(value = "/{subjectId}/quizzes/{quizId}/archive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherQuizDto> archiveQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.archiveQuiz(principal.getName(), subjectId, quizId));
    }

    @DeleteMapping("/{subjectId}/quizzes/{quizId}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long subjectId,
            @PathVariable Long quizId,
            Principal principal
    ) {
        teacherContentService.deleteQuiz(principal.getName(), subjectId, quizId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // 5. LINK RESOURCES
    // =========================================================================

    @GetMapping("/{subjectId}/resources")
    public ResponseEntity<List<TeacherResourceDto>> getResources(
            @PathVariable Long subjectId,
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) ResourceStatus status,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.getResources(
                principal.getName(), subjectId, topicId, status
        ));
    }

    @PostMapping("/{subjectId}/resources")
    public ResponseEntity<TeacherResourceDto> createResource(
            @PathVariable Long subjectId,
            @Valid @RequestBody CreateLinkResourceRequest request,
            Principal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherContentService.createResource(principal.getName(), subjectId, request));
    }

    @PutMapping("/{subjectId}/resources/{resourceId}")
    public ResponseEntity<TeacherResourceDto> updateResource(
            @PathVariable Long subjectId,
            @PathVariable Long resourceId,
            @Valid @RequestBody UpdateLinkResourceRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.updateResource(principal.getName(), subjectId, resourceId, request));
    }

    @RequestMapping(value = "/{subjectId}/resources/{resourceId}/archive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherResourceDto> archiveResource(
            @PathVariable Long subjectId,
            @PathVariable Long resourceId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherContentService.archiveResource(principal.getName(), subjectId, resourceId));
    }

    @DeleteMapping("/{subjectId}/resources/{resourceId}")
    public ResponseEntity<Void> deleteResource(
            @PathVariable Long subjectId,
            @PathVariable Long resourceId,
            Principal principal
    ) {
        teacherContentService.deleteResource(principal.getName(), subjectId, resourceId);
        return ResponseEntity.noContent().build();
    }
}

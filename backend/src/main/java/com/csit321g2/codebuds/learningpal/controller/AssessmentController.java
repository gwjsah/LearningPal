package com.csit321g2.codebuds.learningpal.controller;

import com.csit321g2.codebuds.learningpal.dto.AssessmentRequest;
import com.csit321g2.codebuds.learningpal.entity.Assessment;
import com.csit321g2.codebuds.learningpal.entity.Question;
import com.csit321g2.codebuds.learningpal.exception.ResourceNotFoundException;
import com.csit321g2.codebuds.learningpal.repository.AssessmentRepository;
import com.csit321g2.codebuds.learningpal.repository.QuestionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;

    public AssessmentController(AssessmentRepository assessmentRepository, QuestionRepository questionRepository) {
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
    }

    @GetMapping
    public ResponseEntity<List<Assessment>> getAllAssessments() {
        return ResponseEntity.ok(assessmentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assessment> getAssessmentById(@PathVariable Long id) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + id));
        return ResponseEntity.ok(assessment);
    }

    @PostMapping
    public ResponseEntity<Assessment> createAssessment(@RequestBody AssessmentRequest request) {
        Assessment assessment = new Assessment();
        assessment.setTitle(request.getTitle());
        assessment.setDescription(request.getDescription());
        assessment.setStatus(request.getStatus());
        assessment.setTimeLimitMinutes(request.getTimeLimitMinutes());

        if (request.getQuestionIds() != null && !request.getQuestionIds().isEmpty()) {
            List<Question> questions = questionRepository.findAllById(request.getQuestionIds());
            assessment.setQuestions(questions);
        }

        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Assessment> updateAssessment(@PathVariable Long id, @RequestBody AssessmentRequest request) {
        Assessment existing = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + id));

        if (request.getTitle() != null) {
            existing.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            existing.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }
        if (request.getTimeLimitMinutes() != null) {
            existing.setTimeLimitMinutes(request.getTimeLimitMinutes());
        }
        if (request.getQuestionIds() != null) {
            List<Question> questions = questionRepository.findAllById(request.getQuestionIds());
            existing.setQuestions(questions);
        }

        Assessment saved = assessmentRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssessment(@PathVariable Long id) {
        if (!assessmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Assessment not found with id: " + id);
        }
        assessmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

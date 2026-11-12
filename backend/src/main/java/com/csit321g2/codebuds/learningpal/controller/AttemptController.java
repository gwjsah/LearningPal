package com.csit321g2.codebuds.learningpal.controller;

import com.csit321g2.codebuds.learningpal.dto.AttemptRequest;
import com.csit321g2.codebuds.learningpal.entity.Assessment;
import com.csit321g2.codebuds.learningpal.entity.Attempt;
import com.csit321g2.codebuds.learningpal.entity.AttemptStatus;
import com.csit321g2.codebuds.learningpal.entity.User;
import com.csit321g2.codebuds.learningpal.exception.ResourceNotFoundException;
import com.csit321g2.codebuds.learningpal.repository.AssessmentRepository;
import com.csit321g2.codebuds.learningpal.repository.AttemptRepository;
import com.csit321g2.codebuds.learningpal.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/attempts")
public class AttemptController {

    private final AttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final AssessmentRepository assessmentRepository;

    public AttemptController(AttemptRepository attemptRepository,
                             UserRepository userRepository,
                             AssessmentRepository assessmentRepository) {
        this.attemptRepository = attemptRepository;
        this.userRepository = userRepository;
        this.assessmentRepository = assessmentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Attempt>> getAllAttempts(@RequestParam(required = false) Long studentId,
                                                        @RequestParam(required = false) Long assessmentId) {
        if (studentId != null) {
            return ResponseEntity.ok(attemptRepository.findByStudentId(studentId));
        }
        if (assessmentId != null) {
            return ResponseEntity.ok(attemptRepository.findByAssessmentId(assessmentId));
        }
        return ResponseEntity.ok(attemptRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attempt> getAttemptById(@PathVariable Long id) {
        Attempt attempt = attemptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + id));
        return ResponseEntity.ok(attempt);
    }

    @PostMapping
    public ResponseEntity<Attempt> createAttempt(@RequestBody AttemptRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));
        Assessment assessment = assessmentRepository.findById(request.getAssessmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + request.getAssessmentId()));

        Attempt attempt = new Attempt(student, assessment);
        if (request.getStatus() != null) {
            attempt.setStatus(request.getStatus());
        }
        if (request.getTotalScore() != null) {
            attempt.setTotalScore(request.getTotalScore());
        }
        if (request.getMaxScore() != null) {
            attempt.setMaxScore(request.getMaxScore());
        }

        Attempt saved = attemptRepository.save(attempt);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Attempt> updateAttempt(@PathVariable Long id, @RequestBody AttemptRequest request) {
        Attempt existing = attemptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + id));

        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
            if (request.getStatus() == AttemptStatus.SUBMITTED || request.getStatus() == AttemptStatus.GRADED) {
                existing.setSubmittedAt(Instant.now());
            }
        }
        if (request.getTotalScore() != null) {
            existing.setTotalScore(request.getTotalScore());
        }
        if (request.getMaxScore() != null) {
            existing.setMaxScore(request.getMaxScore());
        }

        Attempt saved = attemptRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttempt(@PathVariable Long id) {
        if (!attemptRepository.existsById(id)) {
            throw new ResourceNotFoundException("Attempt not found with id: " + id);
        }
        attemptRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

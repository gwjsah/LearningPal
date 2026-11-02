package com.learningpal.service;

import com.learningpal.dto.AnswerSubmissionDto;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ConflictException;
import com.learningpal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Central grading engine for assessments.
 * Single source of truth for evaluating answers and compiling attempt scores.
 */
@Service
public class GradingService {

    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final ChoiceRepository choiceRepository;
    private final AnswerRepository answerRepository;
    private final AttemptRepository attemptRepository;

    public GradingService(
            AssessmentQuestionRepository assessmentQuestionRepository,
            ChoiceRepository choiceRepository,
            AnswerRepository answerRepository,
            AttemptRepository attemptRepository) {
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.choiceRepository = choiceRepository;
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
    }

    /**
     * Evaluates and records all answers for an attempt in a single atomic transaction.
     */
    @Transactional
    public Attempt gradeAndSubmit(Attempt attempt, List<AnswerSubmissionDto> submissions) {
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new ConflictException("This attempt has already been submitted and finalized.");
        }

        Assessment assessment = attempt.getAssessment();
        List<AssessmentQuestion> assessmentQuestions =
                assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(assessment);

        // Map allowed questions for this assessment
        Map<Long, Question> allowedQuestions = new HashMap<>();
        for (AssessmentQuestion aq : assessmentQuestions) {
            allowedQuestions.put(aq.getQuestion().getId(), aq.getQuestion());
        }

        // Validate submissions against duplicate question submissions and foreign questions
        Map<Long, Long> submittedAnswers = new HashMap<>();
        if (submissions != null) {
            for (AnswerSubmissionDto sub : submissions) {
                if (sub == null || sub.questionId() == null) continue;

                if (!allowedQuestions.containsKey(sub.questionId())) {
                    throw new BadRequestException("Question ID " + sub.questionId() + " does not belong to this assessment.");
                }

                if (submittedAnswers.containsKey(sub.questionId())) {
                    throw new BadRequestException("Duplicate answer submitted for question ID: " + sub.questionId());
                }

                submittedAnswers.put(sub.questionId(), sub.selectedChoiceId());
            }
        }

        double totalScore = 0.0;
        double maxScore = 0.0;

        // Grade every question configured for this assessment
        for (AssessmentQuestion aq : assessmentQuestions) {
            Question question = aq.getQuestion();
            double questionPoints = question.getPoints() != null ? question.getPoints() : 1.0;
            maxScore += questionPoints;

            Long selectedChoiceId = submittedAnswers.get(question.getId());
            Choice selectedChoice = null;
            double autoScore = 0.0;

            if (selectedChoiceId != null) {
                selectedChoice = choiceRepository.findById(selectedChoiceId)
                        .orElseThrow(() -> new BadRequestException("Choice not found: " + selectedChoiceId));

                // Validate that choice belongs to this question
                if (!selectedChoice.getQuestion().getId().equals(question.getId())) {
                    throw new BadRequestException("Choice ID " + selectedChoiceId + " does not belong to Question ID " + question.getId());
                }

                if (selectedChoice.isCorrect()) {
                    autoScore = questionPoints;
                }
            }

            // Create and persist answer
            Answer answer = new Answer(attempt, question, selectedChoice);
            answer.applyAutoScore(autoScore); // Centralized finalScore recalculation inside Answer entity
            answerRepository.save(answer);

            totalScore += answer.getFinalScore();
        }

        attempt.setTotalScore(totalScore);
        attempt.setMaxScore(maxScore);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());

        return attemptRepository.save(attempt);
    }
}


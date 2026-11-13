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
    private final QuestionAcceptedAnswerRepository acceptedAnswerRepository;

    public GradingService(
            AssessmentQuestionRepository assessmentQuestionRepository,
            ChoiceRepository choiceRepository,
            AnswerRepository answerRepository,
            AttemptRepository attemptRepository,
            QuestionAcceptedAnswerRepository acceptedAnswerRepository) {
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.choiceRepository = choiceRepository;
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
        this.acceptedAnswerRepository = acceptedAnswerRepository;
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
        Map<Long, AnswerSubmissionDto> submittedAnswers = new HashMap<>();
        if (submissions != null) {
            for (AnswerSubmissionDto sub : submissions) {
                if (sub == null || sub.questionId() == null) continue;

                if (!allowedQuestions.containsKey(sub.questionId())) {
                    throw new BadRequestException("Question ID " + sub.questionId() + " does not belong to this assessment.");
                }

                if (submittedAnswers.containsKey(sub.questionId())) {
                    throw new BadRequestException("Duplicate answer submitted for question ID: " + sub.questionId());
                }

                submittedAnswers.put(sub.questionId(), sub);
            }
        }

        double totalScore = 0.0;
        double maxScore = 0.0;

        // Grade every question configured for this assessment
        for (AssessmentQuestion aq : assessmentQuestions) {
            Question question = aq.getQuestion();
            double questionPoints = question.getPoints() != null ? question.getPoints() : 1.0;
            maxScore += questionPoints;

            AnswerSubmissionDto sub = submittedAnswers.get(question.getId());
            QuestionType type = question.getType() != null ? question.getType().canonical() : QuestionType.MULTIPLE_CHOICE;

            Answer answer;
            if (type == QuestionType.ENUMERATION) {
                String trimmed = sub != null && sub.textAnswer() != null ? sub.textAnswer().trim() : null;
                if (trimmed != null && trimmed.length() > 200) {
                    throw new BadRequestException("Enumeration answer must be 200 characters or fewer");
                }
                List<String> accepted = acceptedAnswerRepository.findByQuestionOrderByDisplayOrderAsc(question).stream()
                        .map(QuestionAcceptedAnswer::getAnswerText)
                        .toList();
                double autoScore = (trimmed != null && !trimmed.isEmpty() && EnumerationNormalizer.matchesAny(trimmed, accepted))
                        ? questionPoints
                        : 0.0;
                answer = new Answer(attempt, question, trimmed);
                answer.applyAutoScore(autoScore);
            } else if (type == QuestionType.ESSAY) {
                String trimmed = sub != null && sub.textAnswer() != null ? sub.textAnswer().trim() : null;
                if (trimmed != null && trimmed.length() > 5000) {
                    throw new BadRequestException("Essay answer must be 5000 characters or fewer");
                }
                // Essays start ungraded (autoScore, teacherScore, finalScore remain null)
                answer = new Answer(attempt, question, trimmed);
            } else {
                Long selectedChoiceId = sub != null ? sub.selectedChoiceId() : null;
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

                answer = new Answer(attempt, question, selectedChoice);
                answer.applyAutoScore(autoScore); // Centralized finalScore recalculation inside Answer entity
            }

            answerRepository.save(answer);
            if (answer.getFinalScore() != null) {
                totalScore += answer.getFinalScore();
            }
        }

        attempt.setTotalScore(totalScore);
        attempt.setMaxScore(maxScore);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());

        return attemptRepository.save(attempt);
    }
}


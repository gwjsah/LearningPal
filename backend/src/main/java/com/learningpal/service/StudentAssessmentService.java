package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service managing student assessment workflows:
 * dashboard catalog, starting/resuming attempts, submitting responses, and reviewing auto-graded results.
 */
@Service
public class StudentAssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final ChoiceRepository choiceRepository;
    private final UserRepository userRepository;
    private final GradingService gradingService;
    private final GapAnalysisService gapAnalysisService;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;

    public StudentAssessmentService(
            AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository assessmentQuestionRepository,
            AttemptRepository attemptRepository,
            AnswerRepository answerRepository,
            ChoiceRepository choiceRepository,
            UserRepository userRepository,
            GradingService gradingService,
            GapAnalysisService gapAnalysisService,
            SubjectRepository subjectRepository,
            EnrollmentRepository enrollmentRepository) {
        this.assessmentRepository = assessmentRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.choiceRepository = choiceRepository;
        this.userRepository = userRepository;
        this.gradingService = gradingService;
        this.gapAnalysisService = gapAnalysisService;
        this.subjectRepository = subjectRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Lists all published assessments for a specific subject after verifying student enrollment.
     */
    @Transactional(readOnly = true)
    public List<StudentAssessmentDto> getAvailableAssessmentsBySubject(Long subjectId, String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        if (!enrollmentRepository.existsByStudentAndSubject(student, subject)) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + subject.getName());
        }

        List<Assessment> published = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED);
        return mapToAssessmentDtos(student, published);
    }

    /**
     * Lists all published assessments with the student's latest attempt status.
     */
    @Transactional(readOnly = true)
    public List<StudentAssessmentDto> getAvailableAssessments(String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        List<Assessment> published = assessmentRepository.findByStatus(AssessmentStatus.PUBLISHED);
        return mapToAssessmentDtos(student, published);
    }

    private List<StudentAssessmentDto> mapToAssessmentDtos(User student, List<Assessment> assessments) {
        List<StudentAssessmentDto> list = new ArrayList<>();
        for (Assessment a : assessments) {
            long count = assessmentQuestionRepository.countByAssessmentId(a.getId());

            List<Attempt> attempts = attemptRepository.findByStudentAndAssessmentOrderByAttemptNumberDesc(student, a);
            Attempt latest = attempts.isEmpty() ? null : attempts.get(0);

            list.add(new StudentAssessmentDto(
                    a.getId(),
                    a.getTitle(),
                    a.getDescription(),
                    a.getSubject().getName(),
                    (int) count,
                    latest != null ? latest.getStatus().name() : null,
                    latest != null ? latest.getTotalScore() : null,
                    latest != null ? latest.getMaxScore() : null,
                    latest != null ? latest.getId() : null,
                    latest != null ? latest.getSubmittedAt() : null
            ));
        }
        return list;
    }

    /**
     * Starts a new attempt or resumes an existing IN_PROGRESS attempt.
     * Guaranteed not to leak correct choices or explanations.
     */
    @Transactional
    public StartAttemptResponseDto startOrResumeAttempt(Long assessmentId, String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .filter(a -> a.getStatus() == AssessmentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Published assessment not found: " + assessmentId));

        if (!enrollmentRepository.existsByStudentAndSubject(student, assessment.getSubject())) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + assessment.getSubject().getName());
        }

        List<Attempt> existingAttempts =
                attemptRepository.findByStudentAndAssessmentOrderByAttemptNumberDesc(student, assessment);

        Attempt attempt = null;
        for (Attempt a : existingAttempts) {
            if (a.getStatus() == AttemptStatus.IN_PROGRESS) {
                attempt = a;
                break;
            }
        }

        if (attempt == null) {
            int nextAttemptNumber = existingAttempts.size() + 1;
            Long classId = enrollmentRepository.findClassIdByStudentAndSubject(student, assessment.getSubject())
                    .orElse(null);
            Attempt newAttempt = new Attempt(student, assessment, nextAttemptNumber);
            newAttempt.setClassId(classId);
            attempt = attemptRepository.save(newAttempt);
        }

        List<AssessmentQuestion> assessmentQuestions =
                assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(assessment);

        List<QuestionItemDto> questions = new ArrayList<>();
        for (AssessmentQuestion aq : assessmentQuestions) {
            Question q = aq.getQuestion();
            List<Choice> choices = choiceRepository.findByQuestion(q);

            List<ChoiceItemDto> choiceDtos = new ArrayList<>();
            for (Choice c : choices) {
                choiceDtos.add(new ChoiceItemDto(c.getId(), c.getLabel(), c.getText()));
            }

            questions.add(new QuestionItemDto(
                    q.getId(),
                    q.getTopic().getName(),
                    q.getText(),
                    q.getPoints(),
                    choiceDtos
            ));
        }

        return new StartAttemptResponseDto(
                attempt.getId(),
                assessment.getId(),
                assessment.getTitle(),
                assessment.getDescription(),
                attempt.getAttemptNumber(),
                questions
        );
    }

    /**
     * Submits and auto-grades an attempt.
     */
    @Transactional
    public SubmitAttemptResponse submitAttempt(Long attemptId, SubmitAttemptRequest request, String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        // Ownership enforcement
        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ResourceNotFoundException("Attempt not found: " + attemptId);
        }

        // Enrollment enforcement
        if (!enrollmentRepository.existsByStudentAndSubject(student, attempt.getAssessment().getSubject())) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + attempt.getAssessment().getSubject().getName());
        }

        gradingService.gradeAndSubmit(attempt, request.answers());

        // Automatically update topic mastery & diagnostic gap analysis
        gapAnalysisService.recalculateForStudent(student.getId());

        return new SubmitAttemptResponse(attempt.getId(), "Attempt submitted and graded successfully.");
    }

    /**
     * Retrieves comprehensive result review for a finalized attempt.
     */
    @Transactional(readOnly = true)
    public AttemptResultDto getAttemptResult(Long attemptId, String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        // Ownership enforcement
        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ResourceNotFoundException("Attempt not found: " + attemptId);
        }

        // Enrollment enforcement
        if (!enrollmentRepository.existsByStudentAndSubject(student, attempt.getAssessment().getSubject())) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + attempt.getAssessment().getSubject().getName());
        }

        if (attempt.getStatus() != AttemptStatus.SUBMITTED) {
            throw new BadRequestException("Assessment attempt is still in progress.");
        }

        List<Answer> answers = answerRepository.findByAttempt(attempt);

        // Topic breakdown aggregation: topicName -> [correctCount, totalCount]
        Map<String, int[]> topicCounts = new LinkedHashMap<>();
        List<QuestionReviewDto> questionReviews = new ArrayList<>();

        for (Answer ans : answers) {
            Question q = ans.getQuestion();
            String topicName = q.getTopic().getName();
            topicCounts.putIfAbsent(topicName, new int[]{0, 0});

            int[] counts = topicCounts.get(topicName);
            counts[1]++; // total in topic

            List<Choice> choices = choiceRepository.findByQuestion(q);
            Long correctChoiceId = null;
            List<ChoiceReviewDto> choiceReviews = new ArrayList<>();

            for (Choice c : choices) {
                if (c.isCorrect()) {
                    correctChoiceId = c.getId();
                }
                choiceReviews.add(new ChoiceReviewDto(c.getId(), c.getLabel(), c.getText()));
            }

            Long studentChoiceId = ans.getSelectedChoice() != null ? ans.getSelectedChoice().getId() : null;
            boolean isCorrect = correctChoiceId != null && correctChoiceId.equals(studentChoiceId);

            if (isCorrect) {
                counts[0]++; // correct in topic
            }

            questionReviews.add(new QuestionReviewDto(
                    q.getId(),
                    q.getText(),
                    topicName,
                    choiceReviews,
                    studentChoiceId,
                    correctChoiceId,
                    q.getExplanation(),
                    ans.getFinalScore(),
                    q.getPoints(),
                    isCorrect
            ));
        }

        List<TopicBreakdownDto> topicBreakdowns = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : topicCounts.entrySet()) {
            topicBreakdowns.add(new TopicBreakdownDto(entry.getKey(), entry.getValue()[0], entry.getValue()[1]));
        }

        double score = attempt.getTotalScore() != null ? attempt.getTotalScore() : 0.0;
        double maxScore = attempt.getMaxScore() != null ? attempt.getMaxScore() : 0.0;
        double percentage = maxScore > 0 ? (score / maxScore) * 100.0 : 0.0;

        return new AttemptResultDto(
                attempt.getId(),
                attempt.getAssessment().getId(),
                attempt.getAssessment().getTitle(),
                score,
                maxScore,
                Math.round(percentage * 10.0) / 10.0,
                attempt.getSubmittedAt(),
                topicBreakdowns,
                questionReviews
        );
    }

    private User getStudentByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Student user not found with email: " + email));
    }
}


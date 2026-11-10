package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final ClassAssessmentSettingRepository classAssessmentSettingRepository;
    private final AssessmentAccessRepository assessmentAccessRepository;

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
            EnrollmentRepository enrollmentRepository,
            ClassAssessmentSettingRepository classAssessmentSettingRepository,
            AssessmentAccessRepository assessmentAccessRepository) {
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
        this.classAssessmentSettingRepository = classAssessmentSettingRepository;
        this.assessmentAccessRepository = assessmentAccessRepository;
    }

    /**
     * Lists all published assessments for a specific subject after verifying student enrollment.
     */
    @Transactional(readOnly = true)
    public List<StudentAssessmentDto> getAvailableAssessmentsBySubject(Long subjectId, String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        Institution studentInst = student.getInstitution();
        if (subject.getOwner() != null && subject.getOwner().getInstitution() != null) {
            if (studentInst == null || !subject.getOwner().getInstitution().getId().equals(studentInst.getId())) {
                throw new ResourceNotFoundException("Resource not found");
            }
        }

        if (!enrollmentRepository.existsByStudentAndSubject(student, subject)) {
            throw new ResourceNotFoundException("Resource not found");
        }

        List<Assessment> published = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED);
        if (studentInst != null) {
            published = published.stream()
                    .filter(a -> a.getCreatedBy() == null || a.getCreatedBy().getInstitution() == null
                            || a.getCreatedBy().getInstitution().getId().equals(studentInst.getId()))
                    .toList();
        }
        return mapToAssessmentDtos(student, published);
    }

    /**
     * Lists all published assessments with the student's latest attempt status.
     * Scoped strictly to subjects with active class enrollments in the caller's institution.
     */
    @Transactional(readOnly = true)
    public List<StudentAssessmentDto> getAvailableAssessments(String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Institution institution = student.getInstitution();
        if (institution == null) {
            return Collections.emptyList();
        }

        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        Set<Long> activeSubjectIds = new HashSet<>();
        for (Enrollment e : enrollments) {
            ClassEntity cls = e.getClassEntity();
            if (cls != null && cls.getStatus() == ClassStatus.ACTIVE &&
                    cls.getInstitution() != null && cls.getInstitution().getId().equals(institution.getId()) &&
                    cls.getSubject() != null) {
                activeSubjectIds.add(cls.getSubject().getId());
            }
        }

        if (activeSubjectIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Assessment> published = assessmentRepository.findByStatus(AssessmentStatus.PUBLISHED).stream()
                .filter(a -> a.getSubject() != null && activeSubjectIds.contains(a.getSubject().getId()))
                .filter(a -> a.getCreatedBy() == null || a.getCreatedBy().getInstitution() == null
                        || a.getCreatedBy().getInstitution().getId().equals(institution.getId()))
                .toList();

        return mapToAssessmentDtos(student, published);
    }

    private List<StudentAssessmentDto> mapToAssessmentDtos(User student, List<Assessment> assessments) {
        List<StudentAssessmentDto> list = new ArrayList<>();
        Instant now = Instant.now();

        for (Assessment a : assessments) {
            long count = assessmentQuestionRepository.countByAssessmentId(a.getId());

            List<Attempt> attempts = attemptRepository.findByStudentAndAssessmentOrderByAttemptNumberDesc(student, a);
            Attempt latest = attempts.isEmpty() ? null : attempts.get(0);

            // Class-scoped assessment schedule and retake enforcement
            Optional<ClassEntity> activeClassOpt = enrollmentRepository.findActiveClassByStudentAndSubject(student, a.getSubject());
            ClassAssessmentSetting setting = activeClassOpt.flatMap(cls -> classAssessmentSettingRepository.findByClassEntityAndAssessment(cls, a)).orElse(null);
            AssessmentAccess access = assessmentAccessRepository.findByAssessmentAndStudent(a, student).orElse(null);

            Instant availableFrom = setting != null ? setting.getAvailableFrom() : a.getAvailableFrom();
            Instant availableUntil = (access != null && access.getExtendedUntil() != null)
                    ? access.getExtendedUntil()
                    : (setting != null ? setting.getAvailableUntil() : a.getAvailableUntil());
            boolean allowRetakes = setting != null ? setting.isAllowRetakes() : true;
            boolean retakeUnlocked = access != null && access.isReopened();

            boolean hasSubmitted = attempts.stream().anyMatch(att -> att.getStatus() == AttemptStatus.SUBMITTED);
            boolean hasInProgress = attempts.stream().anyMatch(att -> att.getStatus() == AttemptStatus.IN_PROGRESS);

            String accessStatus = "OPEN";
            String lockReason = null;
            boolean canStart = true;

            if (activeClassOpt.isEmpty()) {
                accessStatus = "CLASS_ARCHIVED";
                lockReason = "This class is archived. New attempts cannot be started.";
                canStart = false;
            } else if (availableFrom != null && now.isBefore(availableFrom)) {
                accessStatus = "NOT_OPEN_YET";
                lockReason = "This assessment is not open yet.";
                canStart = false;
            } else if (availableUntil != null && now.isAfter(availableUntil)) {
                accessStatus = "CLOSED";
                lockReason = "This assessment was closed by your teacher.";
                canStart = false;
            } else if (hasSubmitted && !hasInProgress && !allowRetakes && !retakeUnlocked) {
                accessStatus = "RETAKE_LOCKED";
                lockReason = "Retakes are locked for this assessment by your teacher.";
                canStart = false;
            }

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
                    latest != null ? latest.getSubmittedAt() : null,
                    accessStatus,
                    lockReason,
                    canStart
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
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        Institution studentInst = student.getInstitution();
        if (assessment.getCreatedBy() != null && assessment.getCreatedBy().getInstitution() != null) {
            if (studentInst == null || !assessment.getCreatedBy().getInstitution().getId().equals(studentInst.getId())) {
                throw new ResourceNotFoundException("Resource not found");
            }
        }
        if (assessment.getSubject() != null && assessment.getSubject().getOwner() != null && assessment.getSubject().getOwner().getInstitution() != null) {
            if (studentInst == null || !assessment.getSubject().getOwner().getInstitution().getId().equals(studentInst.getId())) {
                throw new ResourceNotFoundException("Resource not found");
            }
        }

        if (!enrollmentRepository.existsByStudentAndSubject(student, assessment.getSubject())) {
            throw new ResourceNotFoundException("Resource not found");
        }

        Optional<ClassEntity> activeClassOpt = enrollmentRepository.findActiveClassByStudentAndSubject(student, assessment.getSubject());
        if (activeClassOpt.isEmpty()) {
            throw new BadRequestException("This class is archived. New attempts cannot be started.");
        }
        ClassEntity activeClass = activeClassOpt.get();

        // Enforce class-scoped assessment window and retake allowance
        ClassAssessmentSetting setting = classAssessmentSettingRepository.findByClassEntityAndAssessment(activeClass, assessment).orElse(null);
        AssessmentAccess access = assessmentAccessRepository.findByAssessmentAndStudent(assessment, student).orElse(null);

        Instant now = Instant.now();
        Instant availableFrom = setting != null ? setting.getAvailableFrom() : assessment.getAvailableFrom();
        Instant availableUntil = (access != null && access.getExtendedUntil() != null)
                ? access.getExtendedUntil()
                : (setting != null ? setting.getAvailableUntil() : assessment.getAvailableUntil());
        boolean allowRetakes = setting != null ? setting.isAllowRetakes() : true;
        boolean retakeUnlocked = access != null && access.isReopened();

        if (availableFrom != null && now.isBefore(availableFrom)) {
            throw new BadRequestException("This assessment is not open yet (opens at " + availableFrom + ").");
        }
        if (availableUntil != null && now.isAfter(availableUntil)) {
            throw new BadRequestException("This assessment was closed by your teacher on " + availableUntil + ".");
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

        boolean hasSubmitted = existingAttempts.stream().anyMatch(a -> a.getStatus() == AttemptStatus.SUBMITTED);
        if (attempt == null && hasSubmitted && !allowRetakes && !retakeUnlocked) {
            throw new BadRequestException("Retakes are locked for this assessment by your teacher.");
        }

        if (attempt == null) {
            int nextAttemptNumber = existingAttempts.size() + 1;
            Attempt newAttempt = new Attempt(student, assessment, nextAttemptNumber);
            newAttempt.setClassId(activeClass.getId());
            attempt = attemptRepository.save(newAttempt);

            // If this retake was unlocked specifically by teacher, consume the reopen token
            if (retakeUnlocked && !allowRetakes) {
                access.consumeReopen();
                assessmentAccessRepository.save(access);
            }
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
            throw new ResourceNotFoundException("Resource not found");
        }

        // Enrollment enforcement
        if (!enrollmentRepository.existsByStudentAndSubject(student, attempt.getAssessment().getSubject())) {
            throw new ResourceNotFoundException("Resource not found");
        }

        gradingService.gradeAndSubmit(attempt, request.answers());

        // Automatically update topic mastery & diagnostic gap analysis for this class
        if (attempt.getClassId() != null) {
            gapAnalysisService.recalculateForStudentInClass(student.getId(), attempt.getClassId());
        } else {
            gapAnalysisService.recalculateForStudent(student.getId());
        }

        return new SubmitAttemptResponse(attempt.getId(), "Attempt submitted and graded successfully.");
    }

    /**
     * Retrieves comprehensive result review for a finalized attempt.
     */
    @Transactional(readOnly = true)
    public AttemptResultDto getAttemptResult(Long attemptId, String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        // Ownership enforcement
        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ResourceNotFoundException("Resource not found");
        }

        // Enrollment enforcement
        if (!enrollmentRepository.existsByStudentAndSubject(student, attempt.getAssessment().getSubject())) {
            throw new ResourceNotFoundException("Resource not found");
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
            boolean isCorrect = (ans.getFinalScore() != null && q.getPoints() != null)
                    ? ans.getFinalScore() >= q.getPoints()
                    : (correctChoiceId != null && correctChoiceId.equals(studentChoiceId));

            if (isCorrect) {
                counts[0]++; // correct in topic
            }

            boolean adjusted = ans.getTeacherScore() != null;

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
                    isCorrect,
                    adjusted,
                    ans.getTeacherComment(),
                    ans.getAutoScore(),
                    ans.getTeacherScore()
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


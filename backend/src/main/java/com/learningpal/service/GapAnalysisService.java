package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service driving the gap analysis diagnostic engine.
 * Computes topic mastery percentages, classifies strengths and learning gaps,
 * tracks performance trends, and generates personalized feedback and resource recommendations.
 */
@Service
public class GapAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(GapAnalysisService.class);

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final AttemptRepository attemptRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final AnswerRepository answerRepository;
    private final ChoiceRepository choiceRepository;
    private final StudentTopicMasteryRepository studentTopicMasteryRepository;
    private final StudentResourceService studentResourceService;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FeedbackRatingRepository feedbackRatingRepository;

    @Value("${app.analysis.strength-threshold:80.0}")
    private double strengthThreshold;

    @Value("${app.analysis.gap-threshold:60.0}")
    private double gapThreshold;

    @Value("${app.analysis.min-questions:3}")
    private int minQuestions;

    public GapAnalysisService(
            UserRepository userRepository,
            TopicRepository topicRepository,
            AttemptRepository attemptRepository,
            AssessmentQuestionRepository assessmentQuestionRepository,
            AnswerRepository answerRepository,
            ChoiceRepository choiceRepository,
            StudentTopicMasteryRepository studentTopicMasteryRepository,
            StudentResourceService studentResourceService,
            SubjectRepository subjectRepository,
            EnrollmentRepository enrollmentRepository,
            FeedbackRatingRepository feedbackRatingRepository) {
        this.userRepository = userRepository;
        this.topicRepository = topicRepository;
        this.attemptRepository = attemptRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.answerRepository = answerRepository;
        this.choiceRepository = choiceRepository;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.studentResourceService = studentResourceService;
        this.subjectRepository = subjectRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.feedbackRatingRepository = feedbackRatingRepository;
    }

    /**
     * Record representing the most recent evaluation of a distinct question.
     */
    public record QuestionEvaluation(
            Question question,
            double earned,
            double possible,
            boolean answered,
            Instant evaluatedAt,
            Answer answer
    ) {}

    /**
     * Recomputes diagnostic topic mastery for a given student across all curriculum topics.
     * Idempotent and safe to invoke after attempt submissions or teacher score overrides.
     */
    @Transactional
    public void recalculateForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        List<Topic> topics = topicRepository.findAllByOrderByDisplayOrderAsc();

        // 1. Map of distinct questions to their MOST RECENT answer/evaluation
        Map<Long, QuestionEvaluation> latestByQuestion = getLatestQuestionEvaluations(studentId);

        // 2. For each topic, aggregate mastery over distinct questions evaluated
        Map<Long, List<QuestionEvaluation>> evaluationsByTopic = latestByQuestion.values().stream()
                .collect(Collectors.groupingBy(eval -> eval.question().getTopic().getId()));

        for (Topic topic : topics) {
            List<QuestionEvaluation> topicEvals = evaluationsByTopic.getOrDefault(topic.getId(), Collections.emptyList());
            int distinctCount = topicEvals.size();
            double sumEarned = topicEvals.stream().mapToDouble(QuestionEvaluation::earned).sum();
            double sumPossible = topicEvals.stream().mapToDouble(QuestionEvaluation::possible).sum();

            double masteryPercent = (sumPossible > 0.0)
                    ? Math.round((sumEarned / sumPossible) * 1000.0) / 10.0
                    : 0.0;

            MasteryStatus status = GapAnalysisClassifier.classify(
                    sumEarned,
                    sumPossible,
                    distinctCount,
                    strengthThreshold,
                    gapThreshold,
                    minQuestions
            );

            Optional<StudentTopicMastery> existingOpt =
                    studentTopicMasteryRepository.findByStudentAndTopic(student, topic);

            if (existingOpt.isPresent()) {
                StudentTopicMastery existing = existingOpt.get();
                Double previous = existing.getMasteryPercent();
                existing.setPreviousMasteryPercent(previous);
                existing.setMasteryPercent(masteryPercent);
                existing.setStatus(status);
                studentTopicMasteryRepository.save(existing);
            } else {
                StudentTopicMastery newMastery = new StudentTopicMastery(student, topic, masteryPercent, status);
                newMastery.setPreviousMasteryPercent(null);
                studentTopicMasteryRepository.save(newMastery);
            }
        }

        log.info("Diagnostic mastery recalculated for student ID {}", studentId);
    }

    /**
     * Retrieves overall student progress, strengths, gaps, study recommendations,
     * and topic resource completion counts across all curriculum topics.
     */
    @Transactional(readOnly = true)
    public StudentProgressResponseDto getStudentProgress(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        List<Topic> topics = topicRepository.findAllByOrderByDisplayOrderAsc();
        return buildProgressResponse(student, topics);
    }

    /**
     * Retrieves curriculum topic mastery scoped to a specific subject after verifying enrollment.
     */
    @Transactional(readOnly = true)
    public StudentProgressResponseDto getStudentProgressForSubject(Long subjectId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        if (!enrollmentRepository.existsByStudentAndSubject(student, subject)) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + subject.getName());
        }

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        return buildProgressResponse(student, topics);
    }

    /**
     * Core helper building StudentProgressResponseDto from a given list of topics.
     */
    public StudentProgressResponseDto buildProgressResponse(User student, List<Topic> topics) {
        List<StudentTopicMastery> masteryRecords =
                studentTopicMasteryRepository.findByStudentOrderByTopicDisplayOrderAsc(student);

        Map<Long, StudentTopicMastery> masteryByTopic = masteryRecords.stream()
                .collect(Collectors.toMap(m -> m.getTopic().getId(), m -> m, (m1, m2) -> m2));

        // Get distinct questions evaluated per topic for this student
        Map<Long, Integer> distinctQuestionCounts = countDistinctQuestionsEvaluatedPerTopic(student.getId());

        List<TopicProgressDto> topicProgressList = new ArrayList<>();

        for (Topic topic : topics) {
            StudentTopicMastery mastery = masteryByTopic.get(topic.getId());
            int questionsAnswered = distinctQuestionCounts.getOrDefault(topic.getId(), 0);

            Double masteryPercent = (mastery != null) ? mastery.getMasteryPercent() : 0.0;
            Double previousPercent = (mastery != null) ? mastery.getPreviousMasteryPercent() : null;
            MasteryStatus status = (mastery != null) ? mastery.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
            Instant lastUpdated = (mastery != null) ? mastery.getUpdatedAt() : Instant.now();

            String trend = GapAnalysisClassifier.calculateTrend(masteryPercent, previousPercent);

            int[] resourceCounts = studentResourceService.getResourceCountsForTopic(topic, status, student);
            int resourcesCompleted = resourceCounts[0];
            int resourcesRecommended = resourceCounts[1];

            topicProgressList.add(new TopicProgressDto(
                    topic.getId(),
                    topic.getName(),
                    masteryPercent,
                    status,
                    trend,
                    questionsAnswered,
                    lastUpdated,
                    resourcesCompleted,
                    resourcesRecommended
            ));
        }

        List<TopicProgressDto> strengths = topicProgressList.stream()
                .filter(t -> t.status() == MasteryStatus.STRENGTH)
                .toList();

        List<TopicProgressDto> gaps = topicProgressList.stream()
                .filter(t -> t.status() == MasteryStatus.GAP)
                .toList();

        // Pick "study next" topic: lowest-mastery GAP topic, or lowest non-INSUFFICIENT_DATA topic
        TopicProgressDto studyNext = topicProgressList.stream()
                .filter(t -> t.status() != MasteryStatus.INSUFFICIENT_DATA)
                .min(Comparator
                        .comparingInt((TopicProgressDto t) -> t.status() == MasteryStatus.GAP ? 0 : (t.status() == MasteryStatus.DEVELOPING ? 1 : 2))
                        .thenComparingDouble(TopicProgressDto::masteryPercent)
                        .thenComparingLong(TopicProgressDto::topicId))
                .orElse(null);

        return new StudentProgressResponseDto(topicProgressList, strengths, gaps, studyNext);
    }

    /**
     * Retrieves detailed mastery, answer history, personalized feedback, and recommended resources for a single topic.
     */
    @Transactional(readOnly = true)
    public TopicProgressDetailDto getTopicProgressDetail(Long topicId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));

        if (topic.getSubject() != null && !enrollmentRepository.existsByStudentAndSubject(student, topic.getSubject())) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + topic.getSubject().getName());
        }

        StudentTopicMastery mastery = studentTopicMasteryRepository.findByStudentAndTopic(student, topic)
                .orElse(null);

        Map<Long, Integer> distinctCounts = countDistinctQuestionsEvaluatedPerTopic(student.getId());
        int questionsAnswered = distinctCounts.getOrDefault(topicId, 0);

        Double masteryPercent = (mastery != null) ? mastery.getMasteryPercent() : 0.0;
        Double previousPercent = (mastery != null) ? mastery.getPreviousMasteryPercent() : null;
        MasteryStatus status = (mastery != null) ? mastery.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
        Instant lastUpdated = (mastery != null) ? mastery.getUpdatedAt() : Instant.now();
        String trend = GapAnalysisClassifier.calculateTrend(masteryPercent, previousPercent);

        // 1. Answer history (chronological, does not leak unsubmitted questions)
        List<Answer> answers = answerRepository.findStudentTopicAnswers(student, topic, AttemptStatus.SUBMITTED);
        List<StudentAnswerHistoryDto> history = new ArrayList<>();

        for (Answer a : answers) {
            Question q = a.getQuestion();
            double points = (q.getPoints() != null) ? q.getPoints() : 1.0;
            double earned = (a.getFinalScore() != null) ? a.getFinalScore() : 0.0;
            boolean isCorrect = earned >= points;
            Instant submittedAt = (a.getAttempt().getSubmittedAt() != null)
                    ? a.getAttempt().getSubmittedAt()
                    : a.getAttempt().getStartedAt();

            history.add(new StudentAnswerHistoryDto(
                    q.getId(),
                    q.getText(),
                    isCorrect,
                    earned,
                    points,
                    submittedAt
            ));
        }

        // 2. Extract missed questions from the student's MOST RECENT answers in submitted attempts
        Map<Long, QuestionEvaluation> latestByQuestion = getLatestQuestionEvaluations(student.getId());
        List<MissedQuestionDto> missedQuestions = new ArrayList<>();

        for (QuestionEvaluation eval : latestByQuestion.values()) {
            if (eval.question().getTopic().getId().equals(topicId) && eval.earned() < eval.possible()) {
                Question q = eval.question();
                Answer ans = eval.answer();

                String studentAnswer = "Left blank";
                if (ans != null) {
                    if (ans.getSelectedChoice() != null) {
                        studentAnswer = ans.getSelectedChoice().getText();
                    } else if (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank()) {
                        studentAnswer = ans.getTextAnswer();
                    }
                }

                String correctAnswer = choiceRepository.findByQuestion(q).stream()
                        .filter(Choice::isCorrect)
                        .map(Choice::getText)
                        .findFirst()
                        .orElse("N/A");

                missedQuestions.add(new MissedQuestionDto(
                        q.getId(),
                        q.getText(),
                        studentAnswer,
                        correctAnswer,
                        q.getExplanation()
                ));
            }
        }

        // 3. Generate rule-based feedback
        FeedbackDto feedback = FeedbackService.generateFeedback(
                topic.getName(),
                masteryPercent,
                status,
                trend,
                previousPercent,
                missedQuestions
        );

        // 4. Recommended resources tailored to status and topic
        List<RecommendedResourceDto> resources =
                studentResourceService.getRecommendationsForTopic(topic, status, student);
        int resourcesRecommended = resources.size();
        int resourcesCompleted = (int) resources.stream().filter(RecommendedResourceDto::completed).count();

        // 5. Student's own current feedback rating (if any)
        FeedbackRatingDto studentRating = feedbackRatingRepository.findByStudentAndTopic(student, topic)
                .map(r -> new FeedbackRatingDto(r.getRating(), r.getComment(), r.getUpdatedAt()))
                .orElse(null);

        return new TopicProgressDetailDto(
                topic.getId(),
                topic.getSubject() != null ? topic.getSubject().getId() : null,
                topic.getName(),
                topic.getDescription(),
                masteryPercent,
                status,
                trend,
                questionsAnswered,
                lastUpdated,
                history,
                feedback,
                resources,
                resourcesCompleted,
                resourcesRecommended,
                studentRating
        );
    }

    /**
     * Finds the most recent evaluation per distinct question across all submitted attempts.
     * Iterating chronologically ensures newer attempt evaluations overwrite older ones.
     */
    public Map<Long, QuestionEvaluation> getLatestQuestionEvaluations(Long studentId) {
        List<Attempt> submittedAttempts =
                attemptRepository.findByStudentIdAndStatusOrderBySubmittedAtAsc(studentId, AttemptStatus.SUBMITTED);

        submittedAttempts.sort(Comparator.comparing((Attempt a) -> a.getSubmittedAt() != null ? a.getSubmittedAt() : Instant.EPOCH)
                .thenComparing(Attempt::getId));

        Map<Long, QuestionEvaluation> latestByQuestion = new HashMap<>();

        for (Attempt attempt : submittedAttempts) {
            Assessment assessment = attempt.getAssessment();
            List<AssessmentQuestion> assessmentQuestions =
                    assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(assessment);

            List<Answer> answers = answerRepository.findByAttempt(attempt);
            Map<Long, Answer> answerMap = answers.stream()
                    .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (a1, a2) -> a2));

            for (AssessmentQuestion aq : assessmentQuestions) {
                Question q = aq.getQuestion();
                Answer ans = answerMap.get(q.getId());
                double points = (q.getPoints() != null) ? q.getPoints() : 1.0;
                double earned = 0.0;
                boolean answered = false;

                if (ans != null) {
                    earned = (ans.getFinalScore() != null) ? ans.getFinalScore() : 0.0;
                    if (ans.getSelectedChoice() != null || (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank())) {
                        answered = true;
                    }
                }

                latestByQuestion.put(q.getId(), new QuestionEvaluation(
                        q,
                        earned,
                        points,
                        answered,
                        attempt.getSubmittedAt(),
                        ans
                ));
            }
        }

        return latestByQuestion;
    }

    /**
     * Computes the number of distinct questions asked per topic across all submitted attempts.
     */
    public Map<Long, Integer> countDistinctQuestionsEvaluatedPerTopic(Long studentId) {
        List<Attempt> attempts =
                attemptRepository.findByStudentIdAndStatusOrderBySubmittedAtAsc(studentId, AttemptStatus.SUBMITTED);

        Map<Long, Set<Long>> questionIdsByTopic = new HashMap<>();
        for (Attempt attempt : attempts) {
            List<AssessmentQuestion> aqList =
                    assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(attempt.getAssessment());
            for (AssessmentQuestion aq : aqList) {
                Long topicId = aq.getQuestion().getTopic().getId();
                questionIdsByTopic.computeIfAbsent(topicId, k -> new HashSet<>()).add(aq.getQuestion().getId());
            }
        }

        Map<Long, Integer> result = new HashMap<>();
        questionIdsByTopic.forEach((topicId, set) -> result.put(topicId, set.size()));
        return result;
    }

    // Expose classification helper for testing or service callers
    public MasteryStatus classify(double earnedPoints, double totalPoints, int questionCount) {
        return GapAnalysisClassifier.classify(
                earnedPoints,
                totalPoints,
                questionCount,
                strengthThreshold,
                gapThreshold,
                minQuestions
        );
    }
}

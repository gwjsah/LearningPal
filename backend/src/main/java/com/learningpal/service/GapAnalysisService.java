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
    private final ClassEntityRepository classEntityRepository;

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
            FeedbackRatingRepository feedbackRatingRepository,
            ClassEntityRepository classEntityRepository) {
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
        this.classEntityRepository = classEntityRepository;
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
     * Recomputes diagnostic topic mastery for a given student within a specific classroom.
     * Evaluates ONLY submitted attempts taken within that classId.
     * Idempotent and safe to invoke after attempt submissions or teacher score overrides.
     */
    @Transactional
    public void recalculateForStudentInClass(Long studentId, Long classId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        ClassEntity classroom = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        List<Topic> topics;
        if (classroom.getSubject() != null) {
            topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(classroom.getSubject());
        } else {
            topics = topicRepository.findAllByOrderByDisplayOrderAsc();
        }

        // 1. Map of distinct questions to their MOST RECENT answer/evaluation WITHIN this class
        Map<Long, QuestionEvaluation> latestByQuestion = getLatestQuestionEvaluationsInClass(studentId, classId);

        // 2. For each topic, aggregate mastery over distinct questions evaluated in this class
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
                    studentTopicMasteryRepository.findByStudentAndClassroomAndTopic(student, classroom, topic);

            if (existingOpt.isPresent()) {
                StudentTopicMastery existing = existingOpt.get();
                Double previous = existing.getMasteryPercent();
                existing.setPreviousMasteryPercent(previous);
                existing.setMasteryPercent(masteryPercent);
                existing.setStatus(status);
                studentTopicMasteryRepository.save(existing);
            } else {
                StudentTopicMastery newMastery = new StudentTopicMastery(student, classroom, topic, masteryPercent, status);
                newMastery.setPreviousMasteryPercent(null);
                studentTopicMasteryRepository.save(newMastery);
            }
        }

        log.info("Diagnostic mastery recalculated for student ID {} in class ID {}", studentId, classId);
    }

    /**
     * Backward-compatible recalculateForStudent: iterates over all classes the student is enrolled in
     * and recomputes mastery for each class.
     */
    @Transactional
    public void recalculateForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        Set<Long> processedClassIds = new HashSet<>();
        for (Enrollment e : enrollments) {
            if (e.getClassEntity() != null && processedClassIds.add(e.getClassEntity().getId())) {
                recalculateForStudentInClass(studentId, e.getClassEntity().getId());
            }
        }

        List<Attempt> attempts = attemptRepository.findByStudentId(studentId);
        for (Attempt a : attempts) {
            if (a.getClassId() != null && processedClassIds.add(a.getClassId())) {
                recalculateForStudentInClass(studentId, a.getClassId());
            }
        }

        log.info("Diagnostic mastery recalculated across classes for student ID {}", studentId);
    }

    /**
     * Retrieves overall student progress for a specific classroom.
     */
    @Transactional(readOnly = true)
    public StudentProgressResponseDto getStudentProgressForClass(Long classId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        ClassEntity classroom = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student, classroom)) {
            throw new ResourceNotFoundException("Resource not found");
        }

        List<Topic> topics;
        if (classroom.getSubject() != null) {
            topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(classroom.getSubject());
        } else {
            topics = topicRepository.findAllByOrderByDisplayOrderAsc();
        }

        return buildProgressResponse(student, classroom, topics);
    }

    /**
     * Retrieves overall student progress across all curriculum topics.
     */
    @Transactional(readOnly = true)
    public StudentProgressResponseDto getStudentProgress(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        List<Topic> topics = topicRepository.findAllByOrderByDisplayOrderAsc();
        return buildProgressResponse(student, null, topics);
    }

    /**
     * Retrieves curriculum topic mastery scoped to a specific subject after verifying enrollment.
     * Resolves the student's active class for that subject if present.
     */
    @Transactional(readOnly = true)
    public StudentProgressResponseDto getStudentProgressForSubject(Long subjectId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

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

        ClassEntity activeClass = null;
        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        for (Enrollment e : enrollments) {
            if (e.getClassEntity() != null && e.getClassEntity().getStatus() == ClassStatus.ACTIVE &&
                    e.getClassEntity().getSubject() != null && e.getClassEntity().getSubject().getId().equals(subjectId)) {
                activeClass = e.getClassEntity();
                break;
            }
        }

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        return buildProgressResponse(student, activeClass, topics);
    }

    /**
     * Core helper building StudentProgressResponseDto for a given classroom and list of topics.
     */
    public StudentProgressResponseDto buildProgressResponse(User student, ClassEntity classroom, List<Topic> topics) {
        List<StudentTopicMastery> masteryRecords;
        if (classroom != null) {
            masteryRecords = studentTopicMasteryRepository.findByStudentAndClassroomOrderByTopicDisplayOrderAsc(student, classroom);
        } else {
            masteryRecords = studentTopicMasteryRepository.findByStudentOrderByTopicDisplayOrderAsc(student);
        }

        Map<Long, StudentTopicMastery> masteryByTopic = masteryRecords.stream()
                .collect(Collectors.toMap(m -> m.getTopic().getId(), m -> m, (m1, m2) -> m2));

        // Get distinct questions evaluated per topic for this student in this class
        Map<Long, Integer> distinctQuestionCounts = (classroom != null)
                ? countDistinctQuestionsEvaluatedPerTopicInClass(student.getId(), classroom.getId())
                : countDistinctQuestionsEvaluatedPerTopic(student.getId());

        List<TopicProgressDto> topicProgressList = new ArrayList<>();

        for (Topic topic : topics) {
            StudentTopicMastery mastery = masteryByTopic.get(topic.getId());
            int questionsAnswered = distinctQuestionCounts.getOrDefault(topic.getId(), 0);

            Double masteryPercent = (mastery != null) ? mastery.getMasteryPercent() : 0.0;
            Double previousPercent = (mastery != null) ? mastery.getPreviousMasteryPercent() : null;
            MasteryStatus status = (mastery != null) ? mastery.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
            Instant lastUpdated = (mastery != null) ? mastery.getUpdatedAt() : Instant.now();

            String trend = GapAnalysisClassifier.calculateTrend(masteryPercent, previousPercent);

            int[] resourceCounts = studentResourceService.getResourceCountsForTopic(topic, status, student, classroom);
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

        TopicProgressDto studyNext = topicProgressList.stream()
                .filter(t -> t.status() != MasteryStatus.INSUFFICIENT_DATA)
                .min(Comparator
                        .comparingInt((TopicProgressDto t) -> t.status() == MasteryStatus.GAP ? 0 : (t.status() == MasteryStatus.DEVELOPING ? 1 : 2))
                        .thenComparingDouble(TopicProgressDto::masteryPercent)
                        .thenComparingLong(TopicProgressDto::topicId))
                .orElse(null);

        return new StudentProgressResponseDto(topicProgressList, strengths, gaps, studyNext);
    }

    public StudentProgressResponseDto buildProgressResponse(User student, List<Topic> topics) {
        return buildProgressResponse(student, null, topics);
    }

    /**
     * Retrieves detailed mastery, answer history, personalized feedback, and recommended resources for a single topic in a classroom.
     */
    @Transactional(readOnly = true)
    public TopicProgressDetailDto getTopicProgressDetailForClass(Long classId, Long topicId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        ClassEntity classroom = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student, classroom)) {
            throw new ResourceNotFoundException("Resource not found");
        }

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));

        StudentTopicMastery mastery = studentTopicMasteryRepository
                .findByStudentAndClassroomAndTopic(student, classroom, topic)
                .orElse(null);

        Map<Long, Integer> distinctCounts = countDistinctQuestionsEvaluatedPerTopicInClass(student.getId(), classId);
        int questionsAnswered = distinctCounts.getOrDefault(topicId, 0);

        Double masteryPercent = (mastery != null) ? mastery.getMasteryPercent() : 0.0;
        Double previousPercent = (mastery != null) ? mastery.getPreviousMasteryPercent() : null;
        MasteryStatus status = (mastery != null) ? mastery.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
        Instant lastUpdated = (mastery != null) ? mastery.getUpdatedAt() : Instant.now();
        String trend = GapAnalysisClassifier.calculateTrend(masteryPercent, previousPercent);

        // 1. Answer history within this class (chronological, submitted only)
        List<Answer> answers = answerRepository.findStudentClassTopicAnswers(student, classId, topic, AttemptStatus.SUBMITTED);
        List<StudentAnswerHistoryDto> history = new ArrayList<>();

        for (Answer a : answers) {
            Question q = a.getQuestion();
            if (q.getType() == QuestionType.ESSAY && a.getFinalScore() == null) {
                continue;
            }
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

        // 2. Extract missed questions from the student's MOST RECENT answers in submitted attempts in this class
        Map<Long, QuestionEvaluation> latestByQuestion = getLatestQuestionEvaluationsInClass(student.getId(), classId);
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

        // 4. Recommended resources tailored to status and topic within this class
        List<RecommendedResourceDto> resources =
                studentResourceService.getRecommendationsForTopic(topic, status, student, classroom);
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
     * Backward-compatible overload: resolves student's active class for the topic's subject.
     */
    @Transactional(readOnly = true)
    public TopicProgressDetailDto getTopicProgressDetail(Long topicId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (topic.getSubject() != null) {
            Institution studentInst = student.getInstitution();
            if (topic.getSubject().getOwner() != null && topic.getSubject().getOwner().getInstitution() != null) {
                if (studentInst == null || !topic.getSubject().getOwner().getInstitution().getId().equals(studentInst.getId())) {
                    throw new ResourceNotFoundException("Resource not found");
                }
            }
            if (!enrollmentRepository.existsByStudentAndSubject(student, topic.getSubject())) {
                throw new ResourceNotFoundException("Resource not found");
            }
        }

        ClassEntity activeClass = null;
        if (topic.getSubject() != null) {
            List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
            for (Enrollment e : enrollments) {
                if (e.getClassEntity() != null && e.getClassEntity().getStatus() == ClassStatus.ACTIVE &&
                        e.getClassEntity().getSubject() != null && e.getClassEntity().getSubject().getId().equals(topic.getSubject().getId())) {
                    activeClass = e.getClassEntity();
                    break;
                }
            }
        }

        if (activeClass != null) {
            return getTopicProgressDetailForClass(activeClass.getId(), topicId, studentEmail);
        }

        // Standalone subject fallback
        StudentTopicMastery mastery = studentTopicMasteryRepository.findByStudentAndTopic(student, topic)
                .orElse(null);

        Map<Long, Integer> distinctCounts = countDistinctQuestionsEvaluatedPerTopic(student.getId());
        int questionsAnswered = distinctCounts.getOrDefault(topicId, 0);

        Double masteryPercent = (mastery != null) ? mastery.getMasteryPercent() : 0.0;
        Double previousPercent = (mastery != null) ? mastery.getPreviousMasteryPercent() : null;
        MasteryStatus status = (mastery != null) ? mastery.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
        Instant lastUpdated = (mastery != null) ? mastery.getUpdatedAt() : Instant.now();
        String trend = GapAnalysisClassifier.calculateTrend(masteryPercent, previousPercent);

        List<Answer> answers = answerRepository.findStudentTopicAnswers(student, topic, AttemptStatus.SUBMITTED);
        List<StudentAnswerHistoryDto> history = new ArrayList<>();
        for (Answer a : answers) {
            Question q = a.getQuestion();
            if (q.getType() == QuestionType.ESSAY && a.getFinalScore() == null) {
                continue;
            }
            double points = (q.getPoints() != null) ? q.getPoints() : 1.0;
            double earned = (a.getFinalScore() != null) ? a.getFinalScore() : 0.0;
            boolean isCorrect = earned >= points;
            Instant submittedAt = (a.getAttempt().getSubmittedAt() != null)
                    ? a.getAttempt().getSubmittedAt()
                    : a.getAttempt().getStartedAt();
            history.add(new StudentAnswerHistoryDto(q.getId(), q.getText(), isCorrect, earned, points, submittedAt));
        }

        Map<Long, QuestionEvaluation> latestByQuestion = getLatestQuestionEvaluations(student.getId());
        List<MissedQuestionDto> missedQuestions = new ArrayList<>();
        for (QuestionEvaluation eval : latestByQuestion.values()) {
            if (eval.question().getTopic().getId().equals(topicId) && eval.earned() < eval.possible()) {
                Question q = eval.question();
                Answer ans = eval.answer();
                String studentAnswer = (ans != null && ans.getSelectedChoice() != null) ? ans.getSelectedChoice().getText() : "Left blank";
                String correctAnswer = choiceRepository.findByQuestion(q).stream().filter(Choice::isCorrect).map(Choice::getText).findFirst().orElse("N/A");
                missedQuestions.add(new MissedQuestionDto(q.getId(), q.getText(), studentAnswer, correctAnswer, q.getExplanation()));
            }
        }

        FeedbackDto feedback = FeedbackService.generateFeedback(topic.getName(), masteryPercent, status, trend, previousPercent, missedQuestions);
        List<RecommendedResourceDto> resources = studentResourceService.getRecommendationsForTopic(topic, status, student, null);
        int resourcesRecommended = resources.size();
        int resourcesCompleted = (int) resources.stream().filter(RecommendedResourceDto::completed).count();
        FeedbackRatingDto studentRating = feedbackRatingRepository.findByStudentAndTopic(student, topic)
                .map(r -> new FeedbackRatingDto(r.getRating(), r.getComment(), r.getUpdatedAt()))
                .orElse(null);

        return new TopicProgressDetailDto(topic.getId(), topic.getSubject() != null ? topic.getSubject().getId() : null,
                topic.getName(), topic.getDescription(), masteryPercent, status, trend, questionsAnswered, lastUpdated,
                history, feedback, resources, resourcesCompleted, resourcesRecommended, studentRating);
    }

    @Transactional(readOnly = true)
    public Map<Long, QuestionEvaluation> getLatestQuestionEvaluationsInClass(Long studentId, Long classId) {
        List<Attempt> submittedAttempts =
                attemptRepository.findByStudentIdAndClassIdAndStatusOrderBySubmittedAtAsc(studentId, classId, AttemptStatus.SUBMITTED);

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
            Map<Long, Answer> answerByLineage = answers.stream()
                    .collect(Collectors.toMap(
                            a -> a.getQuestion().getLineageId() != null ? a.getQuestion().getLineageId() : a.getQuestion().getId(),
                            a -> a,
                            (a1, a2) -> a2
                    ));

            for (AssessmentQuestion aq : assessmentQuestions) {
                Question q = aq.getQuestion();
                Long lineageKey = (q.getLineageId() != null) ? q.getLineageId() : q.getId();
                Answer ans = answerMap.get(q.getId());
                if (ans == null) {
                    ans = answerByLineage.get(lineageKey);
                }
                Question evalQ = (ans != null && ans.getQuestion() != null) ? ans.getQuestion() : q;
                if (evalQ.getType() == QuestionType.ESSAY && (ans == null || ans.getFinalScore() == null)) {
                    continue;
                }
                double points = (evalQ.getPoints() != null) ? evalQ.getPoints() : 1.0;
                double earned = 0.0;
                boolean answered = false;

                if (ans != null) {
                    earned = (ans.getFinalScore() != null) ? ans.getFinalScore() : 0.0;
                    if (ans.getSelectedChoice() != null || (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank())) {
                        answered = true;
                    }
                }

                latestByQuestion.put(lineageKey, new QuestionEvaluation(
                        evalQ,
                        earned,
                        points,
                        answered,
                        attempt.getSubmittedAt(),
                        ans
                ));
            }

            // Also include any answers directly recorded on the attempt
            for (Answer ans : answers) {
                Question q = ans.getQuestion();
                if (q == null) continue;
                if (q.getType() == QuestionType.ESSAY && ans.getFinalScore() == null) {
                    continue;
                }
                Long lineageKey = (q.getLineageId() != null) ? q.getLineageId() : q.getId();
                double points = (q.getPoints() != null) ? q.getPoints() : 1.0;
                double earned = (ans.getFinalScore() != null) ? ans.getFinalScore() : 0.0;
                boolean answered = (ans.getSelectedChoice() != null || (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank()));

                latestByQuestion.put(lineageKey, new QuestionEvaluation(
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

    @Transactional(readOnly = true)
    public Map<Long, Integer> countDistinctQuestionsEvaluatedPerTopicInClass(Long studentId, Long classId) {
        return countDistinctByTopic(getLatestQuestionEvaluationsInClass(studentId, classId).values());
    }

    private Map<Long, Integer> countDistinctByTopic(Collection<QuestionEvaluation> evaluations) {
        Map<Long, Integer> result = new HashMap<>();
        for (QuestionEvaluation eval : evaluations) {
            if (eval.question() != null && eval.question().getTopic() != null) {
                Long topicId = eval.question().getTopic().getId();
                result.merge(topicId, 1, Integer::sum);
            }
        }
        return result;
    }

    /**
     * Finds the most recent evaluation per distinct question lineage across all submitted attempts.
     * Iterating chronologically ensures newer attempt evaluations overwrite older ones.
     */
    @Transactional(readOnly = true)
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
            Map<Long, Answer> answerByLineage = answers.stream()
                    .collect(Collectors.toMap(
                            a -> a.getQuestion().getLineageId() != null ? a.getQuestion().getLineageId() : a.getQuestion().getId(),
                            a -> a,
                            (a1, a2) -> a2
                    ));

            for (AssessmentQuestion aq : assessmentQuestions) {
                Question q = aq.getQuestion();
                Long lineageKey = (q.getLineageId() != null) ? q.getLineageId() : q.getId();
                Answer ans = answerMap.get(q.getId());
                if (ans == null) {
                    ans = answerByLineage.get(lineageKey);
                }
                Question evalQ = (ans != null && ans.getQuestion() != null) ? ans.getQuestion() : q;
                if (evalQ.getType() == QuestionType.ESSAY && (ans == null || ans.getFinalScore() == null)) {
                    continue;
                }
                double points = (evalQ.getPoints() != null) ? evalQ.getPoints() : 1.0;
                double earned = 0.0;
                boolean answered = false;

                if (ans != null) {
                    earned = (ans.getFinalScore() != null) ? ans.getFinalScore() : 0.0;
                    if (ans.getSelectedChoice() != null || (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank())) {
                        answered = true;
                    }
                }

                latestByQuestion.put(lineageKey, new QuestionEvaluation(
                        evalQ,
                        earned,
                        points,
                        answered,
                        attempt.getSubmittedAt(),
                        ans
                ));
            }

            // Also include any answers directly recorded on the attempt
            for (Answer ans : answers) {
                Question q = ans.getQuestion();
                if (q == null) continue;
                if (q.getType() == QuestionType.ESSAY && ans.getFinalScore() == null) {
                    continue;
                }
                Long lineageKey = (q.getLineageId() != null) ? q.getLineageId() : q.getId();
                double points = (q.getPoints() != null) ? q.getPoints() : 1.0;
                double earned = (ans.getFinalScore() != null) ? ans.getFinalScore() : 0.0;
                boolean answered = (ans.getSelectedChoice() != null || (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank()));

                latestByQuestion.put(lineageKey, new QuestionEvaluation(
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
     * Computes the number of distinct question lineages asked per topic across all submitted attempts.
     */
    @Transactional(readOnly = true)
    public Map<Long, Integer> countDistinctQuestionsEvaluatedPerTopic(Long studentId) {
        return countDistinctByTopic(getLatestQuestionEvaluations(studentId).values());
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

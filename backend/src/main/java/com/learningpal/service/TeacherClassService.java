package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing educator classroom sections, join codes, rosters, and lifecycle archiving.
 * Strictly institution-scoped and teacher-owned.
 */
@Service
public class TeacherClassService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ClassEntityRepository classEntityRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TopicRepository topicRepository;
    private final StudentTopicMasteryRepository studentTopicMasteryRepository;
    private final AttemptRepository attemptRepository;
    private final AssessmentRepository assessmentRepository;
    private final ClassAssessmentSettingRepository classAssessmentSettingRepository;
    private final AssessmentAccessRepository assessmentAccessRepository;
    private final InterventionRepository interventionRepository;
    private final AnswerRepository answerRepository;
    private final ChoiceRepository choiceRepository;
    private final GapAnalysisService gapAnalysisService;
    private final StudentResourceService studentResourceService;
    private final JoinCodeGenerator joinCodeGenerator;
    private final TenantAccess tenantAccess;

    /**
     * Threshold for flagging students who require immediate academic intervention.
     * Rule: Students with 2 or more curriculum learning gaps (status = GAP) are flagged as needsAttention = true.
     */
    public static final int NEEDS_ATTENTION_GAP_THRESHOLD = 2;

    /**
     * Threshold in percentage points to determine whether an intervention improved or declined student mastery.
     * Rule: An improvement of >= 10.0 points is IMPROVED; a decline of >= 10.0 points is DECLINED.
     */
    public static final double INTERVENTION_OUTCOME_THRESHOLD = 10.0;

    public TeacherClassService(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            TopicRepository topicRepository,
            StudentTopicMasteryRepository studentTopicMasteryRepository,
            AttemptRepository attemptRepository,
            AssessmentRepository assessmentRepository,
            ClassAssessmentSettingRepository classAssessmentSettingRepository,
            AssessmentAccessRepository assessmentAccessRepository,
            InterventionRepository interventionRepository,
            AnswerRepository answerRepository,
            ChoiceRepository choiceRepository,
            GapAnalysisService gapAnalysisService,
            StudentResourceService studentResourceService,
            JoinCodeGenerator joinCodeGenerator,
            TenantAccess tenantAccess) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.topicRepository = topicRepository;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.attemptRepository = attemptRepository;
        this.assessmentRepository = assessmentRepository;
        this.classAssessmentSettingRepository = classAssessmentSettingRepository;
        this.assessmentAccessRepository = assessmentAccessRepository;
        this.interventionRepository = interventionRepository;
        this.answerRepository = answerRepository;
        this.choiceRepository = choiceRepository;
        this.gapAnalysisService = gapAnalysisService;
        this.studentResourceService = studentResourceService;
        this.joinCodeGenerator = joinCodeGenerator;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Creates a new class section for the authenticated active teacher.
     */
    @Transactional
    public TeacherClassDto createClass(String teacherEmail, CreateClassRequest request) {
        User teacher = getActiveTeacher(teacherEmail);

        if (request.name() == null || request.name().trim().isBlank()) {
            throw new BadRequestException("Class section name is required");
        }
        String trimmedName = request.name().trim();
        if (trimmedName.length() > 60) {
            throw new BadRequestException("Class section name must be 60 characters or fewer");
        }

        if (request.subjectId() == null) {
            throw new BadRequestException("Subject ID is required");
        }
        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new BadRequestException("Subject not found: " + request.subjectId()));

        if (classEntityRepository.existsByTeacherAndSubjectAndNameIgnoreCase(teacher, subject, trimmedName)) {
            throw new BadRequestException("You already have a class with this name for this subject");
        }

        Institution institution = tenantAccess.requireCallerInstitution(teacher);
        String joinCode = joinCodeGenerator.generateUniqueCode(institution, classEntityRepository);

        ClassEntity newClass = new ClassEntity(institution, subject, teacher, trimmedName, joinCode);
        ClassEntity saved = classEntityRepository.save(newClass);

        return TeacherClassDto.fromEntity(saved, 0);
    }

    /**
     * Lists all classes taught by the authenticated teacher, ordered newest first.
     */
    @Transactional(readOnly = true)
    public List<TeacherClassDto> getTeacherClasses(String teacherEmail) {
        User teacher = getActiveTeacher(teacherEmail);
        List<ClassEntity> classes = classEntityRepository.findByTeacherOrderByCreatedAtDesc(teacher);

        List<TeacherClassDto> dtos = new ArrayList<>();
        for (ClassEntity cls : classes) {
            long count = enrollmentRepository.countByClassEntity(cls);
            dtos.add(TeacherClassDto.fromEntity(cls, count));
        }
        return dtos;
    }

    /**
     * Returns detailed class information including the enrolled student roster.
     */
    @Transactional(readOnly = true)
    public TeacherClassDetailDto getTeacherClassDetail(String teacherEmail, Long classId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityOrderByEnrolledAtDesc(cls);
        List<ClassMemberDto> members = enrollments.stream()
                .map(e -> new ClassMemberDto(
                        e.getStudent().getId(),
                        e.getStudent().getFullName(),
                        e.getStudent().getEmail(),
                        e.getEnrolledAt()
                ))
                .toList();

        return TeacherClassDetailDto.fromEntity(cls, enrollments.size(), members);
    }

    /**
     * Retrieves the class student roster with class-scoped attempt counts, latest diagnostic scores,
     * and curriculum topic mastery statuses.
     * Enforces that the calling teacher owns this class in their institution.
     */
    @Transactional(readOnly = true)
    public List<ClassRosterStudentDto> getClassRoster(String teacherEmail, Long classId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityOrderByEnrolledAtDesc(cls);
        if (enrollments.isEmpty()) {
            return List.of();
        }

        Subject subject = cls.getSubject();
        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        List<User> students = enrollments.stream().map(Enrollment::getStudent).toList();

        // Bulk fetch 1: topic masteries for all students in subject
        List<StudentTopicMastery> masteries = studentTopicMasteryRepository.findByStudentsAndSubject(students, subject);
        Map<Long, Map<Long, StudentTopicMastery>> masteryByStudentAndTopic = masteries.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getStudent().getId(),
                        Collectors.toMap(m -> m.getTopic().getId(), m -> m, (a, b) -> a)
                ));

        // Bulk fetch 2: attempts taken within this class
        List<Attempt> classAttempts = attemptRepository.findByClassId(cls.getId());
        Map<Long, List<Attempt>> attemptsByStudent = classAttempts.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));

        // Bulk fetch 3: open interventions count per student in this class
        Map<Long, Long> openInterventionCounts = interventionRepository
                .countOpenInterventionsByClassGroupedByStudent(cls.getId(), InterventionStatus.PLANNED)
                .stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        List<ClassRosterStudentDto> roster = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            User student = enrollment.getStudent();
            List<Attempt> studentAttempts = attemptsByStudent.getOrDefault(student.getId(), List.of());
            int attemptsCount = studentAttempts.size();
            int openInterventions = openInterventionCounts.getOrDefault(student.getId(), 0L).intValue();

            // Find latest submitted diagnostic in this class
            LatestDiagnosticDto latestDiagnostic = studentAttempts.stream()
                    .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED
                            && a.getAssessment() != null
                            && a.getAssessment().getTitle() != null
                            && a.getAssessment().getTitle().toLowerCase().contains("diagnostic"))
                    .max(Comparator.comparing(a -> a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getStartedAt()))
                    .map(a -> {
                        Double score = a.getTotalScore();
                        Double max = a.getMaxScore();
                        Double percent = (score != null && max != null && max > 0.0)
                                ? Math.round((score / max) * 1000.0) / 10.0
                                : 0.0;
                        return new LatestDiagnosticDto(score, max, percent, a.getSubmittedAt());
                    })
                    .orElse(null);

            Map<Long, StudentTopicMastery> studentTopicMap = masteryByStudentAndTopic.getOrDefault(student.getId(), Map.of());
            List<ClassTopicMasteryDto> topicMasteries = new ArrayList<>();
            int gapCount = 0;
            int developingCount = 0;
            int strengthCount = 0;

            for (Topic topic : topics) {
                StudentTopicMastery m = studentTopicMap.get(topic.getId());
                if (m != null) {
                    String statusStr = m.getStatus() != null ? m.getStatus().name() : "INSUFFICIENT_DATA";
                    Double pct = m.getMasteryPercent() != null ? m.getMasteryPercent() : 0.0;
                    topicMasteries.add(new ClassTopicMasteryDto(topic.getId(), topic.getName(), pct, statusStr));

                    if (m.getStatus() == MasteryStatus.GAP) {
                        gapCount++;
                    } else if (m.getStatus() == MasteryStatus.DEVELOPING) {
                        developingCount++;
                    } else if (m.getStatus() == MasteryStatus.STRENGTH) {
                        strengthCount++;
                    }
                } else {
                    topicMasteries.add(new ClassTopicMasteryDto(topic.getId(), topic.getName(), null, "NO_DATA"));
                }
            }

            boolean needsAttention = gapCount >= NEEDS_ATTENTION_GAP_THRESHOLD;

            roster.add(new ClassRosterStudentDto(
                    student.getId(),
                    student.getFullName(),
                    student.getEmail(),
                    enrollment.getEnrolledAt(),
                    attemptsCount,
                    latestDiagnostic,
                    topicMasteries,
                    gapCount,
                    developingCount,
                    strengthCount,
                    needsAttention,
                    openInterventions
            ));
        }

        return roster;
    }

    /**
     * Calculates aggregate overview metrics for a class: student totals, diagnostic average,
     * topic breakdown ranked by learning gap prevalence, and open interventions total.
     */
    @Transactional(readOnly = true)
    public ClassOverviewResponseDto getClassOverview(String teacherEmail, Long classId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<ClassRosterStudentDto> roster = getClassRoster(teacherEmail, classId);
        Subject subject = cls.getSubject();
        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);

        int enrolledStudents = roster.size();
        int studentsWithAttempts = (int) roster.stream().filter(s -> s.attemptsCount() > 0).count();
        int studentsNeedingAttention = (int) roster.stream().filter(ClassRosterStudentDto::needsAttention).count();
        int totalOpenInterventions = (int) interventionRepository.countByClassEntityIdAndStatus(cls.getId(), InterventionStatus.PLANNED);

        List<Double> diagnosticPercents = roster.stream()
                .map(ClassRosterStudentDto::latestDiagnostic)
                .filter(Objects::nonNull)
                .map(LatestDiagnosticDto::percent)
                .filter(Objects::nonNull)
                .toList();

        Double avgDiagnosticPercent = null;
        if (!diagnosticPercents.isEmpty()) {
            double sum = diagnosticPercents.stream().mapToDouble(Double::doubleValue).sum();
            avgDiagnosticPercent = Math.round((sum / diagnosticPercents.size()) * 10.0) / 10.0;
        }

        ClassOverviewTotalsDto totals = new ClassOverviewTotalsDto(
                enrolledStudents,
                studentsWithAttempts,
                avgDiagnosticPercent,
                studentsNeedingAttention,
                totalOpenInterventions
        );

        // Topic accumulator record for ranking
        record TopicAcc(
                Long topicId,
                String topicName,
                int strength,
                int developing,
                int gap,
                int insufficientData,
                int noData,
                Double avgMastery,
                int displayOrder
        ) {}

        List<TopicAcc> accList = new ArrayList<>();
        for (Topic topic : topics) {
            int strength = 0;
            int developing = 0;
            int gap = 0;
            int insufficientData = 0;
            int noData = 0;
            List<Double> scoresWithData = new ArrayList<>();

            for (ClassRosterStudentDto s : roster) {
                ClassTopicMasteryDto tm = s.topics().stream()
                        .filter(t -> t.topicId().equals(topic.getId()))
                        .findFirst()
                        .orElse(null);

                if (tm == null || "NO_DATA".equalsIgnoreCase(tm.status())) {
                    noData++;
                } else if ("INSUFFICIENT_DATA".equalsIgnoreCase(tm.status())) {
                    insufficientData++;
                } else if ("GAP".equalsIgnoreCase(tm.status())) {
                    gap++;
                    if (tm.masteryPercent() != null) scoresWithData.add(tm.masteryPercent());
                } else if ("DEVELOPING".equalsIgnoreCase(tm.status())) {
                    developing++;
                    if (tm.masteryPercent() != null) scoresWithData.add(tm.masteryPercent());
                } else if ("STRENGTH".equalsIgnoreCase(tm.status())) {
                    strength++;
                    if (tm.masteryPercent() != null) scoresWithData.add(tm.masteryPercent());
                }
            }

            Double avgMastery = null;
            if (!scoresWithData.isEmpty()) {
                double sum = scoresWithData.stream().mapToDouble(Double::doubleValue).sum();
                avgMastery = Math.round((sum / scoresWithData.size()) * 10.0) / 10.0;
            }

            accList.add(new TopicAcc(
                    topic.getId(),
                    topic.getName(),
                    strength,
                    developing,
                    gap,
                    insufficientData,
                    noData,
                    avgMastery,
                    topic.getDisplayOrder() != null ? topic.getDisplayOrder() : 0
            ));
        }

        // Rank by most students in GAP (descending), then lowest average mastery (ascending), then topic display order
        accList.sort(Comparator
                .comparingInt(TopicAcc::gap).reversed()
                .thenComparing((a, b) -> {
                    if (a.avgMastery == null && b.avgMastery == null) return 0;
                    if (a.avgMastery == null) return 1;
                    if (b.avgMastery == null) return -1;
                    return Double.compare(a.avgMastery, b.avgMastery);
                })
                .thenComparingInt(TopicAcc::displayOrder)
        );

        List<ClassTopicOverviewDto> topicDtos = new ArrayList<>();
        for (int i = 0; i < accList.size(); i++) {
            TopicAcc a = accList.get(i);
            topicDtos.add(new ClassTopicOverviewDto(
                    a.topicId(),
                    a.topicName(),
                    a.strength(),
                    a.developing(),
                    a.gap(),
                    a.insufficientData(),
                    a.noData(),
                    a.avgMastery(),
                    i + 1
            ));
        }

        return new ClassOverviewResponseDto(cls.getId(), cls.getName(), totals, topicDtos);
    }

    /**
     * Archives a class section, closing enrollment and preventing new assessment attempts. Idempotent.
     */
    @Transactional
    public TeacherClassDto archiveClass(String teacherEmail, Long classId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        cls.setStatus(ClassStatus.ARCHIVED);
        cls.setEnrollmentOpen(false);
        ClassEntity saved = classEntityRepository.save(cls);

        long count = enrollmentRepository.countByClassEntity(saved);
        return TeacherClassDto.fromEntity(saved, count);
    }

    /**
     * Regenerates the 6-character join code for an active class. Old code stops working immediately.
     */
    @Transactional
    public TeacherClassDto regenerateJoinCode(String teacherEmail, Long classId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        if (cls.getStatus() == ClassStatus.ARCHIVED) {
            throw new BadRequestException("Cannot regenerate join code for an archived class");
        }

        String newCode = joinCodeGenerator.generateUniqueCode(cls.getInstitution(), classEntityRepository);
        cls.setJoinCode(newCode);
        ClassEntity saved = classEntityRepository.save(cls);

        long count = enrollmentRepository.countByClassEntity(saved);
        return TeacherClassDto.fromEntity(saved, count);
    }

    /**
     * Toggles whether new students can join using the join code.
     */
    @Transactional
    public TeacherClassDto toggleEnrollment(String teacherEmail, Long classId, boolean open) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        if (cls.getStatus() == ClassStatus.ARCHIVED && open) {
            throw new BadRequestException("Cannot open enrollment for an archived class");
        }

        cls.setEnrollmentOpen(open);
        ClassEntity saved = classEntityRepository.save(cls);

        long count = enrollmentRepository.countByClassEntity(saved);
        return TeacherClassDto.fromEntity(saved, count);
    }

    /**
     * Lists subject assessments for an owned class with their class-scoped schedule and retake settings.
     */
    @Transactional(readOnly = true)
    public List<TeacherClassAssessmentDto> getClassAssessments(String teacherEmail, Long classId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Assessment> assessments = assessmentRepository.findBySubjectAndStatus(cls.getSubject(), AssessmentStatus.PUBLISHED);
        List<ClassAssessmentSetting> settings = classAssessmentSettingRepository.findByClassEntity(cls);
        Map<Long, ClassAssessmentSetting> settingByAssessmentId = settings.stream()
                .collect(Collectors.toMap(s -> s.getAssessment().getId(), s -> s));

        List<TeacherClassAssessmentDto> result = new ArrayList<>();
        for (Assessment a : assessments) {
            ClassAssessmentSetting setting = settingByAssessmentId.get(a.getId());
            boolean hasCustom = setting != null;
            Instant availableFrom = hasCustom ? setting.getAvailableFrom() : a.getAvailableFrom();
            Instant availableUntil = hasCustom ? setting.getAvailableUntil() : a.getAvailableUntil();
            boolean allowRetakes = hasCustom ? setting.isAllowRetakes() : true;

            result.add(new TeacherClassAssessmentDto(
                    a.getId(),
                    a.getTitle(),
                    a.getDescription(),
                    a.getTimeLimitMinutes(),
                    availableFrom,
                    availableUntil,
                    allowRetakes,
                    hasCustom
            ));
        }
        return result;
    }

    /**
     * Updates class-scoped schedule window and retake rules for an assessment in an owned class.
     */
    @Transactional
    public TeacherClassAssessmentDto updateClassAssessmentSetting(
            String teacherEmail,
            Long classId,
            Long assessmentId,
            UpdateClassAssessmentSettingRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        Assessment assessment = assessmentRepository.findById(assessmentId)
                .filter(a -> a.getStatus() == AssessmentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + assessmentId));

        if (!assessment.getSubject().getId().equals(cls.getSubject().getId())) {
            throw new ResourceNotFoundException("Assessment does not belong to this class subject: " + assessmentId);
        }

        ClassAssessmentSetting setting = classAssessmentSettingRepository
                .findByClassEntityAndAssessment(cls, assessment)
                .orElseGet(() -> new ClassAssessmentSetting(cls, assessment, null, null, true));

        setting.setAvailableFrom(request.availableFrom());
        setting.setAvailableUntil(request.availableUntil());
        if (request.allowRetakes() != null) {
            setting.setAllowRetakes(request.allowRetakes());
        }

        ClassAssessmentSetting saved = classAssessmentSettingRepository.save(setting);
        return new TeacherClassAssessmentDto(
                assessment.getId(),
                assessment.getTitle(),
                assessment.getDescription(),
                assessment.getTimeLimitMinutes(),
                saved.getAvailableFrom(),
                saved.getAvailableUntil(),
                saved.isAllowRetakes(),
                true
        );
    }

    /**
     * Grants a one-time retake unlock or deadline extension for a student enrolled in an owned class.
     */
    @Transactional
    public void unlockStudentAssessment(
            String teacherEmail,
            Long classId,
            Long assessmentId,
            UnlockStudentAssessmentRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        Assessment assessment = assessmentRepository.findById(assessmentId)
                .filter(a -> a.getStatus() == AssessmentStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + assessmentId));

        if (!assessment.getSubject().getId().equals(cls.getSubject().getId())) {
            throw new ResourceNotFoundException("Assessment does not belong to this class subject: " + assessmentId);
        }

        User student = userRepository.findById(request.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + request.studentId()));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student, cls)) {
            throw new ResourceNotFoundException("Student is not enrolled in this class");
        }

        AssessmentAccess access = assessmentAccessRepository
                .findByAssessmentAndStudent(assessment, student)
                .orElseGet(() -> new AssessmentAccess(assessment, student));

        access.grantReopen(teacher, request.extendedUntil(), request.reason());
        assessmentAccessRepository.save(access);
    }

    // =========================================================================
    // PART 1: STUDENT DETAIL
    // =========================================================================

    @Transactional(readOnly = true)
    public TeacherStudentDetailDto getStudentDetail(String teacherEmail, Long classId, Long studentId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        Enrollment enrollment = enrollmentRepository.findByStudentAndClassEntity(student, cls)
                .orElseThrow(() -> new ResourceNotFoundException("Student is not enrolled in this class"));

        Subject subject = cls.getSubject();
        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);

        // Fetch subject-scoped topic mastery rows for this student
        List<StudentTopicMastery> masteries = studentTopicMasteryRepository.findByStudentAndSubject(student, subject);
        Map<Long, StudentTopicMastery> masteryByTopicId = masteries.stream()
                .collect(Collectors.toMap(m -> m.getTopic().getId(), m -> m, (a, b) -> a));

        Map<Long, Integer> distinctCounts = gapAnalysisService.countDistinctQuestionsEvaluatedPerTopic(student.getId());

        List<TeacherStudentTopicMasteryDto> topicMasteries = new ArrayList<>();
        int gapCount = 0;

        for (Topic t : topics) {
            StudentTopicMastery m = masteryByTopicId.get(t.getId());
            Double masteryPercent = (m != null) ? m.getMasteryPercent() : null;
            Double previousPercent = (m != null) ? m.getPreviousMasteryPercent() : null;
            MasteryStatus status = (m != null) ? m.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
            String trend = GapAnalysisClassifier.calculateTrend(masteryPercent, previousPercent);

            if (status == MasteryStatus.GAP) {
                gapCount++;
            }

            int questionsAnswered = distinctCounts.getOrDefault(t.getId(), 0);
            List<RecommendedResourceDto> resources = studentResourceService.getRecommendationsForTopic(t, status, student);
            int resourcesRecommended = resources.size();
            int resourcesCompleted = (int) resources.stream().filter(RecommendedResourceDto::completed).count();

            topicMasteries.add(new TeacherStudentTopicMasteryDto(
                    t.getId(),
                    t.getName(),
                    masteryPercent,
                    previousPercent,
                    trend,
                    status,
                    questionsAnswered,
                    resourcesCompleted,
                    resourcesRecommended
            ));
        }

        boolean needsAttention = gapCount >= NEEDS_ATTENTION_GAP_THRESHOLD;
        StudentProfileDto profile = new StudentProfileDto(
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                enrollment.getEnrolledAt(),
                needsAttention
        );

        // Most-missed questions per GAP or DEVELOPING topic (capped at 5)
        Map<Long, GapAnalysisService.QuestionEvaluation> latestByQuestion =
                gapAnalysisService.getLatestQuestionEvaluations(student.getId());
        Map<Long, List<MissedQuestionDto>> missedQuestionsByTopic = new LinkedHashMap<>();

        for (Topic t : topics) {
            StudentTopicMastery m = masteryByTopicId.get(t.getId());
            MasteryStatus status = (m != null) ? m.getStatus() : MasteryStatus.INSUFFICIENT_DATA;
            if (status == MasteryStatus.GAP || status == MasteryStatus.DEVELOPING) {
                List<MissedQuestionDto> topicMisses = new ArrayList<>();
                for (GapAnalysisService.QuestionEvaluation eval : latestByQuestion.values()) {
                    if (eval.question().getTopic().getId().equals(t.getId()) && eval.earned() < eval.possible()) {
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

                        topicMisses.add(new MissedQuestionDto(
                                q.getId(),
                                q.getText(),
                                studentAnswer,
                                correctAnswer,
                                q.getExplanation()
                        ));

                        if (topicMisses.size() >= 5) {
                            break;
                        }
                    }
                }
                missedQuestionsByTopic.put(t.getId(), topicMisses);
            }
        }

        // Attempts taken in THIS class only
        List<Attempt> classAttempts = attemptRepository.findByClassId(cls.getId()).stream()
                .filter(a -> a.getStudent().getId().equals(student.getId()))
                .sorted(Comparator.comparing((Attempt a) -> a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getStartedAt(), Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<ClassAttemptDto> attemptDtos = new ArrayList<>();
        for (Attempt a : classAttempts) {
            Double score = a.getTotalScore();
            Double max = a.getMaxScore();
            Double pct = (score != null && max != null && max > 0.0)
                    ? Math.round((score / max) * 1000.0) / 10.0
                    : 0.0;
            attemptDtos.add(new ClassAttemptDto(
                    a.getId(),
                    a.getAssessment().getId(),
                    a.getAssessment().getTitle(),
                    a.getSubmittedAt(),
                    score,
                    max,
                    pct
            ));
        }

        // Diagnostic trend over time (chronological)
        List<DiagnosticTrendPointDto> diagnosticTrend = classAttempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED
                        && a.getAssessment() != null
                        && a.getAssessment().getTitle() != null
                        && a.getAssessment().getTitle().toLowerCase().contains("diagnostic"))
                .sorted(Comparator.comparing((Attempt a) -> a.getSubmittedAt() != null ? a.getSubmittedAt() : Instant.EPOCH))
                .map(a -> {
                    Double score = a.getTotalScore();
                    Double max = a.getMaxScore();
                    Double pct = (score != null && max != null && max > 0.0)
                            ? Math.round((score / max) * 1000.0) / 10.0
                            : 0.0;
                    return new DiagnosticTrendPointDto(a.getId(), a.getSubmittedAt(), pct);
                })
                .toList();

        // Interventions for this student in this class
        List<Intervention> interventions = interventionRepository.findByClassEntityIdAndStudentId(cls.getId(), student.getId());
        List<TeacherInterventionDto> interventionDtos = interventions.stream()
                .map(i -> mapToInterventionDto(i, masteryByTopicId))
                .toList();

        return new TeacherStudentDetailDto(
                profile,
                topicMasteries,
                missedQuestionsByTopic,
                attemptDtos,
                diagnosticTrend,
                interventionDtos
        );
    }

    // =========================================================================
    // PART 2: GRADE OVERRIDE
    // =========================================================================

    @Transactional(readOnly = true)
    public TeacherAttemptReviewDto getAttemptReview(String teacherEmail, Long classId, Long attemptId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        if (attempt.getClassId() == null || !attempt.getClassId().equals(cls.getId())) {
            throw new ResourceNotFoundException("Attempt not found in class: " + attemptId);
        }

        List<Answer> answers = answerRepository.findByAttempt(attempt);
        List<TeacherAnswerReviewDto> answerReviews = new ArrayList<>();

        for (Answer ans : answers) {
            Question q = ans.getQuestion();
            Topic t = q.getTopic();

            List<Choice> choices = choiceRepository.findByQuestion(q);
            Long correctChoiceId = null;
            String correctChoiceLabel = null;
            String correctChoiceText = null;
            List<ChoiceReviewDto> choiceReviews = new ArrayList<>();

            for (Choice c : choices) {
                if (c.isCorrect()) {
                    correctChoiceId = c.getId();
                    correctChoiceLabel = c.getLabel();
                    correctChoiceText = c.getText();
                }
                choiceReviews.add(new ChoiceReviewDto(c.getId(), c.getLabel(), c.getText()));
            }

            Long studentChoiceId = ans.getSelectedChoice() != null ? ans.getSelectedChoice().getId() : null;
            String studentChoiceLabel = ans.getSelectedChoice() != null ? ans.getSelectedChoice().getLabel() : null;
            String studentChoiceText = ans.getSelectedChoice() != null ? ans.getSelectedChoice().getText() : null;

            boolean adjusted = ans.getTeacherScore() != null;

            answerReviews.add(new TeacherAnswerReviewDto(
                    ans.getId(),
                    q.getId(),
                    q.getText(),
                    t != null ? t.getId() : null,
                    t != null ? t.getName() : "General",
                    q.getPoints(),
                    choiceReviews,
                    studentChoiceId,
                    studentChoiceLabel,
                    studentChoiceText,
                    correctChoiceId,
                    correctChoiceLabel,
                    correctChoiceText,
                    q.getExplanation(),
                    ans.getAutoScore(),
                    ans.getTeacherScore(),
                    ans.getFinalScore(),
                    ans.getTeacherComment(),
                    ans.getGradedAt(),
                    adjusted
            ));
        }

        double score = attempt.getTotalScore() != null ? attempt.getTotalScore() : 0.0;
        double maxScore = attempt.getMaxScore() != null ? attempt.getMaxScore() : 0.0;
        double percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000.0) / 10.0 : 0.0;

        return new TeacherAttemptReviewDto(
                attempt.getId(),
                cls.getId(),
                cls.getName(),
                attempt.getAssessment().getId(),
                attempt.getAssessment().getTitle(),
                attempt.getStudent().getId(),
                attempt.getStudent().getFullName(),
                attempt.getStudent().getEmail(),
                attempt.getStatus().name(),
                score,
                maxScore,
                percentage,
                attempt.getSubmittedAt(),
                answerReviews
        );
    }

    @Transactional
    public GradeAnswerResponseDto gradeAnswer(
            String teacherEmail,
            Long classId,
            Long attemptId,
            Long answerId,
            GradeAnswerRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        if (attempt.getClassId() == null || !attempt.getClassId().equals(cls.getId())) {
            throw new ResourceNotFoundException("Attempt not found in class: " + attemptId);
        }

        if (attempt.getStatus() != AttemptStatus.SUBMITTED) {
            throw new BadRequestException("Only submitted attempts can have grades overridden");
        }

        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found: " + answerId));

        if (!answer.getAttempt().getId().equals(attempt.getId())) {
            throw new ResourceNotFoundException("Answer does not belong to attempt: " + answerId);
        }

        Double score = request.teacherScore();
        if (score != null) {
            if (score < 0.0) {
                throw new BadRequestException("Score cannot be negative");
            }
            double maxPoints = answer.getQuestion().getPoints() != null ? answer.getQuestion().getPoints() : 1.0;
            if (score > maxPoints) {
                throw new BadRequestException("Score cannot exceed question maximum points of " + maxPoints);
            }
            if (BigDecimal.valueOf(score).stripTrailingZeros().scale() > 2) {
                throw new BadRequestException("Score cannot have more than 2 decimal places");
            }
        }

        String comment = request.teacherComment() != null ? request.teacherComment().trim() : null;
        if (comment != null && comment.length() > 500) {
            throw new BadRequestException("Teacher comment cannot exceed 500 characters");
        }

        // Apply override (centralized in Answer entity)
        answer.applyTeacherOverride(score, comment, teacher);
        Answer savedAnswer = answerRepository.save(answer);

        // Recalculate attempt totalScore
        List<Answer> allAnswers = answerRepository.findByAttempt(attempt);
        double newTotal = allAnswers.stream()
                .mapToDouble(a -> a.getFinalScore() != null ? a.getFinalScore() : 0.0)
                .sum();
        attempt.setTotalScore(newTotal);
        attemptRepository.save(attempt);

        // Recalculate student mastery & gap analysis in same transaction
        gapAnalysisService.recalculateForStudent(attempt.getStudent().getId());

        Topic topic = answer.getQuestion().getTopic();
        StudentTopicMastery updatedMastery = studentTopicMasteryRepository
                .findByStudentAndTopic(attempt.getStudent(), topic)
                .orElse(null);

        Question q = answer.getQuestion();
        List<ChoiceReviewDto> choiceReviews = choiceRepository.findByQuestion(q).stream()
                .map(c -> new ChoiceReviewDto(c.getId(), c.getLabel(), c.getText()))
                .toList();

        Long correctChoiceId = choiceRepository.findByQuestion(q).stream()
                .filter(Choice::isCorrect)
                .map(Choice::getId)
                .findFirst()
                .orElse(null);

        Long studentChoiceId = answer.getSelectedChoice() != null ? answer.getSelectedChoice().getId() : null;

        TeacherAnswerReviewDto answerDto = new TeacherAnswerReviewDto(
                savedAnswer.getId(),
                q.getId(),
                q.getText(),
                topic.getId(),
                topic.getName(),
                q.getPoints(),
                choiceReviews,
                studentChoiceId,
                answer.getSelectedChoice() != null ? answer.getSelectedChoice().getLabel() : null,
                answer.getSelectedChoice() != null ? answer.getSelectedChoice().getText() : null,
                correctChoiceId,
                null,
                null,
                q.getExplanation(),
                savedAnswer.getAutoScore(),
                savedAnswer.getTeacherScore(),
                savedAnswer.getFinalScore(),
                savedAnswer.getTeacherComment(),
                savedAnswer.getGradedAt(),
                savedAnswer.getTeacherScore() != null
        );

        double pct = attempt.getMaxScore() != null && attempt.getMaxScore() > 0
                ? Math.round((newTotal / attempt.getMaxScore()) * 1000.0) / 10.0
                : 0.0;

        return new GradeAnswerResponseDto(
                answerDto,
                newTotal,
                pct,
                topic.getId(),
                topic.getName(),
                updatedMastery != null ? updatedMastery.getMasteryPercent() : null,
                updatedMastery != null ? updatedMastery.getStatus() : null
        );
    }

    // =========================================================================
    // PART 3: INTERVENTIONS
    // =========================================================================

    @Transactional
    public TeacherInterventionDto createIntervention(
            String teacherEmail,
            Long classId,
            Long studentId,
            CreateInterventionRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        if (cls.getStatus() == ClassStatus.ARCHIVED) {
            throw new BadRequestException("Cannot create interventions in an archived class");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student, cls)) {
            throw new ResourceNotFoundException("Student is not enrolled in this class");
        }

        Topic topic = topicRepository.findById(request.topicId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + request.topicId()));

        if (!topic.getSubject().getId().equals(cls.getSubject().getId())) {
            throw new BadRequestException("Topic does not belong to this class subject: " + request.topicId());
        }

        if (request.note() == null || request.note().trim().isEmpty()) {
            throw new BadRequestException("Intervention note is required");
        }

        String note = request.note().trim();
        if (note.length() > 1000) {
            throw new BadRequestException("Intervention note cannot exceed 1000 characters");
        }

        if (request.followUpDate() != null && request.followUpDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Follow-up date must be today or in the future");
        }

        StudentTopicMastery current = studentTopicMasteryRepository.findByStudentAndTopic(student, topic).orElse(null);
        Double masteryAtStart = (current != null) ? current.getMasteryPercent() : null;

        Intervention intervention = new Intervention(
                student,
                teacher,
                cls,
                topic,
                request.type(),
                note,
                InterventionStatus.PLANNED,
                request.followUpDate(),
                masteryAtStart
        );

        Intervention saved = interventionRepository.save(intervention);
        Map<Long, StudentTopicMastery> masteryMap = current != null ? Map.of(topic.getId(), current) : Map.of();
        return mapToInterventionDto(saved, masteryMap);
    }

    @Transactional(readOnly = true)
    public List<TeacherInterventionDto> getClassInterventions(
            String teacherEmail,
            Long classId,
            InterventionStatus status,
            Long studentId) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Intervention> list;
        if (studentId != null && status != null) {
            list = interventionRepository.findByClassEntityIdAndStudentIdAndStatus(cls.getId(), studentId, status);
        } else if (studentId != null) {
            list = interventionRepository.findByClassEntityIdAndStudentId(cls.getId(), studentId);
        } else if (status != null) {
            list = interventionRepository.findByClassEntityIdAndStatus(cls.getId(), status);
        } else {
            list = interventionRepository.findByClassEntityId(cls.getId());
        }

        List<User> students = list.stream().map(Intervention::getStudent).distinct().toList();
        List<StudentTopicMastery> masteries = studentTopicMasteryRepository.findByStudentsAndSubject(students, cls.getSubject());
        Map<String, StudentTopicMastery> studentTopicKeyMap = masteries.stream()
                .collect(Collectors.toMap(m -> m.getStudent().getId() + "_" + m.getTopic().getId(), m -> m, (a, b) -> a));

        return list.stream().map(i -> {
            String key = i.getStudent().getId() + "_" + i.getTopic().getId();
            StudentTopicMastery m = studentTopicKeyMap.get(key);
            Double current = m != null ? m.getMasteryPercent() : null;
            return toInterventionDtoWithCurrent(i, current);
        }).toList();
    }

    @Transactional
    public TeacherInterventionDto updateIntervention(
            String teacherEmail,
            Long classId,
            Long interventionId,
            UpdateInterventionRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention not found: " + interventionId));

        if (intervention.getClassEntity() == null || !intervention.getClassEntity().getId().equals(cls.getId())) {
            throw new ResourceNotFoundException("Intervention does not belong to this class: " + interventionId);
        }

        if (intervention.getStatus() == InterventionStatus.DONE || intervention.getStatus() == InterventionStatus.CANCELLED) {
            throw new BadRequestException("Finalized interventions cannot be modified");
        }

        if (request.note() != null) {
            String trimmed = request.note().trim();
            if (trimmed.isEmpty()) {
                throw new BadRequestException("Note cannot be blank");
            }
            if (trimmed.length() > 1000) {
                throw new BadRequestException("Note cannot exceed 1000 characters");
            }
            intervention.setNote(trimmed);
        }

        if (request.followUpDate() != null) {
            if (request.followUpDate().isBefore(LocalDate.now())) {
                throw new BadRequestException("Follow-up date must be today or in the future");
            }
            intervention.setFollowUpDate(request.followUpDate());
        }

        StudentTopicMastery current = studentTopicMasteryRepository
                .findByStudentAndTopic(intervention.getStudent(), intervention.getTopic())
                .orElse(null);
        Double currentMastery = current != null ? current.getMasteryPercent() : null;

        if (request.status() != null) {
            if (request.status() == InterventionStatus.DONE) {
                intervention.setStatus(InterventionStatus.DONE);
                intervention.setCompletedAt(Instant.now());
                intervention.setMasteryAtCompletion(currentMastery);
            } else if (request.status() == InterventionStatus.CANCELLED) {
                intervention.setStatus(InterventionStatus.CANCELLED);
            }
        }

        Intervention saved = interventionRepository.save(intervention);
        return toInterventionDtoWithCurrent(saved, currentMastery);
    }

    private TeacherInterventionDto mapToInterventionDto(Intervention i, Map<Long, StudentTopicMastery> masteryByTopicId) {
        StudentTopicMastery current = masteryByTopicId.get(i.getTopic().getId());
        Double currentMastery = current != null ? current.getMasteryPercent() : null;
        return toInterventionDtoWithCurrent(i, currentMastery);
    }

    private TeacherInterventionDto toInterventionDtoWithCurrent(Intervention i, Double currentMastery) {
        Double baseline = i.getMasteryAtStart();
        Long classId = i.getClassEntity() != null ? i.getClassEntity().getId() : null;

        boolean hasSubmittedAttemptAfter = false;
        if (classId != null && i.getCreatedAt() != null) {
            hasSubmittedAttemptAfter = attemptRepository.existsByStudentIdAndClassIdAndStatusAndSubmittedAtAfter(
                    i.getStudent().getId(), classId, AttemptStatus.SUBMITTED, i.getCreatedAt()
            );
        }

        InterventionOutcome outcome;
        if (i.getStatus() == InterventionStatus.CANCELLED) {
            outcome = null;
        } else if (baseline == null || currentMastery == null || !hasSubmittedAttemptAfter) {
            outcome = InterventionOutcome.NO_NEW_DATA;
        } else {
            double diff = currentMastery - baseline;
            if (diff >= INTERVENTION_OUTCOME_THRESHOLD) {
                outcome = InterventionOutcome.IMPROVED;
            } else if (diff <= -INTERVENTION_OUTCOME_THRESHOLD) {
                outcome = InterventionOutcome.DECLINED;
            } else {
                outcome = InterventionOutcome.SAME;
            }
        }

        Double changeSinceCompletion = null;
        if (i.getStatus() == InterventionStatus.DONE && i.getMasteryAtCompletion() != null && currentMastery != null) {
            changeSinceCompletion = Math.round((currentMastery - i.getMasteryAtCompletion()) * 10.0) / 10.0;
        }

        return new TeacherInterventionDto(
                i.getId(),
                i.getClassEntity() != null ? i.getClassEntity().getId() : null,
                i.getClassEntity() != null ? i.getClassEntity().getName() : null,
                i.getStudent().getId(),
                i.getStudent().getFullName(),
                i.getStudent().getEmail(),
                i.getTeacher().getId(),
                i.getTeacher().getFullName(),
                i.getTopic().getId(),
                i.getTopic().getName(),
                i.getType(),
                i.getNote(),
                i.getStatus(),
                i.getCreatedAt(),
                i.getFollowUpDate(),
                i.getCompletedAt(),
                i.getMasteryAtStart(),
                i.getMasteryAtCompletion(),
                currentMastery,
                outcome,
                changeSinceCompletion
        );
    }

    private User getActiveTeacher(String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));

        if (teacher.getRole() != Role.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new AccessDeniedException("Only active teachers can access teacher classroom resources");
        }
        return teacher;
    }
}


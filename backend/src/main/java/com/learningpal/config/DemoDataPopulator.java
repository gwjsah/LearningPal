package com.learningpal.config;

import com.learningpal.dto.AnswerSubmissionDto;
import com.learningpal.dto.GradeAnswerRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.GradingService;
import com.learningpal.service.TeacherClassService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Opt-in demo data populator providing realistic, repeatable, and deterministic data
 * for teacher dashboard validation, gap analysis evaluation, and student progress walkthroughs.
 */
@Component
@Order(5)
public class DemoDataPopulator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataPopulator.class);

    public static final String DEMO_DOMAIN = "@demo.learningpal.local";
    public static final String DEMO_INST_CODE = "DEMO-2026";
    public static final String PILOT_INST_CODE = "PILOT-2026";

    private final boolean enabled;
    private final boolean reset;
    private final String demoPassword;
    private final boolean allowRemote;
    private final String datasourceUrl;
    private final Environment environment;

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final ClassEntityRepository classEntityRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final QuestionRepository questionRepository;
    private final ChoiceRepository choiceRepository;
    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final StudentTopicMasteryRepository studentTopicMasteryRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceProgressRepository resourceProgressRepository;
    private final InterventionRepository interventionRepository;
    private final ClassAssessmentSettingRepository classAssessmentSettingRepository;
    private final GapValidationLabelRepository gapValidationLabelRepository;
    private final GradingService gradingService;
    private final GapAnalysisService gapAnalysisService;
    private final TeacherClassService teacherClassService;
    private final PasswordEncoder passwordEncoder;

    public DemoDataPopulator(
            @Value("${app.seed.demo.enabled:false}") boolean enabled,
            @Value("${app.seed.demo.reset:false}") boolean reset,
            @Value("${app.seed.demo.password:}") String demoPassword,
            @Value("${app.seed.demo.allow-remote:false}") boolean allowRemote,
            @Value("${spring.datasource.url:}") String datasourceUrl,
            Environment environment,
            UserRepository userRepository,
            InstitutionRepository institutionRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository assessmentQuestionRepository,
            QuestionRepository questionRepository,
            ChoiceRepository choiceRepository,
            AttemptRepository attemptRepository,
            AnswerRepository answerRepository,
            StudentTopicMasteryRepository studentTopicMasteryRepository,
            ResourceRepository resourceRepository,
            ResourceProgressRepository resourceProgressRepository,
            InterventionRepository interventionRepository,
            ClassAssessmentSettingRepository classAssessmentSettingRepository,
            GapValidationLabelRepository gapValidationLabelRepository,
            GradingService gradingService,
            GapAnalysisService gapAnalysisService,
            TeacherClassService teacherClassService,
            PasswordEncoder passwordEncoder) {
        this.enabled = enabled;
        this.reset = reset;
        this.demoPassword = demoPassword;
        this.allowRemote = allowRemote;
        this.datasourceUrl = datasourceUrl;
        this.environment = environment;
        this.userRepository = userRepository;
        this.institutionRepository = institutionRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.assessmentRepository = assessmentRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.resourceRepository = resourceRepository;
        this.resourceProgressRepository = resourceProgressRepository;
        this.interventionRepository = interventionRepository;
        this.classAssessmentSettingRepository = classAssessmentSettingRepository;
        this.gapValidationLabelRepository = gapValidationLabelRepository;
        this.gradingService = gradingService;
        this.gapAnalysisService = gapAnalysisService;
        this.teacherClassService = teacherClassService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.info("DemoDataPopulator disabled (app.seed.demo.enabled=false). Real seed and existing data preserved.");
            return;
        }

        // 1. Safety check: Reject production environment
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                log.error("SAFETY REFUSAL: DemoDataPopulator cannot run on 'prod' profile!");
                return;
            }
        }

        // 2. Safety check: Local DB check
        if (!isLocalDatabase(datasourceUrl) && !allowRemote) {
            log.error("SAFETY REFUSAL: DemoDataPopulator refuses to run on non-local database without app.seed.demo.allow-remote=true. Datasource URL: {}", sanitizeUrl(datasourceUrl));
            return;
        }

        // 3. Safety check: Demo password requirements
        if (!isValidPassword(demoPassword)) {
            log.warn("SAFETY REFUSAL: app.seed.demo.password is missing or insecure (requires min 8 chars, 1 letter, 1 number). Skipping demo seeding.");
            return;
        }

        // Check if demo data already exists
        boolean demoExists = !userRepository.findByEmailEndingWith(DEMO_DOMAIN).isEmpty();
        if (demoExists) {
            if (reset) {
                log.info("Demo data already exists and reset requested (app.seed.demo.reset=true). Cleaning demo data...");
                cleanDemoData();
            } else {
                log.info("Demo data already exists and reset is false. Skipping duplicate population to ensure idempotency.");
                return;
            }
        }

        log.info("DemoDataPopulator starting deterministic data population...");
        populateAll();
        log.info("DemoDataPopulator finished successfully.");
    }

    private boolean isLocalDatabase(String url) {
        if (url == null || url.isBlank()) return true;
        String lower = url.toLowerCase(Locale.ROOT);
        return lower.contains("localhost")
                || lower.contains("127.0.0.1")
                || lower.contains("h2:mem")
                || lower.contains("h2:file")
                || lower.contains("jdbc:h2:")
                || lower.contains("testdb");
    }

    private String sanitizeUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll("(?i)password=[^;&]*", "password=***");
    }

    private boolean isValidPassword(String pwd) {
        if (pwd == null || pwd.length() < 8) return false;
        boolean hasLetter = pwd.chars().anyMatch(Character::isLetter);
        boolean hasDigit = pwd.chars().anyMatch(Character::isDigit);
        return hasLetter && hasDigit;
    }

    @Transactional
    public void cleanDemoData() {
        log.info("Cleaning up demo data (domain: {})...", DEMO_DOMAIN);

        // 1. Delete demo user artifacts
        List<User> demoUsers = userRepository.findByEmailEndingWith(DEMO_DOMAIN);
        for (User user : demoUsers) {
            // GapValidationLabels
            gapValidationLabelRepository.deleteAll(gapValidationLabelRepository.findByStudentId(user.getId()));

            // Interventions as student or teacher
            interventionRepository.deleteAll(interventionRepository.findByStudent(user));
            interventionRepository.deleteAll(interventionRepository.findByTeacher(user));

            // Attempts and answers
            List<Attempt> attempts = attemptRepository.findByStudent(user);
            for (Attempt att : attempts) {
                answerRepository.deleteAll(answerRepository.findByAttempt(att));
            }
            attemptRepository.deleteAll(attempts);

            // Mastery
            studentTopicMasteryRepository.deleteAll(studentTopicMasteryRepository.findByStudent(user));

            // Resource progress
            resourceProgressRepository.deleteAll(resourceProgressRepository.findByStudent(user));

            // Enrollments
            enrollmentRepository.deleteAll(enrollmentRepository.findByStudentOrderByEnrolledAtDesc(user));
        }

        // 3. Delete demo classes
        List<String> demoJoinCodes = List.of("PILOT1", "PILOT2", "DEMO01", "EMPTY1", "ARCH01");
        for (String jc : demoJoinCodes) {
            classEntityRepository.findByJoinCode(jc).ifPresent(cls -> {
                classAssessmentSettingRepository.deleteAll(classAssessmentSettingRepository.findByClassEntity(cls));
                enrollmentRepository.deleteAll(enrollmentRepository.findByClassEntity(cls));
                interventionRepository.deleteAll(interventionRepository.findByClassEntityId(cls.getId()));
                classEntityRepository.delete(cls);
            });
        }

        // 4. Delete classes in DEMO-2026 institution
        institutionRepository.findByCodeIgnoreCase(DEMO_INST_CODE).ifPresent(demoInst -> {
            List<ClassEntity> classes = classEntityRepository.findByInstitutionOrderByCreatedAtDesc(demoInst);
            for (ClassEntity cls : classes) {
                classAssessmentSettingRepository.deleteAll(classAssessmentSettingRepository.findByClassEntity(cls));
                enrollmentRepository.deleteAll(enrollmentRepository.findByClassEntity(cls));
                interventionRepository.deleteAll(interventionRepository.findByClassEntityId(cls.getId()));
                classEntityRepository.delete(cls);
            }
        });

        // 5. Delete demo users
        userRepository.deleteAll(demoUsers);

        // 6. Delete DEMO-2026 institution
        institutionRepository.findByCodeIgnoreCase(DEMO_INST_CODE).ifPresent(institutionRepository::delete);

        log.info("Demo data reset completed. Base seed and real accounts remained untouched.");
    }

    @Transactional
    public void populateAll() {
        Random rng = new Random(42L);
        Instant now = Instant.now();
        String encodedPassword = passwordEncoder.encode(demoPassword);

        // 1. Institutions
        Institution pilotInst = institutionRepository.findByCodeIgnoreCase(PILOT_INST_CODE)
                .orElseGet(() -> institutionRepository.save(new Institution("Pilot University", PILOT_INST_CODE)));

        Institution demoInst = institutionRepository.findByCodeIgnoreCase(DEMO_INST_CODE)
                .orElseGet(() -> institutionRepository.save(new Institution("Demo Institute", DEMO_INST_CODE)));

        // 2. Admins
        User adminPilot = userRepository.save(new User("Pilot Admin", "admin.pilot" + DEMO_DOMAIN, encodedPassword, Role.ADMIN, UserStatus.ACTIVE, pilotInst));
        User adminDemo = userRepository.save(new User("Demo Admin", "admin.demo" + DEMO_DOMAIN, encodedPassword, Role.ADMIN, UserStatus.ACTIVE, demoInst));

        // 3. Teachers
        User teacherPilot1 = userRepository.save(new User("Dr. Alan Turing", "teacher.pilot1" + DEMO_DOMAIN, encodedPassword, Role.TEACHER, UserStatus.ACTIVE, pilotInst));
        User teacherPilot2 = userRepository.save(new User("Prof. Grace Hopper", "teacher.pilot2" + DEMO_DOMAIN, encodedPassword, Role.TEACHER, UserStatus.ACTIVE, pilotInst));
        User teacherPilot3 = userRepository.save(new User("Prof. John von Neumann", "teacher.pilot3" + DEMO_DOMAIN, encodedPassword, Role.TEACHER, UserStatus.ACTIVE, pilotInst));
        User teacherPending = userRepository.save(new User("Mr. Claude Shannon", "teacher.pending" + DEMO_DOMAIN, encodedPassword, Role.TEACHER, UserStatus.PENDING, pilotInst));
        User teacherDemo = userRepository.save(new User("Dr. Ada Lovelace", "teacher.demo" + DEMO_DOMAIN, encodedPassword, Role.TEACHER, UserStatus.ACTIVE, demoInst));

        // 4. Curriculum
        Subject subject = subjectRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Curriculum Subject not found. Ensure LearningDataSeeder has run."));
        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        if (topics.isEmpty()) {
            throw new IllegalStateException("Curriculum Topics not found.");
        }

        Assessment diagnosticAssessment = assessmentRepository.findBySubject(subject).stream()
                .filter(a -> a.getTitle().contains("Diagnostic"))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Diagnostic assessment not found."));

        Map<Long, Assessment> topicQuizzes = new HashMap<>();
        for (Topic t : topics) {
            String topicKeyword = t.getName().contains(" ") ? t.getName().split(" ")[0] : t.getName();
            assessmentRepository.findBySubject(subject).stream()
                    .filter(a -> !a.getTitle().contains("Comprehensive") && a.getTitle().toLowerCase().contains(topicKeyword.toLowerCase()))
                    .findFirst()
                    .ifPresent(quiz -> topicQuizzes.put(t.getId(), quiz));
        }

        // 5. Classes
        ClassEntity classSectionA = classEntityRepository.save(new ClassEntity(pilotInst, subject, teacherPilot1, "Section A - Systems Programming", "PILOT1"));
        ClassEntity classSectionB = classEntityRepository.save(new ClassEntity(pilotInst, subject, teacherPilot2, "Section B - Software Architecture", "PILOT2"));
        ClassEntity classDemo = classEntityRepository.save(new ClassEntity(demoInst, subject, teacherDemo, "Demo Section - Applied Computing", "DEMO01"));
        
        ClassEntity classEmpty = new ClassEntity(pilotInst, subject, teacherPilot3, "Honors C Programming", "EMPTY1");
        classEntityRepository.save(classEmpty);

        ClassEntity classArchived = new ClassEntity(pilotInst, subject, teacherPilot1, "Section X - Fall 2025 (Legacy)", "ARCH01");
        classArchived.setStatus(ClassStatus.ARCHIVED);
        classArchived.setEnrollmentOpen(false);
        classEntityRepository.save(classArchived);

        // 6. Students
        // Section A: Showcase student, Fresh student 1, 16 regular students = 18 students
        User studentShowcase = userRepository.save(new User("Alex Rivera (Showcase)", "showcase" + DEMO_DOMAIN, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
        enrollmentRepository.save(new Enrollment(studentShowcase, classSectionA));

        User studentFresh1 = userRepository.save(new User("Jordan Lee (Fresh A)", "fresh1" + DEMO_DOMAIN, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
        enrollmentRepository.save(new Enrollment(studentFresh1, classSectionA));

        List<User> sectionAStudents = new ArrayList<>(List.of(studentShowcase, studentFresh1));
        for (int i = 1; i <= 16; i++) {
            String email = String.format("student.p%02d%s", i, DEMO_DOMAIN);
            User s = userRepository.save(new User("Pilot Student " + i, email, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
            enrollmentRepository.save(new Enrollment(s, classSectionA));
            sectionAStudents.add(s);
        }

        // Section B: Fresh student 2, 17 regular students = 18 students
        User studentFresh2 = userRepository.save(new User("Taylor Swift (Fresh B)", "fresh2" + DEMO_DOMAIN, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
        enrollmentRepository.save(new Enrollment(studentFresh2, classSectionB));

        List<User> sectionBStudents = new ArrayList<>(List.of(studentFresh2));
        for (int i = 17; i <= 33; i++) {
            String email = String.format("student.p%02d%s", i, DEMO_DOMAIN);
            User s = userRepository.save(new User("Pilot Student " + i, email, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
            enrollmentRepository.save(new Enrollment(s, classSectionB));
            sectionBStudents.add(s);
        }

        // Demo Section: 8 students
        List<User> demoSectionStudents = new ArrayList<>();
        for (int i = 1; i <= 8; i++) {
            String email = String.format("student.d%02d%s", i, DEMO_DOMAIN);
            User s = userRepository.save(new User("Demo Student " + i, email, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, demoInst));
            enrollmentRepository.save(new Enrollment(s, classDemo));
            demoSectionStudents.add(s);
        }

        // Archived class students (2 past students)
        User studentArchived1 = userRepository.save(new User("Morgan Past (Alum)", "student.arch1" + DEMO_DOMAIN, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
        User studentArchived2 = userRepository.save(new User("Casey Past (Alum)", "student.arch2" + DEMO_DOMAIN, encodedPassword, Role.STUDENT, UserStatus.ACTIVE, pilotInst));
        enrollmentRepository.save(new Enrollment(studentArchived1, classArchived));
        enrollmentRepository.save(new Enrollment(studentArchived2, classArchived));

        // 7. Student Skill Distribution
        // Assign true skill per topic for each student:
        // 25% strong (0.80 - 0.95)
        // 40% mixed (mix of 0.80+ and 0.30 - 0.50)
        // 25% weak in 1-3 topics (0.20 - 0.40)
        // 10% borderline (0.50 - 0.65)
        Map<Long, Map<Long, Double>> studentTopicSkills = new HashMap<>();

        // Showcase student skills (Loops is weak 0.33, Functions 0.45, others high)
        Map<Long, Double> showcaseSkills = new HashMap<>();
        for (int i = 0; i < topics.size(); i++) {
            Topic t = topics.get(i);
            if (i == 4) showcaseSkills.put(t.getId(), 0.33); // Loops: weak
            else if (i == 5) showcaseSkills.put(t.getId(), 0.45); // Functions: weak
            else showcaseSkills.put(t.getId(), 0.85); // Strengths
        }
        studentTopicSkills.put(studentShowcase.getId(), showcaseSkills);

        // Assign skills for all other students
        List<User> allStudents = new ArrayList<>();
        allStudents.addAll(sectionAStudents);
        allStudents.addAll(sectionBStudents);
        allStudents.addAll(demoSectionStudents);
        allStudents.add(studentArchived1);
        allStudents.add(studentArchived2);

        int studentIdx = 0;
        for (User st : allStudents) {
            if (st.getId().equals(studentShowcase.getId())) continue;
            Map<Long, Double> skills = new HashMap<>();
            int bucket = (studentIdx % 10);
            for (int tIdx = 0; tIdx < topics.size(); tIdx++) {
                Topic topic = topics.get(tIdx);
                double skill;
                if (bucket < 2) {
                    // Strong student (25%)
                    skill = 0.80 + (0.15 * rng.nextDouble());
                } else if (bucket < 6) {
                    // Mixed student (40%)
                    skill = (tIdx % 2 == 0) ? (0.80 + 0.15 * rng.nextDouble()) : (0.35 + 0.15 * rng.nextDouble());
                } else if (bucket < 9) {
                    // Weak in 1-3 topics (25%)
                    skill = (tIdx < 2) ? (0.25 + 0.15 * rng.nextDouble()) : (0.65 + 0.15 * rng.nextDouble());
                } else {
                    // Borderline (10%)
                    skill = 0.50 + (0.15 * rng.nextDouble());
                }
                skills.put(topic.getId(), Math.round(skill * 100.0) / 100.0);
            }
            studentTopicSkills.put(st.getId(), skills);
            studentIdx++;
        }

        // 8. GapValidationLabel (Ground Truth synthetic labels)
        for (User st : allStudents) {
            Map<Long, Double> skills = studentTopicSkills.get(st.getId());
            for (Topic t : topics) {
                double skill = skills.getOrDefault(t.getId(), 0.5);
                ValidationLabel label = (skill < 0.55) ? ValidationLabel.WEAK : ValidationLabel.NOT_WEAK;
                gapValidationLabelRepository.save(new GapValidationLabel(
                        st, t, label, ValidationSource.SYNTHETIC, null, now
                ));
            }
        }

        // 9. Assessment Attempts & Grading
        // Chronological timeline over 6 weeks:
        // Week 1 (T-35 days): Diagnostic assessment
        // Week 3 (T-21 days): Mid-term quizzes
        // Week 5 (T-10 days): Retake quizzes & follow-ups
        // Fresh students (fresh1, fresh2) take NO attempts.
        Set<Long> freshStudentIds = Set.of(studentFresh1.getId(), studentFresh2.getId());

        // A) Diagnostic Attempts for Section A, Section B, Demo Section
        for (User st : allStudents) {
            if (freshStudentIds.contains(st.getId())) continue;
            if (st.equals(studentShowcase) || st.equals(studentArchived1) || st.equals(studentArchived2)) continue;

            Long classId = resolveStudentClassId(st, classSectionA, classSectionB, classDemo, classArchived);
            int backdateDays = 34 + rng.nextInt(6); // 34-40 days ago
            Instant attemptTime = now.minus(Duration.ofDays(backdateDays));

            takeAssessment(st, diagnosticAssessment, classId, 1, studentTopicSkills.get(st.getId()), attemptTime, rng);
            gapAnalysisService.recalculateForStudent(st.getId());
        }

        // B) Archived students past attempts
        takeAssessment(studentArchived1, diagnosticAssessment, classArchived.getId(), 1, studentTopicSkills.get(studentArchived1.getId()), now.minus(Duration.ofDays(120)), rng);
        gapAnalysisService.recalculateForStudent(studentArchived1.getId());
        takeAssessment(studentArchived2, diagnosticAssessment, classArchived.getId(), 1, studentTopicSkills.get(studentArchived2.getId()), now.minus(Duration.ofDays(110)), rng);
        gapAnalysisService.recalculateForStudent(studentArchived2.getId());

        // C) Follow-up Topic Quizzes for ~16 students in Section A & B
        int quizCount = 0;
        for (User st : allStudents) {
            if (freshStudentIds.contains(st.getId())) continue;
            if (st.equals(studentShowcase) || st.equals(studentArchived1) || st.equals(studentArchived2)) continue;

            if (quizCount < 16) {
                Long classId = resolveStudentClassId(st, classSectionA, classSectionB, classDemo, classArchived);
                Topic targetTopic = topics.get(quizCount % topics.size());
                Assessment quiz = topicQuizzes.get(targetTopic.getId());
                if (quiz != null) {
                    Instant quizTime = now.minus(Duration.ofDays(14 + (quizCount % 7)));
                    takeAssessment(st, quiz, classId, 1, studentTopicSkills.get(st.getId()), quizTime, rng);
                    gapAnalysisService.recalculateForStudent(st.getId());
                    quizCount++;
                }
            }
        }

        // 10. Showcase Student Complete Journey
        // Diagnostic at T-35 days
        Instant showcaseDiagTime = now.minus(Duration.ofDays(35));
        Attempt showcaseDiagAttempt = takeAssessment(studentShowcase, diagnosticAssessment, classSectionA.getId(), 1, showcaseSkills, showcaseDiagTime, rng);
        gapAnalysisService.recalculateForStudent(studentShowcase.getId());

        // Teacher Grade Override for Showcase student on Diagnostic (at T-28 days)
        List<Answer> showcaseAnswers = answerRepository.findByAttempt(showcaseDiagAttempt);
        for (Answer ans : showcaseAnswers) {
            if (ans.getFinalScore() == 0.0) {
                ans.applyTeacherOverride(1.0, "Awarded partial credit for sound algorithm structure despite minor boundary condition.", teacherPilot1);
                answerRepository.save(ans);
                double total = showcaseAnswers.stream().mapToDouble(a -> a.getFinalScore() != null ? a.getFinalScore() : 0.0).sum();
                showcaseDiagAttempt.setTotalScore(total);
                attemptRepository.save(showcaseDiagAttempt);
                gapAnalysisService.recalculateForStudent(studentShowcase.getId());
                break;
            }
        }

        // At T-25 days: Teacher creates intervention on Loops with start mastery = 33.3%
        Topic loopsTopic = topics.get(4);
        Intervention showcaseIntervention = new Intervention(
                studentShowcase,
                teacherPilot1,
                classSectionA,
                loopsTopic,
                InterventionType.ONE_ON_ONE,
                "Dedicated 45-minute whiteboard session reviewing loop condition bounds and termination checks.",
                InterventionStatus.DONE,
                LocalDate.now().minusDays(18),
                33.3
        );
        showcaseIntervention.setCreatedAt(now.minus(Duration.ofDays(25)));
        showcaseIntervention.setCompletedAt(now.minus(Duration.ofDays(20)));
        showcaseIntervention.setMasteryAtCompletion(83.3);
        interventionRepository.save(showcaseIntervention);

        // Resource completed on Loops at T-22 days
        List<Resource> loopsResources = resourceRepository.findByTopic(loopsTopic);
        if (!loopsResources.isEmpty()) {
            ResourceProgress rp = new ResourceProgress(studentShowcase, loopsResources.get(0));
            rp.markCompleted();
            resourceProgressRepository.save(rp);
        }

        // T-14 days: Retake/Topic Quiz on Loops: score jumps to 83.3%
        Assessment loopsQuiz = topicQuizzes.get(loopsTopic.getId());
        if (loopsQuiz != null) {
            Map<Long, Double> improvedSkills = new HashMap<>(showcaseSkills);
            improvedSkills.put(loopsTopic.getId(), 0.85); // Improved skill
            takeAssessment(studentShowcase, loopsQuiz, classSectionA.getId(), 1, improvedSkills, now.minus(Duration.ofDays(14)), rng);
            gapAnalysisService.recalculateForStudent(studentShowcase.getId());
        }

        // 11. Teacher Grade Overrides (~12 overrides across attempts)
        int overrideCount = 0;
        List<Attempt> submittedAttempts = attemptRepository.findAll().stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED && !a.getStudent().equals(studentShowcase))
                .toList();

        String[] overrideComments = {
                "Student demonstrated correct reasoning in handwritten scratchpad.",
                "Syntax typo in format specifier excused; logical flow was correct.",
                "Partial credit granted for correct base case in function design.",
                "Awarded 0.5 points for identifying the short-circuit evaluation pitfall.",
                "Good alternative algorithmic approach; accepted by teacher review.",
                "Followed up in office hours; student clearly grasps operator precedence."
        };

        for (Attempt att : submittedAttempts) {
            if (overrideCount >= 12) break;
            List<Answer> answers = answerRepository.findByAttempt(att);
            for (Answer ans : answers) {
                if (ans.getFinalScore() == 0.0 && overrideCount < 12) {
                    User teacher = att.getClassId().equals(classSectionA.getId()) ? teacherPilot1 : teacherPilot2;
                    ans.applyTeacherOverride(1.0, overrideComments[overrideCount % overrideComments.length], teacher);
                    answerRepository.save(ans);
                    overrideCount++;
                    gapAnalysisService.recalculateForStudent(att.getStudent().getId());
                    break;
                }
            }
        }

        // 12. Pedagogical Interventions (~15 interventions across all statuses)
        // A) 5 DONE with IMPROVED outcome
        // B) 3 DONE with SAME outcome
        // C) 2 DONE with DECLINED outcome
        // D) 3 PLANNED recent interventions (outcome NO_NEW_DATA)
        // E) 2 CANCELLED interventions
        createInterventionBatch(sectionAStudents, sectionBStudents, demoSectionStudents, topics,
                classSectionA, classSectionB, classDemo, teacherPilot1, teacherPilot2, teacherDemo, now, rng);

        log.info("DemoDataPopulator: Populated 2 institutions, 7 accounts, 5 classes, 46 students, realistic journeys, and validation labels.");
    }

    private Long resolveStudentClassId(User st, ClassEntity secA, ClassEntity secB, ClassEntity secDemo, ClassEntity secArch) {
        if (enrollmentRepository.existsByStudentAndClassEntity(st, secA)) return secA.getId();
        if (enrollmentRepository.existsByStudentAndClassEntity(st, secB)) return secB.getId();
        if (enrollmentRepository.existsByStudentAndClassEntity(st, secDemo)) return secDemo.getId();
        return secArch.getId();
    }

    private Attempt takeAssessment(
            User student,
            Assessment assessment,
            Long classId,
            int attemptNumber,
            Map<Long, Double> skills,
            Instant submittedAt,
            Random rng) {
        Attempt attempt = new Attempt(student, assessment, attemptNumber, classId);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        attempt.setStartedAt(submittedAt.minus(Duration.ofMinutes(25)));
        attempt = attemptRepository.save(attempt);

        List<AssessmentQuestion> aqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(assessment);
        List<AnswerSubmissionDto> submissions = new ArrayList<>();

        for (AssessmentQuestion aq : aqs) {
            Question q = aq.getQuestion();
            Topic t = q.getTopic();
            double skill = (skills != null && t != null) ? skills.getOrDefault(t.getId(), 0.5) : 0.5;

            // Adjust probability based on question difficulty
            double prob = skill;
            if (q.getDifficulty() == DifficultyLevel.HARD) prob = skill * 0.85;
            else if (q.getDifficulty() == DifficultyLevel.EASY) prob = Math.min(1.0, skill * 1.15);

            List<Choice> choices = choiceRepository.findByQuestion(q);
            Choice correctChoice = choices.stream().filter(Choice::isCorrect).findFirst().orElse(null);
            List<Choice> wrongChoices = choices.stream().filter(c -> !c.isCorrect()).toList();

            Long selectedChoiceId = null;
            if (rng.nextDouble() < prob && correctChoice != null) {
                selectedChoiceId = correctChoice.getId();
            } else if (!wrongChoices.isEmpty()) {
                selectedChoiceId = wrongChoices.get(rng.nextInt(wrongChoices.size())).getId();
            }

            submissions.add(new AnswerSubmissionDto(q.getId(), selectedChoiceId));
        }

        // Grade through real production grading pipeline
        attempt = gradingService.gradeAndSubmit(attempt, submissions);

        // Backdate timestamps
        attempt.setStartedAt(submittedAt.minus(Duration.ofMinutes(25)));
        attempt.setSubmittedAt(submittedAt);
        return attemptRepository.save(attempt);
    }

    private void createInterventionBatch(
            List<User> secAStudents,
            List<User> secBStudents,
            List<User> demoStudents,
            List<Topic> topics,
            ClassEntity secA,
            ClassEntity secB,
            ClassEntity secDemo,
            User teacherA,
            User teacherB,
            User teacherDemo,
            Instant now,
            Random rng) {

        // 1. PLANNED recent interventions (3 total) - created 2 days ago, NO subsequent quiz -> outcome NO_NEW_DATA
        if (secAStudents.size() > 3) {
            User s = secAStudents.get(2);
            Intervention itv = new Intervention(s, teacherA, secA, topics.get(0), InterventionType.EXTRA_PRACTICE,
                    "Assigned supplementary code tracing worksheet on integer division truncation.",
                    InterventionStatus.PLANNED, LocalDate.now().plusDays(5), 45.0);
            itv.setCreatedAt(now.minus(Duration.ofDays(2)));
            interventionRepository.save(itv);
        }

        if (secBStudents.size() > 2) {
            User s = secBStudents.get(1);
            Intervention itv = new Intervention(s, teacherB, secB, topics.get(3), InterventionType.ONE_ON_ONE,
                    "Schedule short 15-minute diagnostic conference on switch-case fall-through semantics.",
                    InterventionStatus.PLANNED, LocalDate.now().plusDays(4), 50.0);
            itv.setCreatedAt(now.minus(Duration.ofDays(1)));
            interventionRepository.save(itv);
        }

        if (demoStudents.size() > 1) {
            User s = demoStudents.get(0);
            Intervention itv = new Intervention(s, teacherDemo, secDemo, topics.get(1), InterventionType.GROUP_SESSION,
                    "Reviewing operator precedence order and parenthesis rules before upcoming midterm exam.",
                    InterventionStatus.PLANNED, LocalDate.now().plusDays(6), 40.0);
            itv.setCreatedAt(now.minus(Duration.ofDays(3)));
            interventionRepository.save(itv);
        }

        // 2. CANCELLED interventions (2 total)
        if (secAStudents.size() > 4) {
            User s = secAStudents.get(3);
            Intervention itv = new Intervention(s, teacherA, secA, topics.get(2), InterventionType.ONE_ON_ONE,
                    "Student solved question during recitation; separate session not required.",
                    InterventionStatus.CANCELLED, LocalDate.now().minusDays(10), 60.0);
            itv.setCreatedAt(now.minus(Duration.ofDays(20)));
            itv.setCompletedAt(now.minus(Duration.ofDays(12)));
            interventionRepository.save(itv);
        }

        if (secBStudents.size() > 3) {
            User s = secBStudents.get(2);
            Intervention itv = new Intervention(s, teacherB, secB, topics.get(5), InterventionType.EXTRA_PRACTICE,
                    "Student submitted self-directed correction sheet ahead of meeting.",
                    InterventionStatus.CANCELLED, LocalDate.now().minusDays(8), 55.0);
            itv.setCreatedAt(now.minus(Duration.ofDays(18)));
            itv.setCompletedAt(now.minus(Duration.ofDays(10)));
            interventionRepository.save(itv);
        }

        // 3. DONE interventions (10 total across IMPROVED, SAME, DECLINED)
        // To ensure outcome evaluates accurately:
        // createdAt is set to T-28 days, completedAt to T-21 days.
        // For students who took a quiz around T-14 days:
        // currentMastery is compared with masteryAtStart!
        int doneCount = 0;
        List<User> eligibleStudents = new ArrayList<>(secAStudents);
        eligibleStudents.addAll(secBStudents);

        for (User s : eligibleStudents) {
            if (doneCount >= 10) break;
            List<Attempt> studentAttempts = attemptRepository.findByStudentIdAndStatusOrderBySubmittedAtAsc(s.getId(), AttemptStatus.SUBMITTED);
            if (studentAttempts.size() >= 2) {
                // Has diagnostic (T-35) and subsequent quiz (T-14)
                Topic targetTopic = topics.get(doneCount % topics.size());
                Optional<StudentTopicMastery> stmOpt = studentTopicMasteryRepository.findByStudentAndTopic(s, targetTopic);
                if (stmOpt.isPresent()) {
                    double currentMastery = stmOpt.get().getMasteryPercent();
                    double startMastery;
                    if (doneCount < 5) {
                        // IMPROVED outcome (current - start >= +10)
                        startMastery = Math.max(0.0, currentMastery - 20.0);
                    } else if (doneCount < 8) {
                        // SAME outcome (within +/- 10)
                        startMastery = Math.max(0.0, currentMastery - 2.0);
                    } else {
                        // DECLINED outcome (current - start <= -10)
                        startMastery = Math.min(100.0, currentMastery + 18.0);
                    }

                    ClassEntity cls = enrollmentRepository.findByStudentOrderByEnrolledAtDesc(s).get(0).getClassEntity();
                    User teacher = cls.getTeacher();

                    Intervention itv = new Intervention(s, teacher, cls, targetTopic,
                            (doneCount % 2 == 0) ? InterventionType.ONE_ON_ONE : InterventionType.EXTRA_PRACTICE,
                            "Reviewed core concepts and diagnostic mistakes for " + targetTopic.getName() + ".",
                            InterventionStatus.DONE, LocalDate.now().minusDays(15), startMastery);

                    itv.setCreatedAt(now.minus(Duration.ofDays(28)));
                    itv.setCompletedAt(now.minus(Duration.ofDays(21)));
                    itv.setMasteryAtCompletion(currentMastery);
                    interventionRepository.save(itv);
                    doneCount++;
                }
            }
        }
    }
}

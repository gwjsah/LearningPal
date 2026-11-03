package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Teacher Class View: Roster & Overview Integration Tests")
public class TeacherClassViewTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    private Institution inst;

    private User teacherA;
    private User teacherB;
    private User student1;
    private User student2;
    private User student3;
    private User admin;
    private User superAdmin;

    private Subject subject;
    private Topic topic1;
    private Topic topic2;
    private Topic topic3;
    private Assessment diagnosticAssessment;
    private Assessment topicQuiz;

    private ClassEntity classA;
    private ClassEntity classB;
    private ClassEntity archivedClassOld;

    private String teacherAToken;
    private String teacherBToken;
    private String student1Token;
    private String adminToken;
    private String superAdminToken;

    @BeforeEach
    void setUp() {
        attemptRepository.deleteAll();
        studentTopicMasteryRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classEntityRepository.deleteAll();

        // 1. Institution
        inst = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Pilot Academy", "PILOT-2026", InstitutionStatus.ACTIVE)));

        // 2. Users
        teacherA = getOrCreateUser("tview.teacher_a@pilot.edu", Role.TEACHER, UserStatus.ACTIVE, inst);
        teacherB = getOrCreateUser("tview.teacher_b@pilot.edu", Role.TEACHER, UserStatus.ACTIVE, inst);
        student1 = getOrCreateUser("tview.student1@pilot.edu", Role.STUDENT, UserStatus.ACTIVE, inst);
        student2 = getOrCreateUser("tview.student2@pilot.edu", Role.STUDENT, UserStatus.ACTIVE, inst);
        student3 = getOrCreateUser("tview.student3@pilot.edu", Role.STUDENT, UserStatus.ACTIVE, inst);
        admin = getOrCreateUser("tview.admin@pilot.edu", Role.ADMIN, UserStatus.ACTIVE, inst);
        superAdmin = getOrCreateUser("tview.superadmin@platform.edu", Role.SUPER_ADMIN, UserStatus.ACTIVE, null);

        // 3. Subject and 3 Topics (fetch seeded or create)
        subject = subjectRepository.findByCode("C_PROG_INTRO").orElseGet(() ->
                subjectRepository.save(new Subject("Intro to C Programming", "C_PROG_INTRO", "C Language Basics")));

        List<Topic> existingTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        if (existingTopics.size() >= 3) {
            topic1 = existingTopics.get(0);
            topic2 = existingTopics.get(1);
            topic3 = existingTopics.get(2);
        } else {
            topic1 = topicRepository.save(new Topic(subject, "Variables", "Data types and variables", 1));
            topic2 = topicRepository.save(new Topic(subject, "Loops", "For and while loops", 2));
            topic3 = topicRepository.save(new Topic(subject, "Functions", "Functions and parameters", 3));
        }

        // 4. Assessments
        diagnosticAssessment = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED).stream()
                .filter(a -> a.getTitle().toLowerCase().contains("diagnostic"))
                .findFirst()
                .orElseGet(() -> assessmentRepository.save(new Assessment(
                        subject,
                        "Comprehensive Diagnostic Assessment",
                        "Holistic diagnostic",
                        AssessmentStatus.PUBLISHED,
                        admin
                )));

        topicQuiz = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED).stream()
                .filter(a -> !a.getTitle().toLowerCase().contains("diagnostic"))
                .findFirst()
                .orElseGet(() -> assessmentRepository.save(new Assessment(
                        subject,
                        "Variables Quiz",
                        "Topic 1 quiz",
                        AssessmentStatus.PUBLISHED,
                        admin
                )));

        // 5. Classes
        classA = classEntityRepository.save(new ClassEntity(inst, subject, teacherA, "Section Alpha", "SEC001"));
        classB = classEntityRepository.save(new ClassEntity(inst, subject, teacherB, "Section Beta", "SEC002"));
        archivedClassOld = classEntityRepository.save(new ClassEntity(inst, subject, teacherA, "Old Archived Cohort", "OLD001"));
        archivedClassOld.setStatus(ClassStatus.ARCHIVED);
        archivedClassOld.setEnrollmentOpen(false);
        classEntityRepository.save(archivedClassOld);

        // 6. Enrollments in Class A
        enrollmentRepository.save(new Enrollment(student1, classA));
        enrollmentRepository.save(new Enrollment(student2, classA));
        enrollmentRepository.save(new Enrollment(student3, classA));

        // Student 3 was also enrolled in the old archived class
        enrollmentRepository.save(new Enrollment(student3, archivedClassOld));

        // 7. Student Mastery Setup (Hand-Calculated Fixture):
        // Student 1:
        // - Topic 1: STRENGTH (90.0%)
        // - Topic 2: GAP (40.0%)
        // - Topic 3: GAP (50.0%)
        // => Gaps = 2, Developing = 0, Strength = 1 => needsAttention = true (>= 2)
        saveMastery(student1, topic1, 90.0, MasteryStatus.STRENGTH);
        saveMastery(student1, topic2, 40.0, MasteryStatus.GAP);
        saveMastery(student1, topic3, 50.0, MasteryStatus.GAP);

        // Student 2:
        // - Topic 1: DEVELOPING (70.0%)
        // - Topic 2: STRENGTH (85.0%)
        // - Topic 3: GAP (55.0%)
        // => Gaps = 1, Developing = 1, Strength = 1 => needsAttention = false (< 2)
        saveMastery(student2, topic1, 70.0, MasteryStatus.DEVELOPING);
        saveMastery(student2, topic2, 85.0, MasteryStatus.STRENGTH);
        saveMastery(student2, topic3, 55.0, MasteryStatus.GAP);

        // Student 3:
        // No mastery records in subject => status NO_DATA, masteryPercent = null/0.0
        // => Gaps = 0, Developing = 0, Strength = 0 => needsAttention = false

        // 8. Attempts in Class A:
        // Student 1: Diagnostic Attempt (Score: 15 / 20 = 75.0%)
        Attempt att1 = new Attempt(student1, diagnosticAssessment, 1);
        att1.setClassId(classA.getId());
        att1.setStatus(AttemptStatus.SUBMITTED);
        att1.setTotalScore(15.0);
        att1.setMaxScore(20.0);
        att1.setSubmittedAt(Instant.now().minusSeconds(3600));
        attemptRepository.save(att1);

        // Student 2: Diagnostic Attempt (Score: 18 / 20 = 90.0%) + Topic Quiz Attempt (Score: 5 / 5)
        Attempt att2Diag = new Attempt(student2, diagnosticAssessment, 1);
        att2Diag.setClassId(classA.getId());
        att2Diag.setStatus(AttemptStatus.SUBMITTED);
        att2Diag.setTotalScore(18.0);
        att2Diag.setMaxScore(20.0);
        att2Diag.setSubmittedAt(Instant.now().minusSeconds(1800));
        attemptRepository.save(att2Diag);

        Attempt att2Quiz = new Attempt(student2, topicQuiz, 1);
        att2Quiz.setClassId(classA.getId());
        att2Quiz.setStatus(AttemptStatus.SUBMITTED);
        att2Quiz.setTotalScore(5.0);
        att2Quiz.setMaxScore(5.0);
        att2Quiz.setSubmittedAt(Instant.now().minusSeconds(900));
        attemptRepository.save(att2Quiz);

        // Student 3: Has an attempt in archivedClassOld (Score: 10 / 20 = 50.0%), but NONE in classA!
        Attempt att3Old = new Attempt(student3, diagnosticAssessment, 1);
        att3Old.setClassId(archivedClassOld.getId());
        att3Old.setStatus(AttemptStatus.SUBMITTED);
        att3Old.setTotalScore(10.0);
        att3Old.setMaxScore(20.0);
        att3Old.setSubmittedAt(Instant.now().minusSeconds(86400));
        attemptRepository.save(att3Old);

        // Tokens
        teacherAToken = jwtService.generateToken(teacherA);
        teacherBToken = jwtService.generateToken(teacherB);
        student1Token = jwtService.generateToken(student1);
        adminToken = jwtService.generateToken(admin);
        superAdminToken = jwtService.generateToken(superAdmin);
    }

    private User getOrCreateUser(String email, Role role, UserStatus status, Institution inst) {
        User u = userRepository.findByEmail(email).orElseGet(() ->
                new User(email.split("@")[0], email, passwordEncoder.encode("password123"), role, status, inst)
        );
        u.setInstitution(inst);
        u.setStatus(status);
        u.setRole(role);
        return userRepository.save(u);
    }

    private void saveMastery(User student, Topic topic, Double percent, MasteryStatus status) {
        StudentTopicMastery m = new StudentTopicMastery(student, topic, percent, status);
        studentTopicMasteryRepository.save(m);
    }

    // =========================================================================
    // Part 2 & Part 3: Class Roster Verification
    // =========================================================================

    @Test
    @DisplayName("GET /api/teacher/classes/{id}/roster returns exact student mastery, attempts, needsAttention flag, and cross-class isolation")
    void testGetClassRosterExactNumbers() throws Exception {
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/roster")
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))

                // Student 1 verification
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].attemptsCount").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].latestDiagnostic.score").value(hasItem(15.0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].latestDiagnostic.maxScore").value(hasItem(20.0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].latestDiagnostic.percent").value(hasItem(75.0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].gapCount").value(hasItem(2)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].developingCount").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].strengthCount").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student1@pilot.edu')].needsAttention").value(hasItem(true)))

                // Student 2 verification
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].attemptsCount").value(hasItem(2)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].latestDiagnostic.score").value(hasItem(18.0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].latestDiagnostic.percent").value(hasItem(90.0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].gapCount").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].developingCount").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].strengthCount").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student2@pilot.edu')].needsAttention").value(hasItem(false)))

                // Student 3 verification: attempts in Old Archived Class DO NOT leak into classA
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].attemptsCount").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].latestDiagnostic").value(hasItem(nullValue())))
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].gapCount").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].needsAttention").value(hasItem(false)))
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].topics[0].status").value(hasItem("NO_DATA")))
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].topics[1].status").value(hasItem("NO_DATA")))
                .andExpect(jsonPath("$[?(@.email == 'tview.student3@pilot.edu')].topics[2].status").value(hasItem("NO_DATA")));
    }

    // =========================================================================
    // Part 2 & Part 3: Class Overview Verification
    // =========================================================================

    @Test
    @DisplayName("GET /api/teacher/classes/{id}/overview returns exact aggregate totals and topic rank breakdown")
    void testGetClassOverviewExactNumbers() throws Exception {
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/overview")
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classId", is(classA.getId().intValue())))
                .andExpect(jsonPath("$.className", is("Section Alpha")))

                // Class totals verification
                .andExpect(jsonPath("$.totals.enrolledStudents", is(3)))
                .andExpect(jsonPath("$.totals.studentsWithAttempts", is(2)))
                .andExpect(jsonPath("$.totals.studentsNeedingAttention", is(1)))
                .andExpect(jsonPath("$.totals.averageDiagnosticPercent", is(82.5)))

                // Topic ranks verification:
                // Rank 1: Topic 3 -> gapCount = 2, avg = 52.5%
                .andExpect(jsonPath("$.topics[0].topicName", is(topic3.getName())))
                .andExpect(jsonPath("$.topics[0].gapCount", is(2)))
                .andExpect(jsonPath("$.topics[0].strengthCount", is(0)))
                .andExpect(jsonPath("$.topics[0].noDataCount", is(1)))
                .andExpect(jsonPath("$.topics[0].averageMasteryPercent", is(52.5)))
                .andExpect(jsonPath("$.topics[0].rank", is(1)))

                // Rank 2: Topic 2 -> gapCount = 1, avg = 62.5%
                .andExpect(jsonPath("$.topics[1].topicName", is(topic2.getName())))
                .andExpect(jsonPath("$.topics[1].gapCount", is(1)))
                .andExpect(jsonPath("$.topics[1].strengthCount", is(1)))
                .andExpect(jsonPath("$.topics[1].noDataCount", is(1)))
                .andExpect(jsonPath("$.topics[1].averageMasteryPercent", is(62.5)))
                .andExpect(jsonPath("$.topics[1].rank", is(2)))

                // Rank 3: Topic 1 -> gapCount = 0, avg = 80.0%
                .andExpect(jsonPath("$.topics[2].topicName", is(topic1.getName())))
                .andExpect(jsonPath("$.topics[2].gapCount", is(0)))
                .andExpect(jsonPath("$.topics[2].developingCount", is(1)))
                .andExpect(jsonPath("$.topics[2].strengthCount", is(1)))
                .andExpect(jsonPath("$.topics[2].noDataCount", is(1)))
                .andExpect(jsonPath("$.topics[2].averageMasteryPercent", is(80.0)))
                .andExpect(jsonPath("$.topics[2].rank", is(3)));
    }

    // =========================================================================
    // Part 2 & Part 3: Scope & Role Rejection Tests
    // =========================================================================

    @Test
    @DisplayName("Teacher B cannot read Teacher A's roster or overview (404 Not Found)")
    void testTeacherBCannotReadTeacherAClassData() throws Exception {
        // Teacher B calling Teacher A's roster -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/roster")
                        .header("Authorization", "Bearer " + teacherBToken))
                .andExpect(status().isNotFound());

        // Teacher B calling Teacher A's overview -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/overview")
                        .header("Authorization", "Bearer " + teacherBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Non-teacher tokens (Student, Admin, Super Admin) are refused on teacher roster & overview endpoints (403 Forbidden)")
    void testNonTeacherTokensRefusedOnRosterAndOverview() throws Exception {
        // Student token -> 403
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/roster")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/overview")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        // Admin token -> 403
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/roster")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // Super Admin token -> 403
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/roster")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/overview")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isForbidden());
    }
}

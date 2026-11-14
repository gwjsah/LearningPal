package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.UnlockStudentAssessmentRequest;
import com.learningpal.dto.UpdateClassAssessmentSettingRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Part 4: Class-Scoped Assessment Access Integration Tests")
public class ClassAssessmentAccessTests {

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
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ClassAssessmentSettingRepository classAssessmentSettingRepository;

    @Autowired
    private AssessmentAccessRepository assessmentAccessRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    private Institution instA;
    private Institution instB;

    private User teacherA;
    private User teacherB;
    private User student1;
    private User student2;

    private Subject subject;
    private Assessment assessment;

    private ClassEntity classA;
    private ClassEntity classB;

    private String teacherAToken;
    private String teacherBToken;
    private String student1Token;
    private String student2Token;

    @BeforeEach
    void setUp() {
        attemptRepository.deleteAll();
        assessmentAccessRepository.deleteAll();
        classAssessmentSettingRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classEntityRepository.deleteAll();

        instA = institutionRepository.findByCode("TEST_INST_ACCESS_A")
                .orElseGet(() -> institutionRepository.save(new Institution("Access Inst A", "TEST_INST_ACCESS_A", InstitutionStatus.ACTIVE)));
        instB = institutionRepository.findByCode("TEST_INST_ACCESS_B")
                .orElseGet(() -> institutionRepository.save(new Institution("Access Inst B", "TEST_INST_ACCESS_B", InstitutionStatus.ACTIVE)));

        teacherA = getOrCreateUser("teach.a@access.edu", "Teacher A", Role.TEACHER, instA);
        teacherB = getOrCreateUser("teach.b@access.edu", "Teacher B", Role.TEACHER, instA);
        student1 = getOrCreateUser("stud.1@access.edu", "Student One", Role.STUDENT, instA);
        student2 = getOrCreateUser("stud.2@access.edu", "Student Two", Role.STUDENT, instA);

        teacherAToken = jwtService.generateToken(teacherA);
        teacherBToken = jwtService.generateToken(teacherB);
        student1Token = jwtService.generateToken(student1);
        student2Token = jwtService.generateToken(student2);

        subject = subjectRepository.findByCode("C_PROG_INTRO")
                .orElseThrow(() -> new IllegalStateException("C_PROG_INTRO seeded subject missing"));

        List<Assessment> published = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED);
        if (published.isEmpty()) {
            throw new IllegalStateException("Seeded published assessments missing");
        }
        assessment = published.get(0);

        classA = new ClassEntity(instA, subject, teacherA, "Class Alpha", "ACC001");
        classA = classEntityRepository.save(classA);

        classB = new ClassEntity(instA, subject, teacherB, "Class Beta", "ACC002");
        classB = classEntityRepository.save(classB);

        // Student 1 in Class A
        enrollmentRepository.save(new Enrollment(student1, classA));
        // Student 2 in Class B
        enrollmentRepository.save(new Enrollment(student2, classB));
    }

    private User getOrCreateUser(String email, String fullName, Role role, Institution inst) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User(fullName, email, passwordEncoder.encode("Password123!"), role, UserStatus.ACTIVE, inst);
            return userRepository.save(u);
        });
    }

    @Test
    @DisplayName("Teacher lists assessments for owned class and gets default settings")
    void testTeacherListsAssessmentsWithDefaults() throws Exception {
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/assessments")
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].assessmentId", is(assessment.getId().intValue())))
                .andExpect(jsonPath("$[0].hasCustomSetting", is(false)))
                .andExpect(jsonPath("$[0].allowRetakes", is(true)))
                .andExpect(jsonPath("$[0].status", is("PUBLISHED")))
                .andExpect(jsonPath("$[0].totalQuestions", is(6)))
                .andExpect(jsonPath("$[0].attemptCount", is(0)));
    }

    @Test
    @DisplayName("Teacher configures class-scoped schedule and retake lock, verified in listing")
    void testTeacherUpdatesClassAssessmentSetting() throws Exception {
        Instant now = Instant.now();
        Instant availableFrom = now.minus(1, ChronoUnit.HOURS);
        Instant availableUntil = now.plus(2, ChronoUnit.HOURS);

        UpdateClassAssessmentSettingRequest request = new UpdateClassAssessmentSettingRequest(
                availableFrom,
                availableUntil,
                false
        );

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assessmentId", is(assessment.getId().intValue())))
                .andExpect(jsonPath("$.hasCustomSetting", is(true)))
                .andExpect(jsonPath("$.allowRetakes", is(false)))
                .andExpect(jsonPath("$.availableFrom", notNullValue()))
                .andExpect(jsonPath("$.availableUntil", notNullValue()))
                .andExpect(jsonPath("$.status", is("PUBLISHED")))
                .andExpect(jsonPath("$.totalQuestions", is(6)));

        // Verification via GET
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/assessments")
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].hasCustomSetting", is(true)))
                .andExpect(jsonPath("$[0].allowRetakes", is(false)))
                .andExpect(jsonPath("$[0].status", is("PUBLISHED")))
                .andExpect(jsonPath("$[0].totalQuestions", is(6)));

        // Future window resolves to SCHEDULED
        UpdateClassAssessmentSettingRequest futureRequest = new UpdateClassAssessmentSettingRequest(
                now.plus(1, ChronoUnit.HOURS),
                now.plus(3, ChronoUnit.HOURS),
                false
        );
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(futureRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SCHEDULED")));

        // Past window resolves to CLOSED
        UpdateClassAssessmentSettingRequest pastRequest = new UpdateClassAssessmentSettingRequest(
                now.minus(3, ChronoUnit.HOURS),
                now.minus(1, ChronoUnit.HOURS),
                false
        );
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pastRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CLOSED")));
    }

    @Test
    @DisplayName("Teacher B cannot modify or read Teacher A's class assessment settings (404)")
    void testTeacherBIsolationOnClassAssessments() throws Exception {
        UpdateClassAssessmentSettingRequest request = new UpdateClassAssessmentSettingRequest(null, null, false);

        // Teacher B cannot update Teacher A's class
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

        // Teacher B cannot read Teacher A's assessments endpoint
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/assessments")
                        .header("Authorization", "Bearer " + teacherBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Student is governed by their active class: Class A retake lock does not affect Class B student")
    void testStudentGovernedByActiveClassSettings() throws Exception {
        // Lock retakes in Class A
        UpdateClassAssessmentSettingRequest lockRetakes = new UpdateClassAssessmentSettingRequest(null, null, false);
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockRetakes)))
                .andExpect(status().isOk());

        // Simulate Student 1 submitted an attempt in Class A
        Attempt att1 = new Attempt(student1, assessment, 1);
        att1.setClassId(classA.getId());
        att1.setStatus(AttemptStatus.SUBMITTED);
        attemptRepository.save(att1);

        // Simulate Student 2 submitted an attempt in Class B
        Attempt att2 = new Attempt(student2, assessment, 1);
        att2.setClassId(classB.getId());
        att2.setStatus(AttemptStatus.SUBMITTED);
        attemptRepository.save(att2);

        // Student 1 in Class A sees RETAKE_LOCKED
        mockMvc.perform(get("/api/student/subjects/" + subject.getId() + "/assessments")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accessStatus", is("RETAKE_LOCKED")))
                .andExpect(jsonPath("$[0].canStart", is(false)))
                .andExpect(jsonPath("$[0].lockReason", notNullValue()));

        // Student 1 attempt to start retake is refused with 400
        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Retakes are locked")));

        // Student 2 in Class B is unaffected (OPEN, canStart = true)
        mockMvc.perform(get("/api/student/subjects/" + subject.getId() + "/assessments")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accessStatus", is("OPEN")))
                .andExpect(jsonPath("$[0].canStart", is(true)));

        // Student 2 can start retake
        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attemptNumber", is(2)));
    }

    @Test
    @DisplayName("Assessment availability window: not open yet and closed deadlines refuse attempts with 400")
    void testAssessmentAvailabilityWindowEnforcement() throws Exception {
        Instant now = Instant.now();

        // 1. Test NOT_OPEN_YET (future start)
        UpdateClassAssessmentSettingRequest futureSetting = new UpdateClassAssessmentSettingRequest(
                now.plus(1, ChronoUnit.DAYS),
                now.plus(2, ChronoUnit.DAYS),
                true
        );
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(futureSetting)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/student/subjects/" + subject.getId() + "/assessments")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accessStatus", is("NOT_OPEN_YET")))
                .andExpect(jsonPath("$[0].canStart", is(false)));

        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not open yet")));

        // 2. Test CLOSED (past deadline)
        UpdateClassAssessmentSettingRequest expiredSetting = new UpdateClassAssessmentSettingRequest(
                now.minus(2, ChronoUnit.DAYS),
                now.minus(1, ChronoUnit.DAYS),
                true
        );
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expiredSetting)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/student/subjects/" + subject.getId() + "/assessments")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accessStatus", is("CLOSED")))
                .andExpect(jsonPath("$[0].canStart", is(false)));

        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("closed by your teacher")));
    }

    @Test
    @DisplayName("Teacher unlocks student retake: student can take attempt and token is consumed")
    void testTeacherUnlockStudentRetakeFlow() throws Exception {
        // Class A retakes locked
        UpdateClassAssessmentSettingRequest lockRetakes = new UpdateClassAssessmentSettingRequest(null, null, false);
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockRetakes)))
                .andExpect(status().isOk());

        // Student 1 submitted attempt 1
        Attempt att1 = new Attempt(student1, assessment, 1);
        att1.setClassId(classA.getId());
        att1.setStatus(AttemptStatus.SUBMITTED);
        attemptRepository.save(att1);

        // Verification: student cannot retake
        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest());

        // Teacher A unlocks Student 1
        UnlockStudentAssessmentRequest unlockReq = new UnlockStudentAssessmentRequest(
                student1.getId(),
                "Approved makeup attempt",
                Instant.now().plus(1, ChronoUnit.DAYS)
        );
        mockMvc.perform(post("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId() + "/unlock-student")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unlockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("reopened")));

        // Student 1 now sees status OPEN
        mockMvc.perform(get("/api/student/subjects/" + subject.getId() + "/assessments")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].canStart", is(true)));

        // Student 1 successfully starts attempt 2
        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attemptNumber", is(2)));
    }

    @Test
    @DisplayName("Teacher cannot unlock retake for student not enrolled in class (404)")
    void testTeacherCannotUnlockUnenrolledStudent() throws Exception {
        // Student 2 is enrolled in Class B, not Class A
        UnlockStudentAssessmentRequest unlockReq = new UnlockStudentAssessmentRequest(
                student2.getId(),
                "Invalid unlock attempt",
                null
        );

        mockMvc.perform(post("/api/teacher/classes/" + classA.getId() + "/assessments/" + assessment.getId() + "/unlock-student")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unlockReq)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Archived class refuses new attempts with 400")
    void testArchivedClassRefusesNewAttempts() throws Exception {
        classA.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(classA);

        mockMvc.perform(post("/api/student/assessments/" + assessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("archived")));
    }
}

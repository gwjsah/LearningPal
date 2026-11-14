package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.CreateClassRequest;
import com.learningpal.dto.JoinClassRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.ClassJoinRateLimiter;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ClassroomLoopTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private ClassJoinRateLimiter rateLimiter;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Institution instA;
    private Institution instB;

    private User teacherA1;
    private String teacherA1Token;

    private User teacherA2;
    private String teacherA2Token;

    private User teacherB;
    private String teacherBToken;

    private User studentA;
    private String studentAToken;

    private User studentB;
    private String studentBToken;

    private User adminA;
    private String adminAToken;

    private User pendingTeacher;
    private String pendingTeacherToken;

    private Subject pilotSubject;
    private Assessment pilotAssessment;

    @BeforeEach
    void setUp() {
        instA = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));

        instB = institutionRepository.findByCode("METRO-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Metro State University", "METRO-2026", InstitutionStatus.ACTIVE)));

        teacherA1 = userRepository.findByEmail("loop.teacher.a1@learningpal.edu").orElseGet(() -> {
            User u = new User("Loop Teacher A1", "loop.teacher.a1@learningpal.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE);
            u.setInstitution(instA);
            return userRepository.save(u);
        });
        teacherA1.setInstitution(instA);
        teacherA1 = userRepository.save(teacherA1);
        teacherA1Token = jwtService.generateToken(teacherA1);

        teacherA2 = userRepository.findByEmail("loop.teacher.a2@learningpal.edu").orElseGet(() -> {
            User u = new User("Loop Teacher A2", "loop.teacher.a2@learningpal.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE);
            u.setInstitution(instA);
            return userRepository.save(u);
        });
        teacherA2.setInstitution(instA);
        teacherA2 = userRepository.save(teacherA2);
        teacherA2Token = jwtService.generateToken(teacherA2);

        teacherB = userRepository.findByEmail("loop.teacher.b@metro.edu").orElseGet(() -> {
            User u = new User("Loop Teacher B", "loop.teacher.b@metro.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE);
            u.setInstitution(instB);
            return userRepository.save(u);
        });
        teacherB.setInstitution(instB);
        teacherB = userRepository.save(teacherB);
        teacherBToken = jwtService.generateToken(teacherB);

        studentA = userRepository.findByEmail("loop.student.a@learningpal.edu").orElseGet(() -> {
            User u = new User("Loop Student A", "loop.student.a@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(instA);
            return userRepository.save(u);
        });
        studentA.setInstitution(instA);
        studentA = userRepository.save(studentA);
        studentAToken = jwtService.generateToken(studentA);

        studentB = userRepository.findByEmail("loop.student.b@metro.edu").orElseGet(() -> {
            User u = new User("Loop Student B", "loop.student.b@metro.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(instB);
            return userRepository.save(u);
        });
        studentB.setInstitution(instB);
        studentB = userRepository.save(studentB);
        studentBToken = jwtService.generateToken(studentB);

        adminA = userRepository.findByEmail("loop.admin.a@learningpal.edu").orElseGet(() -> {
            User u = new User("Loop Admin A", "loop.admin.a@learningpal.edu", passwordEncoder.encode("Password123!"), Role.ADMIN, UserStatus.ACTIVE);
            u.setInstitution(instA);
            return userRepository.save(u);
        });
        adminAToken = jwtService.generateToken(adminA);

        pendingTeacher = userRepository.findByEmail("loop.pending.teacher@learningpal.edu").orElseGet(() -> {
            User u = new User("Pending Teacher", "loop.pending.teacher@learningpal.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.PENDING);
            u.setInstitution(instA);
            return userRepository.save(u);
        });
        pendingTeacherToken = jwtService.generateToken(pendingTeacher);

        pilotSubject = subjectRepository.findByCode("C_PROG_INTRO").orElseThrow();

        pilotAssessment = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().contains("Variables"))
                .findFirst()
                .orElseThrow();

        // Reset rate limiters
        rateLimiter.resetForUser(studentA.getId());
        rateLimiter.resetForUser(studentB.getId());

        // Clear enrollments for these test students
        enrollmentRepository.findByStudentId(studentA.getId()).forEach(enrollmentRepository::delete);
        enrollmentRepository.findByStudentId(studentB.getId()).forEach(enrollmentRepository::delete);
    }

    // =========================================================================
    // 1. Teacher Class Creation & Security Tests
    // =========================================================================

    @Test
    @DisplayName("Active teacher can create a class with valid 6-char join code")
    void testTeacherCreatesClassSuccessfully() throws Exception {
        CreateClassRequest req = new CreateClassRequest(pilotSubject.getId(), "Morning Section 101");

        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Morning Section 101")))
                .andExpect(jsonPath("$.subject.code", is("C_PROG_INTRO")))
                .andExpect(jsonPath("$.joinCode", matchesPattern("^[2-9A-HJ-NP-Z]{6}$")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.enrollmentOpen", is(true)))
                .andExpect(jsonPath("$.studentCount", is(0)));
    }

    @Test
    @DisplayName("Teacher class creation validation: blank name, name > 60 chars, invalid subject, duplicate name")
    void testTeacherCreateClassValidation() throws Exception {
        // Blank name
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateClassRequest(pilotSubject.getId(), "   "))))
                .andExpect(status().isBadRequest());

        // Name > 60 characters
        String longName = "A".repeat(61);
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateClassRequest(pilotSubject.getId(), longName))))
                .andExpect(status().isBadRequest());

        // Invalid subject ID (returns 404 Resource not found)
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateClassRequest(999999L, "Valid Section"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Resource not found")));

        // Create initial class
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateClassRequest(pilotSubject.getId(), "Duplicate Section"))))
                .andExpect(status().isCreated());

        // Attempt duplicate name for same teacher & subject (case-insensitive)
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateClassRequest(pilotSubject.getId(), "duplicate section"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already have a class with this name")));
    }

    @Test
    @DisplayName("Non-teacher tokens and pending teacher are refused on teacher endpoints (403 Forbidden)")
    void testNonTeacherTokensRefusedOnTeacherEndpoints() throws Exception {
        CreateClassRequest req = new CreateClassRequest(pilotSubject.getId(), "Unauthorized Section");

        // Student token -> 403
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Admin token -> 403
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Pending teacher token -> 401/403 (deactivated/pending status)
        mockMvc.perform(post("/api/teacher/classes")
                        .header("Authorization", "Bearer " + pendingTeacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 2. Ownership & Archiving Tests
    // =========================================================================

    @Test
    @DisplayName("Teacher A cannot read, archive, or modify Teacher B's class (404 Not Found)")
    void testTeacherCannotAccessOtherTeacherClass() throws Exception {
        // Teacher A1 creates a class
        ClassEntity classA = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Section A1", "SECTA1"));

        // Teacher A2 (same institution, different teacher) tries to read -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId())
                        .header("Authorization", "Bearer " + teacherA2Token))
                .andExpect(status().isNotFound());

        // Teacher B (different institution) tries to read -> 404
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId())
                        .header("Authorization", "Bearer " + teacherBToken))
                .andExpect(status().isNotFound());

        // Teacher A2 tries to archive -> 404
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/archive")
                        .header("Authorization", "Bearer " + teacherA2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Class archiving is idempotent and no DELETE endpoint exists")
    void testClassArchivingIsIdempotentAndNoDeleteEndpoint() throws Exception {
        ClassEntity classA = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Section Archive Test", "ARCH01"));

        // First archive
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/archive")
                        .header("Authorization", "Bearer " + teacherA1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ARCHIVED")))
                .andExpect(jsonPath("$.enrollmentOpen", is(false)));

        ClassEntity refreshed = classEntityRepository.findById(classA.getId()).orElseThrow();
        assertEquals(ClassStatus.ARCHIVED, refreshed.getStatus());
        assertFalse(refreshed.isEnrollmentOpen());

        // Second archive (idempotent no-op)
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/archive")
                        .header("Authorization", "Bearer " + teacherA1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ARCHIVED")));

        // No DELETE endpoint exists
        mockMvc.perform(delete("/api/teacher/classes/" + classA.getId())
                        .header("Authorization", "Bearer " + teacherA1Token))
                .andExpect(status().isMethodNotAllowed());
    }

    // =========================================================================
    // 3. Student Join & Cross-Tenant Isolation Tests
    // =========================================================================

    @Test
    @DisplayName("Student joins with valid code (case insensitive, trimmed), and cannot join with cross-tenant code")
    void testStudentJoinValidAndCrossTenantCode() throws Exception {
        ClassEntity classA = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Section A", "JOIN26"));
        ClassEntity classB = classEntityRepository.save(new ClassEntity(instB, pilotSubject, teacherB, "Section B", "METR26"));

        // Student A joins Class A with spaces and lowercase ("  join26  ")
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"  join26  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionName", is("Section A")))
                .andExpect(jsonPath("$.subject.code", is("C_PROG_INTRO")));

        assertTrue(enrollmentRepository.existsByStudentAndSubject(studentA, pilotSubject));

        // Student A attempts to join Class B (from Metro State University) -> 400 generic message
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"METR26\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("That code isn't valid or the class isn't accepting students")));
    }

    @Test
    @DisplayName("Unknown, archived, and closed classes return the exact same generic error message")
    void testUnknownArchivedClosedClassesReturnSameGenericError() throws Exception {
        ClassEntity archivedClass = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Archived Class", "ARC999"));
        archivedClass.setStatus(ClassStatus.ARCHIVED);
        archivedClass.setEnrollmentOpen(false);
        classEntityRepository.save(archivedClass);

        ClassEntity closedClass = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Closed Class", "CLS999"));
        closedClass.setEnrollmentOpen(false);
        classEntityRepository.save(closedClass);

        String expectedMessage = "That code isn't valid or the class isn't accepting students";

        // Unknown code
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"NOPE99\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is(expectedMessage)));

        // Archived class
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ARC999\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is(expectedMessage)));

        // Closed enrollment class
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"CLS999\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is(expectedMessage)));
    }

    @Test
    @DisplayName("One active class per subject rule: second active class returns 409, but works after first class is archived")
    void testOneActiveClassPerSubjectRule() throws Exception {
        ClassEntity class1 = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Section 1", "ACT001"));
        ClassEntity class2 = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA2, "Section 2", "ACT002"));

        // Join Class 1
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ACT001\"}"))
                .andExpect(status().isOk());

        // Joining Class 2 of SAME subject returns 409 with existing class name
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ACT002\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already enrolled in an active class for this subject: Section 1")));

        // Archive Class 1
        class1.setStatus(ClassStatus.ARCHIVED);
        class1.setEnrollmentOpen(false);
        classEntityRepository.save(class1);

        // Now joining Class 2 succeeds!
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ACT002\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionName", is("Section 2")));
    }

    // =========================================================================
    // 4. Rate Limiter Tests
    // =========================================================================

    @Test
    @DisplayName("Rate limit: 6th failed attempt within a minute returns 429, and successful joins do not count")
    void testRateLimitOnFailedAttempts() throws Exception {
        // 5 consecutive failed attempts with invalid codes
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/student/classes/join")
                            .header("Authorization", "Bearer " + studentAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\": \"BAD00" + i + "\"}"))
                    .andExpect(status().isBadRequest());
        }

        // 6th failed attempt returns 429 Too Many Requests
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"BAD006\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Too many failed join attempts")));
    }

    @Test
    @DisplayName("Rate limit: 4 failures, successful or idempotent join, then 2 more failures -> 6th failure returns 429")
    void testRateLimitDoesNotResetOnSuccessfulOrIdempotentJoin() throws Exception {
        rateLimiter.resetForUser(studentB.getId());
        ClassEntity validClass = classEntityRepository.save(
                new ClassEntity(instB, pilotSubject, teacherB, "Rate Limit Test Section", "RLT001")
        );

        // 1. 4 consecutive failures
        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/student/classes/join")
                            .header("Authorization", "Bearer " + studentBToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\": \"ERR00" + i + "\"}"))
                    .andExpect(status().isBadRequest());
        }

        // 2. A successful join does NOT reset failure count
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"RLT001\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionName", is("Rate Limit Test Section")));

        // 3. An idempotent join also does NOT reset failure count
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"RLT001\"}"))
                .andExpect(status().isOk());

        // 4. 1 more failure (5th total failure recorded in window)
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ERR005\"}"))
                .andExpect(status().isBadRequest());

        // 5. 2nd failure after join (6th total failure within the window) -> HTTP 429
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ERR006\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Too many failed join attempts")));
    }

    // =========================================================================
    // 5. Archived Class Attempt Refusal Test
    // =========================================================================

    @Test
    @DisplayName("Starting an attempt in an archived class is refused with clear 400, while results stay viewable")
    void testStartingAttemptInArchivedClassRefused() throws Exception {
        ClassEntity classA = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Active First", "ATMPT1"));

        // Join active class
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"ATMPT1\"}"))
                .andExpect(status().isOk());

        // Now archive the class
        classA.setStatus(ClassStatus.ARCHIVED);
        classA.setEnrollmentOpen(false);
        classEntityRepository.save(classA);

        // Starting an assessment attempt is refused because class is archived
        mockMvc.perform(post("/api/student/assessments/" + pilotAssessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("archived")));

        // Progress remains viewable
        mockMvc.perform(get("/api/student/subjects/" + pilotSubject.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 6. Stretch Goals: Regenerate Join Code & Toggle Enrollment
    // =========================================================================

    @Test
    @DisplayName("Stretch: Teacher can regenerate join code and toggle enrollment open/closed")
    void testStretchRegenerateCodeAndToggleEnrollment() throws Exception {
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, pilotSubject, teacherA1, "Stretch Section", "STR001"));

        // Regenerate code
        mockMvc.perform(post("/api/teacher/classes/" + cls.getId() + "/regenerate-code")
                        .header("Authorization", "Bearer " + teacherA1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.joinCode", not("STR001")))
                .andExpect(jsonPath("$.joinCode", matchesPattern("^[2-9A-HJ-NP-Z]{6}$")));

        // Old code "STR001" stops working immediately for students
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"STR001\"}"))
                .andExpect(status().isBadRequest());

        // Toggle enrollment closed
        mockMvc.perform(put("/api/teacher/classes/" + cls.getId() + "/enrollment")
                        .header("Authorization", "Bearer " + teacherA1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"open\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrollmentOpen", is(false)));
    }
}


package com.learningpal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.EnrollmentBackfillRunner;
import com.learningpal.config.JwtService;
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
import org.springframework.test.web.servlet.MvcResult;
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
public class StudentEnrollmentTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private EnrollmentBackfillRunner enrollmentBackfillRunner;

    @Autowired
    private ClassJoinRateLimiter rateLimiter;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User student;
    private String studentToken;
    private Subject cSubject;
    private Subject mathSubject;
    private ClassEntity cClass;
    private Assessment cAssessment;
    private Topic cTopic;

    @BeforeEach
    void setUp() {
        Institution inst = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));

        student = userRepository.findByEmail("enrollment.student@learningpal.edu").orElseGet(() -> {
            User u = new User("Enrollment Student", "enrollment.student@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(inst);
            return userRepository.save(u);
        });
        student.setInstitution(inst);
        student = userRepository.save(student);
        studentToken = jwtService.generateToken(student);

        cSubject = subjectRepository.findByCode("C_PROG_INTRO").orElseThrow();

        mathSubject = subjectRepository.findByCode("MTH_101").orElseGet(() ->
                subjectRepository.save(new Subject("MTH_101", "Discrete Mathematics", "Sets, logic, relations, and graph theory.")));

        cAssessment = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().contains("Variables"))
                .findFirst()
                .orElseThrow();

        cTopic = topicRepository.findAllByOrderByDisplayOrderAsc().get(0);

        cClass = classEntityRepository.findFirstByInstitutionAndSubject(inst, cSubject).orElseGet(() ->
                classEntityRepository.save(new ClassEntity(inst, cSubject, null, "Section A", "CCODE1")));

        // Reset rate limiter for test isolation
        rateLimiter.resetForUser(student.getId());

        // Clear any preexisting test enrollments for clean isolation
        enrollmentRepository.findByStudentId(student.getId())
                .forEach(enrollmentRepository::delete);
    }

    @Test
    @DisplayName("Taking assessment in non-enrolled subject is refused with 403 Forbidden")
    void testStartAttemptInNonEnrolledSubjectRefused() throws Exception {
        assertFalse(enrollmentRepository.existsByStudentAndSubject(student, cSubject));

        mockMvc.perform(post("/api/student/assessments/" + cAssessment.getId() + "/attempts")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("not enrolled")));
    }

    @Test
    @DisplayName("Viewing progress or topic detail in non-enrolled subject is refused with 403 Forbidden")
    void testViewingProgressInNonEnrolledSubjectRefused() throws Exception {
        assertFalse(enrollmentRepository.existsByStudentAndSubject(student, cSubject));

        // Subject progress endpoint
        mockMvc.perform(get("/api/student/subjects/" + cSubject.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("not enrolled")));

        // Topic detail endpoint
        mockMvc.perform(get("/api/student/progress/topics/" + cTopic.getId())
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("not enrolled")));
    }

    @Test
    @DisplayName("Idempotent class join: joining twice with same code succeeds and creates exactly one enrollment")
    void testIdempotentClassJoin() throws Exception {
        assertFalse(enrollmentRepository.existsByStudentAndSubject(student, cSubject));

        // First join
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"" + cClass.getJoinCode() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject.code", is("C_PROG_INTRO")))
                .andExpect(jsonPath("$.sectionName", is(cClass.getName())))
                .andExpect(jsonPath("$.oneLineStatus", is("Not started yet")));

        assertTrue(enrollmentRepository.existsByStudentAndSubject(student, cSubject));
        assertEquals(1, enrollmentRepository.findByStudentId(student.getId()).size());

        // Second join (idempotent no-op)
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"" + cClass.getJoinCode() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject.code", is("C_PROG_INTRO")));

        assertEquals(1, enrollmentRepository.findByStudentId(student.getId()).size());
    }

    @Test
    @DisplayName("Backfill runner does not auto-enroll students without join code, but stamps classId on historical attempts")
    void testBackfillRunnerDoesNotAutoEnrollStudents() {
        Assessment mathAssessment = assessmentRepository.save(new Assessment(
                mathSubject,
                "Discrete Math Quiz 1",
                "Testing logic fundamentals",
                AssessmentStatus.PUBLISHED,
                null
        ));

        Attempt attempt = attemptRepository.save(new Attempt(student, mathAssessment));
        assertFalse(enrollmentRepository.existsByStudentAndSubject(student, mathSubject));

        // Run backfill
        enrollmentBackfillRunner.run();

        // Student is still NOT enrolled because auto-enrollment has been retired
        assertFalse(enrollmentRepository.existsByStudentAndSubject(student, mathSubject));

        // Now student enrolls into a class for mathSubject
        ClassEntity mathClass = classEntityRepository.save(new ClassEntity(student.getInstitution(), mathSubject, null, "Section M", "MTH001"));
        enrollmentRepository.save(new Enrollment(student, mathClass));

        // Run backfill again: now attempt gets stamped with classId
        enrollmentBackfillRunner.run();
        Attempt updatedAttempt = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertEquals(mathClass.getId(), updatedAttempt.getClassId());
    }

    @Test
    @DisplayName("Student class list returns enrolled classes and summary without leaking join codes")
    void testStudentClassList() throws Exception {
        // Enroll via join endpoint
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"" + cClass.getJoinCode() + "\"}"))
                .andExpect(status().isOk());

        // Enrolled classes list
        mockMvc.perform(get("/api/student/classes")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sectionName", is(cClass.getName())))
                .andExpect(jsonPath("$[0].subject.code", is("C_PROG_INTRO")))
                .andExpect(jsonPath("$[0].joinCode").doesNotExist()); // NEVER leak joinCode to student!

        // Backward compatible subjects list
        mockMvc.perform(get("/api/student/subjects")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].code", is("C_PROG_INTRO")))
                .andExpect(jsonPath("$[0].oneLineStatus", is("Not started yet")));
    }
}

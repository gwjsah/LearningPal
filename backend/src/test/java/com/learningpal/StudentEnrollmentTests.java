package com.learningpal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.EnrollmentBackfillRunner;
import com.learningpal.config.JwtService;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.StudentEnrollmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
    private StudentEnrollmentService studentEnrollmentService;

    @Autowired
    private EnrollmentBackfillRunner enrollmentBackfillRunner;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User student;
    private String studentToken;
    private Subject cSubject;
    private Subject mathSubject;
    private Assessment cAssessment;
    private Topic cTopic;

    @BeforeEach
    void setUp() {
        student = userRepository.findByEmail("enrollment.student@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Enrollment Student", "enrollment.student@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE)));
        studentToken = jwtService.generateToken(student);

        cSubject = subjectRepository.findByCode("C_PROG_INTRO").orElseThrow();

        mathSubject = subjectRepository.findByCode("MTH_101").orElseGet(() ->
                subjectRepository.save(new Subject("MTH_101", "Discrete Mathematics", "Sets, logic, relations, and graph theory.")));

        cAssessment = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().contains("Variables"))
                .findFirst()
                .orElseThrow();

        cTopic = topicRepository.findAllByOrderByDisplayOrderAsc().get(0);

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
    @DisplayName("Idempotent self-enrollment: enrolling twice creates exactly one record and returns 200")
    void testIdempotentSelfEnrollment() throws Exception {
        assertFalse(enrollmentRepository.existsByStudentAndSubject(student, cSubject));

        // First enrollment
        mockMvc.perform(post("/api/student/subjects/" + cSubject.getId() + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("C_PROG_INTRO")))
                .andExpect(jsonPath("$.oneLineStatus", is("Not started yet")));

        assertTrue(enrollmentRepository.existsByStudentAndSubject(student, cSubject));
        long countAfterFirst = enrollmentRepository.findByStudentId(student.getId()).size();
        assertEquals(1, countAfterFirst);

        // Second enrollment (idempotent no-op)
        mockMvc.perform(post("/api/student/subjects/" + cSubject.getId() + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("C_PROG_INTRO")));

        long countAfterSecond = enrollmentRepository.findByStudentId(student.getId()).size();
        assertEquals(1, countAfterSecond);
    }

    @Test
    @DisplayName("Backfill runner auto-enrolls student who has an existing historical attempt")
    void testBackfillRunnerEnrollsHistoricalAttemptOwners() {
        // Create an attempt for student in mathSubject without enrollment
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

        // Verify student is now enrolled
        assertTrue(enrollmentRepository.existsByStudentAndSubject(student, mathSubject));
    }

    @Test
    @DisplayName("Available subjects lists non-enrolled subjects and excludes enrolled ones")
    void testAvailableSubjectsList() throws Exception {
        // Initially both C and Math are available
        MvcResult res1 = mockMvc.perform(get("/api/student/subjects/available")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode arr1 = objectMapper.readTree(res1.getResponse().getContentAsString());
        assertTrue(arr1.size() >= 2);

        // Enroll in C
        mockMvc.perform(post("/api/student/subjects/" + cSubject.getId() + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());

        // Now available subjects must NOT contain C_PROG_INTRO
        MvcResult res2 = mockMvc.perform(get("/api/student/subjects/available")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode arr2 = objectMapper.readTree(res2.getResponse().getContentAsString());
        for (JsonNode s : arr2) {
            assertNotEquals("C_PROG_INTRO", s.get("code").asText());
        }

        // And enrolled subjects must contain C_PROG_INTRO
        mockMvc.perform(get("/api/student/subjects")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].code", is("C_PROG_INTRO")))
                .andExpect(jsonPath("$[0].oneLineStatus", is("Not started yet")));
    }
}


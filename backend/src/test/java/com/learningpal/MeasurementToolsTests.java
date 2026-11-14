package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.MeasurementRatingService;
import com.learningpal.service.MeasurementSurveyService;
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

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Measurement Tools: Helpfulness Ratings, Usability Surveys & Target Check Tests")
public class MeasurementToolsTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MeasurementRatingService measurementRatingService;

    @Autowired
    private MeasurementSurveyService measurementSurveyService;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private FeedbackRatingRepository feedbackRatingRepository;

    @Autowired
    private ResourceRatingRepository resourceRatingRepository;

    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

    @Autowired
    private SurveyAnswerRepository surveyAnswerRepository;

    private Institution inst;
    private User student1;
    private User student2;
    private User teacher;
    private User admin;
    private Subject subject;
    private Topic topic1;
    private Topic topic2;
    private Resource resource1;
    private ClassEntity classroom;

    private String student1Token;
    private String teacherToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        surveyAnswerRepository.deleteAll();
        surveyResponseRepository.deleteAll();
        feedbackRatingRepository.deleteAll();
        resourceRatingRepository.deleteAll();

        inst = institutionRepository.findByCode("PILOT-2026")
                .orElseGet(() -> institutionRepository.save(new Institution("Pilot University", "PILOT-2026")));

        String enc = passwordEncoder.encode("Secret123!");

        student1 = userRepository.findByEmail("meas.student1@pilot.edu")
                .orElseGet(() -> userRepository.save(new User("Alice Student", "meas.student1@pilot.edu", enc, Role.STUDENT, UserStatus.ACTIVE, inst)));

        student2 = userRepository.findByEmail("meas.student2@pilot.edu")
                .orElseGet(() -> userRepository.save(new User("Bob Student", "meas.student2@pilot.edu", enc, Role.STUDENT, UserStatus.ACTIVE, inst)));

        teacher = userRepository.findByEmail("meas.teacher@pilot.edu")
                .orElseGet(() -> userRepository.save(new User("Turing Teacher", "meas.teacher@pilot.edu", enc, Role.TEACHER, UserStatus.ACTIVE, inst)));

        admin = userRepository.findByEmail("meas.admin@pilot.edu")
                .orElseGet(() -> userRepository.save(new User("Principal Admin", "meas.admin@pilot.edu", enc, Role.ADMIN, UserStatus.ACTIVE, inst)));

        subject = subjectRepository.findAll().stream().findFirst()
                .orElseGet(() -> subjectRepository.save(new Subject("Computer Science", "CS101", "Introduction to CS")));

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        if (topics.isEmpty()) {
            topic1 = topicRepository.save(new Topic(subject, "Variables", "Intro to variables", 1));
            topic2 = topicRepository.save(new Topic(subject, "Control Flow", "Branching logic", 2));
        } else {
            topic1 = topics.get(0);
            topic2 = topics.size() > 1 ? topics.get(1) : topic1;
        }

        List<Resource> resources = resourceRepository.findBySubjectId(subject.getId());
        if (resources.isEmpty()) {
            resource1 = resourceRepository.save(new Resource(subject, topic1, "Intro Guide", "Guide description", ResourceType.NOTE, "Content", "http://example.com", DifficultyLevel.EASY, teacher));
        } else {
            resource1 = resources.get(0);
        }

        classroom = classEntityRepository.findByJoinCode("MEAS01")
                .orElseGet(() -> classEntityRepository.save(new ClassEntity(inst, subject, teacher, "Measurement Class", "MEAS01")));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student1, classroom)) {
            enrollmentRepository.save(new Enrollment(student1, classroom));
        }
        if (!enrollmentRepository.existsByStudentAndClassEntity(student2, classroom)) {
            enrollmentRepository.save(new Enrollment(student2, classroom));
        }

        student1Token = jwtService.generateToken(student1);
        teacherToken = jwtService.generateToken(teacher);
        adminToken = jwtService.generateToken(admin);
    }

    @Test
    @DisplayName("Part A: Student can rate topic feedback and resource, rating bounds are enforced, and upsert keeps single row")
    void testRatingBoundsAndUpsert() throws Exception {
        // 1. Invalid bounds: 0 should fail with 400
        mockMvc.perform(put("/api/student/topics/" + topic1.getId() + "/feedback-rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(0, "Invalid"))))
                .andExpect(status().isBadRequest());

        // 2. Invalid bounds: 6 should fail with 400
        mockMvc.perform(put("/api/student/topics/" + topic1.getId() + "/feedback-rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(6, "Invalid"))))
                .andExpect(status().isBadRequest());

        // 3. Valid rating: 4
        mockMvc.perform(put("/api/student/topics/" + topic1.getId() + "/feedback-rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(4, "Very clear explanation."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating", is(4)))
                .andExpect(jsonPath("$.comment", is("Very clear explanation.")));

        assertEquals(1, feedbackRatingRepository.findByStudent(student1).size());

        // 4. Upsert check: change rating from 4 to 5 with updated comment
        mockMvc.perform(put("/api/student/topics/" + topic1.getId() + "/feedback-rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(5, "Revised: outstanding feedback!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating", is(5)))
                .andExpect(jsonPath("$.comment", is("Revised: outstanding feedback!")));

        // Should still be exactly 1 row
        assertEquals(1, feedbackRatingRepository.findByStudent(student1).size());
        assertEquals(5, feedbackRatingRepository.findByStudentAndTopic(student1, topic1).get().getRating());

        // 5. Rate resource
        mockMvc.perform(put("/api/student/resources/" + resource1.getId() + "/rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(5, "Loved the practice sheet"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating", is(5)));

        assertEquals(1, resourceRatingRepository.findByStudent(student1).size());
    }

    @Test
    @DisplayName("Part A: Student cannot rate a topic or resource outside their enrolled subject (returns 404)")
    void testRatingUnenrolledSubjectReturns404() throws Exception {
        Institution otherInst = institutionRepository.findByCode("OTHER-2026")
                .orElseGet(() -> institutionRepository.save(new Institution("Other College", "OTHER-2026")));
        Subject otherSubject = subjectRepository.save(new Subject("Foreign Subject", "FOR101", "Foreign"));
        Topic foreignTopic = topicRepository.save(new Topic(otherSubject, "Foreign Topic", "Unenrolled", 1));
        Resource foreignResource = resourceRepository.save(new Resource(otherSubject, foreignTopic, "Foreign Resource", "Desc", ResourceType.NOTE, "Content", "http://foreign.com", DifficultyLevel.EASY, teacher));

        // Rating foreign topic feedback should 404
        mockMvc.perform(put("/api/student/topics/" + foreignTopic.getId() + "/feedback-rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(5, "Test"))))
                .andExpect(status().isNotFound());

        // Rating foreign resource should 404
        mockMvc.perform(put("/api/student/resources/" + foreignResource.getId() + "/rating")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RateItemRequest(5, "Test"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Part A: Hand-computed fixture for ratings summary and target check (80% target, min 10 raters)")
    void testHandComputedRatingsSummaryFixture() {
        // Setup 10 distinct raters
        String enc = passwordEncoder.encode("Secret123!");
        List<User> raters = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            final int idx = i;
            User u = userRepository.findByEmail("fixture.rater" + idx + "@pilot.edu")
                    .orElseGet(() -> userRepository.save(new User("Rater " + idx, "fixture.rater" + idx + "@pilot.edu", enc, Role.STUDENT, UserStatus.ACTIVE, inst)));
            raters.add(u);
        }

        // 10 raters rate topic1 feedback:
        // 8 raters give 5 (helpful)
        // 2 raters give 3 (not helpful)
        // Total ratings = 10, helpful = 8 -> 80.0% helpful
        for (int i = 0; i < 10; i++) {
            int score = (i < 8) ? 5 : 3;
            feedbackRatingRepository.save(new FeedbackRating(raters.get(i), topic1, score, "Comment " + i, MasteryStatus.DEVELOPING));
        }

        AdminRatingsSummaryDto summary = measurementRatingService.getAdminRatingsSummary("meas.admin@pilot.edu");

        assertEquals(10, summary.totalRaters());
        assertEquals(10, summary.totalRatings());
        assertEquals(80.0, summary.helpfulPercentage());
        assertEquals(80.0, summary.satisfiedRatersPercentage());
        assertEquals("MET", summary.targetCheckStatus());
        assertTrue(summary.targetCheckSentence().contains("MET"));

        // When fewer than 10 raters (e.g. delete 2 raters' records)
        feedbackRatingRepository.delete(feedbackRatingRepository.findByStudentAndTopic(raters.get(8), topic1).get());
        feedbackRatingRepository.delete(feedbackRatingRepository.findByStudentAndTopic(raters.get(9), topic1).get());

        AdminRatingsSummaryDto summaryNotEnough = measurementRatingService.getAdminRatingsSummary("meas.admin@pilot.edu");
        assertEquals(8, summaryNotEnough.totalRaters());
        assertEquals("NOT_ENOUGH_DATA", summaryNotEnough.targetCheckStatus());
        assertTrue(summaryNotEnough.targetCheckSentence().contains("requires at least 10 raters"));
    }

    @Test
    @DisplayName("Part A: Teacher ratings summary is class-scoped, shows helpfulness, and never identifies students")
    void testTeacherRatingsSummary() throws Exception {
        feedbackRatingRepository.save(new FeedbackRating(student1, topic1, 5, "Clear guidance on loops", MasteryStatus.GAP));
        feedbackRatingRepository.save(new FeedbackRating(student2, topic1, 4, "Helpful breakdown", MasteryStatus.DEVELOPING));
        resourceRatingRepository.save(new ResourceRating(student1, resource1, 5, "Useful practice questions"));

        mockMvc.perform(get("/api/teacher/classes/" + classroom.getId() + "/ratings-summary")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.recentComments", hasSize(greaterThanOrEqualTo(1))))
                // Verify student name and email are never in response
                .andExpect(content().string(not(containsString("meas.student1@pilot.edu"))))
                .andExpect(content().string(not(containsString("Alice Student"))));
    }

    @Test
    @DisplayName("Part B: Usability survey enforces required items, bounds 1-5, single response per version, and role items")
    void testSurveyValidationAndSingleResponse() throws Exception {
        // 1. Get survey status
        mockMvc.perform(get("/api/survey")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.surveyVersion", is("v1")))
                .andExpect(jsonPath("$.role", is("STUDENT")))
                .andExpect(jsonPath("$.alreadyResponded", is(false)))
                .andExpect(jsonPath("$.items", hasSize(8)));

        // 2. Submit survey with missing items -> 400
        Map<String, Integer> incompleteAnswers = Map.of("results_without_help", 5);
        mockMvc.perform(post("/api/survey")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitSurveyRequest("v1", incompleteAnswers, "Missing items"))))
                .andExpect(status().isBadRequest());

        // 3. Complete valid answers for all 8 student items
        Map<String, Integer> validAnswers = new HashMap<>();
        for (SurveyItemDto item : MeasurementSurveyService.STUDENT_SURVEY_ITEMS) {
            validAnswers.put(item.key(), 5);
        }

        mockMvc.perform(post("/api/survey")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitSurveyRequest("v1", validAnswers, "Loved the interface"))))
                .andExpect(status().isOk());

        // 4. Already responded should now be true
        mockMvc.perform(get("/api/survey")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyResponded", is(true)));

        // 5. Duplicate submission attempt for same version -> 400 BadRequest
        mockMvc.perform(post("/api/survey")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitSurveyRequest("v1", validAnswers, "Duplicate"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Part B: Admin survey summary calculates role averages and 4.0 target logic (min 5 per role)")
    void testAdminSurveySummaryTargetCheck() {
        String enc = passwordEncoder.encode("Secret123!");

        // Create 5 students and 5 teachers
        for (int i = 0; i < 5; i++) {
            final int idx = i;
            User s = userRepository.findByEmail("surv.stu" + idx + "@pilot.edu")
                    .orElseGet(() -> userRepository.save(new User("S" + idx, "surv.stu" + idx + "@pilot.edu", enc, Role.STUDENT, UserStatus.ACTIVE, inst)));

            SurveyResponse sResp = new SurveyResponse(s, Role.STUDENT, "v1", "Great app");
            for (SurveyItemDto item : MeasurementSurveyService.STUDENT_SURVEY_ITEMS) {
                sResp.addAnswer(item.key(), 5); // 5.0 average
            }
            surveyResponseRepository.save(sResp);

            User t = userRepository.findByEmail("surv.tea" + idx + "@pilot.edu")
                    .orElseGet(() -> userRepository.save(new User("T" + idx, "surv.tea" + idx + "@pilot.edu", enc, Role.TEACHER, UserStatus.ACTIVE, inst)));

            SurveyResponse tResp = new SurveyResponse(t, Role.TEACHER, "v1", "Useful tools");
            for (SurveyItemDto item : MeasurementSurveyService.TEACHER_SURVEY_ITEMS) {
                tResp.addAnswer(item.key(), 4); // 4.0 average
            }
            surveyResponseRepository.save(tResp);
        }

        AdminSurveySummaryDto summary = measurementSurveyService.getAdminSurveySummary("meas.admin@pilot.edu");

        assertEquals(10, summary.totalResponses());
        assertEquals(5, summary.studentResponsesCount());
        assertEquals(5, summary.teacherResponsesCount());
        assertEquals(5.0, summary.studentAverage());
        assertEquals(4.0, summary.teacherAverage());
        assertEquals(4.5, summary.overallAverage());
        assertEquals(100.0, summary.satisfiedRespondentsPercentage());
        assertEquals("MET", summary.targetCheckStatus());
        assertTrue(summary.targetCheckSentence().contains("MET"));
    }

    @Test
    @DisplayName("CSV Formula Injection Protection: Active formula triggers are escaped with single quote")
    void testCsvFormulaInjectionDefense() {
        assertEquals("'=1+1", MeasurementRatingService.escapeCsvCell("=1+1"));
        assertEquals("'+2+2", MeasurementRatingService.escapeCsvCell("+2+2"));
        assertEquals("'-5", MeasurementRatingService.escapeCsvCell("-5"));
        assertEquals("'@SUM(A1:A5)", MeasurementRatingService.escapeCsvCell("@SUM(A1:A5)"));
        assertEquals("Safe Text", MeasurementRatingService.escapeCsvCell("Safe Text"));
    }

    @Test
    @DisplayName("Role security: Student token refused on teacher/admin ratings and admin survey endpoints")
    void testRoleAccessEnforcement() throws Exception {
        // Student token on teacher ratings summary -> 403
        mockMvc.perform(get("/api/teacher/classes/" + classroom.getId() + "/ratings-summary")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        // Student token on admin ratings summary -> 403
        mockMvc.perform(get("/api/admin/ratings/summary")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        // Student token on admin survey summary -> 403
        mockMvc.perform(get("/api/admin/survey/summary")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());
    }
}

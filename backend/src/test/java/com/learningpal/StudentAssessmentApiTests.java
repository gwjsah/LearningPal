package com.learningpal;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class StudentAssessmentApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentQuestionRepository assessmentQuestionRepository;

    @Autowired
    private ChoiceRepository choiceRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User studentA;
    private String tokenA;

    private User studentB;
    private String tokenB;

    private User teacher;
    private String teacherToken;

    private Assessment topicQuiz1;
    private ClassEntity defaultClass;

    @BeforeEach
    void setUp() {
        Institution pilot = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));

        // Create student A
        studentA = userRepository.findByEmail("student.a@learningpal.edu").orElseGet(() -> {
            User u = new User("Student A", "student.a@learningpal.edu", passwordEncoder.encode("Password123"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(pilot);
            return userRepository.save(u);
        });
        if (studentA.getInstitution() == null) {
            studentA.setInstitution(pilot);
            studentA = userRepository.save(studentA);
        }
        tokenA = jwtService.generateToken(studentA);

        // Create student B
        studentB = userRepository.findByEmail("student.b@learningpal.edu").orElseGet(() -> {
            User u = new User("Student B", "student.b@learningpal.edu", passwordEncoder.encode("Password123"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(pilot);
            return userRepository.save(u);
        });
        if (studentB.getInstitution() == null) {
            studentB.setInstitution(pilot);
            studentB = userRepository.save(studentB);
        }
        tokenB = jwtService.generateToken(studentB);

        // Create teacher
        teacher = userRepository.findByEmail("teacher.test@learningpal.edu").orElseGet(() -> {
            User u = new User("Teacher Test", "teacher.test@learningpal.edu", passwordEncoder.encode("Password123"), Role.TEACHER, UserStatus.ACTIVE);
            u.setInstitution(pilot);
            return userRepository.save(u);
        });
        if (teacher.getInstitution() == null) {
            teacher.setInstitution(pilot);
            teacher = userRepository.save(teacher);
        }
        teacherToken = jwtService.generateToken(teacher);

        // Find pilot topic quiz
        topicQuiz1 = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().contains("Variables"))
                .findFirst()
                .orElseThrow();

        defaultClass = classEntityRepository.findFirstByInstitutionAndSubject(pilot, topicQuiz1.getSubject())
                .orElseGet(() -> classEntityRepository.save(new ClassEntity(pilot, topicQuiz1.getSubject(), teacher, "Section A", "STU001")));

        // Enroll students in subject
        if (!enrollmentRepository.existsByStudentAndSubject(studentA, topicQuiz1.getSubject())) {
            enrollmentRepository.save(new Enrollment(studentA, defaultClass));
        }
        if (!enrollmentRepository.existsByStudentAndSubject(studentB, topicQuiz1.getSubject())) {
            enrollmentRepository.save(new Enrollment(studentB, defaultClass));
        }
    }

    @Test
    @DisplayName("Teacher token is refused on student endpoints (403 Forbidden)")
    void testTeacherTokenRefusedOnStudentEndpoints() throws Exception {
        mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("You do not have permission to access this resource")));

        mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Start-attempt response contains NO isCorrect or explanation fields")
    void testStartAttemptDoesNotLeakAnswersOrExplanations() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attemptId", notNullValue()))
                .andExpect(jsonPath("$.questions", hasSize(greaterThan(0))))
                .andReturn();

        String json = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(json);

        // Assert strictly that neither 'isCorrect' nor 'explanation' exists in any node
        assertFalse(json.contains("\"isCorrect\""), "SECURITY BREACH: 'isCorrect' must not appear in start-attempt JSON");
        assertFalse(json.contains("\"explanation\""), "SECURITY BREACH: 'explanation' must not appear in start-attempt JSON");

        // Inspect choices
        JsonNode firstQuestion = root.get("questions").get(0);
        assertNotNull(firstQuestion.get("id"));
        assertNotNull(firstQuestion.get("text"));
        assertNotNull(firstQuestion.get("topicName"));
        assertNull(firstQuestion.get("explanation"));

        JsonNode firstChoice = firstQuestion.get("choices").get(0);
        assertNotNull(firstChoice.get("id"));
        assertNotNull(firstChoice.get("label"));
        assertNotNull(firstChoice.get("text"));
        assertNull(firstChoice.get("isCorrect"));
    }

    @Test
    @DisplayName("Grading: All correct submission yields full points and 100%")
    void testGradingAllCorrect() throws Exception {
        // Start attempt
        MvcResult startResult = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode startNode = objectMapper.readTree(startResult.getResponse().getContentAsString());
        long attemptId = startNode.get("attemptId").asLong();

        // Build answers payload with correct choices
        List<AssessmentQuestion> aqList = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);
        StringBuilder answersPayload = new StringBuilder("{\"answers\": [");
        for (int i = 0; i < aqList.size(); i++) {
            Question q = aqList.get(i).getQuestion();
            Choice correctChoice = choiceRepository.findByQuestion(q).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
            if (i > 0) answersPayload.append(",");
            answersPayload.append(String.format("{\"questionId\": %d, \"selectedChoiceId\": %d}", q.getId(), correctChoice.getId()));
        }
        answersPayload.append("]}");

        // Submit
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answersPayload.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId", is((int) attemptId)));

        // Verify result
        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is((double) aqList.size())))
                .andExpect(jsonPath("$.maxScore", is((double) aqList.size())))
                .andExpect(jsonPath("$.percentage", is(100.0)))
                .andExpect(jsonPath("$.questionReviews", hasSize(aqList.size())))
                .andExpect(jsonPath("$.questionReviews[0].isCorrect", is(true)))
                .andExpect(jsonPath("$.questionReviews[0].pointsEarned", is(1.0)))
                .andExpect(jsonPath("$.questionReviews[0].explanation", notNullValue()));
    }

    @Test
    @DisplayName("Grading: All wrong and unanswered submission yields 0.0 points and 0.0%")
    void testGradingAllWrongAndUnanswered() throws Exception {
        // Start attempt
        MvcResult startResult = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode startNode = objectMapper.readTree(startResult.getResponse().getContentAsString());
        long attemptId = startNode.get("attemptId").asLong();

        List<AssessmentQuestion> aqList = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);
        Question firstQuestion = aqList.get(0).getQuestion();
        Choice wrongChoice = choiceRepository.findByQuestion(firstQuestion).stream().filter(c -> !c.isCorrect()).findFirst().orElseThrow();

        // Submit only first question with wrong choice, leave rest unanswered
        String answersPayload = String.format("{\"answers\": [{\"questionId\": %d, \"selectedChoiceId\": %d}]}",
                firstQuestion.getId(), wrongChoice.getId());

        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answersPayload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(0.0)))
                .andExpect(jsonPath("$.maxScore", is((double) aqList.size())))
                .andExpect(jsonPath("$.percentage", is(0.0)));
    }

    @Test
    @DisplayName("Student B cannot read or submit Student A's attempt (404 Not Found)")
    void testAttemptOwnershipIsolation() throws Exception {
        // Student A starts attempt
        MvcResult startResult = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        long attemptIdA = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("attemptId").asLong();

        // Student B tries to submit Student A's attempt
        mockMvc.perform(post("/api/student/attempts/" + attemptIdA + "/submit")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\": []}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Attempt not found")));

        // Student B tries to view Student A's result
        mockMvc.perform(get("/api/student/attempts/" + attemptIdA + "/result")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Attempt not found")));
    }

    @Test
    @DisplayName("Attempt cannot be submitted twice (409 Conflict)")
    void testCannotSubmitTwice() throws Exception {
        MvcResult startResult = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        long attemptId = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("attemptId").asLong();

        // First submit: OK
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\": []}"))
                .andExpect(status().isOk());

        // Second submit: 409 Conflict
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\": []}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already been submitted")));
    }

    @Test
    @DisplayName("Cannot submit a choice that belongs to a different question (400 Bad Request)")
    void testCannotSubmitMismatchedChoice() throws Exception {
        MvcResult startResult = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        long attemptId = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("attemptId").asLong();

        List<AssessmentQuestion> aqList = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);
        Question question1 = aqList.get(0).getQuestion();
        Question question2 = aqList.get(1).getQuestion();

        Choice choiceOfQuestion2 = choiceRepository.findByQuestion(question2).get(0);

        // Submit choice of Question 2 for Question 1
        String payload = String.format("{\"answers\": [{\"questionId\": %d, \"selectedChoiceId\": %d}]}",
                question1.getId(), choiceOfQuestion2.getId());

        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("does not belong to Question ID")));
    }

    @Test
    @DisplayName("Result endpoint refuses attempt that is still IN_PROGRESS (400 Bad Request)")
    void testResultEndpointRefusesInProgressAttempt() throws Exception {
        MvcResult startResult = mockMvc.perform(post("/api/student/assessments/" + topicQuiz1.getId() + "/attempts")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andReturn();

        long attemptId = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("attemptId").asLong();

        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("still in progress")));
    }

    @Test
    @DisplayName("Comprehensive Diagnostic end-to-end walkthrough: signup, take, answer 12 right + 3 wrong + 3 unanswered, submit, hand-calculated score check, and Student 2 isolation check")
    void testComprehensiveDiagnosticWalkthrough() throws Exception {
        // Step 1: Sign up Student 1
        String signup1 = """
            {
              "fullName": "Walkthrough Student One",
              "email": "wt.student1@learningpal.edu",
              "password": "Password123",
              "role": "STUDENT", "institutionCode": "PILOT-2026"
            }
            """;
        MvcResult signup1Res = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signup1))
                .andExpect(status().isCreated())
                .andReturn();
        String student1Token = objectMapper.readTree(signup1Res.getResponse().getContentAsString()).get("token").asText();

        // Enroll Student 1 in pilot subject via classroom join code
        mockMvc.perform(post("/api/student/classes/join")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\": \"" + defaultClass.getJoinCode() + "\"}"))
                .andExpect(status().isOk());

        // Step 2: List assessments and find Comprehensive Diagnostic
        MvcResult listRes = mockMvc.perform(get("/api/student/assessments")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode assessmentsArr = objectMapper.readTree(listRes.getResponse().getContentAsString());
        long diagnosticId = -1;
        for (JsonNode a : assessmentsArr) {
            if (a.get("title").asText().contains("Diagnostic")) {
                diagnosticId = a.get("id").asLong();
                break;
            }
        }
        assertTrue(diagnosticId > 0, "Comprehensive Diagnostic assessment must exist");

        // Step 3: Start attempt for Comprehensive Diagnostic (18 questions)
        MvcResult startRes = mockMvc.perform(post("/api/student/assessments/" + diagnosticId + "/attempts")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode startData = objectMapper.readTree(startRes.getResponse().getContentAsString());
        long attemptId = startData.get("attemptId").asLong();
        JsonNode questions = startData.get("questions");
        assertEquals(18, questions.size(), "Comprehensive Diagnostic must have 18 questions");

        // Step 4: Answer 12 questions correctly, 3 questions incorrectly, leave 3 unanswered
        // Hand calculation:
        // 12 * 1.0 = 12.0 points earned
        // Max points = 18.0 points
        // Percentage = (12.0 / 18.0) * 100 = 66.7%
        StringBuilder answersJson = new StringBuilder("{\"answers\": [");
        for (int i = 0; i < 15; i++) { // questions 0..14 answered, 15..17 left unanswered
            long qId = questions.get(i).get("id").asLong();
            Question qEntity = assessmentQuestionRepository.findAll().stream()
                    .map(AssessmentQuestion::getQuestion)
                    .filter(q -> q.getId().equals(qId))
                    .findFirst()
                    .orElseThrow();
            List<Choice> choices = choiceRepository.findByQuestion(qEntity);

            Long choiceIdToPick;
            if (i < 12) {
                // Pick correct choice
                choiceIdToPick = choices.stream().filter(Choice::isCorrect).findFirst().orElseThrow().getId();
            } else {
                // Pick incorrect choice (i = 12, 13, 14)
                choiceIdToPick = choices.stream().filter(c -> !c.isCorrect()).findFirst().orElseThrow().getId();
            }

            if (i > 0) answersJson.append(",");
            answersJson.append(String.format("{\"questionId\": %d, \"selectedChoiceId\": %d}", qId, choiceIdToPick));
        }
        answersJson.append("]}");

        // Step 5: Submit attempt
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answersJson.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId", is((int) attemptId)));

        // Step 6: Verify hand-calculated result on Student 1
        MvcResult resultRes = mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(12.0)))
                .andExpect(jsonPath("$.maxScore", is(18.0)))
                .andExpect(jsonPath("$.percentage", is(66.7)))
                .andExpect(jsonPath("$.questionReviews", hasSize(18)))
                .andExpect(jsonPath("$.topicBreakdowns", hasSize(6)))
                .andReturn();

        JsonNode resultData = objectMapper.readTree(resultRes.getResponse().getContentAsString());
        assertEquals(12.0, resultData.get("score").asDouble());
        assertEquals(18.0, resultData.get("maxScore").asDouble());
        assertEquals(66.7, resultData.get("percentage").asDouble());

        // Step 7: Sign up Student 2
        String signup2 = """
            {
              "fullName": "Walkthrough Student Two",
              "email": "wt.student2@learningpal.edu",
              "password": "Password123",
              "role": "STUDENT", "institutionCode": "PILOT-2026"
            }
            """;
        MvcResult signup2Res = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signup2))
                .andExpect(status().isCreated())
                .andReturn();
        String student2Token = objectMapper.readTree(signup2Res.getResponse().getContentAsString()).get("token").asText();

        // Step 8: Confirm Student 2 CANNOT access Student 1's attempt result (returns 404)
        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Attempt not found")));
    }
}

package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.AnswerSubmissionDto;
import com.learningpal.dto.FeedbackDto;
import com.learningpal.dto.MissedQuestionDto;
import com.learningpal.dto.RecommendedResourceDto;
import com.learningpal.dto.SubmitAttemptRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.FeedbackService;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.StudentAssessmentService;
import com.learningpal.service.StudentResourceService;
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

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class FeedbackAndResourceTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentQuestionRepository assessmentQuestionRepository;

    @Autowired
    private ChoiceRepository choiceRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceProgressRepository resourceProgressRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private StudentAssessmentService studentAssessmentService;

    @Autowired
    private GapAnalysisService gapAnalysisService;

    @Autowired
    private StudentResourceService studentResourceService;

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

    private Topic topic1;
    private Assessment topicQuiz1;

    @BeforeEach
    void setUp() {
        studentA = userRepository.findByEmail("feedback.student.a@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Feedback Student A", "feedback.student.a@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE)));
        tokenA = jwtService.generateToken(studentA);

        studentB = userRepository.findByEmail("feedback.student.b@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Feedback Student B", "feedback.student.b@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE)));
        tokenB = jwtService.generateToken(studentB);

        teacher = userRepository.findByEmail("feedback.teacher@learningpal.edu").orElseGet(() ->
                userRepository.save(new User("Feedback Teacher", "feedback.teacher@learningpal.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE)));
        teacherToken = jwtService.generateToken(teacher);

        topic1 = topicRepository.findAllByOrderByDisplayOrderAsc().get(0);

        topicQuiz1 = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().contains("Variables"))
                .findFirst()
                .orElseThrow();

        if (!enrollmentRepository.existsByStudentAndSubject(studentA, topic1.getSubject())) {
            enrollmentRepository.save(new Enrollment(studentA, topic1.getSubject()));
        }
        if (!enrollmentRepository.existsByStudentAndSubject(studentB, topic1.getSubject())) {
            enrollmentRepository.save(new Enrollment(studentB, topic1.getSubject()));
        }
    }

    // =========================================================================
    // 1. Feedback Pure Function Tests
    // =========================================================================

    @Test
    @DisplayName("Feedback pure function handles each status, trend wording, wrong/blank misses, and no-misses")
    void testFeedbackPureFunction() {
        List<MissedQuestionDto> misses = List.of(
                new MissedQuestionDto(1L, "What is sizeof(char)?", "2 bytes", "1 byte", "char is always 1 byte in C."),
                new MissedQuestionDto(2L, "What is 7 / 2?", "Left blank", "3", "Integer division truncates.")
        );

        // GAP status with UP trend
        FeedbackDto gapUp = FeedbackService.generateFeedback("Variables", 50.0, MasteryStatus.GAP, "UP", 35.0, misses);
        assertTrue(gapUp.headline().contains("Needs attention"));
        assertTrue(gapUp.message().contains("up 15 points since last time"));
        assertTrue(gapUp.message().contains("study note"));
        assertEquals(2, gapUp.whatToReview().size());
        assertEquals("Left blank", gapUp.whatToReview().get(1).studentAnswer());

        // GAP status with DOWN trend
        FeedbackDto gapDown = FeedbackService.generateFeedback("Variables", 40.0, MasteryStatus.GAP, "DOWN", 55.0, misses);
        assertTrue(gapDown.message().contains("down 15 points since last time"));

        // DEVELOPING status with UP trend
        FeedbackDto devUp = FeedbackService.generateFeedback("Variables", 70.0, MasteryStatus.DEVELOPING, "UP", 60.0, misses);
        assertTrue(devUp.headline().contains("Good progress"));
        assertTrue(devUp.message().contains("up 10 points since last time"));
        assertTrue(devUp.message().contains("close to a strength"));

        // STRENGTH status with zero misses (100%)
        FeedbackDto strengthPerfect = FeedbackService.generateFeedback("Variables", 100.0, MasteryStatus.STRENGTH, "SAME", 100.0, List.of());
        assertTrue(strengthPerfect.headline().contains("Solid understanding"));
        assertTrue(strengthPerfect.message().contains("flawless") || strengthPerfect.message().contains("complete mastery"));
        assertTrue(strengthPerfect.message().contains("practice challenge"));
        assertEquals(0, strengthPerfect.whatToReview().size());

        // STRENGTH status with 1 minor miss (e.g. 83.3%)
        FeedbackDto strengthWithMiss = FeedbackService.generateFeedback("Variables", 83.3, MasteryStatus.STRENGTH, "DOWN", 100.0, List.of(misses.get(0)));
        assertTrue(strengthWithMiss.message().contains("down 17 points since last time"));
        assertTrue(strengthWithMiss.message().contains("minor detail") || strengthWithMiss.message().contains("practice challenge"));
        assertEquals(1, strengthWithMiss.whatToReview().size());

        // INSUFFICIENT_DATA status
        FeedbackDto insufficient = FeedbackService.generateFeedback("Variables", 0.0, MasteryStatus.INSUFFICIENT_DATA, "SAME", null, List.of());
        assertTrue(insufficient.headline().contains("More practice needed"));
        assertTrue(insufficient.message().contains("fewer than 3 questions"));
    }

    // =========================================================================
    // 2. Resource Recommendations Ordering & Filtering
    // =========================================================================

    @Test
    @DisplayName("Recommendations return only topic resources and follow the ordering rules per status")
    void testResourceRecommendationsRules() {
        // Topic 1 has 1 NOTE and 1 PRACTICE
        List<RecommendedResourceDto> gapRecs = studentResourceService.getRecommendationsForTopic(topic1, MasteryStatus.GAP, studentA);
        assertEquals(2, gapRecs.size());
        assertEquals(ResourceType.NOTE, gapRecs.get(0).type());
        assertEquals(ResourceType.PRACTICE, gapRecs.get(1).type());

        List<RecommendedResourceDto> devRecs = studentResourceService.getRecommendationsForTopic(topic1, MasteryStatus.DEVELOPING, studentA);
        assertEquals(2, devRecs.size());
        assertEquals(ResourceType.NOTE, devRecs.get(0).type());
        assertEquals(ResourceType.PRACTICE, devRecs.get(1).type());

        // STRENGTH topics only get PRACTICE
        List<RecommendedResourceDto> strengthRecs = studentResourceService.getRecommendationsForTopic(topic1, MasteryStatus.STRENGTH, studentA);
        assertEquals(1, strengthRecs.size());
        assertEquals(ResourceType.PRACTICE, strengthRecs.get(0).type());

        // INSUFFICIENT_DATA topics only get NOTE
        List<RecommendedResourceDto> insufficientRecs = studentResourceService.getRecommendationsForTopic(topic1, MasteryStatus.INSUFFICIENT_DATA, studentA);
        assertEquals(1, insufficientRecs.size());
        assertEquals(ResourceType.NOTE, insufficientRecs.get(0).type());
    }

    // =========================================================================
    // 3. Resource Completion API (Idempotent, Uncomplete, 404)
    // =========================================================================

    @Test
    @DisplayName("Completing a resource twice creates one row, uncompleting works, unknown resource returns 404")
    void testResourceCompletionLifecycle() throws Exception {
        Resource note = resourceRepository.findByTopic(topic1).stream()
                .filter(r -> r.getType() == ResourceType.NOTE)
                .findFirst()
                .orElseThrow();

        // 1. Mark complete
        mockMvc.perform(post("/api/student/resources/" + note.getId() + "/complete")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)))
                .andExpect(jsonPath("$.resourceId", is(note.getId().intValue())));

        assertEquals(1, resourceProgressRepository.findByStudent(studentA).size());
        assertEquals(ProgressStatus.COMPLETED, resourceProgressRepository.findByStudentAndResource(studentA, note).orElseThrow().getStatus());

        // 2. Mark complete again (idempotent - still 1 row)
        mockMvc.perform(post("/api/student/resources/" + note.getId() + "/complete")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)));

        assertEquals(1, resourceProgressRepository.findByStudent(studentA).size());

        // 3. Mark incomplete (DELETE)
        mockMvc.perform(delete("/api/student/resources/" + note.getId() + "/complete")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(false)));

        assertTrue(resourceProgressRepository.findByStudentAndResource(studentA, note).isEmpty());

        // 4. Unknown resource returns 404
        mockMvc.perform(post("/api/student/resources/99999/complete")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Resource not found")));
    }

    // =========================================================================
    // 4. Student Isolation & Role Guarding
    // =========================================================================

    @Test
    @DisplayName("Student B's completion state never appears for Student A; teacher token is refused (403)")
    void testResourceIsolationAndSecurity() throws Exception {
        Resource note = resourceRepository.findByTopic(topic1).stream()
                .filter(r -> r.getType() == ResourceType.NOTE)
                .findFirst()
                .orElseThrow();

        // Student B marks note complete
        mockMvc.perform(post("/api/student/resources/" + note.getId() + "/complete")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk());

        // Student A inspects topic detail: note must be completed = false
        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resources[0].completed", is(false)))
                .andExpect(jsonPath("$.resourcesCompleted", is(0)));

        // Teacher token refused on completion endpoints
        mockMvc.perform(post("/api/student/resources/" + note.getId() + "/complete")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/student/resources/" + note.getId() + "/complete")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 5. Missed Questions Recency & Dynamic Feedback on Teacher Override
    // =========================================================================

    @Test
    @DisplayName("Missed questions reflect most recent answer, and teacher override updates feedback automatically")
    void testMissedQuestionsRecencyAndTeacherOverrideFeedback() throws Exception {
        List<AssessmentQuestion> aqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);

        // Attempt 1: Student gets Q0 wrong, Q1 correct, Q2 left blank, others correct -> score 4/6 = 66.7% DEVELOPING
        var startAttempt1 = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());
        List<AnswerSubmissionDto> sub1 = new ArrayList<>();

        // Q0: wrong
        sub1.add(new AnswerSubmissionDto(aqs.get(0).getQuestion().getId(), getIncorrectChoice(aqs.get(0).getQuestion()).getId()));
        // Q1: correct
        sub1.add(new AnswerSubmissionDto(aqs.get(1).getQuestion().getId(), getCorrectChoice(aqs.get(1).getQuestion()).getId()));
        // Q2: left blank (not included in sub1)
        // Q3..Q5: correct
        for (int i = 3; i < aqs.size(); i++) {
            sub1.add(new AnswerSubmissionDto(aqs.get(i).getQuestion().getId(), getCorrectChoice(aqs.get(i).getQuestion()).getId()));
        }

        studentAssessmentService.submitAttempt(startAttempt1.attemptId(), new SubmitAttemptRequest(sub1), studentA.getEmail());

        // Check topic detail: has 2 missed questions (Q0 wrong, Q2 left blank)
        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DEVELOPING")))
                .andExpect(jsonPath("$.feedback.headline", containsString("Good progress")))
                .andExpect(jsonPath("$.feedback.whatToReview", hasSize(2)))
                .andExpect(jsonPath("$.feedback.whatToReview[1].studentAnswer", is("Left blank")));

        // Attempt 2 (Retake): Student fixes Q0 and Q2, answers all 6 correctly
        var startAttempt2 = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());
        List<AnswerSubmissionDto> sub2 = new ArrayList<>();
        for (AssessmentQuestion aq : aqs) {
            sub2.add(new AnswerSubmissionDto(aq.getQuestion().getId(), getCorrectChoice(aq.getQuestion()).getId()));
        }
        studentAssessmentService.submitAttempt(startAttempt2.attemptId(), new SubmitAttemptRequest(sub2), studentA.getEmail());

        // Now topic detail: 100% STRENGTH, whatToReview has 0 misses, trend UP
        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("STRENGTH")))
                .andExpect(jsonPath("$.trend", is("UP")))
                .andExpect(jsonPath("$.feedback.headline", containsString("Solid understanding")))
                .andExpect(jsonPath("$.feedback.whatToReview", hasSize(0)));

        // Teacher overrides 4 answers down to 0 points (penalty) -> score drops to 2/6 = 33.3% GAP
        List<Answer> answers = answerRepository.findByAttemptId(startAttempt2.attemptId());
        for (int i = 0; i < 4; i++) {
            answers.get(i).applyTeacherOverride(0.0, "Deducted", teacher);
        }
        answerRepository.saveAll(answers);

        // Recalculate
        gapAnalysisService.recalculateForStudent(studentA.getId());

        // Topic detail feedback immediately switches to GAP status wording!
        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("GAP")))
                .andExpect(jsonPath("$.feedback.headline", containsString("Needs attention")))
                .andExpect(jsonPath("$.feedback.whatToReview", hasSize(4)));
    }

    private Choice getCorrectChoice(Question question) {
        return choiceRepository.findByQuestion(question).stream()
                .filter(Choice::isCorrect)
                .findFirst()
                .orElseThrow();
    }

    private Choice getIncorrectChoice(Question question) {
        return choiceRepository.findByQuestion(question).stream()
                .filter(c -> !c.isCorrect())
                .findFirst()
                .orElseThrow();
    }
}


package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.AnswerSubmissionDto;
import com.learningpal.dto.SubmitAttemptRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisClassifier;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.StudentAssessmentService;
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

import java.util.ArrayList;
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
public class GapAnalysisTests {

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
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private StudentAssessmentService studentAssessmentService;

    @Autowired
    private GapAnalysisService gapAnalysisService;

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

    private Assessment diagnosticAssessment;
    private Assessment topicQuiz1;
    private Topic topic1;

    @BeforeEach
    void setUp() {
        Institution pilot = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));

        // Create student A
        studentA = userRepository.findByEmail("gap.student.a@learningpal.edu").orElseGet(() -> {
            User u = new User("Gap Student A", "gap.student.a@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(pilot);
            return userRepository.save(u);
        });
        if (studentA.getInstitution() == null) {
            studentA.setInstitution(pilot);
            studentA = userRepository.save(studentA);
        }
        tokenA = jwtService.generateToken(studentA);

        // Create student B
        studentB = userRepository.findByEmail("gap.student.b@learningpal.edu").orElseGet(() -> {
            User u = new User("Gap Student B", "gap.student.b@learningpal.edu", passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE);
            u.setInstitution(pilot);
            return userRepository.save(u);
        });
        if (studentB.getInstitution() == null) {
            studentB.setInstitution(pilot);
            studentB = userRepository.save(studentB);
        }
        tokenB = jwtService.generateToken(studentB);

        // Create teacher
        teacher = userRepository.findByEmail("gap.teacher@learningpal.edu").orElseGet(() -> {
            User u = new User("Gap Teacher", "gap.teacher@learningpal.edu", passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE);
            u.setInstitution(pilot);
            return userRepository.save(u);
        });
        if (teacher.getInstitution() == null) {
            teacher.setInstitution(pilot);
            teacher = userRepository.save(teacher);
        }
        teacherToken = jwtService.generateToken(teacher);

        // Find pilot assessments
        diagnosticAssessment = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().toLowerCase().contains("diagnostic"))
                .findFirst()
                .orElseThrow();

        topicQuiz1 = assessmentRepository.findAll().stream()
                .filter(a -> a.getTitle().contains("Variables"))
                .findFirst()
                .orElseThrow();

        topic1 = topicRepository.findAllByOrderByDisplayOrderAsc().get(0);

        ClassEntity defaultClass = classEntityRepository.findFirstByInstitutionAndSubject(pilot, topic1.getSubject())
                .orElseGet(() -> classEntityRepository.save(new ClassEntity(pilot, topic1.getSubject(), teacher, "Section A", "GAP001")));

        if (!enrollmentRepository.existsByStudentAndSubject(studentA, topic1.getSubject())) {
            enrollmentRepository.save(new Enrollment(studentA, defaultClass));
        }
        if (!enrollmentRepository.existsByStudentAndSubject(studentB, topic1.getSubject())) {
            enrollmentRepository.save(new Enrollment(studentB, defaultClass));
        }
    }

    // =========================================================================
    // 1. Classification Function Tests (pure boundary values, zero points, insufficient data)
    // =========================================================================

    @Test
    @DisplayName("Classification function correctly evaluates exact boundary values, zero points, and insufficient data")
    void testClassificationBoundariesAndThresholds() {
        // Standard defaults: STRENGTH >= 80, DEVELOPING >= 60, GAP < 60, minQuestions = 3

        // Insufficient data: count < 3
        assertEquals(MasteryStatus.INSUFFICIENT_DATA, GapAnalysisClassifier.classify(2.0, 2.0, 2));
        assertEquals(MasteryStatus.INSUFFICIENT_DATA, GapAnalysisClassifier.classify(0.0, 0.0, 0));
        assertEquals(MasteryStatus.INSUFFICIENT_DATA, GapAnalysisClassifier.classify(100.0, 100.0, 1));

        // Zero possible points with sufficient count
        assertEquals(MasteryStatus.INSUFFICIENT_DATA, GapAnalysisClassifier.classify(0.0, 0.0, 5));

        // Boundary: exactly 80.0% -> STRENGTH
        assertEquals(MasteryStatus.STRENGTH, GapAnalysisClassifier.classify(80.0, 100.0, 4));
        assertEquals(MasteryStatus.STRENGTH, GapAnalysisClassifier.classify(4.0, 5.0, 5)); // 80.0%

        // Boundary: just below 80.0% (79.9%) -> DEVELOPING
        assertEquals(MasteryStatus.DEVELOPING, GapAnalysisClassifier.classify(79.9, 100.0, 4));

        // Boundary: exactly 60.0% -> DEVELOPING
        assertEquals(MasteryStatus.DEVELOPING, GapAnalysisClassifier.classify(60.0, 100.0, 5));
        assertEquals(MasteryStatus.DEVELOPING, GapAnalysisClassifier.classify(3.0, 5.0, 5)); // 60.0%

        // Boundary: just below 60.0% (59.9%) -> GAP
        assertEquals(MasteryStatus.GAP, GapAnalysisClassifier.classify(59.9, 100.0, 3));
        assertEquals(MasteryStatus.GAP, GapAnalysisClassifier.classify(0.0, 100.0, 3));

        // Custom thresholds test
        assertEquals(MasteryStatus.STRENGTH, GapAnalysisClassifier.classify(75.0, 100.0, 2, 70.0, 50.0, 2));
        assertEquals(MasteryStatus.INSUFFICIENT_DATA, GapAnalysisClassifier.classify(75.0, 100.0, 2, 70.0, 50.0, 5));
    }

    @Test
    @DisplayName("Trend calculation accurately determines UP, DOWN, and SAME transitions")
    void testTrendTransitions() {
        // Previous null -> SAME (initial baseline)
        assertEquals("SAME", GapAnalysisClassifier.calculateTrend(80.0, null));

        // Improvements -> UP
        assertEquals("UP", GapAnalysisClassifier.calculateTrend(80.0, 60.0));
        assertEquals("UP", GapAnalysisClassifier.calculateTrend(60.1, 60.0));

        // Declines -> DOWN
        assertEquals("DOWN", GapAnalysisClassifier.calculateTrend(50.0, 75.0));
        assertEquals("DOWN", GapAnalysisClassifier.calculateTrend(59.9, 60.0));

        // Unchanged -> SAME
        assertEquals("SAME", GapAnalysisClassifier.calculateTrend(75.0, 75.0));
        assertEquals("SAME", GapAnalysisClassifier.calculateTrend(75.02, 75.0)); // within floating delta tolerance
    }

    // =========================================================================
    // 2. Mastery Calculation (most recent answer after retake, unanswered = 0, no double count)
    // =========================================================================

    @Test
    @DisplayName("Mastery calculation uses most recent answer after retake, unanswered counts as 0, no double counting")
    void testMasteryCalculationRules() {
        // Get questions for topicQuiz1 (6 questions for topic 1)
        List<AssessmentQuestion> aqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);
        assertEquals(6, aqs.size());

        // --- ATTEMPT 1: Student answers 3 questions correctly, 1 wrong, leaves 2 unanswered ---
        var startResp1 = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());
        Long attempt1Id = startResp1.attemptId();

        List<AnswerSubmissionDto> sub1 = new ArrayList<>();
        // Q0: correct
        sub1.add(new AnswerSubmissionDto(aqs.get(0).getQuestion().getId(), getCorrectChoice(aqs.get(0).getQuestion()).getId()));
        // Q1: correct
        sub1.add(new AnswerSubmissionDto(aqs.get(1).getQuestion().getId(), getCorrectChoice(aqs.get(1).getQuestion()).getId()));
        // Q2: correct
        sub1.add(new AnswerSubmissionDto(aqs.get(2).getQuestion().getId(), getCorrectChoice(aqs.get(2).getQuestion()).getId()));
        // Q3: incorrect
        sub1.add(new AnswerSubmissionDto(aqs.get(3).getQuestion().getId(), getIncorrectChoice(aqs.get(3).getQuestion()).getId()));
        // Q4 & Q5 omitted (unanswered)

        studentAssessmentService.submitAttempt(attempt1Id, new SubmitAttemptRequest(sub1), studentA.getEmail());

        // Verify StudentTopicMastery for Topic 1:
        // 6 distinct questions asked in attempt 1: 3 earned out of 6 possible = 50.0% -> GAP
        StudentTopicMastery mastery1 = studentTopicMasteryRepository.findByStudentAndTopic(studentA, topic1).orElseThrow();
        assertEquals(50.0, mastery1.getMasteryPercent());
        assertEquals(MasteryStatus.GAP, mastery1.getStatus());
        assertNull(mastery1.getPreviousMasteryPercent());

        // --- ATTEMPT 2 (RETAKE): Student answers all 6 correctly ---
        var startResp2 = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());
        Long attempt2Id = startResp2.attemptId();
        assertNotEquals(attempt1Id, attempt2Id);

        List<AnswerSubmissionDto> sub2 = new ArrayList<>();
        for (AssessmentQuestion aq : aqs) {
            sub2.add(new AnswerSubmissionDto(aq.getQuestion().getId(), getCorrectChoice(aq.getQuestion()).getId()));
        }

        studentAssessmentService.submitAttempt(attempt2Id, new SubmitAttemptRequest(sub2), studentA.getEmail());

        // Verify Retake: Most recent answer per question is used (6 out of 6 = 100.0%)
        StudentTopicMastery mastery2 = studentTopicMasteryRepository.findByStudentAndTopic(studentA, topic1).orElseThrow();
        assertEquals(100.0, mastery2.getMasteryPercent());
        assertEquals(MasteryStatus.STRENGTH, mastery2.getStatus());
        assertEquals(50.0, mastery2.getPreviousMasteryPercent()); // Preserves previous mastery for trend
    }

    @Test
    @DisplayName("Two assessments containing the same question do NOT double count points")
    void testQuestionsAcrossMultipleAssessmentsDoNotDoubleCount() {
        // Diagnostic Assessment shares 3 questions with TopicQuiz 1
        List<AssessmentQuestion> diagAqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(diagnosticAssessment);
        List<AssessmentQuestion> topicAqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);

        // Find the 3 shared questions in Topic 1
        List<Long> sharedQuestionIds = diagAqs.stream()
                .map(aq -> aq.getQuestion().getId())
                .filter(qId -> topicAqs.stream().anyMatch(taq -> taq.getQuestion().getId().equals(qId)))
                .toList();
        assertEquals(3, sharedQuestionIds.size());

        // Student takes Diagnostic: answers the 3 shared questions correctly (plus other topics)
        var startDiag = studentAssessmentService.startOrResumeAttempt(diagnosticAssessment.getId(), studentA.getEmail());
        List<AnswerSubmissionDto> diagSub = new ArrayList<>();
        for (AssessmentQuestion aq : diagAqs) {
            diagSub.add(new AnswerSubmissionDto(aq.getQuestion().getId(), getCorrectChoice(aq.getQuestion()).getId()));
        }
        studentAssessmentService.submitAttempt(startDiag.attemptId(), new SubmitAttemptRequest(diagSub), studentA.getEmail());

        // Now Topic 1 has 3 distinct questions evaluated (100.0% -> STRENGTH)
        StudentTopicMastery masteryDiag = studentTopicMasteryRepository.findByStudentAndTopic(studentA, topic1).orElseThrow();
        assertEquals(100.0, masteryDiag.getMasteryPercent());
        assertEquals(MasteryStatus.STRENGTH, masteryDiag.getStatus());

        // Next, Student takes Topic Quiz 1 (contains the 3 shared questions plus 3 additional questions = 6 total)
        var startTopic = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());
        List<AnswerSubmissionDto> topicSub = new ArrayList<>();
        // Answer all 6 questions correctly
        for (AssessmentQuestion aq : topicAqs) {
            topicSub.add(new AnswerSubmissionDto(aq.getQuestion().getId(), getCorrectChoice(aq.getQuestion()).getId()));
        }
        studentAssessmentService.submitAttempt(startTopic.attemptId(), new SubmitAttemptRequest(topicSub), studentA.getEmail());

        // In Topic 1, distinct question count is 6 (NOT 3 + 6 = 9). Score is 6/6 = 100.0%.
        StudentTopicMastery masteryTopic = studentTopicMasteryRepository.findByStudentAndTopic(studentA, topic1).orElseThrow();
        assertEquals(100.0, masteryTopic.getMasteryPercent());
        assertEquals(MasteryStatus.STRENGTH, masteryTopic.getStatus());
    }

    // =========================================================================
    // 3. Re-analysis (Teacher Score Override proves future override support)
    // =========================================================================

    @Test
    @DisplayName("Teacher score override followed by recalculateForStudent updates mastery and status")
    void testTeacherScoreOverrideUpdatesMastery() {
        // Take topic quiz 1 and score 5/6 = 83.3% -> STRENGTH
        List<AssessmentQuestion> aqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);
        var startResp = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());

        List<AnswerSubmissionDto> subs = new ArrayList<>();
        for (int i = 0; i < aqs.size(); i++) {
            Question q = aqs.get(i).getQuestion();
            if (i < 5) {
                subs.add(new AnswerSubmissionDto(q.getId(), getCorrectChoice(q).getId()));
            } else {
                subs.add(new AnswerSubmissionDto(q.getId(), getIncorrectChoice(q).getId()));
            }
        }
        studentAssessmentService.submitAttempt(startResp.attemptId(), new SubmitAttemptRequest(subs), studentA.getEmail());

        StudentTopicMastery initialMastery = studentTopicMasteryRepository.findByStudentAndTopic(studentA, topic1).orElseThrow();
        assertEquals(83.3, initialMastery.getMasteryPercent());
        assertEquals(MasteryStatus.STRENGTH, initialMastery.getStatus());

        // Teacher overrides 2 correct answers down to 0 points (penalty for guessing or partial credit)
        List<Answer> answers = answerRepository.findByAttemptId(startResp.attemptId());
        answers.get(0).applyTeacherOverride(0.0, "Deducted for incorrect reasoning", teacher);
        answers.get(1).applyTeacherOverride(0.0, "Deducted for incorrect reasoning", teacher);
        answerRepository.saveAll(answers);

        // Run gap analysis recalculation
        gapAnalysisService.recalculateForStudent(studentA.getId());

        // New score: 3 out of 6 = 50.0% -> status drops from STRENGTH to GAP!
        StudentTopicMastery updatedMastery = studentTopicMasteryRepository.findByStudentAndTopic(studentA, topic1).orElseThrow();
        assertEquals(50.0, updatedMastery.getMasteryPercent());
        assertEquals(MasteryStatus.GAP, updatedMastery.getStatus());
        assertEquals(83.3, updatedMastery.getPreviousMasteryPercent());
    }

    // =========================================================================
    // 4. API Security & Ownership Tests
    // =========================================================================

    @Test
    @DisplayName("Teacher token is refused on student progress endpoints (403 Forbidden)")
    void testTeacherTokenForbiddenOnProgressEndpoints() throws Exception {
        mockMvc.perform(get("/api/student/progress")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("You do not have permission to access this resource")));

        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student B cannot see Student A's progress and answer history")
    void testStudentProgressIsolation() throws Exception {
        // Have Student A take Quiz 1 and get 100%
        List<AssessmentQuestion> aqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(topicQuiz1);
        var startResp = studentAssessmentService.startOrResumeAttempt(topicQuiz1.getId(), studentA.getEmail());
        List<AnswerSubmissionDto> subs = new ArrayList<>();
        for (AssessmentQuestion aq : aqs) {
            subs.add(new AnswerSubmissionDto(aq.getQuestion().getId(), getCorrectChoice(aq.getQuestion()).getId()));
        }
        studentAssessmentService.submitAttempt(startResp.attemptId(), new SubmitAttemptRequest(subs), studentA.getEmail());

        // Student A progress endpoint: shows Topic 1 with 100% STRENGTH and 6 questions answered
        mockMvc.perform(get("/api/student/progress")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0].masteryPercent", is(100.0)))
                .andExpect(jsonPath("$.topics[0].status", is("STRENGTH")))
                .andExpect(jsonPath("$.topics[0].questionsAnswered", is(6)))
                .andExpect(jsonPath("$.strengths", hasSize(1)));

        // Student B progress endpoint: Student B has taken NO attempts yet
        // All topics must have 0 questions answered and INSUFFICIENT_DATA, strengths empty, studyNext null
        mockMvc.perform(get("/api/student/progress")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0].questionsAnswered", is(0)))
                .andExpect(jsonPath("$.topics[0].status", is("INSUFFICIENT_DATA")))
                .andExpect(jsonPath("$.strengths", hasSize(0)))
                .andExpect(jsonPath("$.studyNext").doesNotExist());

        // Student B topic progress detail: has empty answer history
        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionsAnswered", is(0)))
                .andExpect(jsonPath("$.history", hasSize(0)));

        // Student A topic progress detail: has 6 history items, no correct answers leaked for unsubmitted questions
        mockMvc.perform(get("/api/student/progress/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionsAnswered", is(6)))
                .andExpect(jsonPath("$.history", hasSize(6)))
                .andExpect(jsonPath("$.history[0].isCorrect", is(true)))
                .andExpect(jsonPath("$.history[0].questionText", notNullValue()))
                .andExpect(jsonPath("$.history[0].explanation").doesNotExist())
                .andExpect(jsonPath("$.history[0].choices").doesNotExist());
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

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


package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.GradeAnswerRequest;
import com.learningpal.dto.CreateInterventionRequest;
import com.learningpal.dto.UpdateInterventionRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisService;
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
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Teacher Student View: Student Detail, Grade Override, and Interventions Tests")
public class TeacherStudentViewTests {

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
    private AssessmentQuestionRepository assessmentQuestionRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ChoiceRepository choiceRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private GapAnalysisService gapAnalysisService;

    private Institution instAlpha;

    private User teacherA;
    private User teacherB;
    private User student1;
    private User student2;

    private Subject subject;
    private Subject foreignSubject;
    private Topic topic1;
    private Topic topic2;
    private Topic foreignTopic;

    private Assessment diagnosticAssessment;
    private Assessment quizAssessment;
    private Question q1;
    private Question q2;
    private Double q1Points;
    private Double q2Points;
    private Choice c1Correct;
    private Choice c1Wrong;
    private Choice c2Correct;

    private ClassEntity classA;
    private ClassEntity classB;
    private ClassEntity archivedClass;

    private String teacherAToken;
    private String teacherBToken;
    private String student1Token;

    @BeforeEach
    void setUp() {
        interventionRepository.deleteAll();
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        studentTopicMasteryRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classEntityRepository.deleteAll();

        // 1. Institutions
        instAlpha = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Pilot Academy", "PILOT-2026", InstitutionStatus.ACTIVE)));

        // 2. Users
        teacherA = getOrCreateUser("tsv.teacher_a@alpha.edu", Role.TEACHER, UserStatus.ACTIVE, instAlpha);
        teacherB = getOrCreateUser("tsv.teacher_b@alpha.edu", Role.TEACHER, UserStatus.ACTIVE, instAlpha);
        student1 = getOrCreateUser("tsv.student1@alpha.edu", Role.STUDENT, UserStatus.ACTIVE, instAlpha);
        student2 = getOrCreateUser("tsv.student2@alpha.edu", Role.STUDENT, UserStatus.ACTIVE, instAlpha);

        teacherAToken = jwtService.generateToken(teacherA);
        teacherBToken = jwtService.generateToken(teacherB);
        student1Token = jwtService.generateToken(student1);

        // 3. Subjects & Topics (reuse seeded pilot subject)
        subject = subjectRepository.findByCode("C_PROG_INTRO").orElseThrow();
        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        assertTrue(topics.size() >= 2, "Expected at least 2 seeded topics");
        topic1 = topics.get(0);
        topic2 = topics.get(1);

        foreignSubject = subjectRepository.findByCode("FOREIGN_SUB").orElseGet(() ->
                subjectRepository.save(new Subject("FOREIGN_SUB", "Foreign Subject", "Unrelated curriculum")));
        foreignTopic = topicRepository.findBySubjectOrderByDisplayOrderAsc(foreignSubject).stream()
                .findFirst()
                .orElseGet(() -> topicRepository.save(new Topic(foreignSubject, "Foreign Topic", "Desc", 1)));

        // 4. Assessments & Questions
        diagnosticAssessment = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED).stream()
                .filter(a -> a.getTitle().toLowerCase().contains("diagnostic"))
                .findFirst()
                .orElseThrow();

        quizAssessment = assessmentRepository.findBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED).stream()
                .filter(a -> !a.getTitle().toLowerCase().contains("diagnostic"))
                .findFirst()
                .orElseThrow();

        List<AssessmentQuestion> diagQuestions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(diagnosticAssessment);
        assertTrue(diagQuestions.size() >= 2, "Expected at least 2 questions in diagnostic");
        q1 = questionRepository.findById(diagQuestions.get(0).getQuestion().getId()).orElseThrow();
        q2 = questionRepository.findById(diagQuestions.get(1).getQuestion().getId()).orElseThrow();
        q1Points = q1.getPoints();
        q2Points = q2.getPoints();

        List<Choice> q1Choices = choiceRepository.findByQuestion(q1);
        c1Correct = q1Choices.stream().filter(Choice::isCorrect).findFirst().orElseThrow();
        c1Wrong = q1Choices.stream().filter(c -> !c.isCorrect()).findFirst().orElseThrow();

        List<Choice> q2Choices = choiceRepository.findByQuestion(q2);
        c2Correct = q2Choices.stream().filter(Choice::isCorrect).findFirst().orElseThrow();

        // 5. Classes
        classA = classEntityRepository.save(new ClassEntity(instAlpha, subject, teacherA, "Section Alpha 1", "ALP001"));
        classB = classEntityRepository.save(new ClassEntity(instAlpha, subject, teacherB, "Section Beta 1", "ALP002"));

        archivedClass = new ClassEntity(instAlpha, subject, teacherA, "Section Archived", "ALP003");
        archivedClass.setStatus(ClassStatus.ARCHIVED);
        archivedClass.setEnrollmentOpen(false);
        archivedClass = classEntityRepository.save(archivedClass);

        // 6. Enrollments: student1 in classA, student2 in classB
        enrollmentRepository.save(new Enrollment(student1, classA));
        enrollmentRepository.save(new Enrollment(student2, classB));
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

    @Test
    @DisplayName("Student Detail: Returns profile, mastery trends, missed diagnostic questions, and only attempts taken in THIS class")
    void testStudentDetailReturnsProfileTopicMasteriesMissedQuestionsAndClassAttemptsOnly() throws Exception {
        // Attempt 1: Taken in Class A (diagnostic assessment)
        Attempt attemptClassA = new Attempt(student1, diagnosticAssessment, 1);
        attemptClassA.setClassId(classA.getId());
        attemptClassA.setStatus(AttemptStatus.SUBMITTED);
        attemptClassA.setTotalScore(0.0);
        attemptClassA.setMaxScore(10.0);
        attemptClassA.setSubmittedAt(Instant.now().minusSeconds(3600));
        attemptClassA = attemptRepository.save(attemptClassA);

        Answer ans1 = new Answer(attemptClassA, q1, c1Wrong);
        ans1.applyAutoScore(0.0);
        answerRepository.save(ans1);

        Answer ans2 = new Answer(attemptClassA, q2, (Choice) null);
        ans2.applyAutoScore(0.0);
        answerRepository.save(ans2);

        // Attempt 2: Taken in Class B (quiz assessment) - should NOT show up in Class A's student view
        Attempt attemptClassB = new Attempt(student1, quizAssessment, 1);
        attemptClassB.setClassId(classB.getId());
        attemptClassB.setStatus(AttemptStatus.SUBMITTED);
        attemptClassB.setTotalScore(5.0);
        attemptClassB.setMaxScore(5.0);
        attemptClassB.setSubmittedAt(Instant.now());
        attemptRepository.save(attemptClassB);

        // Topic masteries recalculated
        gapAnalysisService.recalculateForStudent(student1.getId());

        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/students/" + student1.getId())
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.studentId").value(student1.getId()))
                .andExpect(jsonPath("$.profile.name").value("tsv.student1"))
                .andExpect(jsonPath("$.profile.email").value("tsv.student1@alpha.edu"))
                .andExpect(jsonPath("$.profile.needsAttention").value(true))
                .andExpect(jsonPath("$.topicMasteries", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.missedQuestionsByTopic", notNullValue()))
                // Attempts: must ONLY contain attemptClassA, not attemptClassB
                .andExpect(jsonPath("$.attempts", hasSize(1)))
                .andExpect(jsonPath("$.attempts[0].attemptId").value(attemptClassA.getId()))
                .andExpect(jsonPath("$.diagnosticTrend", hasSize(1)));
    }

    @Test
    @DisplayName("Student Detail: Returns 404 when student is not enrolled in the class")
    void testStudentDetailReturns404ForUnenrolledStudent() throws Exception {
        // student2 is enrolled in classB, not classA
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/students/" + student2.getId())
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Grade Override Workflow: Overrides score, recalculates total and topic mastery, visible in student result")
    void testGradeOverrideWorkflowRecalculatesTotalScoreAndGapAnalysis() throws Exception {
        Attempt attempt = new Attempt(student1, diagnosticAssessment, 1);
        attempt.setClassId(classA.getId());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setTotalScore(q2Points);
        attempt.setMaxScore(q1Points + q2Points);
        attempt.setSubmittedAt(Instant.now().minusSeconds(1800));
        attempt = attemptRepository.save(attempt);

        Answer ans1 = new Answer(attempt, q1, c1Wrong);
        ans1.applyAutoScore(0.0);
        ans1 = answerRepository.save(ans1);

        Answer ans2 = new Answer(attempt, q2, c2Correct);
        ans2.applyAutoScore(q2Points);
        answerRepository.save(ans2);

        gapAnalysisService.recalculateForStudent(student1.getId());

        // Teacher grants partial credit
        double partialCredit = q1Points * 0.8;
        GradeAnswerRequest gradeReq = new GradeAnswerRequest(partialCredit, "Strong reasoning demonstrated.");

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans1.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(gradeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer.answerId").value(ans1.getId()))
                .andExpect(jsonPath("$.answer.autoScore").value(0.0))
                .andExpect(jsonPath("$.answer.teacherScore").value(partialCredit))
                .andExpect(jsonPath("$.answer.finalScore").value(partialCredit))
                .andExpect(jsonPath("$.answer.adjusted").value(true))
                .andExpect(jsonPath("$.answer.teacherComment").value("Strong reasoning demonstrated."))
                .andExpect(jsonPath("$.newAttemptTotalScore").value(q2Points + partialCredit));

        // Verify Student Result endpoint reflects adjustment
        mockMvc.perform(get("/api/student/attempts/" + attempt.getId() + "/result")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionReviews[0].adjusted").value(true))
                .andExpect(jsonPath("$.questionReviews[0].teacherComment").value("Strong reasoning demonstrated."))
                .andExpect(jsonPath("$.questionReviews[0].teacherScore").value(partialCredit))
                .andExpect(jsonPath("$.questionReviews[0].pointsEarned").value(partialCredit));
    }

    @Test
    @DisplayName("Grade Override Revert: Passing null teacherScore restores autoScore and recalculates total")
    void testGradeOverrideRevertRestoresAutoScore() throws Exception {
        Attempt attempt = new Attempt(student1, diagnosticAssessment, 1);
        attempt.setClassId(classA.getId());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setTotalScore(1.0);
        attempt.setMaxScore(10.0);
        attempt.setSubmittedAt(Instant.now().minusSeconds(1000));
        attempt = attemptRepository.save(attempt);

        Answer ans1 = new Answer(attempt, q1, c1Wrong);
        ans1.applyAutoScore(0.0);
        ans1.applyTeacherOverride(1.0, "Old comment", teacherA);
        ans1 = answerRepository.save(ans1);

        // Revert by sending null score
        GradeAnswerRequest revertReq = new GradeAnswerRequest(null, "Reverted back to auto-grade.");

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans1.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(revertReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer.teacherScore").doesNotExist())
                .andExpect(jsonPath("$.answer.finalScore").value(0.0))
                .andExpect(jsonPath("$.answer.adjusted").value(false))
                .andExpect(jsonPath("$.answer.teacherComment").value("Reverted back to auto-grade."));

        Answer revertedAns = answerRepository.findById(ans1.getId()).orElseThrow();
        assertNull(revertedAns.getTeacherScore());
        assertEquals(0.0, revertedAns.getFinalScore(), 0.01);
    }

    @Test
    @DisplayName("Grade Override Validation: Rejects negative score, score > max, >2 decimals, comment >500 chars, and in-progress attempt")
    void testGradeOverrideValidationRules() throws Exception {
        Attempt attempt = new Attempt(student1, diagnosticAssessment, 1);
        attempt.setClassId(classA.getId());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setTotalScore(5.0);
        attempt.setMaxScore(10.0);
        attempt.setSubmittedAt(Instant.now());
        attempt = attemptRepository.save(attempt);

        Answer ans1 = new Answer(attempt, q1, c1Wrong);
        ans1.applyAutoScore(0.0);
        ans1 = answerRepository.save(ans1);

        // 1. Negative score
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans1.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(-0.5, "Negative"))))
                .andExpect(status().isBadRequest());

        // 2. Score > question points
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans1.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(q1Points + 5.0, "Too high"))))
                .andExpect(status().isBadRequest());

        // 3. More than 2 decimal places (1.234)
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans1.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(0.234, "Too precise"))))
                .andExpect(status().isBadRequest());

        // 4. Comment > 500 characters
        String longComment = "a".repeat(501);
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans1.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(1.0, longComment))))
                .andExpect(status().isBadRequest());

        // 5. Attempt in progress (unsubmitted)
        Attempt inProgressAttempt = new Attempt(student1, diagnosticAssessment, 1);
        inProgressAttempt.setClassId(classA.getId());
        inProgressAttempt.setStatus(AttemptStatus.IN_PROGRESS);
        inProgressAttempt = attemptRepository.save(inProgressAttempt);

        Answer inProgAns = new Answer(inProgressAttempt, q1, c1Wrong);
        inProgAns.applyAutoScore(0.0);
        inProgAns = answerRepository.save(inProgAns);

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + inProgressAttempt.getId() + "/answers/" + inProgAns.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(1.0, "Valid score"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Pedagogical Interventions: Creation, filtering, completion, outcome boundary, and immutability")
    void testInterventionsLifecycleAndOutcomes() throws Exception {
        // Baseline mastery: 40.0% for topic1 in classA
        StudentTopicMastery stm = new StudentTopicMastery(student1, classA, topic1, 40.0, MasteryStatus.GAP);
        studentTopicMasteryRepository.save(stm);

        // 1. Create intervention: masteryAtStart should be snapshotted at 40.0
        CreateInterventionRequest createReq = new CreateInterventionRequest(
                topic1.getId(),
                InterventionType.ONE_ON_ONE,
                "Schedule 30min session to review loop termination.",
                LocalDate.now().plusDays(3)
        );

        String responseStr = mockMvc.perform(post("/api/teacher/classes/" + classA.getId() + "/students/" + student1.getId() + "/interventions")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.topicId").value(topic1.getId()))
                .andExpect(jsonPath("$.type").value("ONE_ON_ONE"))
                .andExpect(jsonPath("$.status").value("PLANNED"))
                .andExpect(jsonPath("$.masteryAtStart").value(40.0))
                .andExpect(jsonPath("$.masteryAtCompletion").doesNotExist())
                .andExpect(jsonPath("$.outcome").value("NO_NEW_DATA"))
                .andReturn().getResponse().getContentAsString();

        Long interventionId = objectMapper.readTree(responseStr).get("id").asLong();

        // 2. Query class interventions: filter by status=PLANNED
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/interventions?status=PLANNED")
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(interventionId))
                .andExpect(jsonPath("$[0].outcome").value("NO_NEW_DATA"));

        // 3. Complete intervention when student mastery improved by +10.0%
        // First record a new attempt submitted after intervention creation so outcome evaluates
        Attempt postInterventionAttempt = new Attempt(student1, quizAssessment, 1);
        postInterventionAttempt.setClassId(classA.getId());
        postInterventionAttempt.setStatus(AttemptStatus.SUBMITTED);
        postInterventionAttempt.setTotalScore(5.0);
        postInterventionAttempt.setMaxScore(5.0);
        postInterventionAttempt.setSubmittedAt(java.time.Instant.now().plusSeconds(2));
        attemptRepository.save(postInterventionAttempt);

        stm.setMasteryPercent(50.0); // 50.0 - 40.0 = +10.0 -> IMPROVED
        studentTopicMasteryRepository.save(stm);

        UpdateInterventionRequest doneReq = new UpdateInterventionRequest(
                "Session conducted successfully. Student grasped loop conditions.",
                LocalDate.now(),
                InterventionStatus.DONE
        );

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/interventions/" + interventionId)
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(doneReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.masteryAtCompletion").value(50.0))
                .andExpect(jsonPath("$.changeSinceCompletion").value(0.0))
                .andExpect(jsonPath("$.outcome").value("IMPROVED"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        // 4. Immutability check: once DONE, cannot be reverted back to PLANNED
        UpdateInterventionRequest reopenReq = new UpdateInterventionRequest(
                "Try reopening.",
                null,
                InterventionStatus.PLANNED
        );
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/interventions/" + interventionId)
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reopenReq)))
                .andExpect(status().isBadRequest());

        // 5. Cannot create intervention in ARCHIVED class
        mockMvc.perform(post("/api/teacher/classes/" + archivedClass.getId() + "/students/" + student1.getId() + "/interventions")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isBadRequest());

        // 6. Cannot create intervention with topic from a different subject
        CreateInterventionRequest foreignTopicReq = new CreateInterventionRequest(
                foreignTopic.getId(),
                InterventionType.EXTRA_PRACTICE,
                "Irrelevant topic",
                LocalDate.now()
        );
        mockMvc.perform(post("/api/teacher/classes/" + classA.getId() + "/students/" + student1.getId() + "/interventions")
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(foreignTopicReq)))
                .andExpect(status().isBadRequest());

        // 7. Verify no DELETE endpoint exists (soft-cancellation only)
        mockMvc.perform(delete("/api/teacher/classes/" + classA.getId() + "/interventions/" + interventionId)
                        .header("Authorization", "Bearer " + teacherAToken))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Tenant & Ownership Isolation: Teacher B and students cannot access Teacher A's students, grading, or interventions")
    void testTenantAndOwnershipIsolation() throws Exception {
        Attempt attempt = new Attempt(student1, diagnosticAssessment, 1);
        attempt.setClassId(classA.getId());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setTotalScore(0.0);
        attempt.setMaxScore(10.0);
        attempt.setSubmittedAt(Instant.now());
        attempt = attemptRepository.save(attempt);

        Answer ans = new Answer(attempt, q1, c1Wrong);
        ans.applyAutoScore(0.0);
        ans = answerRepository.save(ans);

        // Teacher B tries to access Student 1 detail under Class A -> 404 (does not own Class A)
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/students/" + student1.getId())
                        .header("Authorization", "Bearer " + teacherBToken))
                .andExpect(status().isNotFound());

        // Teacher B tries to grade Student 1's attempt -> 404
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans.getId() + "/grade")
                        .header("Authorization", "Bearer " + teacherBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(1.0, "Unauthorized"))))
                .andExpect(status().isNotFound());

        // Student tries to call teacher grading endpoint -> 403 Forbidden
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/attempts/" + attempt.getId() + "/answers/" + ans.getId() + "/grade")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(1.0, "Self grade"))))
                .andExpect(status().isForbidden());

        // Student tries to view student detail endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/students/" + student1.getId())
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());
    }
}

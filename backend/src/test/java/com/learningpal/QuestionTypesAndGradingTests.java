package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.DatabaseMigrationRunner;
import com.learningpal.config.JwtService;
import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.EnumerationNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Enumeration & Essay Question Types, Rule/Rubric Grading, Mastery & Validation Lab Tests")
public class QuestionTypesAndGradingTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private DatabaseMigrationRunner migrationRunner;

    @Autowired private InstitutionRepository institutionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private TopicRepository topicRepository;
    @Autowired private ClassEntityRepository classEntityRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private ChoiceRepository choiceRepository;
    @Autowired private QuestionAcceptedAnswerRepository acceptedAnswerRepository;
    @Autowired private EssayRubricCriterionRepository rubricCriterionRepository;
    @Autowired private AssessmentRepository assessmentRepository;
    @Autowired private AssessmentQuestionRepository assessmentQuestionRepository;
    @Autowired private AttemptRepository attemptRepository;
    @Autowired private AnswerRepository answerRepository;
    @Autowired private StudentTopicMasteryRepository masteryRepository;

    private User teacher;
    private User student;
    private String teacherToken;
    private String studentToken;
    private Subject subject;
    private Topic topic;
    private ClassEntity cls;

    @BeforeEach
    void setUp() {
        long s = System.nanoTime();
        Institution inst = institutionRepository.save(new Institution("QT Inst " + s, "QTI_" + s));
        teacher = userRepository.save(new User("Teacher QT", "tqt_" + s + "@edu.test",
                passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, inst));
        student = userRepository.save(new User("Student QT", "sqt_" + s + "@edu.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT, UserStatus.ACTIVE, inst));

        teacherToken = jwtService.generateToken(teacher);
        studentToken = jwtService.generateToken(student);

        subject = subjectRepository.save(new Subject("QT_" + s, "Question Types Subject", "Desc", teacher));
        topic = topicRepository.save(new Topic(subject, "Pointers & Memory", "Pointers", 1));
        cls = classEntityRepository.save(new ClassEntity(inst, subject, teacher, "QT Section", "QT" + (s % 10000)));
        enrollmentRepository.save(new Enrollment(student, cls));
    }

    @Test
    @DisplayName("Enumeration normalization: case, whitespace, punctuation, Unicode NFKC, explicit number words, and variant limits")
    void testEnumerationNormalizerRulesAndLimits() throws Exception {
        assertEquals("hello world", EnumerationNormalizer.normalize("  (Hello   WORLD!)  "));
        assertEquals("stdio.h", EnumerationNormalizer.normalize("  \"stdio.h\" "));
        assertEquals("cafe", EnumerationNormalizer.normalize("caf\u0065"));
        // NFKC compatibility normalization (fullwidth -> ASCII)
        assertEquals("printf", EnumerationNormalizer.normalize("\uFF50\uFF52\uFF49\uFF4E\uFF54\uFF46"));
        // Number words match ONLY when explicitly listed in accepted variants
        assertTrue(EnumerationNormalizer.matchesAny("  One. ", List.of("1", "one")));
        assertFalse(EnumerationNormalizer.matchesAny("one", List.of("1")));
        assertFalse(EnumerationNormalizer.matchesAny("", List.of("1")));
        assertFalse(EnumerationNormalizer.matchesAny(null, List.of("1")));

        // SEC2-003: numeric signs, decimals, and trailing percent must not be stripped
        assertEquals("-3", EnumerationNormalizer.normalize("  \"-3\" "));
        assertFalse(EnumerationNormalizer.matchesAny("-3", List.of("3")));
        assertTrue(EnumerationNormalizer.matchesAny(" -3 ", List.of("-3")));
        assertEquals("+5", EnumerationNormalizer.normalize("+5"));
        assertFalse(EnumerationNormalizer.matchesAny("+5", List.of("5")));
        assertEquals("50%", EnumerationNormalizer.normalize("  50%! "));
        assertFalse(EnumerationNormalizer.matchesAny("50%", List.of("50")));
        assertTrue(EnumerationNormalizer.matchesAny(" 50% ", List.of("50%")));
        assertEquals(".5", EnumerationNormalizer.normalize(".5"));
        assertFalse(EnumerationNormalizer.matchesAny(".5", List.of("5")));
        assertEquals("1.5", EnumerationNormalizer.normalize("1.5"));
        assertFalse(EnumerationNormalizer.matchesAny("1.5", List.of("15")));

        // Variant limit validation: 0 variants -> 400
        CreateQuestionRequest emptyVariants = new CreateQuestionRequest(
                topic.getId(), "Name a loop?", "for/while",
                DifficultyLevel.EASY, 1.0, null, QuestionType.ENUMERATION, List.of(), null
        );
        mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyVariants)))
                .andExpect(status().isBadRequest());

        // 11 variants -> 400
        List<String> eleven = List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11");
        CreateQuestionRequest tooManyVariants = new CreateQuestionRequest(
                topic.getId(), "Name a digit?", "digits",
                DifficultyLevel.EASY, 1.0, null, QuestionType.ENUMERATION, eleven, null
        );
        mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooManyVariants)))
                .andExpect(status().isBadRequest());

        // Variant > 100 chars -> 400
        CreateQuestionRequest tooLongVariant = new CreateQuestionRequest(
                topic.getId(), "Name?", "expl",
                DifficultyLevel.EASY, 1.0, null, QuestionType.ENUMERATION, List.of("a".repeat(101)), null
        );
        mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooLongVariant)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Enumeration auto-scoring at submit: listed variants get full points, wrong gets 0, results expose acceptedAnswers")
    void testEnumerationAutoScoringAndResults() throws Exception {
        CreateQuestionRequest req = new CreateQuestionRequest(
                topic.getId(),
                "What header defines printf?", "stdio.h declares printf.",
                DifficultyLevel.EASY, 2.0, null, QuestionType.ENUMERATION,
                List.of("stdio.h", "<stdio.h>"), null
        );

        MvcResult qRes = mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("ENUMERATION")))
                .andExpect(jsonPath("$.acceptedAnswers", hasSize(2)))
                .andReturn();

        TeacherQuestionDto createdQ = objectMapper.readValue(qRes.getResponse().getContentAsString(), TeacherQuestionDto.class);

        // Wrong variant question
        Question enumQ2 = questionRepository.save(new Question(topic, QuestionType.ENUMERATION, "Keyword for constant?", "const", DifficultyLevel.EASY, 2.0, teacher));
        enumQ2.setSubject(subject);
        enumQ2 = questionRepository.save(enumQ2);
        enumQ2.setLineageId(enumQ2.getId());
        enumQ2 = questionRepository.save(enumQ2);
        acceptedAnswerRepository.save(new QuestionAcceptedAnswer(enumQ2, "const", 0));

        Assessment quiz = assessmentRepository.save(new Assessment(subject, "Enum Quiz", "Desc", AssessmentStatus.PUBLISHED, teacher));
        Question enumQ1 = questionRepository.findById(createdQ.id()).orElseThrow();
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, enumQ1, 1));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, enumQ2, 2));

        // Start attempt -> verify acceptedAnswers NOT leaked in quiz-taking payload
        MvcResult startRes = mockMvc.perform(post("/api/student/assessments/" + quiz.getId() + "/attempts")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questions[0].type", is("ENUMERATION")))
                .andExpect(jsonPath("$.questions[0].acceptedAnswers").doesNotExist())
                .andReturn();
        Long attemptId = objectMapper.readTree(startRes.getResponse().getContentAsString()).get("attemptId").asLong();

        // Submit > 200 chars -> 400
        SubmitAttemptRequest tooLong = new SubmitAttemptRequest(List.of(
                new AnswerSubmissionDto(enumQ1.getId(), null, "x".repeat(201))
        ));
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooLong)))
                .andExpect(status().isBadRequest());

        // Submit valid: Q1 normalized match ("  <STDIO.H>! "), Q2 wrong ("let")
        SubmitAttemptRequest valid = new SubmitAttemptRequest(List.of(
                new AnswerSubmissionDto(enumQ1.getId(), null, "  <STDIO.H>! "),
                new AnswerSubmissionDto(enumQ2.getId(), null, "let")
        ));
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(valid)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(2.0)))
                .andExpect(jsonPath("$.maxScore", is(4.0)))
                .andExpect(jsonPath("$.awaitingTeacherGrading", is(false)))
                .andExpect(jsonPath("$.questionReviews[0].isCorrect", is(true)))
                .andExpect(jsonPath("$.questionReviews[0].acceptedAnswers", contains("stdio.h", "<stdio.h>")))
                .andExpect(jsonPath("$.questionReviews[1].isCorrect", is(false)))
                .andExpect(jsonPath("$.questionReviews[1].pointsEarned", is(0.0)));
    }

    @Test
    @DisplayName("Essay rubric validation (1-8 criteria, positive int, sum==points) and versioning when answers exist")
    void testEssayRubricValidationAndVersioning() throws Exception {
        // Points mismatch -> 400
        CreateQuestionRequest mismatch = new CreateQuestionRequest(
                topic.getId(), "Explain pointers.", null,
                DifficultyLevel.HARD, 99.0, null, QuestionType.ESSAY, null,
                List.of(new EssayRubricCriterionDto(null, "Accuracy", "Correctness", 5, 0))
        );
        mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mismatch)))
                .andExpect(status().isBadRequest());

        // 0 criteria -> 400
        CreateQuestionRequest noCriteria = new CreateQuestionRequest(
                topic.getId(), "Explain pointers.", null,
                DifficultyLevel.HARD, null, null, QuestionType.ESSAY, null, List.of()
        );
        mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noCriteria)))
                .andExpect(status().isBadRequest());

        // Valid essay with 2 criteria (3 + 2 = 5 pts)
        CreateQuestionRequest validEssay = new CreateQuestionRequest(
                topic.getId(), "Explain pass-by-reference in C.", null,
                DifficultyLevel.MEDIUM, null, null, QuestionType.ESSAY, null,
                List.of(
                        new EssayRubricCriterionDto(null, "Concept", "Pointer syntax", 3, 0),
                        new EssayRubricCriterionDto(null, "Example", "Working swap", 2, 1)
                )
        );
        MvcResult createdRes = mockMvc.perform(post("/api/teacher/subjects/" + subject.getId() + "/questions")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validEssay)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("ESSAY")))
                .andExpect(jsonPath("$.points", is(5.0)))
                .andExpect(jsonPath("$.rubricCriteria", hasSize(2)))
                .andReturn();

        TeacherQuestionDto v1Dto = objectMapper.readValue(createdRes.getResponse().getContentAsString(), TeacherQuestionDto.class);
        Question v1 = questionRepository.findById(v1Dto.id()).orElseThrow();

        // Simulate existing student answer on v1
        Assessment quiz = assessmentRepository.save(new Assessment(subject, "Essay Quiz", "Desc", AssessmentStatus.PUBLISHED, teacher));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, v1, 1));
        Attempt att = new Attempt(student, quiz, 1);
        att.setClassId(cls.getId());
        att.setStatus(AttemptStatus.SUBMITTED);
        att = attemptRepository.save(att);
        answerRepository.save(new Answer(att, v1, "Student essay text"));

        // Edit v1 -> creates v2 with new rubric, retires v1
        UpdateQuestionRequest updateReq = new UpdateQuestionRequest(
                topic.getId(), "Explain pass-by-reference in C (v2).", "Model answer",
                DifficultyLevel.HARD, null, null, QuestionType.ESSAY, null,
                List.of(
                        new EssayRubricCriterionDto(null, "Concept", "Pointer syntax", 4, 0),
                        new EssayRubricCriterionDto(null, "Example", "Working swap", 4, 1)
                )
        );
        MvcResult v2Res = mockMvc.perform(put("/api/teacher/subjects/" + subject.getId() + "/questions/" + v1.getId())
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version", is(2)))
                .andExpect(jsonPath("$.points", is(8.0)))
                .andExpect(jsonPath("$.rubricCriteria", hasSize(2)))
                .andReturn();

        TeacherQuestionDto v2Dto = objectMapper.readValue(v2Res.getResponse().getContentAsString(), TeacherQuestionDto.class);
        Question v1Reloaded = questionRepository.findById(v1.getId()).orElseThrow();
        assertEquals(QuestionStatus.RETIRED, v1Reloaded.getStatus());
        assertEquals(v1.getLineageId(), questionRepository.findById(v2Dto.id()).orElseThrow().getLineageId());
        assertEquals(2, rubricCriterionRepository.findByQuestionOrderByDisplayOrderAsc(questionRepository.findById(v2Dto.id()).orElseThrow()).size());
    }

    @Test
    @DisplayName("Essay grading writes teacherScore via single grading method, excludes ungraded from mastery, and regrade updates mastery")
    void testEssayGradingMasteryExclusionAndRegrade() throws Exception {
        // 1 MCQ (2 pts) + 1 Essay (4 + 4 = 8 pts) in same topic
        Question mcq = createMcqQuestion("MCQ 1", 2.0, true);
        Question essay = questionRepository.save(new Question(topic, QuestionType.ESSAY, "Discuss memory leaks.", null, DifficultyLevel.HARD, 8.0, teacher));
        essay.setSubject(subject);
        essay = questionRepository.save(essay);
        essay.setLineageId(essay.getId());
        essay = questionRepository.save(essay);
        EssayRubricCriterion c1 = rubricCriterionRepository.save(new EssayRubricCriterion(essay, "Definition", "Clear def", 4, 0));
        EssayRubricCriterion c2 = rubricCriterionRepository.save(new EssayRubricCriterion(essay, "Prevention", "free()", 4, 1));

        Assessment quiz = assessmentRepository.save(new Assessment(subject, "Mixed Quiz", "Desc", AssessmentStatus.PUBLISHED, teacher));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, mcq, 1));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, essay, 2));

        MvcResult startRes = mockMvc.perform(post("/api/student/assessments/" + quiz.getId() + "/attempts")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long attemptId = objectMapper.readTree(startRes.getResponse().getContentAsString()).get("attemptId").asLong();
        Choice correctMcq = choiceRepository.findByQuestion(mcq).stream().filter(Choice::isCorrect).findFirst().orElseThrow();

        SubmitAttemptRequest submit = new SubmitAttemptRequest(List.of(
                new AnswerSubmissionDto(mcq.getId(), correctMcq.getId(), null),
                new AnswerSubmissionDto(essay.getId(), null, "Memory leaks happen when malloc is never freed.")
        ));
        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submit)))
                .andExpect(status().isOk());

        // Before grading: awaitingTeacherGrading = true, rubricScores hidden, mastery = 100% (essay excluded, NOT 0!)
        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.awaitingTeacherGrading", is(true)))
                .andExpect(jsonPath("$.ungradedEssayCount", is(1)))
                .andExpect(jsonPath("$.score", is(2.0)))
                .andExpect(jsonPath("$.questionReviews[1].graded", is(false)))
                .andExpect(jsonPath("$.questionReviews[1].rubricScores", hasSize(0)));

        StudentTopicMastery masteryBefore = masteryRepository
                .findByStudentIdAndClassroomIdAndTopicId(student.getId(), cls.getId(), topic.getId())
                .orElseThrow();
        assertEquals(100.0, masteryBefore.getMasteryPercent(), 0.01);

        // Fetch teacher attempt review -> find essay answerId
        MvcResult reviewRes = mockMvc.perform(get("/api/teacher/classes/" + cls.getId() + "/attempts/" + attemptId)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.awaitingTeacherGrading", is(true)))
                .andExpect(jsonPath("$.ungradedEssayCount", is(1)))
                .andReturn();
        Long essayAnswerId = objectMapper.readTree(reviewRes.getResponse().getContentAsString())
                .get("answers").get(1).get("answerId").asLong();

        // Bounds rejected (> maxPoints) -> 400
        GradeAnswerRequest outOfBounds = new GradeAnswerRequest(null, "Too high",
                List.of(new CriterionScoreRequest(c1.getId(), 5), new CriterionScoreRequest(c2.getId(), 2)));
        mockMvc.perform(put("/api/teacher/classes/" + cls.getId() + "/attempts/" + attemptId + "/answers/" + essayAnswerId + "/grade")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(outOfBounds)))
                .andExpect(status().isBadRequest());

        // Grade essay: 3 + 1 = 4 pts -> totalScore = 2 + 4 = 6 / 10 -> mastery = 60%
        GradeAnswerRequest validGrade = new GradeAnswerRequest(null, "Good start, add free() example.",
                List.of(new CriterionScoreRequest(c1.getId(), 3), new CriterionScoreRequest(c2.getId(), 1)));
        mockMvc.perform(put("/api/teacher/classes/" + cls.getId() + "/attempts/" + attemptId + "/answers/" + essayAnswerId + "/grade")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validGrade)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer.teacherScore", is(4.0)))
                .andExpect(jsonPath("$.answer.finalScore", is(4.0)))
                .andExpect(jsonPath("$.newAttemptTotalScore", is(6.0)))
                .andExpect(jsonPath("$.newTopicMasteryPercent", is(60.0)));

        // Student now sees rubricScores and awaitingTeacherGrading = false
        mockMvc.perform(get("/api/student/attempts/" + attemptId + "/result")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.awaitingTeacherGrading", is(false)))
                .andExpect(jsonPath("$.questionReviews[1].graded", is(true)))
                .andExpect(jsonPath("$.questionReviews[1].rubricScores", hasSize(2)));

        // Regrade essay: 4 + 4 = 8 pts -> totalScore = 10 / 10 -> mastery = 100%
        GradeAnswerRequest regrade = new GradeAnswerRequest(null, "Updated after review",
                List.of(new CriterionScoreRequest(c1.getId(), 4), new CriterionScoreRequest(c2.getId(), 4)));
        mockMvc.perform(put("/api/teacher/classes/" + cls.getId() + "/attempts/" + attemptId + "/answers/" + essayAnswerId + "/grade")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regrade)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newAttemptTotalScore", is(10.0)))
                .andExpect(jsonPath("$.newTopicMasteryPercent", is(100.0)));
    }

    @Test
    @DisplayName("Legacy MCQ compatibility and idempotent DatabaseMigrationRunner")
    void testLegacyMcqAndIdempotentMigration() throws Exception {
        Question legacyMcq = createMcqQuestion("Legacy MCQ", 1.0, false);
        assertEquals(QuestionType.MCQ, legacyMcq.getType());

        // Idempotent migration runner can run repeatedly without error
        assertDoesNotThrow(() -> migrationRunner.run());
        assertDoesNotThrow(() -> migrationRunner.run());

        mockMvc.perform(get("/api/teacher/subjects/" + subject.getId() + "/questions?type=MULTIPLE_CHOICE")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(legacyMcq.getId().intValue())))
                .andExpect(jsonPath("$[0].type", is("MULTIPLE_CHOICE")));
    }

    @Test
    @DisplayName("Validation lab eligibility counts distinct final-scored questions across mixed types and excludes ungraded essays")
    void testValidationLabMixedTypesEligibility() throws Exception {
        // 1 MCQ + 1 Enumeration + 1 Ungraded Essay = 2 final-scored questions -> NOT eligible (< 3)
        Question mcq = createMcqQuestion("VL MCQ", 1.0, true);
        Question enumQ = questionRepository.save(new Question(topic, QuestionType.ENUMERATION, "VL Enum", "expl", DifficultyLevel.EASY, 1.0, teacher));
        enumQ.setSubject(subject);
        enumQ = questionRepository.save(enumQ);
        enumQ.setLineageId(enumQ.getId());
        enumQ = questionRepository.save(enumQ);
        acceptedAnswerRepository.save(new QuestionAcceptedAnswer(enumQ, "42", 0));

        Question essay = questionRepository.save(new Question(topic, QuestionType.ESSAY, "VL Essay", null, DifficultyLevel.MEDIUM, 2.0, teacher));
        essay.setSubject(subject);
        essay = questionRepository.save(essay);
        essay.setLineageId(essay.getId());
        essay = questionRepository.save(essay);
        EssayRubricCriterion c = rubricCriterionRepository.save(new EssayRubricCriterion(essay, "Clarity", "Clear", 2, 0));

        Assessment quiz = assessmentRepository.save(new Assessment(subject, "VL Quiz", "Desc", AssessmentStatus.PUBLISHED, teacher));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, mcq, 1));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, enumQ, 2));
        assessmentQuestionRepository.save(new AssessmentQuestion(quiz, essay, 3));

        MvcResult startRes = mockMvc.perform(post("/api/student/assessments/" + quiz.getId() + "/attempts")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long attemptId = objectMapper.readTree(startRes.getResponse().getContentAsString()).get("attemptId").asLong();
        Choice correct = choiceRepository.findByQuestion(mcq).stream().filter(Choice::isCorrect).findFirst().orElseThrow();

        mockMvc.perform(post("/api/student/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SubmitAttemptRequest(List.of(
                                new AnswerSubmissionDto(mcq.getId(), correct.getId(), null),
                                new AnswerSubmissionDto(enumQ.getId(), null, "42"),
                                new AnswerSubmissionDto(essay.getId(), null, "My essay response")
                        )))))
                .andExpect(status().isOk());

        // With essay ungraded: evidence shows all 3 answers, but progress questionsAnswered == 2 -> INSUFFICIENT_DATA (< 3)
        mockMvc.perform(get("/api/teacher/classes/" + cls.getId() + "/validation/students/" + student.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0].evidence", hasSize(3)));

        mockMvc.perform(get("/api/student/classes/" + cls.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0].questionsAnswered", is(2)))
                .andExpect(jsonPath("$.topics[0].status", is("INSUFFICIENT_DATA")));

        // Grade the essay -> distinctCount == 3 -> eligible (STRENGTH)
        MvcResult rev = mockMvc.perform(get("/api/teacher/classes/" + cls.getId() + "/attempts/" + attemptId)
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andReturn();
        Long essayAnsId = objectMapper.readTree(rev.getResponse().getContentAsString())
                .get("answers").get(2).get("answerId").asLong();

        mockMvc.perform(put("/api/teacher/classes/" + cls.getId() + "/attempts/" + attemptId + "/answers/" + essayAnsId + "/grade")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GradeAnswerRequest(null, "Nice", List.of(new CriterionScoreRequest(c.getId(), 2))))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/teacher/classes/" + cls.getId() + "/validation/students/" + student.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0].evidence", hasSize(3)));

        mockMvc.perform(get("/api/student/classes/" + cls.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0].questionsAnswered", is(3)))
                .andExpect(jsonPath("$.topics[0].status", is("STRENGTH")));
    }

    private Question createMcqQuestion(String text, double pts, boolean canonicalType) {
        Question q = new Question(topic, canonicalType ? QuestionType.MULTIPLE_CHOICE : QuestionType.MCQ,
                text, "Explanation", DifficultyLevel.EASY, pts, teacher);
        q.setSubject(subject);
        q = questionRepository.save(q);
        q.setLineageId(q.getId());
        q = questionRepository.save(q);
        choiceRepository.save(new Choice(q, "A", "Right", true));
        choiceRepository.save(new Choice(q, "B", "Wrong", false));
        return q;
    }
}

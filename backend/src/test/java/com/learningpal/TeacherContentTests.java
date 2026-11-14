package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.TeacherClassService;
import com.learningpal.service.TeacherContentService;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.annotation.DirtiesContext(classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Phase A Teacher Content Tools - Subjects, Topics, Versioned Question Bank, Quizzes & Links")
public class TeacherContentTests {

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
    private QuestionRepository questionRepository;

    @Autowired
    private ChoiceRepository choiceRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentQuestionRepository assessmentQuestionRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private TeacherContentService teacherContentService;

    @Autowired
    private TeacherClassService teacherClassService;

    @Autowired
    private GapAnalysisService gapAnalysisService;

    private Institution instA;
    private Institution instB;
    private User teacherA;
    private User teacherB;
    private User studentA;
    private User adminA;

    private String tokenTeacherA;
    private String tokenTeacherB;
    private String tokenStudentA;
    private String tokenAdminA;

    @BeforeEach
    void setUp() {
        String suffix = String.valueOf(System.nanoTime());
        instA = institutionRepository.save(new Institution("Institution A " + suffix, "INSTA_" + suffix, InstitutionStatus.ACTIVE));
        instB = institutionRepository.save(new Institution("Institution B " + suffix, "INSTB_" + suffix, InstitutionStatus.ACTIVE));

        teacherA = userRepository.save(new User("Teacher A " + suffix, "teachera_" + suffix + "@inst.edu",
                passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE, instA));
        teacherB = userRepository.save(new User("Teacher B " + suffix, "teacherb_" + suffix + "@inst.edu",
                passwordEncoder.encode("Password123!"), Role.TEACHER, UserStatus.ACTIVE, instB));
        studentA = userRepository.save(new User("Student A " + suffix, "studenta_" + suffix + "@inst.edu",
                passwordEncoder.encode("Password123!"), Role.STUDENT, UserStatus.ACTIVE, instA));
        adminA = userRepository.save(new User("Admin A " + suffix, "admina_" + suffix + "@inst.edu",
                passwordEncoder.encode("Password123!"), Role.ADMIN, UserStatus.ACTIVE, instA));

        tokenTeacherA = jwtService.generateToken(teacherA);
        tokenTeacherB = jwtService.generateToken(teacherB);
        tokenStudentA = jwtService.generateToken(studentA);
        tokenAdminA = jwtService.generateToken(adminA);
    }

    @Test
    @DisplayName("Teacher can create private subject and access controls block unauthorized users")
    void testSubjectCreationAndAccessControl() throws Exception {
        CreateSubjectRequest req = new CreateSubjectRequest("Discrete Mathematics", "Introductory discrete structures.");

        // Teacher A creates subject
        String response = mockMvc.perform(post("/api/teacher/subjects")
                        .header("Authorization", "Bearer " + tokenTeacherA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Discrete Mathematics")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andReturn().getResponse().getContentAsString();

        TeacherSubjectDto created = objectMapper.readValue(response, TeacherSubjectDto.class);
        Long subjectId = created.id();

        // Teacher A can list and view it
        mockMvc.perform(get("/api/teacher/subjects")
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Discrete Mathematics")));

        mockMvc.perform(get("/api/teacher/subjects/" + subjectId)
                        .header("Authorization", "Bearer " + tokenTeacherA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(subjectId.intValue())));

        // Teacher B receives 404 (private isolation)
        mockMvc.perform(get("/api/teacher/subjects/" + subjectId)
                        .header("Authorization", "Bearer " + tokenTeacherB))
                .andExpect(status().isNotFound());

        // Student receives 403 Forbidden
        mockMvc.perform(get("/api/teacher/subjects")
                        .header("Authorization", "Bearer " + tokenStudentA))
                .andExpect(status().isForbidden());

        // Admin receives 403 Forbidden
        mockMvc.perform(get("/api/teacher/subjects")
                        .header("Authorization", "Bearer " + tokenAdminA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Two-field class creation reuses active subject by name or creates new private subject")
    void testTwoFieldClassCreation() {
        // Teacher A creates a subject
        TeacherSubjectDto subj = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Data Structures", "Core CS"));

        // Create class with same trimmed name (case-insensitive) -> should reuse subj
        CreateClassRequest reqReuse = new CreateClassRequest("  data structures  ", "Section 1", null);
        TeacherClassDto class1 = teacherClassService.createClass(teacherA.getEmail(), reqReuse);

        assertEquals(subj.id(), class1.subject().id());
        assertEquals("Section 1", class1.name());

        // Teacher A creates class with new subject name -> automatically creates new subject
        CreateClassRequest reqNew = new CreateClassRequest("Operating Systems", "Section OS-A", null);
        TeacherClassDto class2 = teacherClassService.createClass(teacherA.getEmail(), reqNew);

        assertNotEquals(subj.id(), class2.subject().id());
        assertEquals("Operating Systems", class2.subject().name());

        // Teacher B creates class with same subject name "Data Structures" -> does NOT reuse Teacher A's subject!
        CreateClassRequest reqTeacherB = new CreateClassRequest("Data Structures", "Sec B", null);
        TeacherClassDto classB = teacherClassService.createClass(teacherB.getEmail(), reqTeacherB);

        assertNotEquals(subj.id(), classB.subject().id());
        Subject subjectB = subjectRepository.findById(classB.subject().id()).orElseThrow();
        assertEquals(teacherB.getId(), subjectB.getOwner().getId());
    }

    @Test
    @DisplayName("Topic management: create, reorder, unique name per subject, and archive")
    void testTopicLifecycle() {
        TeacherSubjectDto subj = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Linear Algebra", "Vectors and matrices"));

        // Create topics
        TeacherTopicDto t1 = teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                new CreateTopicRequest("Vectors", "Vector arithmetic"));
        TeacherTopicDto t2 = teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                new CreateTopicRequest("Matrices", "Matrix operations"));

        // Duplicate name rejection
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                        new CreateTopicRequest("vectors", "Duplicate test")));

        // Reorder topics
        teacherContentService.reorderTopics(teacherA.getEmail(), subj.id(),
                new ReorderTopicsRequest(List.of(t2.id(), t1.id())));

        List<TeacherTopicDto> reordered = teacherContentService.getTopics(teacherA.getEmail(), subj.id());
        assertEquals(t2.id(), reordered.get(0).id());
        assertEquals(1, reordered.get(0).displayOrder());
        assertEquals(t1.id(), reordered.get(1).id());
        assertEquals(2, reordered.get(1).displayOrder());

        // Archive topic
        teacherContentService.archiveTopic(teacherA.getEmail(), subj.id(), t2.id());
        Topic updatedT2 = topicRepository.findById(t2.id()).orElseThrow();
        assertEquals(TopicStatus.ARCHIVED, updatedT2.getStatus());
    }

    @Test
    @DisplayName("Question validation: requires 2-6 choices and exactly 1 correct choice")
    void testQuestionValidation() {
        TeacherSubjectDto subj = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Physics 1", "Mechanics"));
        TeacherTopicDto t1 = teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                new CreateTopicRequest("Kinematics", "Motion in 1D"));

        // Invalid: only 1 choice
        CreateQuestionRequest req1Choice = new CreateQuestionRequest(
                t1.id(), "What is velocity?", "Rate of change of position.", DifficultyLevel.EASY, 1.0,
                List.of(new ChoiceDto(null, "A", "Speed with direction", true))
        );
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createQuestion(teacherA.getEmail(), subj.id(), req1Choice));

        // Invalid: 2 choices but none correct
        CreateQuestionRequest req0Correct = new CreateQuestionRequest(
                t1.id(), "What is velocity?", "Rate of change of position.", DifficultyLevel.EASY, 1.0,
                List.of(
                        new ChoiceDto(null, "A", "Scalar quantity", false),
                        new ChoiceDto(null, "B", "Constant zero", false)
                )
        );
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createQuestion(teacherA.getEmail(), subj.id(), req0Correct));

        // Invalid: 2 choices both correct
        CreateQuestionRequest req2Correct = new CreateQuestionRequest(
                t1.id(), "What is velocity?", "Rate of change of position.", DifficultyLevel.EASY, 1.0,
                List.of(
                        new ChoiceDto(null, "A", "Vector speed", true),
                        new ChoiceDto(null, "B", "Rate of displacement", true)
                )
        );
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createQuestion(teacherA.getEmail(), subj.id(), req2Correct));

        // Valid: 3 choices, exactly 1 correct
        CreateQuestionRequest validReq = new CreateQuestionRequest(
                t1.id(), "What is velocity?", "Rate of change of position.", DifficultyLevel.EASY, 1.0,
                List.of(
                        new ChoiceDto(null, "A", "Scalar speed", false),
                        new ChoiceDto(null, "B", "Speed with direction", true),
                        new ChoiceDto(null, "C", "Acceleration", false)
                )
        );
        TeacherQuestionDto q = teacherContentService.createQuestion(teacherA.getEmail(), subj.id(), validReq);
        assertNotNull(q.id());
        assertEquals(1, q.version());
        assertEquals(QuestionStatus.ACTIVE, q.status());
        assertEquals(q.id(), q.lineageId());
    }

    @Test
    @DisplayName("Question versioning: in-place edit when unanswered, new version + retire old when answered")
    void testQuestionVersioningAndGapAnalysis() {
        TeacherSubjectDto subjDto = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Database Systems", "Relational databases"));
        TeacherTopicDto topicDto = teacherContentService.createTopic(teacherA.getEmail(), subjDto.id(),
                new CreateTopicRequest("SQL Basics", "Queries and constraints"));

        TeacherQuestionDto q1 = teacherContentService.createQuestion(teacherA.getEmail(), subjDto.id(),
                new CreateQuestionRequest(
                        topicDto.id(), "What clause filters rows in SQL?", "Use WHERE clause.", DifficultyLevel.EASY, 1.0,
                        List.of(
                                new ChoiceDto(null, "A", "WHERE", true),
                                new ChoiceDto(null, "B", "ORDER BY", false)
                        )
                ));

        // 1. Unanswered edit: in-place modification
        UpdateQuestionRequest updateUnanswered = new UpdateQuestionRequest(
                topicDto.id(), "What SQL clause filters rows conditionally?", "Use WHERE clause.", DifficultyLevel.EASY, 1.0,
                List.of(
                        new ChoiceDto(null, "A", "WHERE", true),
                        new ChoiceDto(null, "B", "GROUP BY", false)
                )
        );
        TeacherQuestionDto editedV1 = teacherContentService.updateQuestion(teacherA.getEmail(), subjDto.id(), q1.id(), updateUnanswered);
        assertEquals(q1.id(), editedV1.id());
        assertEquals(1, editedV1.version());
        assertEquals("What SQL clause filters rows conditionally?", editedV1.text());

        // 2. Setup Class, Quiz, and Student Attempt answering q1
        Subject subject = subjectRepository.findById(subjDto.id()).orElseThrow();
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, subject, teacherA, "DB Sec 1", "DB101"));
        enrollmentRepository.save(new Enrollment(studentA, cls));

        TeacherQuizDto quizDto = teacherContentService.createQuiz(teacherA.getEmail(), subjDto.id(),
                new CreateQuizRequest("Quiz 1", "Intro quiz", AssessmentKind.QUIZ, 30, List.of(q1.id())));
        teacherContentService.publishQuiz(teacherA.getEmail(), subjDto.id(), quizDto.id());

        Assessment quiz = assessmentRepository.findById(quizDto.id()).orElseThrow();
        Attempt attempt1 = new Attempt(studentA, quiz);
        attempt1.setClassId(cls.getId());
        attempt1.setStatus(AttemptStatus.SUBMITTED);
        attempt1.setStartedAt(Instant.now().minusSeconds(3600));
        attempt1.setSubmittedAt(Instant.now().minusSeconds(1800));
        attempt1.setMaxScore(1.0);
        attempt1.setTotalScore(1.0);
        Attempt savedAttempt1 = attemptRepository.save(attempt1);

        Question qEntity = questionRepository.findById(q1.id()).orElseThrow();
        Choice correctChoice = choiceRepository.findByQuestion(qEntity).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
        Answer ans1 = new Answer(savedAttempt1, qEntity, correctChoice);
        ans1.applyAutoScore(1.0);
        answerRepository.save(ans1);

        // Gap analysis recalculation
        gapAnalysisService.recalculateForStudentInClass(studentA.getId(), cls.getId());
        var masteries1 = studentTopicMasteryRepository.findByStudentAndClassroom(studentA, cls);
        assertFalse(masteries1.isEmpty());
        assertNotNull(masteries1.get(0).getMasteryPercent());

        // 3. Now teacher edits the answered question:
        // Must retire v1 and create v2 with same lineageId!
        UpdateQuestionRequest updateAnswered = new UpdateQuestionRequest(
                topicDto.id(), "What clause filters rows before aggregation? (v2)", "WHERE filters before GROUP BY.", DifficultyLevel.MEDIUM, 2.0,
                List.of(
                        new ChoiceDto(null, "A", "WHERE", true),
                        new ChoiceDto(null, "B", "HAVING", false)
                )
        );
        TeacherQuestionDto v2 = teacherContentService.updateQuestion(teacherA.getEmail(), subjDto.id(), q1.id(), updateAnswered);

        assertNotEquals(q1.id(), v2.id());
        assertEquals(2, v2.version());
        assertEquals(q1.lineageId(), v2.lineageId());
        assertEquals(q1.id(), v2.supersedesId());

        Question oldQ = questionRepository.findById(q1.id()).orElseThrow();
        assertEquals(QuestionStatus.RETIRED, oldQ.getStatus());

        // 4. Retired question cannot enter a new quiz
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createQuiz(teacherA.getEmail(), subjDto.id(),
                        new CreateQuizRequest("Quiz 2", "Should fail with retired question", AssessmentKind.QUIZ, 30, List.of(q1.id()))));

        // 5. Gap analysis with lineage: student takes another attempt answering v2
        Question q2Entity = questionRepository.findById(v2.id()).orElseThrow();
        Attempt attempt2 = new Attempt(studentA, quiz);
        attempt2.setClassId(cls.getId());
        attempt2.setStatus(AttemptStatus.SUBMITTED);
        attempt2.setStartedAt(Instant.now().minusSeconds(1000));
        attempt2.setSubmittedAt(Instant.now());
        attempt2.setMaxScore(1.0);
        attempt2.setTotalScore(1.0);
        Attempt savedAttempt2 = attemptRepository.save(attempt2);

        Choice correctChoice2 = choiceRepository.findByQuestion(q2Entity).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
        Answer ans2 = new Answer(savedAttempt2, q2Entity, correctChoice2);
        ans2.applyAutoScore(q2Entity.getPoints());
        answerRepository.save(ans2);

        // Gap analysis should count 1 unique question lineage (the most recent answer), NOT 2 separate questions
        gapAnalysisService.recalculateForStudentInClass(studentA.getId(), cls.getId());
        var masteries2 = studentTopicMasteryRepository.findByStudentAndClassroom(studentA, cls);
        assertFalse(masteries2.isEmpty());
        assertEquals(100.0, masteries2.get(0).getMasteryPercent(), "Should evaluate correctly with lineage aggregation");
    }

    @Test
    @DisplayName("Quiz freeze: cannot modify questions once attempted; unpublish works when 0 attempts")
    void testQuizFreezeAndUnpublish() {
        TeacherSubjectDto subj = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Algorithms", "Design and analysis"));
        TeacherTopicDto top = teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                new CreateTopicRequest("Sorting", "Comparison sorts"));

        TeacherQuestionDto q1 = teacherContentService.createQuestion(teacherA.getEmail(), subj.id(),
                new CreateQuestionRequest(top.id(), "Merge Sort time complexity?", "O(N log N)", DifficultyLevel.MEDIUM, 1.0,
                        List.of(new ChoiceDto(null, "A", "O(N log N)", true), new ChoiceDto(null, "B", "O(N^2)", false))));
        TeacherQuestionDto q2 = teacherContentService.createQuestion(teacherA.getEmail(), subj.id(),
                new CreateQuestionRequest(top.id(), "Quick Sort worst case?", "O(N^2)", DifficultyLevel.HARD, 1.0,
                        List.of(new ChoiceDto(null, "A", "O(N^2)", true), new ChoiceDto(null, "B", "O(N)", false))));

        // Create Draft Quiz
        TeacherQuizDto quiz = teacherContentService.createQuiz(teacherA.getEmail(), subj.id(),
                new CreateQuizRequest("Sort Quiz", "Sorting algorithms test", AssessmentKind.QUIZ, 30, List.of(q1.id())));
        assertEquals(AssessmentStatus.DRAFT, quiz.status());

        // Edit draft quiz (change questions)
        TeacherQuizDto updatedDraft = teacherContentService.updateQuiz(teacherA.getEmail(), subj.id(), quiz.id(),
                new UpdateQuizRequest("Sort Quiz Final", "Updated desc", AssessmentKind.QUIZ, 30, List.of(q1.id(), q2.id())));
        assertEquals(2, updatedDraft.questions().size());

        // Publish quiz
        TeacherQuizDto pub = teacherContentService.publishQuiz(teacherA.getEmail(), subj.id(), quiz.id());
        assertEquals(AssessmentStatus.PUBLISHED, pub.status());

        // Unpublish when 0 attempts -> allowed!
        TeacherQuizDto unpub = teacherContentService.unpublishQuiz(teacherA.getEmail(), subj.id(), quiz.id());
        assertEquals(AssessmentStatus.DRAFT, unpub.status());

        // Re-publish
        teacherContentService.publishQuiz(teacherA.getEmail(), subj.id(), quiz.id());

        // Submit attempt against published quiz
        Assessment quizEntity = assessmentRepository.findById(quiz.id()).orElseThrow();
        Attempt attempt = new Attempt(studentA, quizEntity);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        attemptRepository.save(attempt);

        // Attempting to modify questions on published quiz with attempts -> rejected!
        assertThrows(RuntimeException.class, () ->
                teacherContentService.updateQuiz(teacherA.getEmail(), subj.id(), quiz.id(),
                        new UpdateQuizRequest("Attempt change", "desc", AssessmentKind.QUIZ, 30, List.of(q1.id()))));

        // Attempting to unpublish quiz with attempts -> rejected!
        assertThrows(RuntimeException.class, () ->
                teacherContentService.unpublishQuiz(teacherA.getEmail(), subj.id(), quiz.id()));

        // Duplicate quiz copies questions into new DRAFT quiz
        TeacherQuizDto duplicated = teacherContentService.duplicateQuiz(teacherA.getEmail(), subj.id(), quiz.id());
        assertEquals(AssessmentStatus.DRAFT, duplicated.status());
        assertTrue(duplicated.title().contains("Copy"));
        assertEquals(2, duplicated.questions().size());
    }

    @Test
    @DisplayName("Link resource validation: strict http/https scheme, safe domain extraction, rejects javascript/data/ftp")
    void testLinkResourceValidation() {
        TeacherSubjectDto subj = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Computer Networks", "OSI model"));
        TeacherTopicDto top = teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                new CreateTopicRequest("TCP/IP", "Transport protocol"));

        // Valid https URL tagged with topic
        TeacherResourceDto r1 = teacherContentService.createResource(teacherA.getEmail(), subj.id(),
                new CreateLinkResourceRequest("RFC 793 Specification", "https://datatracker.ietf.org/doc/html/rfc793", "Official spec", top.id()));
        assertEquals("datatracker.ietf.org", r1.domain());
        assertEquals(top.id(), r1.topicId());

        // Valid http URL untagged (subject general study material)
        TeacherResourceDto r2 = teacherContentService.createResource(teacherA.getEmail(), subj.id(),
                new CreateLinkResourceRequest("Course Syllabus", "http://example.org/syllabus", "Class overview", null));
        assertNull(r2.topicId());
        assertEquals("example.org", r2.domain());

        // Reject javascript: URL
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createResource(teacherA.getEmail(), subj.id(),
                        new CreateLinkResourceRequest("Exploit", "javascript:alert(1)", "bad", null)));

        // Reject data: URL
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createResource(teacherA.getEmail(), subj.id(),
                        new CreateLinkResourceRequest("Data URI", "data:text/html,<b>hi</b>", "bad", null)));

        // Reject ftp: URL
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createResource(teacherA.getEmail(), subj.id(),
                        new CreateLinkResourceRequest("FTP Server", "ftp://files.example.com", "bad", null)));

        // Reject URL exceeding 2000 chars
        String longUrl = "https://example.com/test?" + "a".repeat(2048);
        assertThrows(RuntimeException.class, () ->
                teacherContentService.createResource(teacherA.getEmail(), subj.id(),
                        new CreateLinkResourceRequest("Long URL", longUrl, "bad", null)));
    }

    @Test
    @DisplayName("Archive-not-delete for entities in use")
    void testArchiveNotDelete() {
        TeacherSubjectDto subj = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Software Testing", "QA and Unit Tests"));
        TeacherTopicDto top = teacherContentService.createTopic(teacherA.getEmail(), subj.id(),
                new CreateTopicRequest("TDD", "Test-driven development"));

        teacherContentService.createQuestion(teacherA.getEmail(), subj.id(),
                new CreateQuestionRequest(top.id(), "What comes first in TDD?", "Write test first", DifficultyLevel.EASY, 1.0,
                        List.of(new ChoiceDto(null, "A", "Red (failing test)", true), new ChoiceDto(null, "B", "Production code", false))));

        // Cannot delete topic while question exists
        assertThrows(RuntimeException.class, () ->
                teacherContentService.deleteTopic(teacherA.getEmail(), subj.id(), top.id()));

        // Archiving topic succeeds
        teacherContentService.archiveTopic(teacherA.getEmail(), subj.id(), top.id());
        Topic updatedTop = topicRepository.findById(top.id()).orElseThrow();
        assertEquals(TopicStatus.ARCHIVED, updatedTop.getStatus());
    }

    @Test
    @DisplayName("Roster and student detail fallback to Latest quiz if no diagnostic assessment exists")
    void testRosterFallbackToLatestQuiz() {
        TeacherSubjectDto subjDto = teacherContentService.createSubject(teacherA.getEmail(),
                new CreateSubjectRequest("Compiler Design", "Parsing and ASTs"));
        Subject subject = subjectRepository.findById(subjDto.id()).orElseThrow();
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, subject, teacherA, "Compilers Sec A", "COMP1"));
        enrollmentRepository.save(new Enrollment(studentA, cls));

        // Create Quiz (AssessmentKind.QUIZ - NOT DIAGNOSTIC)
        Assessment quiz = new Assessment(subject, "Midterm Quiz 1", "Regular quiz", AssessmentStatus.PUBLISHED, AssessmentKind.QUIZ, teacherA);
        assessmentRepository.save(quiz);

        Attempt attempt = new Attempt(studentA, quiz);
        attempt.setClassId(cls.getId());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        attempt.setMaxScore(20.0);
        attempt.setTotalScore(18.0);
        attemptRepository.save(attempt);

        // Check Roster
        var roster = teacherClassService.getClassRoster(teacherA.getEmail(), cls.getId());
        assertEquals(1, roster.size());
        assertEquals("Latest quiz", roster.get(0).latestDiagnostic().label());
        assertEquals(90.0, roster.get(0).latestDiagnostic().percent(), 0.01);

        // Check Student Detail trend
        var detail = teacherClassService.getStudentDetail(teacherA.getEmail(), cls.getId(), studentA.getId());
        assertFalse(detail.diagnosticTrend().isEmpty());
        assertEquals(90.0, detail.diagnosticTrend().get(0).percent(), 0.01);
    }
}

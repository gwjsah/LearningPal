package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.DatabaseMigrationRunner;
import com.learningpal.config.JwtService;
import com.learningpal.dto.AnswerSubmissionDto;
import com.learningpal.dto.GradeAnswerRequest;
import com.learningpal.dto.SaveValidationLabelRequest;
import com.learningpal.dto.SubmitAttemptRequest;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.StudentAssessmentService;
import com.learningpal.service.StudentResourceService;
import com.learningpal.service.TeacherClassService;
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

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.annotation.DirtiesContext(classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Per-Student Per-Class Scoped Topic Mastery and Resource Progress Tests")
public class ClassScopedMasteryTests {

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
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceProgressRepository resourceProgressRepository;

    @Autowired
    private GapValidationLabelRepository gapValidationLabelRepository;

    @Autowired
    private GapAnalysisService gapAnalysisService;

    @Autowired
    private StudentAssessmentService studentAssessmentService;

    @Autowired
    private StudentResourceService studentResourceService;

    @Autowired
    private TeacherClassService teacherClassService;

    @Autowired
    private DatabaseMigrationRunner databaseMigrationRunner;

    private Institution institution;
    private User teacherA;
    private User teacherB;
    private User student;
    private String studentToken;
    private String teacherAToken;
    private Subject subject;
    private Topic topic1;
    private Topic topic2;
    private ClassEntity classA;
    private ClassEntity classB;
    private Assessment assessmentA;
    private Assessment assessmentB;
    private Resource resource1;

    @BeforeEach
    void setup() {
        gapValidationLabelRepository.deleteAll();
        resourceProgressRepository.deleteAll();
        studentTopicMasteryRepository.deleteAll();
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        enrollmentRepository.deleteAll();
        assessmentQuestionRepository.deleteAll();
        choiceRepository.deleteAll();
        questionRepository.deleteAll();
        assessmentRepository.deleteAll();
        resourceRepository.deleteAll();
        classEntityRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();
        institutionRepository.deleteAll();

        institution = institutionRepository.save(new Institution("Test University", "TEST-UNI-2026", InstitutionStatus.ACTIVE));

        teacherA = userRepository.save(new User("Prof Alpha", "prof.alpha@test.edu", passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, institution));
        teacherB = userRepository.save(new User("Prof Beta", "prof.beta@test.edu", passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, institution));
        student = userRepository.save(new User("Sam Student", "sam.student@test.edu", passwordEncoder.encode("Pass123!"), Role.STUDENT, UserStatus.ACTIVE, institution));

        studentToken = jwtService.generateToken(student);
        teacherAToken = jwtService.generateToken(teacherA);

        subject = subjectRepository.save(new Subject("Introduction to C", "C_PROG_INTRO", "Learn C"));

        topic1 = topicRepository.save(new Topic(subject, "Control Flow", "Conditionals and loops", 1));
        topic2 = topicRepository.save(new Topic(subject, "Pointers", "Memory and pointers", 2));

        // Create 3 questions for topic 1 to meet minQuestions=3 threshold
        Question q1 = questionRepository.save(new Question(topic1, QuestionType.MCQ, "Q1: What does if do?", "Exp 1", DifficultyLevel.EASY, 1.0, teacherA));
        Choice c1Correct = choiceRepository.save(new Choice(q1, "A", "Branches execution", true));
        Choice c1Wrong = choiceRepository.save(new Choice(q1, "B", "Loops forever", false));

        Question q2 = questionRepository.save(new Question(topic1, QuestionType.MCQ, "Q2: What does while do?", "Exp 2", DifficultyLevel.EASY, 1.0, teacherA));
        Choice c2Correct = choiceRepository.save(new Choice(q2, "A", "Loops while true", true));
        Choice c2Wrong = choiceRepository.save(new Choice(q2, "B", "Exits program", false));

        Question q3 = questionRepository.save(new Question(topic1, QuestionType.MCQ, "Q3: What does for do?", "Exp 3", DifficultyLevel.EASY, 1.0, teacherA));
        Choice c3Correct = choiceRepository.save(new Choice(q3, "A", "Iterates count", true));
        Choice c3Wrong = choiceRepository.save(new Choice(q3, "B", "Allocates memory", false));

        // Create Class A (Section A) and Class B (Section B) for the same subject
        classA = classEntityRepository.save(new ClassEntity(institution, subject, teacherA, "Section A", "SEC-A-01"));
        classB = classEntityRepository.save(new ClassEntity(institution, subject, teacherB, "Section B", "SEC-B-02"));

        // Assessment for Class A
        assessmentA = assessmentRepository.save(new Assessment(subject, "Diagnostic Quiz A", "Diag A", AssessmentStatus.PUBLISHED, null));
        assessmentQuestionRepository.save(new AssessmentQuestion(assessmentA, q1, 1));
        assessmentQuestionRepository.save(new AssessmentQuestion(assessmentA, q2, 2));
        assessmentQuestionRepository.save(new AssessmentQuestion(assessmentA, q3, 3));

        // Assessment for Class B
        assessmentB = assessmentRepository.save(new Assessment(subject, "Diagnostic Quiz B", "Diag B", AssessmentStatus.PUBLISHED, null));
        assessmentQuestionRepository.save(new AssessmentQuestion(assessmentB, q1, 1));
        assessmentQuestionRepository.save(new AssessmentQuestion(assessmentB, q2, 2));
        assessmentQuestionRepository.save(new AssessmentQuestion(assessmentB, q3, 3));

        // Educational resource for topic 1
        resource1 = resourceRepository.save(new Resource(subject, topic1, "Control Flow Cheat Sheet", "Notes on if/while", ResourceType.NOTE, "Content", null, DifficultyLevel.EASY, teacherA));
    }

    @Test
    @DisplayName("Rule 1: Fresh start - joining Class B starts with 0.0 mastery and INSUFFICIENT_DATA; Class A mastery preserved")
    void testFreshMasteryOnNewClass() throws Exception {
        // Enroll student in Class A
        enrollmentRepository.save(new Enrollment(student, classA));

        // Start and submit assessment in Class A with 100% score (all 3 correct)
        var startA = studentAssessmentService.startOrResumeAttempt(assessmentA.getId(), student.getEmail());
        List<Question> questions = List.of(
                questionRepository.findAll().get(0),
                questionRepository.findAll().get(1),
                questionRepository.findAll().get(2)
        );
        List<AnswerSubmissionDto> answersA = new ArrayList<>();
        for (Question q : questions) {
            Choice correct = choiceRepository.findByQuestion(q).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
            answersA.add(new AnswerSubmissionDto(q.getId(), correct.getId()));
        }
        studentAssessmentService.submitAttempt(startA.attemptId(), new SubmitAttemptRequest(answersA), student.getEmail());

        // Verify Class A mastery is 100.0% STRENGTH
        StudentTopicMastery masteryA = studentTopicMasteryRepository
                .findByStudentAndClassroomAndTopic(student, classA, topic1)
                .orElseThrow();
        assertEquals(100.0, masteryA.getMasteryPercent());
        assertEquals(MasteryStatus.STRENGTH, masteryA.getStatus());

        // Now student enrolls in Class B
        enrollmentRepository.save(new Enrollment(student, classB));

        // Recalculate Class B for student
        gapAnalysisService.recalculateForStudentInClass(student.getId(), classB.getId());

        // Query Class B progress via API: fresh start (0.0 mastery, INSUFFICIENT_DATA, 0 answered)
        mockMvc.perform(get("/api/student/classes/" + classB.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].masteryPercent", contains(0.0)))
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].status", contains("INSUFFICIENT_DATA")))
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].questionsAnswered", contains(0)))
                .andExpect(jsonPath("$.strengths", hasSize(0)))
                .andExpect(jsonPath("$.gaps", hasSize(0)));

        // Query Class A progress via API: STILL 100.0% STRENGTH!
        mockMvc.perform(get("/api/student/classes/" + classA.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].masteryPercent", contains(100.0)))
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].status", contains("STRENGTH")))
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].questionsAnswered", contains(3)))
                .andExpect(jsonPath("$.strengths", hasSize(1)));
    }

    @Test
    @DisplayName("Rule 2: Archived classes keep mastery history viewable; new attempts are blocked")
    void testArchivedClassMasteryPreservedAndReadOnly() throws Exception {
        enrollmentRepository.save(new Enrollment(student, classA));

        // Take attempt in Class A
        var startA = studentAssessmentService.startOrResumeAttempt(assessmentA.getId(), student.getEmail());
        List<AnswerSubmissionDto> answersA = new ArrayList<>();
        for (Question q : questionRepository.findAll()) {
            Choice correct = choiceRepository.findByQuestion(q).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
            answersA.add(new AnswerSubmissionDto(q.getId(), correct.getId()));
        }
        studentAssessmentService.submitAttempt(startA.attemptId(), new SubmitAttemptRequest(answersA), student.getEmail());

        // Archive Class A
        classA.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(classA);

        // Progress endpoint remains viewable in read-only mode
        mockMvc.perform(get("/api/student/classes/" + classA.getId() + "/progress")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].masteryPercent", contains(100.0)))
                .andExpect(jsonPath("$.topics[?(@.topicId == " + topic1.getId() + ")].status", contains("STRENGTH")));

        // Attempting to start a new quiz in archived class is rejected (400 Bad Request)
        mockMvc.perform(post("/api/student/assessments/" + assessmentA.getId() + "/attempts")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Rule 3: Teacher score override recalculates only the attempt's class mastery")
    void testTeacherScoreOverrideAffectsOnlyTargetClass() throws Exception {
        enrollmentRepository.save(new Enrollment(student, classA));

        // Take attempt in Class A: 3/3 correct
        var startA = studentAssessmentService.startOrResumeAttempt(assessmentA.getId(), student.getEmail());
        List<AnswerSubmissionDto> answersA = new ArrayList<>();
        for (Question q : questionRepository.findAll()) {
            Choice correct = choiceRepository.findByQuestion(q).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
            answersA.add(new AnswerSubmissionDto(q.getId(), correct.getId()));
        }
        studentAssessmentService.submitAttempt(startA.attemptId(), new SubmitAttemptRequest(answersA), student.getEmail());

        // Semester concludes: Class A is archived; student joins Class B (Spring 2026)
        classA.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(classA);
        enrollmentRepository.save(new Enrollment(student, classB));

        // Recalculate Class B: starts fresh (0 attempts)
        gapAnalysisService.recalculateForStudentInClass(student.getId(), classB.getId());

        // Teacher overrides answer in Class A down to 0.0 points
        List<Answer> answers = answerRepository.findByAttemptId(startA.attemptId());
        teacherClassService.gradeAnswer(
                teacherA.getEmail(),
                classA.getId(),
                startA.attemptId(),
                answers.get(0).getId(),
                new GradeAnswerRequest(0.0, "Overridden down to 0 for poor style")
        );

        // Class A mastery now drops from 100% to 2/3 = 66.7% (DEVELOPING)
        StudentTopicMastery masteryA = studentTopicMasteryRepository
                .findByStudentAndClassroomAndTopic(student, classA, topic1)
                .orElseThrow();
        assertEquals(66.7, masteryA.getMasteryPercent());
        assertEquals(MasteryStatus.DEVELOPING, masteryA.getStatus());
        assertEquals(100.0, masteryA.getPreviousMasteryPercent());

        // Class B mastery remains 0.0 / INSUFFICIENT_DATA
        StudentTopicMastery masteryB = studentTopicMasteryRepository
                .findByStudentAndClassroomAndTopic(student, classB, topic1)
                .orElseThrow();
        assertEquals(0.0, masteryB.getMasteryPercent());
        assertEquals(MasteryStatus.INSUFFICIENT_DATA, masteryB.getStatus());
    }

    @Test
    @DisplayName("Rule 4: Most recent answer evaluates within class attempts only without cross-class leakage")
    void testMostRecentAnswerScopedToClassLineage() {
        enrollmentRepository.save(new Enrollment(student, classA));

        // In Class A: Student answers Q1 correctly
        var startA = studentAssessmentService.startOrResumeAttempt(assessmentA.getId(), student.getEmail());
        Question q1 = questionRepository.findAll().get(0);
        Choice c1Correct = choiceRepository.findByQuestion(q1).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
        studentAssessmentService.submitAttempt(
                startA.attemptId(),
                new SubmitAttemptRequest(List.of(new AnswerSubmissionDto(q1.getId(), c1Correct.getId()))),
                student.getEmail()
        );

        // Class A concludes and is archived; student enters Class B
        classA.setStatus(ClassStatus.ARCHIVED);
        classEntityRepository.save(classA);
        enrollmentRepository.save(new Enrollment(student, classB));

        // In Class B: Student answers Q1 INCORRECTLY
        var startB = studentAssessmentService.startOrResumeAttempt(assessmentB.getId(), student.getEmail());
        Choice c1Wrong = choiceRepository.findByQuestion(q1).stream().filter(c -> !c.isCorrect()).findFirst().orElseThrow();
        studentAssessmentService.submitAttempt(
                startB.attemptId(),
                new SubmitAttemptRequest(List.of(new AnswerSubmissionDto(q1.getId(), c1Wrong.getId()))),
                student.getEmail()
        );

        // Check latest evaluation in Class A: earned = 1.0
        var evalsA = gapAnalysisService.getLatestQuestionEvaluationsInClass(student.getId(), classA.getId());
        assertEquals(1.0, evalsA.get(q1.getId()).earned());

        // Check latest evaluation in Class B: earned = 0.0
        var evalsB = gapAnalysisService.getLatestQuestionEvaluationsInClass(student.getId(), classB.getId());
        assertEquals(0.0, evalsB.get(q1.getId()).earned());
    }

    @Test
    @DisplayName("Rule 5: Resource completion is per (student, class, resource)")
    void testResourceProgressPerClass() throws Exception {
        enrollmentRepository.save(new Enrollment(student, classA));
        enrollmentRepository.save(new Enrollment(student, classB));

        // Mark resource completed in Class A
        mockMvc.perform(post("/api/student/classes/" + classA.getId() + "/resources/" + resource1.getId() + "/complete")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)));

        // Resource is completed in Class A
        assertTrue(resourceProgressRepository
                .findByStudentAndClassroomAndResource(student, classA, resource1)
                .isPresent());

        // Resource is NOT completed in Class B
        assertFalse(resourceProgressRepository
                .findByStudentAndClassroomAndResource(student, classB, resource1)
                .isPresent());

        // Unmarking in Class A succeeds and does not touch Class B
        mockMvc.perform(delete("/api/student/classes/" + classA.getId() + "/resources/" + resource1.getId() + "/complete")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(false)));

        assertFalse(resourceProgressRepository
                .findByStudentAndClassroomAndResource(student, classA, resource1)
                .isPresent());
    }

    @Test
    @DisplayName("Rule 6: Database migration runner is fully idempotent and succeeds when run multiple times")
    void testMigrationRunnerIdempotence() {
        assertDoesNotThrow(() -> databaseMigrationRunner.run());
        assertDoesNotThrow(() -> databaseMigrationRunner.run());
    }

    @Test
    @DisplayName("Rule 7: Validation lab snapshots record class-specific mastery")
    void testValidationLabSnapshotClassMastery() throws Exception {
        enrollmentRepository.save(new Enrollment(student, classA));

        // Build mastery in Class A
        var startA = studentAssessmentService.startOrResumeAttempt(assessmentA.getId(), student.getEmail());
        List<AnswerSubmissionDto> answersA = new ArrayList<>();
        for (Question q : questionRepository.findAll()) {
            Choice correct = choiceRepository.findByQuestion(q).stream().filter(Choice::isCorrect).findFirst().orElseThrow();
            answersA.add(new AnswerSubmissionDto(q.getId(), correct.getId()));
        }
        studentAssessmentService.submitAttempt(startA.attemptId(), new SubmitAttemptRequest(answersA), student.getEmail());

        // Teacher labels student in Class A (blind response: no system analytics leaked)
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/validation/students/" + student.getId() + "/topics/" + topic1.getId())
                        .header("Authorization", "Bearer " + teacherAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SaveValidationLabelRequest(
                                ValidationLabel.NOT_WEAK,
                                "Mastered control flow"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label", is("NOT_WEAK")))
                .andExpect(jsonPath("$.note", is("Mastered control flow")));

        // Server-side snapshot recorded Class A's mastery and status
        GapValidationLabel saved = gapValidationLabelRepository
                .findByStudentIdAndClassroomIdAndTopicIdAndSource(student.getId(), classA.getId(), topic1.getId(), ValidationSource.TEACHER)
                .orElseThrow();
        assertEquals(MasteryStatus.STRENGTH, saved.getSystemStatusAtLabel());
        assertEquals(100.0, saved.getSystemMasteryAtLabel());
        assertNotNull(saved.getClassroom());
        assertEquals(classA.getId(), saved.getClassroom().getId());
    }
}

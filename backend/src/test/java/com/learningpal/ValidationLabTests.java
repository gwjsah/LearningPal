package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.ValidationService;
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

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Validation Lab Unit and Integration Tests")
public class ValidationLabTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ValidationService validationService;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AssessmentQuestionRepository assessmentQuestionRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private ChoiceRepository choiceRepository;

    @Autowired
    private GapValidationLabelRepository gapValidationLabelRepository;

    @Autowired
    private StudentTopicMasteryRepository studentTopicMasteryRepository;

    @Autowired
    private StudentValidationAssignmentRepository studentValidationAssignmentRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    private Institution instA;
    private User teacherA;
    private User studentA1;
    private User studentA2;
    private Subject subject;
    private Topic topic1;
    private Topic topic2;
    private ClassEntity classA;
    private String teacherToken;

    @BeforeEach
    void setUp() {
        gapValidationLabelRepository.deleteAll();
        studentValidationAssignmentRepository.deleteAll();
        studentTopicMasteryRepository.deleteAll();
        interventionRepository.deleteAll();
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classEntityRepository.deleteAll();

        instA = institutionRepository.findByCode("PILOT-2026").orElseGet(() ->
                institutionRepository.save(new Institution("Campus Alpha", "PILOT-2026", InstitutionStatus.ACTIVE))
        );

        teacherA = userRepository.findByEmail("val.teachera@insta.com").orElseGet(() ->
                userRepository.save(new User(
                        "Teacher A", "val.teachera@insta.com", passwordEncoder.encode("Pass123!"),
                        Role.TEACHER, UserStatus.ACTIVE, instA
                ))
        );

        studentA1 = userRepository.findByEmail("val.s1@insta.com").orElseGet(() ->
                userRepository.save(new User(
                        "Student 1", "val.s1@insta.com", passwordEncoder.encode("Pass123!"),
                        Role.STUDENT, UserStatus.ACTIVE, instA
                ))
        );

        studentA2 = userRepository.findByEmail("val.s2@insta.com").orElseGet(() ->
                userRepository.save(new User(
                        "Student 2", "val.s2@insta.com", passwordEncoder.encode("Pass123!"),
                        Role.STUDENT, UserStatus.ACTIVE, instA
                ))
        );

        subject = subjectRepository.findAll().stream().findFirst().orElseGet(() ->
                subjectRepository.save(new Subject("Intro to C", "CS101", "C Basics"))
        );

        List<Topic> existingTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        if (existingTopics.size() >= 2) {
            topic1 = existingTopics.get(0);
            topic2 = existingTopics.get(1);
        } else {
            topic1 = topicRepository.save(new Topic(subject, "Variables", "Variables in C", 1));
            topic2 = topicRepository.save(new Topic(subject, "Loops", "Loops in C", 2));
        }

        classA = classEntityRepository.save(new ClassEntity(
                instA, subject, teacherA, "Section 101", "VAL01"
        ));

        enrollmentRepository.save(new Enrollment(studentA1, classA));
        enrollmentRepository.save(new Enrollment(studentA2, classA));

        teacherToken = "Bearer " + jwtService.generateToken(teacherA);
    }

    // =========================================================================
    // 1. HAND-COMPUTED FIXTURE TEST FOR MATHEMATICAL INTEGRITY
    // =========================================================================
    @Test
    @DisplayName("Hand-computed fixture: accuracy, precision, recall, F1, Cohen's kappa, per-topic and student match")
    void testMetricsMathWithHandComputedFixture() {
        // Construct 6 students x 3 topics = 18 labels with a known confusion matrix
        // Target matrix:
        // TP = 8 (Teacher WEAK, System GAP)
        // FP = 2 (Teacher NOT_WEAK, System GAP)
        // TN = 6 (Teacher NOT_WEAK, System DEVELOPING/STRENGTH)
        // FN = 2 (Teacher WEAK, System DEVELOPING/STRENGTH)
        // Usable N = 8 + 2 + 6 + 2 = 18
        //
        // Expected Metrics:
        // Accuracy = (8 + 6) / 18 = 14 / 18 = 77.777...% -> 77.8%
        // Precision = 8 / (8 + 2) = 8 / 10 = 80.0%
        // Recall = 8 / (8 + 2) = 8 / 10 = 80.0%
        // F1 = 2 * (80 * 80) / (80 + 80) = 80.0%
        // Cohen's Kappa:
        //   Po = 14 / 18 = 0.7777777778
        //   Teacher Yes = 10/18, Teacher No = 8/18
        //   System Yes = 10/18, System No = 8/18
        //   Pe = (10/18 * 10/18) + (8/18 * 8/18) = (100 + 64) / 324 = 164 / 324 = 0.5061728395
        //   Kappa = (0.7777777778 - 0.5061728395) / (1 - 0.5061728395) = 0.2716049383 / 0.4938271605 = 0.550

        Topic t1 = new Topic(subject, "T1", "Topic 1", 1);
        Topic t2 = new Topic(subject, "T2", "Topic 2", 2);
        Topic t3 = new Topic(subject, "T3", "Topic 3", 3);

        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            User s = new User("S" + i, "s" + i + "@fixture.com", "pass", Role.STUDENT, UserStatus.ACTIVE, instA);
            s.setId((long) (i + 100));
            students.add(s);
        }

        List<GapValidationLabel> labels = new ArrayList<>();
        labels.add(createLabel(students.get(0), t1, ValidationLabel.WEAK, MasteryStatus.GAP, 30.0));
        labels.add(createLabel(students.get(0), t2, ValidationLabel.WEAK, MasteryStatus.GAP, 40.0));
        labels.add(createLabel(students.get(0), t3, ValidationLabel.NOT_WEAK, MasteryStatus.STRENGTH, 85.0));

        labels.add(createLabel(students.get(1), t1, ValidationLabel.WEAK, MasteryStatus.GAP, 25.0));
        labels.add(createLabel(students.get(1), t2, ValidationLabel.WEAK, MasteryStatus.GAP, 35.0));
        labels.add(createLabel(students.get(1), t3, ValidationLabel.NOT_WEAK, MasteryStatus.DEVELOPING, 70.0));

        labels.add(createLabel(students.get(2), t1, ValidationLabel.WEAK, MasteryStatus.GAP, 45.0));
        labels.add(createLabel(students.get(2), t2, ValidationLabel.WEAK, MasteryStatus.GAP, 50.0));
        labels.add(createLabel(students.get(2), t3, ValidationLabel.WEAK, MasteryStatus.DEVELOPING, 68.0));

        labels.add(createLabel(students.get(3), t1, ValidationLabel.WEAK, MasteryStatus.GAP, 20.0));
        labels.add(createLabel(students.get(3), t2, ValidationLabel.NOT_WEAK, MasteryStatus.GAP, 52.0));
        labels.add(createLabel(students.get(3), t3, ValidationLabel.NOT_WEAK, MasteryStatus.STRENGTH, 90.0));

        labels.add(createLabel(students.get(4), t1, ValidationLabel.WEAK, MasteryStatus.GAP, 30.0));
        labels.add(createLabel(students.get(4), t2, ValidationLabel.NOT_WEAK, MasteryStatus.DEVELOPING, 65.0));
        labels.add(createLabel(students.get(4), t3, ValidationLabel.NOT_WEAK, MasteryStatus.STRENGTH, 95.0));

        labels.add(createLabel(students.get(5), t1, ValidationLabel.NOT_WEAK, MasteryStatus.GAP, 55.0));
        labels.add(createLabel(students.get(5), t2, ValidationLabel.NOT_WEAK, MasteryStatus.STRENGTH, 80.0));
        labels.add(createLabel(students.get(5), t3, ValidationLabel.WEAK, MasteryStatus.DEVELOPING, 62.0));

        ValidationReportDto report = validationService.computeReport(
                labels, ValidationSource.TEACHER, false, 99L, "Fixture Class", "Inst A"
        );

        assertThat(report.confusionMatrix().tp()).isEqualTo(8);
        assertThat(report.confusionMatrix().fp()).isEqualTo(2);
        assertThat(report.confusionMatrix().tn()).isEqualTo(6);
        assertThat(report.confusionMatrix().fn()).isEqualTo(2);

        assertThat(report.metrics().accuracyPercent()).isEqualTo(77.8);
        assertThat(report.metrics().precisionPercent()).isEqualTo(80.0);
        assertThat(report.metrics().recallPercent()).isEqualTo(80.0);
        assertThat(report.metrics().f1Percent()).isEqualTo(80.0);
        assertThat(report.metrics().cohenKappa()).isEqualTo(0.550);

        // Student exact matches: S1, S2, S5 match all 3 topics = 3/6 = 50.0%
        assertThat(report.metrics().studentExactMatchCount()).isEqualTo(3);
        assertThat(report.metrics().studentExactMatchPercent()).isEqualTo(50.0);

        // Target check: 6 students < 30 -> NOT_ENOUGH_RECORDS
        assertThat(report.targetCheck().status()).isEqualTo("NOT_ENOUGH_RECORDS");
        assertThat(report.targetCheck().studentsEvaluated()).isEqualTo(6);
        assertThat(report.targetCheck().sentence()).contains("Currently 6 evaluated (24 more needed)");
    }

    // =========================================================================
    // 2. EXCLUSIONS AND STALENESS FILTERING
    // =========================================================================
    @Test
    @DisplayName("Exclusions: CANNOT_JUDGE, INSUFFICIENT_DATA, and stale labels are counted and excluded")
    void testExclusionsAndStaleness() {
        User s1 = studentA1;
        Topic t = topic1;

        // Label 1: CANNOT_JUDGE
        GapValidationLabel l1 = createLabel(s1, t, ValidationLabel.CANNOT_JUDGE, MasteryStatus.GAP, 30.0);

        // Label 2: INSUFFICIENT_DATA
        GapValidationLabel l2 = createLabel(s1, topic2, ValidationLabel.WEAK, MasteryStatus.INSUFFICIENT_DATA, 0.0);

        // Label 3: Normal usable label
        GapValidationLabel l3 = createLabel(s1, t, ValidationLabel.WEAK, MasteryStatus.GAP, 40.0);

        // Label 4: Stale label (attemptCountAtLabel=1, but student has 2 submitted attempts in class)
        GapValidationLabel l4 = createLabel(s1, topic2, ValidationLabel.WEAK, MasteryStatus.GAP, 40.0);
        l4.setClassroom(classA);
        l4.setAttemptCountAtLabel(1);

        // Record 2 attempts for student in classA
        Assessment assm = assessmentRepository.save(new Assessment(subject, "Quiz", "Quiz desc", AssessmentStatus.PUBLISHED, null));
        Attempt att1 = new Attempt(s1, assm, 1, classA.getId());
        att1.setStatus(AttemptStatus.SUBMITTED);
        attemptRepository.save(att1);

        Attempt att2 = new Attempt(s1, assm, 2, classA.getId());
        att2.setStatus(AttemptStatus.SUBMITTED);
        attemptRepository.save(att2);

        List<GapValidationLabel> allLabels = List.of(l1, l2, l3, l4);

        // Default: includeStale = false -> l4 excluded as stale
        ValidationReportDto reportWithoutStale = validationService.computeReport(
                allLabels, ValidationSource.TEACHER, false, classA.getId(), classA.getName(), "Inst A"
        );

        assertThat(reportWithoutStale.sampleSize().totalLabelsEvaluated()).isEqualTo(4);
        assertThat(reportWithoutStale.sampleSize().excludedCannotJudge()).isEqualTo(1);
        assertThat(reportWithoutStale.sampleSize().excludedInsufficientData()).isEqualTo(1);
        assertThat(reportWithoutStale.sampleSize().excludedStale()).isEqualTo(1);
        assertThat(reportWithoutStale.sampleSize().usableStudentTopicPairs()).isEqualTo(1);

        // With includeStale = true -> l4 is included in usable pairs
        ValidationReportDto reportWithStale = validationService.computeReport(
                allLabels, ValidationSource.TEACHER, true, classA.getId(), classA.getName(), "Inst A"
        );

        assertThat(reportWithStale.sampleSize().excludedStale()).isEqualTo(0);
        assertThat(reportWithStale.sampleSize().usableStudentTopicPairs()).isEqualTo(2);
    }

    // =========================================================================
    // 3. THRESHOLD SENSITIVITY TEST
    // =========================================================================
    @Test
    @DisplayName("Threshold sensitivity on fixture correctly picks best threshold")
    void testThresholdSensitivity() {
        Topic t = topic1;
        List<GapValidationLabel> labels = new ArrayList<>();

        // Teacher labeled all as WEAK if mastery < 55%
        for (int i = 1; i <= 10; i++) {
            User s = new User("Student" + i, "st" + i + "@test.com", "pass", Role.STUDENT, UserStatus.ACTIVE, instA);
            s.setId((long) (i + 200));
            double mastery = 30.0 + (i * 4.0); // 34, 38, 42, 46, 50, 54, 58, 62, 66, 70
            ValidationLabel teacherLabel = (mastery < 55.0) ? ValidationLabel.WEAK : ValidationLabel.NOT_WEAK;
            MasteryStatus status = (mastery < 60.0) ? MasteryStatus.GAP : MasteryStatus.DEVELOPING;
            labels.add(createLabel(s, t, teacherLabel, status, mastery));
        }

        ValidationReportDto report = validationService.computeReport(
                labels, ValidationSource.TEACHER, false, classA.getId(), classA.getName(), "Inst A"
        );

        assertThat(report.thresholdSensitivity()).hasSize(6);
        Optional<ValidationThresholdSensitivityDto> row55 = report.thresholdSensitivity().stream()
                .filter(r -> r.threshold() == 55.0)
                .findFirst();

        assertThat(row55).isPresent();
        assertThat(row55.get().agreementPercent()).isEqualTo(100.0);
        assertThat(report.bestThreshold()).isEqualTo(55.0);
    }

    // =========================================================================
    // 4. BLINDNESS SERIALIZATION TEST
    // =========================================================================
    @Test
    @DisplayName("Blindness: Labeling endpoints return zero mastery, status, trend, needsAttention, or gap fields")
    void testBlindnessSerialization() throws Exception {
        Assessment assm = assessmentRepository.save(new Assessment(subject, "Variables Quiz", "Quiz", AssessmentStatus.PUBLISHED, null));
        Question q = questionRepository.save(new Question(topic1, QuestionType.MCQ, "What is int?", "Exp", DifficultyLevel.EASY, 1.0, null));
        Choice c = choiceRepository.save(new Choice(q, "A", "Integer type", true));

        Attempt attempt = new Attempt(studentA1, assm, 1, classA.getId());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        attemptRepository.save(attempt);

        Answer ans = new Answer(attempt, q, c);
        ans.applyAutoScore(1.0);
        answerRepository.save(ans);

        // Record a real StudentTopicMastery to make sure it DOES NOT leak
        studentTopicMasteryRepository.save(new StudentTopicMastery(
                studentA1, classA, topic1, 85.0, MasteryStatus.STRENGTH
        ));

        // 1. Check GET /api/teacher/classes/{classId}/validation/students
        String studentsJson = mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/validation/students")
                        .header("Authorization", teacherToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertBlindJson(studentsJson);

        // 2. Check GET /api/teacher/classes/{classId}/validation/students/{studentId}
        String detailJson = mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/validation/students/" + studentA1.getId())
                        .header("Authorization", teacherToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertBlindJson(detailJson);
    }

    // =========================================================================
    // 5. UPSERT & SNAPSHOT TEST
    // =========================================================================
    @Test
    @DisplayName("Upsert keeps one TEACHER label per student-topic, takes snapshot, and validates inputs")
    void testUpsertAndSnapshot() throws Exception {
        studentTopicMasteryRepository.save(new StudentTopicMastery(
                studentA1, classA, topic1, 45.0, MasteryStatus.GAP
        ));

        // 1. Initial save of TEACHER label
        SaveValidationLabelRequest req1 = new SaveValidationLabelRequest(ValidationLabel.WEAK, "Struggles with syntax");
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/validation/students/" + studentA1.getId() + "/topics/" + topic1.getId())
                        .header("Authorization", teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topicId").value(topic1.getId()))
                .andExpect(jsonPath("$.label").value("WEAK"))
                .andExpect(jsonPath("$.note").value("Struggles with syntax"));

        List<GapValidationLabel> labels = gapValidationLabelRepository.findByStudentIdAndSource(
                studentA1.getId(), ValidationSource.TEACHER
        );
        assertThat(labels).hasSize(1);
        GapValidationLabel saved1 = labels.get(0);
        assertThat(saved1.getSystemMasteryAtLabel()).isEqualTo(45.0);
        assertThat(saved1.getSystemStatusAtLabel()).isEqualTo(MasteryStatus.GAP);
        assertThat(saved1.getAttemptCountAtLabel()).isEqualTo(0);

        // 2. Upsert same topic -> updates existing record (NOT insert duplicate)
        SaveValidationLabelRequest req2 = new SaveValidationLabelRequest(ValidationLabel.NOT_WEAK, "Improved after tutoring");
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/validation/students/" + studentA1.getId() + "/topics/" + topic1.getId())
                        .header("Authorization", teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("NOT_WEAK"))
                .andExpect(jsonPath("$.note").value("Improved after tutoring"));

        labels = gapValidationLabelRepository.findByStudentIdAndSource(studentA1.getId(), ValidationSource.TEACHER);
        assertThat(labels).hasSize(1);
        assertThat(labels.get(0).getLabel()).isEqualTo(ValidationLabel.NOT_WEAK);

        // 3. Validation: Note > 300 characters rejected
        String longNote = "a".repeat(301);
        SaveValidationLabelRequest invalidNoteReq = new SaveValidationLabelRequest(ValidationLabel.WEAK, longNote);
        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/validation/students/" + studentA1.getId() + "/topics/" + topic1.getId())
                        .header("Authorization", teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidNoteReq)))
                .andExpect(status().isBadRequest());

        // 4. Validation: Foreign topic from another subject rejected
        Subject otherSubject = subjectRepository.save(new Subject("Java", "CS102", "Java Basics"));
        Topic foreignTopic = topicRepository.save(new Topic(otherSubject, "Classes", "Classes in Java", 1));

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/validation/students/" + studentA1.getId() + "/topics/" + foreignTopic.getId())
                        .header("Authorization", teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isBadRequest());

        // 5. Validation: Student not enrolled in class rejected (404)
        User unenrolledStudent = userRepository.save(new User(
                "Unenrolled", "unenrolled@instA.com", "pass", Role.STUDENT, UserStatus.ACTIVE, instA
        ));

        mockMvc.perform(put("/api/teacher/classes/" + classA.getId() + "/validation/students/" + unenrolledStudent.getId() + "/topics/" + topic1.getId())
                        .header("Authorization", teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 6. TARGET LOGIC TEST (< 30 vs >= 30, and >= 85% vs < 85%)
    // =========================================================================
    @Test
    @DisplayName("Target logic: < 30 gives NOT_ENOUGH_RECORDS; >= 30 compares against 85%")
    void testTargetLogic() {
        Topic t = topic1;

        // Case A: 32 students, 28 match (87.5% >= 85.0%) -> MET
        List<GapValidationLabel> labelsA = new ArrayList<>();
        for (int i = 1; i <= 32; i++) {
            User s = new User("St" + i, "st" + i + "@instA.com", "pass", Role.STUDENT, UserStatus.ACTIVE, instA);
            s.setId((long) (i + 300));
            ValidationLabel v = (i <= 28) ? ValidationLabel.WEAK : ValidationLabel.NOT_WEAK;
            labelsA.add(createLabel(s, t, v, MasteryStatus.GAP, 35.0));
        }

        ValidationReportDto reportA = validationService.computeReport(
                labelsA, ValidationSource.TEACHER, false, classA.getId(), classA.getName(), "Inst A"
        );
        assertThat(reportA.targetCheck().status()).isEqualTo("MET");
        assertThat(reportA.targetCheck().studentsEvaluated()).isEqualTo(32);
        assertThat(reportA.metrics().accuracyPercent()).isEqualTo(87.5);

        // Case B: 30 students, 24 match (80.0% < 85.0%) -> NOT_MET
        List<GapValidationLabel> labelsB = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            User s = new User("St" + i, "st" + i + "@instA.com", "pass", Role.STUDENT, UserStatus.ACTIVE, instA);
            s.setId((long) (i + 400));
            ValidationLabel v = (i <= 24) ? ValidationLabel.WEAK : ValidationLabel.NOT_WEAK;
            labelsB.add(createLabel(s, t, v, MasteryStatus.GAP, 35.0));
        }

        ValidationReportDto reportB = validationService.computeReport(
                labelsB, ValidationSource.TEACHER, false, classA.getId(), classA.getName(), "Inst A"
        );
        assertThat(reportB.targetCheck().status()).isEqualTo("NOT_MET");
        assertThat(reportB.targetCheck().studentsEvaluated()).isEqualTo(30);
        assertThat(reportB.metrics().accuracyPercent()).isEqualTo(80.0);
    }

    // =========================================================================
    // 7. CSV EXPORT: FORMULA SAFETY & PSEUDONYMIZATION
    // =========================================================================
    @Test
    @DisplayName("CSV export: formula injection safe, pseudonymized, and contains no student names/emails")
    void testCsvExportSafetyAndPseudonymization() throws Exception {
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, topic1, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                classA, "=SUM(1+1)", 0, MasteryStatus.GAP, 40.0
        ));

        String csv = mockMvc.perform(get("/api/teacher/classes/" + classA.getId() + "/validation/export")
                        .header("Authorization", teacherToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv; charset=UTF-8"))
                .andReturn().getResponse().getContentAsString();

        // 1. Verify NO student real name or email appears in CSV
        assertThat(csv).doesNotContain(studentA1.getFullName());
        assertThat(csv).doesNotContain(studentA1.getEmail());

        // 2. Verify pseudonymous code S001 is present
        assertThat(csv).contains("S001");

        // 3. Verify formula injection protection helper
        assertThat(ValidationService.escapeCsvCell("=1+1")).isEqualTo("'=1+1");
        assertThat(ValidationService.escapeCsvCell("+2-3")).isEqualTo("'+2-3");
        assertThat(ValidationService.escapeCsvCell("@SUM")).isEqualTo("'@SUM");
        assertThat(ValidationService.escapeCsvCell("-5*2")).isEqualTo("'-5*2");
    }

    // =========================================================================
    // 8. SOURCE ISOLATION: TEACHER AND SYNTHETIC NEVER MIX
    // =========================================================================
    @Test
    @DisplayName("Source isolation: SYNTHETIC and TEACHER labels never mix in a report")
    void testSourceIsolation() {
        Topic t = topic1;
        // 1 Teacher label
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, t, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                classA, "Teacher manual inspection", 0, MasteryStatus.GAP, 40.0
        ));

        // 1 Synthetic label for same student
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, t, ValidationLabel.NOT_WEAK, ValidationSource.SYNTHETIC, null, Instant.now(),
                classA, "Synthetic ground truth", 0, MasteryStatus.STRENGTH, 80.0
        ));

        // Teacher report
        ValidationReportDto teacherReport = validationService.getClassValidationReport(
                classA.getId(), "TEACHER", false, teacherA.getEmail()
        );
        assertThat(teacherReport.isSimulated()).isFalse();
        assertThat(teacherReport.sampleSize().usableStudentTopicPairs()).isEqualTo(1);
        assertThat(teacherReport.confusionMatrix().tp()).isEqualTo(1);

        // Synthetic report
        ValidationReportDto syntheticReport = validationService.getClassValidationReport(
                classA.getId(), "SYNTHETIC", false, teacherA.getEmail()
        );
        assertThat(syntheticReport.isSimulated()).isTrue();
        assertThat(syntheticReport.sampleSize().usableStudentTopicPairs()).isEqualTo(1);
        assertThat(syntheticReport.confusionMatrix().tn()).isEqualTo(1);
    }

    // =========================================================================
    // 9. TOPIC SAMPLING AND ELIGIBILITY TEST
    // =========================================================================
    @Test
    @DisplayName("Topic sampling: assigns up to 3 eligible topics, excludes INSUFFICIENT_DATA, persists deterministically")
    void testTopicSamplingAndEligibility() {
        Subject s2 = subjectRepository.save(new Subject("Advanced C", "CS201", "Advanced C"));
        Topic t1 = topicRepository.save(new Topic(s2, "Pointers", "Pointers", 1));
        Topic t2 = topicRepository.save(new Topic(s2, "Memory", "Memory", 2));
        Topic t3 = topicRepository.save(new Topic(s2, "Structs", "Structs", 3));
        Topic t4 = topicRepository.save(new Topic(s2, "Files", "Files", 4));
        Topic t5 = topicRepository.save(new Topic(s2, "Macros", "Macros", 5));
        Topic t6 = topicRepository.save(new Topic(s2, "Bitwise", "Bitwise", 6));

        ClassEntity cls2 = classEntityRepository.save(new ClassEntity(instA, s2, teacherA, "CS201-A", "VAL02"));
        enrollmentRepository.save(new Enrollment(studentA1, cls2));

        // Mark t1..t4 as eligible (STRENGTH/GAP/DEVELOPING)
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls2, t1, 80.0, MasteryStatus.STRENGTH));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls2, t2, 40.0, MasteryStatus.GAP));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls2, t3, 65.0, MasteryStatus.DEVELOPING));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls2, t4, 70.0, MasteryStatus.DEVELOPING));
        // Mark t5, t6 as INSUFFICIENT_DATA (not eligible)
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls2, t5, 0.0, MasteryStatus.INSUFFICIENT_DATA));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls2, t6, 0.0, MasteryStatus.INSUFFICIENT_DATA));

        // First call to get detail -> performs assignment
        ValidationStudentDetailDto detail1 = validationService.getValidationStudentDetail(cls2.getId(), studentA1.getId(), teacherA.getEmail());
        assertThat(detail1.topics()).hasSize(3);

        Set<Long> assignedIds1 = new HashSet<>();
        for (ValidationTopicEvidenceDto tc : detail1.topics()) {
            assignedIds1.add(tc.topicId());
            assertThat(tc.topicId()).isNotEqualTo(t5.getId());
            assertThat(tc.topicId()).isNotEqualTo(t6.getId());
        }

        // Check persisted rows in DB
        List<StudentValidationAssignment> rows = studentValidationAssignmentRepository.findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(
                studentA1.getId(), cls2.getId()
        );
        assertThat(rows).hasSize(3);
        assertThat(rows.get(0).getSeed()).isNotBlank();
        assertThat(rows.get(0).getAssignedOrder()).isEqualTo(1);
        assertThat(rows.get(1).getAssignedOrder()).isEqualTo(2);
        assertThat(rows.get(2).getAssignedOrder()).isEqualTo(3);

        // Second call -> must return identical assigned topics (no re-rolling)
        ValidationStudentDetailDto detail2 = validationService.getValidationStudentDetail(cls2.getId(), studentA1.getId(), teacherA.getEmail());
        Set<Long> assignedIds2 = new HashSet<>();
        for (ValidationTopicEvidenceDto tc : detail2.topics()) {
            assignedIds2.add(tc.topicId());
        }
        assertThat(assignedIds2).isEqualTo(assignedIds1);
    }

    // =========================================================================
    // 10. GATE UNIT AND PROGRESS STATES TEST
    // =========================================================================
    @Test
    @DisplayName("Gate unit: 30 students gate counts only students whose assigned topics are fully labeled")
    void testGateUnitAndProgressStates() {
        Subject s = subjectRepository.save(new Subject("Algorithms", "CS301", "Algos"));
        Topic t1 = topicRepository.save(new Topic(s, "Sorting", "Sort", 1));
        Topic t2 = topicRepository.save(new Topic(s, "Searching", "Search", 2));
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, s, teacherA, "Algos A", "ALG01"));

        enrollmentRepository.save(new Enrollment(studentA1, cls));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls, t1, 80.0, MasteryStatus.STRENGTH));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls, t2, 40.0, MasteryStatus.GAP));

        // Pre-label state: UNLABELED, 2 assigned topics
        List<ValidationStudentSummaryDto> list0 = validationService.getValidationStudents(cls.getId(), teacherA.getEmail());
        assertThat(list0).hasSize(1);
        assertThat(list0.get(0).progressState()).isEqualTo("UNLABELED");
        assertThat(list0.get(0).assignedTopicsCount()).isEqualTo(2);
        assertThat(list0.get(0).labeledTopicsCount()).isEqualTo(0);

        // Partially label (1 of 2): IN_PROGRESS
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, t1, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls, "Label 1", 0, MasteryStatus.STRENGTH, 80.0
        ));

        List<ValidationStudentSummaryDto> list1 = validationService.getValidationStudents(cls.getId(), teacherA.getEmail());
        assertThat(list1.get(0).progressState()).isEqualTo("IN_PROGRESS");
        assertThat(list1.get(0).labeledTopicsCount()).isEqualTo(1);

        // At this point, report target check studentsEvaluated must be 0 (partially labeled student does not count)
        ValidationReportDto rep1 = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(rep1.targetCheck().studentsEvaluated()).isEqualTo(0);

        // Fully label (2 of 2): COMPLETED
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, t2, ValidationLabel.NOT_WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls, "Label 2", 0, MasteryStatus.GAP, 40.0
        ));

        List<ValidationStudentSummaryDto> list2 = validationService.getValidationStudents(cls.getId(), teacherA.getEmail());
        assertThat(list2.get(0).progressState()).isEqualTo("COMPLETED");
        assertThat(list2.get(0).labeledTopicsCount()).isEqualTo(2);

        // Target check studentsEvaluated is now 1
        ValidationReportDto rep2 = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(rep2.targetCheck().studentsEvaluated()).isEqualTo(1);
    }

    // =========================================================================
    // 11. SMALL CLASS COMPLETE HONEST BANNER TEST
    // =========================================================================
    @Test
    @DisplayName("Small class honest banner: complete with < 30 students shows SMALL_CLASS_COMPLETE banner")
    void testSmallClassHonestBanner() {
        Subject s = subjectRepository.save(new Subject("Math", "M101", "Math"));
        Topic t1 = topicRepository.save(new Topic(s, "Algebra", "Alg", 1));
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, s, teacherA, "Small Class", "SML01"));

        enrollmentRepository.save(new Enrollment(studentA1, cls));
        enrollmentRepository.save(new Enrollment(studentA2, cls));

        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls, t1, 80.0, MasteryStatus.STRENGTH));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA2, cls, t1, 40.0, MasteryStatus.GAP));

        // Fully label studentA1 only (1 of 2 complete) -> banner is PRELIMINARY
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, t1, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls, "A1", 0, MasteryStatus.STRENGTH, 80.0
        ));

        ValidationReportDto repPreliminary = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(repPreliminary.targetCheck().bannerType()).isEqualTo("PRELIMINARY");
        assertThat(repPreliminary.targetCheck().sentence()).contains("Preliminary: 1 of 30 students labeled");

        // Now fully label studentA2 too (2 of 2 complete, all enrolled labeled!) -> SMALL_CLASS_COMPLETE
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA2, t1, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls, "A2", 0, MasteryStatus.GAP, 40.0
        ));

        ValidationReportDto repComplete = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(repComplete.targetCheck().bannerType()).isEqualTo("SMALL_CLASS_COMPLETE");
        assertThat(repComplete.targetCheck().status()).isEqualTo("NOT_ENOUGH_RECORDS");
        assertThat(repComplete.targetCheck().sentence()).contains("Complete: 2 of 2 eligible students");
        assertThat(repComplete.targetCheck().sentence()).contains("Too few students to certify against the 85% target");
    }

    // =========================================================================
    // 12. NO CROSS-CLASS POOLING TEST
    // =========================================================================
    @Test
    @DisplayName("No cross-class pooling: class reports do not pool labels across classes")
    void testNoCrossClassPooling() {
        Subject s = subjectRepository.save(new Subject("Databases", "DB101", "Databases"));
        Topic t1 = topicRepository.save(new Topic(s, "SQL", "SQL", 1));

        ClassEntity cls1 = classEntityRepository.save(new ClassEntity(instA, s, teacherA, "DB Sec 1", "DBS01"));
        ClassEntity cls2 = classEntityRepository.save(new ClassEntity(instA, s, teacherA, "DB Sec 2", "DBS02"));

        enrollmentRepository.save(new Enrollment(studentA1, cls1));
        enrollmentRepository.save(new Enrollment(studentA2, cls2));

        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA1, cls1, t1, 80.0, MasteryStatus.STRENGTH));
        studentTopicMasteryRepository.save(new StudentTopicMastery(studentA2, cls2, t1, 40.0, MasteryStatus.GAP));

        // Save 1 label for cls1
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA1, t1, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls1, "Sec 1", 0, MasteryStatus.STRENGTH, 80.0
        ));

        // Save 1 label for cls2
        gapValidationLabelRepository.save(new GapValidationLabel(
                studentA2, t1, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls2, "Sec 2", 0, MasteryStatus.GAP, 40.0
        ));

        ValidationReportDto rep1 = validationService.getClassValidationReport(cls1.getId(), "TEACHER", false, teacherA.getEmail());
        ValidationReportDto rep2 = validationService.getClassValidationReport(cls2.getId(), "TEACHER", false, teacherA.getEmail());

        assertThat(rep1.sampleSize().usableStudentTopicPairs()).isEqualTo(1);
        assertThat(rep2.sampleSize().usableStudentTopicPairs()).isEqualTo(1);
    }

    // =========================================================================
    // 13. ADMIN ROLLUP AND BREAKDOWN TEST
    // =========================================================================
    @Test
    @DisplayName("Admin rollup: aggregates institution classes, provides per-class breakdown, rejects SUPER_ADMIN")
    void testAdminRollupAndBreakdown() throws Exception {
        User admin = userRepository.save(new User(
                "Admin User", "admin.val@insta.com", passwordEncoder.encode("Pass123!"),
                Role.ADMIN, UserStatus.ACTIVE, instA
        ));
        String adminToken = "Bearer " + jwtService.generateToken(admin);

        User superAdmin = userRepository.save(new User(
                "Super User", "superadmin.val@insta.com", passwordEncoder.encode("Pass123!"),
                Role.SUPER_ADMIN, UserStatus.ACTIVE, null
        ));
        String superAdminToken = "Bearer " + jwtService.generateToken(superAdmin);

        // 1. Admin gets institution rollup
        mockMvc.perform(get("/api/admin/validation/report")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pooledClassesCount").isNumber())
                .andExpect(jsonPath("$.classBreakdowns").isArray());

        // 2. Super admin is rejected with 403 (role barrier)
        mockMvc.perform(get("/api/admin/validation/report")
                        .header("Authorization", superAdminToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 15. TOP-UP BEFORE FIRST LABEL TEST (FIX 1)
    // =========================================================================
    @Test
    @DisplayName("Fix 1: Top-up before first label - assignment expands until first label is saved, then freezes")
    void testTopUpBeforeFirstLabel() {
        Subject sub = subjectRepository.save(new Subject("World History", "HIST101", "World History"));
        Topic t1 = topicRepository.save(new Topic(sub, "Ancient Egypt", "Egypt", 1));
        Topic t2 = topicRepository.save(new Topic(sub, "Roman Empire", "Rome", 2));
        Topic t3 = topicRepository.save(new Topic(sub, "Classical Greece", "Greece", 3));
        Topic t4 = topicRepository.save(new Topic(sub, "Dynastic China", "China", 4));

        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, sub, teacherA, "History Class", "HIST01"));
        User student = userRepository.save(new User(
                "History Student", "history.student@test.com", passwordEncoder.encode("pw"),
                Role.STUDENT, UserStatus.ACTIVE, instA
        ));
        enrollmentRepository.save(new Enrollment(student, cls));

        // 1. Initially, only t1 is eligible
        studentTopicMasteryRepository.save(new StudentTopicMastery(student, cls, t1, 80.0, MasteryStatus.STRENGTH));

        List<Topic> firstAssigned = validationService.getOrAssignTopicsForStudent(cls, student);
        assertThat(firstAssigned).hasSize(1);
        assertThat(firstAssigned.get(0).getId()).isEqualTo(t1.getId());

        List<StudentValidationAssignment> rows1 = studentValidationAssignmentRepository
                .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(student.getId(), cls.getId());
        assertThat(rows1).hasSize(1);
        assertThat(rows1.get(0).getAssignedOrder()).isEqualTo(1);
        String initialSeed = rows1.get(0).getSeed();

        // 2. More topics become eligible before any label is saved
        studentTopicMasteryRepository.save(new StudentTopicMastery(student, cls, t2, 75.0, MasteryStatus.STRENGTH));
        studentTopicMasteryRepository.save(new StudentTopicMastery(student, cls, t3, 60.0, MasteryStatus.DEVELOPING));

        List<Topic> secondAssigned = validationService.getOrAssignTopicsForStudent(cls, student);
        assertThat(secondAssigned).hasSize(3);
        // Existing assignment t1 must NOT be removed or reordered
        assertThat(secondAssigned.get(0).getId()).isEqualTo(t1.getId());

        List<StudentValidationAssignment> rows2 = studentValidationAssignmentRepository
                .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(student.getId(), cls.getId());
        assertThat(rows2).hasSize(3);
        assertThat(rows2.get(0).getTopic().getId()).isEqualTo(t1.getId());
        assertThat(rows2.get(0).getAssignedOrder()).isEqualTo(1);
        assertThat(rows2.get(0).getSeed()).isEqualTo(initialSeed);
        assertThat(rows2.get(1).getAssignedOrder()).isEqualTo(2);
        assertThat(rows2.get(2).getAssignedOrder()).isEqualTo(3);

        // 3. Repeated call without changes returns identical results
        List<Topic> repeatedAssigned = validationService.getOrAssignTopicsForStudent(cls, student);
        assertThat(repeatedAssigned).hasSize(3);
        assertThat(repeatedAssigned.stream().map(Topic::getId).toList())
                .isEqualTo(secondAssigned.stream().map(Topic::getId).toList());
        assertThat(studentValidationAssignmentRepository
                .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(student.getId(), cls.getId()))
                .hasSize(3);

        // 4. Save one label for t1; make t4 also eligible; verify assignments are frozen
        gapValidationLabelRepository.save(new GapValidationLabel(
                student, t1, ValidationLabel.NOT_WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                cls, "Good", 0, MasteryStatus.STRENGTH, 80.0
        ));
        studentTopicMasteryRepository.save(new StudentTopicMastery(student, cls, t4, 85.0, MasteryStatus.STRENGTH));

        List<Topic> frozenAssigned = validationService.getOrAssignTopicsForStudent(cls, student);
        assertThat(frozenAssigned).hasSize(3);
        assertThat(frozenAssigned.stream().map(Topic::getId).toList())
                .isEqualTo(secondAssigned.stream().map(Topic::getId).toList());
        assertThat(studentValidationAssignmentRepository
                .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(student.getId(), cls.getId()))
                .hasSize(3);
    }

    // =========================================================================
    // 16. ELIGIBLE-ONLY DENOMINATOR AND HONEST BANNER TEST (FIX 2)
    // =========================================================================
    @Test
    @DisplayName("Fix 2: Eligible-only denominator and honest banner - excluded enrolled students reported accurately")
    void testEligibleOnlyDenominatorAndHonestBanner() {
        Subject sci = subjectRepository.save(new Subject("Natural Science", "SCI101", "Natural Science"));
        Topic top1 = topicRepository.save(new Topic(sci, "Mechanics", "Mech", 1));
        Topic top2 = topicRepository.save(new Topic(sci, "Thermodynamics", "Thermo", 2));

        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, sci, teacherA, "Science Class", "SCI01"));

        // Create 20 enrolled students
        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            User s = userRepository.save(new User(
                    "Sci Student " + i, "sci.student" + i + "@test.com", passwordEncoder.encode("pw"),
                    Role.STUDENT, UserStatus.ACTIVE, instA
            ));
            enrollmentRepository.save(new Enrollment(s, cls));
            students.add(s);
        }

        // Initially zero students are eligible -> empty state banner
        ValidationReportDto zeroRep = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(zeroRep.targetCheck().bannerType()).isEqualTo("NO_ELIGIBLE_STUDENTS");
        assertThat(zeroRep.targetCheck().sentence()).contains("No students are eligible yet: students need at least 3 answered questions in a topic");
        assertThat(zeroRep.notYetEligible()).isEqualTo(20);
        assertThat(zeroRep.eligibleStudents()).isEqualTo(0);

        // Make first 4 students eligible and fully label them
        for (int i = 0; i < 4; i++) {
            User s = students.get(i);
            studentTopicMasteryRepository.save(new StudentTopicMastery(s, cls, top1, 85.0, MasteryStatus.STRENGTH));
            studentTopicMasteryRepository.save(new StudentTopicMastery(s, cls, top2, 45.0, MasteryStatus.GAP));
            validationService.getOrAssignTopicsForStudent(cls, s);

            gapValidationLabelRepository.save(new GapValidationLabel(
                    s, top1, ValidationLabel.NOT_WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                    cls, "Strong", 0, MasteryStatus.STRENGTH, 85.0
            ));
            gapValidationLabelRepository.save(new GapValidationLabel(
                    s, top2, ValidationLabel.WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                    cls, "Weak", 0, MasteryStatus.GAP, 45.0
            ));
        }

        // 4 of 4 eligible students labeled, 16 not yet eligible -> SMALL_CLASS_COMPLETE with parenthetical
        ValidationReportDto smallCompleteRep = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(smallCompleteRep.targetCheck().bannerType()).isEqualTo("SMALL_CLASS_COMPLETE");
        assertThat(smallCompleteRep.targetCheck().sentence())
                .isEqualTo("Complete: 4 of 4 eligible students (16 enrolled students not yet eligible). Too few students to certify against the 85% target.");
        assertThat(smallCompleteRep.notYetEligible()).isEqualTo(16);
        assertThat(smallCompleteRep.eligibleStudents()).isEqualTo(4);

        // Adding an eligible unlabeled student (student index 4) returns the class to Preliminary
        User s5 = students.get(4);
        studentTopicMasteryRepository.save(new StudentTopicMastery(s5, cls, top1, 75.0, MasteryStatus.STRENGTH));
        validationService.getOrAssignTopicsForStudent(cls, s5);

        ValidationReportDto prelimRep = validationService.getClassValidationReport(cls.getId(), "TEACHER", false, teacherA.getEmail());
        assertThat(prelimRep.targetCheck().bannerType()).isEqualTo("PRELIMINARY");
        assertThat(prelimRep.targetCheck().sentence()).contains("Preliminary: 4 of 30 students labeled");
        assertThat(prelimRep.eligibleStudents()).isEqualTo(5);
        assertThat(prelimRep.notYetEligible()).isEqualTo(15);
    }

    // =========================================================================
    // 17. ADMIN BREAKDOWN ELIGIBLE-ONLY DENOMINATOR TEST
    // =========================================================================
    @Test
    @DisplayName("Admin validation breakdown: per-class rows use eligible-only denominator and honest targetStatus")
    void testAdminBreakdownEligibleOnlyDenominator() {
        User admin = userRepository.save(new User(
                "Admin Denominator Check", "admin.denom@insta.com", passwordEncoder.encode("Pass123!"),
                Role.ADMIN, UserStatus.ACTIVE, instA
        ));

        Subject sci = subjectRepository.save(new Subject("Physics", "PHY101", "Physics"));
        Topic top1 = topicRepository.save(new Topic(sci, "Kinematics", "Kin", 1));
        ClassEntity cls = classEntityRepository.save(new ClassEntity(instA, sci, teacherA, "Physics Sec A", "PHY01"));

        // Enroll 10 students in cls, but only 2 are eligible (have >= 3 answered questions / non-INSUFFICIENT_DATA mastery)
        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            User s = userRepository.save(new User(
                    "Phy Student " + i, "phy.student" + i + "@insta.com", passwordEncoder.encode("pw"),
                    Role.STUDENT, UserStatus.ACTIVE, instA
            ));
            enrollmentRepository.save(new Enrollment(s, cls));
            students.add(s);
        }

        // Before any student is eligible: breakdown for cls shows 0 / 0 and NO_ELIGIBLE_STUDENTS
        ValidationReportDto adminRepZero = validationService.getAdminValidationReport("TEACHER", false, admin.getEmail());
        ValidationClassBreakdownDto cbZero = adminRepZero.classBreakdowns().stream()
                .filter(b -> b.classId().equals(cls.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(cbZero.studentsLabeled()).isEqualTo(0);
        assertThat(cbZero.totalStudents()).isEqualTo(0);
        assertThat(cbZero.targetStatus()).isEqualTo("NO_ELIGIBLE_STUDENTS");

        // Make 2 of the 10 enrolled students eligible and fully label both
        for (int i = 0; i < 2; i++) {
            User s = students.get(i);
            studentTopicMasteryRepository.save(new StudentTopicMastery(s, cls, top1, 80.0, MasteryStatus.STRENGTH));
            validationService.getOrAssignTopicsForStudent(cls, s);
            gapValidationLabelRepository.save(new GapValidationLabel(
                    s, top1, ValidationLabel.NOT_WEAK, ValidationSource.TEACHER, teacherA, Instant.now(),
                    cls, "Matched", 0, MasteryStatus.STRENGTH, 80.0
            ));
        }

        ValidationReportDto adminRepComplete = validationService.getAdminValidationReport("TEACHER", false, admin.getEmail());
        ValidationClassBreakdownDto cbComplete = adminRepComplete.classBreakdowns().stream()
                .filter(b -> b.classId().equals(cls.getId()))
                .findFirst()
                .orElseThrow();

        // Eligible-only denominator is 2 (not 10 enrolled), and status is COMPLETED / SMALL_CLASS_COMPLETE
        assertThat(cbComplete.studentsLabeled()).isEqualTo(2);
        assertThat(cbComplete.totalStudents()).isEqualTo(2);
        assertThat(cbComplete.status()).isEqualTo("COMPLETED");
        assertThat(cbComplete.targetStatus()).isEqualTo("SMALL_CLASS_COMPLETE");
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    private GapValidationLabel createLabel(User student, Topic topic, ValidationLabel label, MasteryStatus status, Double mastery) {
        GapValidationLabel gvl = new GapValidationLabel(
                student, topic, label, ValidationSource.TEACHER, teacherA, Instant.now()
        );
        gvl.setClassroom(classA);
        gvl.setSystemStatusAtLabel(status);
        gvl.setSystemMasteryAtLabel(mastery);
        gvl.setAttemptCountAtLabel(null);
        return gvl;
    }

    private void assertBlindJson(String json) {
        String lower = json.toLowerCase();
        assertThat(lower).doesNotContain("\"masterypercent\"");
        assertThat(lower).doesNotContain("\"status\"");
        assertThat(lower).doesNotContain("\"trend\"");
        assertThat(lower).doesNotContain("\"needsattention\"");
        assertThat(lower).doesNotContain("\"gap\"");
        assertThat(lower).doesNotContain("\"developing\"");
        assertThat(lower).doesNotContain("\"strength\"");
    }
}

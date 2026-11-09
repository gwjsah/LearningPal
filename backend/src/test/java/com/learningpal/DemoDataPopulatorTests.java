package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.DemoDataPopulator;
import com.learningpal.dto.LoginRequest;
import com.learningpal.dto.TeacherInterventionDto;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.GradingService;
import com.learningpal.service.TeacherClassService;
import com.learningpal.service.TeacherFileService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Demo Data Populator: Safety Guards, Population, Idempotency, and Reset Tests")
public class DemoDataPopulatorTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Environment environment;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

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
    private InterventionRepository interventionRepository;

    @Autowired
    private ClassAssessmentSettingRepository classAssessmentSettingRepository;

    @Autowired
    private GapValidationLabelRepository gapValidationLabelRepository;

    @Autowired
    private FeedbackRatingRepository feedbackRatingRepository;

    @Autowired
    private ResourceRatingRepository resourceRatingRepository;

    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

    @Autowired
    private GradingService gradingService;

    @Autowired
    private GapAnalysisService gapAnalysisService;

    @Autowired
    private TeacherClassService teacherClassService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ResourceFileRepository resourceFileRepository;

    @Autowired
    private TeacherFileService teacherFileService;

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @AfterEach
    void tearDown() {
        transactionTemplate.execute(status -> {
            createPopulator(true, true, "DemoPass123!", false, "jdbc:h2:mem:testdb", environment).cleanDemoData();
            return null;
        });
    }

    private DemoDataPopulator createPopulator(
            boolean enabled,
            boolean reset,
            String password,
            boolean allowRemote,
            String dbUrl,
            Environment env) {
        return new DemoDataPopulator(
                enabled,
                reset,
                password,
                allowRemote,
                dbUrl,
                env,
                userRepository,
                institutionRepository,
                classEntityRepository,
                enrollmentRepository,
                subjectRepository,
                topicRepository,
                assessmentRepository,
                assessmentQuestionRepository,
                questionRepository,
                choiceRepository,
                attemptRepository,
                answerRepository,
                studentTopicMasteryRepository,
                resourceRepository,
                resourceProgressRepository,
                interventionRepository,
                classAssessmentSettingRepository,
                gapValidationLabelRepository,
                feedbackRatingRepository,
                resourceRatingRepository,
                surveyResponseRepository,
                gradingService,
                gapAnalysisService,
                teacherClassService,
                passwordEncoder,
                resourceFileRepository,
                teacherFileService
        );
    }

    @Test
    @DisplayName("Safety Guard: Populator is disabled by default and does not seed demo data")
    void testDisabledByDefault() {
        DemoDataPopulator populator = createPopulator(false, false, "DemoPass123!", false, "jdbc:h2:mem:testdb", environment);
        populator.run();

        List<User> demoUsers = userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN);
        assertTrue(demoUsers.isEmpty(), "Demo users should not exist when populator is disabled.");
        assertFalse(institutionRepository.findByCodeIgnoreCase(DemoDataPopulator.DEMO_INST_CODE).isPresent());
    }

    @Test
    @DisplayName("Safety Guard: Refuses to run if password is weak or missing")
    void testRefusesOnWeakPassword() {
        DemoDataPopulator weakPwd = createPopulator(true, false, "short", false, "jdbc:h2:mem:testdb", environment);
        weakPwd.run();
        assertTrue(userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).isEmpty());

        DemoDataPopulator noNum = createPopulator(true, false, "allletterslong", false, "jdbc:h2:mem:testdb", environment);
        noNum.run();
        assertTrue(userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).isEmpty());
    }

    @Test
    @DisplayName("Safety Guard: Refuses to run on prod profile")
    void testRefusesOnProdProfile() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        DemoDataPopulator populator = createPopulator(true, false, "DemoPass123!", false, "jdbc:h2:mem:testdb", prodEnv);
        populator.run();
        assertTrue(userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).isEmpty());
    }

    @Test
    @DisplayName("Safety Guard: Refuses to run on non-local DB unless allow-remote=true")
    void testRefusesOnNonLocalDbWithoutFlag() {
        DemoDataPopulator populator = createPopulator(true, false, "DemoPass123!", false, "jdbc:mysql://prod-aws.rds.com:3306/db", environment);
        populator.run();
        assertTrue(userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).isEmpty());
    }

    @Test
    @DisplayName("Full Population: Seeds institutions, accounts, classes, attempts, showcase student, and labels")
    void testFullPopulationAndScenarios() throws Exception {
        DemoDataPopulator populator = createPopulator(true, false, "DemoPass123!", false, "jdbc:h2:mem:testdb", environment);
        transactionTemplate.execute(status -> {
            populator.run();
            return null;
        });

        // 1. Institutions
        Institution demoInst = institutionRepository.findByCodeIgnoreCase(DemoDataPopulator.DEMO_INST_CODE).orElseThrow();
        assertEquals("Demo Institute", demoInst.getName());

        Institution pilotInst = institutionRepository.findByCodeIgnoreCase(DemoDataPopulator.PILOT_INST_CODE).orElseThrow();
        assertEquals("Pilot University", pilotInst.getName());

        // 2. Accounts
        User adminPilot = userRepository.findByEmail("admin.pilot" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        assertEquals(Role.ADMIN, adminPilot.getRole());
        assertEquals(pilotInst.getId(), adminPilot.getInstitution().getId());

        User adminDemo = userRepository.findByEmail("admin.demo" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        assertEquals(Role.ADMIN, adminDemo.getRole());
        assertEquals(demoInst.getId(), adminDemo.getInstitution().getId());

        User teacher1 = userRepository.findByEmail("teacher.pilot1" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        assertEquals(UserStatus.ACTIVE, teacher1.getStatus());

        User teacherPending = userRepository.findByEmail("teacher.pending" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        assertEquals(UserStatus.PENDING, teacherPending.getStatus());

        // 3. Classes
        ClassEntity secA = classEntityRepository.findByJoinCode("PILOT1").orElseThrow();
        assertEquals(ClassStatus.ACTIVE, secA.getStatus());
        assertTrue(secA.isEnrollmentOpen());

        ClassEntity emptySec = classEntityRepository.findByJoinCode("EMPTY1").orElseThrow();
        assertEquals(0, enrollmentRepository.findByClassEntity(emptySec).size(), "Honors class should be empty.");

        ClassEntity archSec = classEntityRepository.findByJoinCode("ARCH01").orElseThrow();
        assertEquals(ClassStatus.ARCHIVED, archSec.getStatus());
        assertFalse(archSec.isEnrollmentOpen());

        // 4. Fresh Students
        User fresh1 = userRepository.findByEmail("fresh1" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        assertEquals(0, attemptRepository.findByStudent(fresh1).size(), "Fresh student 1 should have zero attempts.");

        User fresh2 = userRepository.findByEmail("fresh2" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        assertEquals(0, attemptRepository.findByStudent(fresh2).size(), "Fresh student 2 should have zero attempts.");

        // 5. Showcase Student
        User showcase = userRepository.findByEmail("showcase" + DemoDataPopulator.DEMO_DOMAIN).orElseThrow();
        List<Attempt> showcaseAttempts = attemptRepository.findByStudent(showcase);
        assertTrue(showcaseAttempts.size() >= 2, "Showcase student should have multiple attempts.");

        List<StudentTopicMastery> showcaseMasteries = studentTopicMasteryRepository.findByStudent(showcase);
        assertFalse(showcaseMasteries.isEmpty());

        // Verify showcase student has improving trend on Loops
        Subject subject = subjectRepository.findAll().get(0);
        Topic loopsTopic = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject).get(4);
        StudentTopicMastery loopsMastery = studentTopicMasteryRepository.findByStudentAndTopic(showcase, loopsTopic).orElseThrow();
        assertTrue(loopsMastery.getMasteryPercent() > loopsMastery.getPreviousMasteryPercent(), "Showcase student should show an improving trend on Loops.");

        // Verify showcase student has completed resource
        List<ResourceProgress> completedResources = resourceProgressRepository.findByStudent(showcase);
        assertFalse(completedResources.isEmpty(), "Showcase student should have completed resources.");

        // Verify showcase student has an intervention with outcome IMPROVED
        List<TeacherInterventionDto> showcaseInterventions = teacherClassService.getClassInterventions(teacher1.getEmail(), secA.getId(), null, showcase.getId());
        assertFalse(showcaseInterventions.isEmpty());
        assertTrue(showcaseInterventions.stream().anyMatch(i -> i.outcome() == InterventionOutcome.IMPROVED),
                "Showcase student should have an intervention with outcome IMPROVED.");

        // 6. Synthetic Ground Truth Validation Labels
        List<GapValidationLabel> labels = gapValidationLabelRepository.findByStudentId(showcase.getId());
        assertEquals(6, labels.size(), "Should have synthetic label for each of the 6 topics.");
        assertTrue(labels.stream().allMatch(l -> l.getSource() == ValidationSource.SYNTHETIC));

        // 7. Verify all 4 intervention outcomes exist in the database
        List<TeacherInterventionDto> allSecAInterventions = teacherClassService.getClassInterventions(teacher1.getEmail(), secA.getId(), null, null);
        ClassEntity secB = classEntityRepository.findByJoinCode("PILOT2").orElseThrow();
        List<TeacherInterventionDto> allSecBInterventions = teacherClassService.getClassInterventions("teacher.pilot2" + DemoDataPopulator.DEMO_DOMAIN, secB.getId(), null, null);
        List<TeacherInterventionDto> combined = new java.util.ArrayList<>(allSecAInterventions);
        combined.addAll(allSecBInterventions);

        Set<InterventionOutcome> outcomesPresent = combined.stream()
                .map(TeacherInterventionDto::outcome)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        assertTrue(outcomesPresent.contains(InterventionOutcome.IMPROVED), "IMPROVED outcome should be present.");
        assertTrue(outcomesPresent.contains(InterventionOutcome.SAME), "SAME outcome should be present.");
        assertTrue(outcomesPresent.contains(InterventionOutcome.DECLINED), "DECLINED outcome should be present.");
        assertTrue(outcomesPresent.contains(InterventionOutcome.NO_NEW_DATA), "NO_NEW_DATA outcome should be present.");

        // 8. Authentication & JWT verification
        LoginRequest loginReq = new LoginRequest("teacher.pilot1" + DemoDataPopulator.DEMO_DOMAIN, "DemoPass123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("TEACHER"));

        // 9. Teacher isolation check
        String teacher1Token = objectMapper.readTree(
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                        .andReturn().getResponse().getContentAsString()
        ).get("token").asText();

        // Pilot teacher tries to view Demo Institute class -> 404
        ClassEntity demoClass = classEntityRepository.findByJoinCode("DEMO01").orElseThrow();
        mockMvc.perform(get("/api/teacher/classes/" + demoClass.getId())
                        .header("Authorization", "Bearer " + teacher1Token))
                .andExpect(status().isNotFound());

        // 10. Idempotency check: running again without reset does not duplicate
        int userCountBefore = userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).size();
        transactionTemplate.execute(status -> {
            populator.run();
            return null;
        });
        int userCountAfter = userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).size();
        assertEquals(userCountBefore, userCountAfter, "Subsequent run without reset should be idempotent.");

        // 11. Reset check: cleanDemoData removes only demo data, preserving real accounts
        long realAdminCountBefore = userRepository.findByEmail("admin@learningpal.edu").isPresent() ? 1 : 0;
        transactionTemplate.execute(status -> {
            populator.cleanDemoData();
            return null;
        });

        assertTrue(userRepository.findByEmailEndingWith(DemoDataPopulator.DEMO_DOMAIN).isEmpty(), "All demo accounts should be deleted after reset.");
        assertFalse(institutionRepository.findByCodeIgnoreCase(DemoDataPopulator.DEMO_INST_CODE).isPresent(), "Demo institute should be deleted.");
        if (realAdminCountBefore > 0) {
            assertTrue(userRepository.findByEmail("admin@learningpal.edu").isPresent(), "Real seed admin must survive demo reset!");
        }
    }
}

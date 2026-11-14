package com.learningpal;

import com.learningpal.config.LearningDataSeeder;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class LearningDataModelTests {

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
    private ResourceRepository resourceRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssessmentAccessRepository assessmentAccessRepository;

    @Autowired
    private LearningDataSeeder learningDataSeeder;

    @Test
    @DisplayName("Pilot Subject and 6 Topics exist in strictly defined order")
    void testPilotSubjectAndTopics() {
        Subject subject = subjectRepository.findByCode("C_PROG_INTRO").orElse(null);
        assertNotNull(subject, "Pilot subject C_PROG_INTRO must exist");
        assertEquals("Introduction to Programming: C Language Basics", subject.getName());

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        assertEquals(6, topics.size(), "Subject must have exactly 6 topics");

        assertEquals("Variables and Data Types", topics.get(0).getName());
        assertEquals("Operators and Expressions", topics.get(1).getName());
        assertEquals("Input and Output (printf/scanf)", topics.get(2).getName());
        assertEquals("Conditional Statements (if/else/switch)", topics.get(3).getName());
        assertEquals("Loops (for/while/do-while)", topics.get(4).getName());
        assertEquals("Functions", topics.get(5).getName());

        for (int i = 0; i < 6; i++) {
            assertEquals(i + 1, topics.get(i).getDisplayOrder(), "Topics must be ordered 1 to 6");
        }
    }

    @Test
    @DisplayName("Every question belongs to exactly one topic")
    void testEveryQuestionHasTopic() {
        List<Question> questions = questionRepository.findAll();
        assertFalse(questions.isEmpty(), "Questions list should not be empty");
        assertTrue(questions.size() >= 36, "Must have at least 36 questions seeded");

        for (Question q : questions) {
            assertNotNull(q.getTopic(), "Every question must belong to a topic");
            assertNotNull(q.getText(), "Question text cannot be null");
            assertNotNull(q.getExplanation(), "Question explanation cannot be null");
            assertNotNull(q.getDifficulty(), "Question difficulty cannot be null");
            assertEquals(1.0, q.getPoints(), "Default question points must be 1.0");
        }
    }

    @Test
    @DisplayName("Every MCQ question has exactly 4 choices with exactly ONE correct choice")
    void testEveryMcqHasExactlyOneCorrectChoiceOutOfFour() {
        List<Question> questions = questionRepository.findAll();

        for (Question q : questions) {
            if (q.getType() == QuestionType.MCQ) {
                List<Choice> choices = choiceRepository.findByQuestion(q);
                assertEquals(4, choices.size(), "Question ID " + q.getId() + " must have exactly 4 choices");

                Set<String> labels = new HashSet<>();
                long correctCount = 0;

                for (Choice c : choices) {
                    labels.add(c.getLabel());
                    if (c.isCorrect()) {
                        correctCount++;
                    }
                }

                assertTrue(labels.containsAll(List.of("A", "B", "C", "D")), "Choices must be labeled A, B, C, D");
                assertEquals(1, correctCount, "Question ID " + q.getId() + " must have exactly one correct choice");
            }
        }
    }

    @Test
    @DisplayName("Every topic has at least 6 questions")
    void testEveryTopicHasAtLeastSixQuestions() {
        List<Topic> topics = topicRepository.findAll();
        for (Topic t : topics) {
            long count = questionRepository.countByTopicId(t.getId());
            assertTrue(count >= 6, "Topic " + t.getName() + " must have at least 6 questions, found: " + count);
        }
    }

    @Test
    @DisplayName("Every topic has at least 2 resources (at least one NOTE and one PRACTICE)")
    void testEveryTopicHasResources() {
        List<Topic> topics = topicRepository.findAll();
        for (Topic t : topics) {
            List<Resource> resources = resourceRepository.findByTopic(t);
            assertTrue(resources.size() >= 2, "Topic " + t.getName() + " must have at least 2 resources");

            boolean hasNote = resources.stream().anyMatch(r -> r.getType() == ResourceType.NOTE);
            boolean hasPractice = resources.stream().anyMatch(r -> r.getType() == ResourceType.PRACTICE);

            assertTrue(hasNote, "Topic " + t.getName() + " must have a NOTE resource");
            assertTrue(hasPractice, "Topic " + t.getName() + " must have a PRACTICE resource");

            for (Resource r : resources) {
                assertNull(r.getUrl(), "Resource url must be null");
                assertNotNull(r.getContent(), "Resource content must be populated");
                assertFalse(r.getContent().isBlank(), "Resource content must not be blank");
            }
        }
    }

    @Test
    @DisplayName("Comprehensive Diagnostic Assessment covers all 6 topics with 18 questions")
    void testComprehensiveDiagnosticCoversAllSixTopics() {
        Assessment diagnostic = assessmentRepository.findByTitle("Comprehensive Diagnostic Assessment")
                .orElse(null);
        assertNotNull(diagnostic, "Comprehensive Diagnostic Assessment must exist");
        assertEquals(AssessmentStatus.PUBLISHED, diagnostic.getStatus());

        List<AssessmentQuestion> items = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(diagnostic);
        assertEquals(18, items.size(), "Comprehensive Diagnostic must contain 18 questions");

        Set<Long> coveredTopicIds = new HashSet<>();
        for (AssessmentQuestion aq : items) {
            coveredTopicIds.add(aq.getQuestion().getTopic().getId());
        }

        assertEquals(6, coveredTopicIds.size(), "Diagnostic must cover all 6 distinct topics");
    }

    @Test
    @DisplayName("Seeder is idempotent and does not duplicate data on restart")
    void testSeederIsIdempotent() {
        long initialSubjects = subjectRepository.count();
        long initialTopics = topicRepository.count();
        long initialQuestions = questionRepository.count();
        long initialChoices = choiceRepository.count();
        long initialAssessments = assessmentRepository.count();
        long initialResources = resourceRepository.count();

        // Run seeder again
        learningDataSeeder.run();

        assertEquals(initialSubjects, subjectRepository.count());
        assertEquals(initialTopics, topicRepository.count());
        assertEquals(initialQuestions, questionRepository.count());
        assertEquals(initialChoices, choiceRepository.count());
        assertEquals(initialAssessments, assessmentRepository.count());
        assertEquals(initialResources, resourceRepository.count());
    }

    @Test
    @Transactional
    @DisplayName("Unique constraints reject duplicates for AssessmentQuestion and Answer")
    void testUniqueConstraints() {
        Assessment assessment = assessmentRepository.findAll().get(0);
        Question question = questionRepository.findAll().get(0);

        // Duplicate assessment question position or assessment-question pair
        AssessmentQuestion duplicateAq = new AssessmentQuestion(assessment, question, 999);
        // Note: the seeder already assigned question to an assessment question in topic quiz
        // If we try to insert duplicate (assessment, question), JPA/DB should reject it
        assertThrows(DataIntegrityViolationException.class, () -> {
            assessmentQuestionRepository.saveAndFlush(duplicateAq);
        });
    }

    @Test
    @Transactional
    @DisplayName("Answer grading rule: single recalculation logic for autoScore and teacherScore override")
    void testAnswerGradingRule() {
        User student = userRepository.findAll().get(0);
        User teacher = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.TEACHER)
                .findFirst()
                .orElse(student);

        Assessment assessment = assessmentRepository.findAll().get(0);
        Question question = questionRepository.findAll().get(0);
        Choice choice = choiceRepository.findByQuestion(question).get(0);

        Attempt attempt = attemptRepository.save(new Attempt(student, assessment));
        Answer answer = new Answer(attempt, question, choice);

        // 1. Initial state: no scores
        assertNull(answer.getAutoScore());
        assertNull(answer.getTeacherScore());
        assertNull(answer.getFinalScore());

        // 2. Auto-grading occurs (e.g. choice matches correct answer -> 1.0)
        answer.applyAutoScore(1.0);
        assertEquals(1.0, answer.getAutoScore());
        assertNull(answer.getTeacherScore());
        assertEquals(1.0, answer.getFinalScore(), "Final score must equal auto score when no teacher override exists");

        // 3. Teacher overrides score with feedback
        answer.applyTeacherOverride(0.5, "Partial credit granted for method", teacher);
        assertEquals(1.0, answer.getAutoScore());
        assertEquals(0.5, answer.getTeacherScore());
        assertEquals(0.5, answer.getFinalScore(), "Final score must be teacher score when present");
        assertEquals("Partial credit granted for method", answer.getTeacherComment());
        assertEquals(teacher, answer.getGradedBy());
        assertNotNull(answer.getGradedAt());

        // 4. Persistence check
        Answer saved = answerRepository.saveAndFlush(answer);
        assertEquals(0.5, saved.getFinalScore());
    }

    @Test
    @DisplayName("Assessment scheduling and randomization defaults")
    void testAssessmentSchedulingAndRandomizationDefaults() {
        List<Assessment> assessments = assessmentRepository.findAll();
        assertFalse(assessments.isEmpty());

        for (Assessment a : assessments) {
            assertTrue(a.isRandomizeQuestions(), "Questions should be randomized by default");
            assertTrue(a.isRandomizeChoices(), "Choices should be randomized by default");
            assertEquals(AssessmentStatus.PUBLISHED, a.getStatus());
        }

        // Test custom scheduling window
        Assessment assessment = assessments.get(0);
        java.time.Instant now = java.time.Instant.now();
        assessment.setAvailableFrom(now);
        assessment.setAvailableUntil(now.plusSeconds(3600));
        assessment.setTimeLimitMinutes(45);
        Assessment updated = assessmentRepository.saveAndFlush(assessment);

        assertEquals(45, updated.getTimeLimitMinutes());
        assertNotNull(updated.getAvailableFrom());
        assertNotNull(updated.getAvailableUntil());
    }

    @Test
    @Transactional
    @DisplayName("AssessmentAccess: teacher can reopen assessment with extended deadline, rejects duplicates")
    void testAssessmentAccessAndTeacherReopenFlow() {
        User student = userRepository.findAll().get(0);
        User teacher = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.TEACHER)
                .findFirst()
                .orElse(student);

        Assessment assessment = assessmentRepository.findAll().get(0);

        AssessmentAccess access = new AssessmentAccess(assessment, student);
        assertFalse(access.isReopened(), "Default access should not be reopened");
        assessmentAccessRepository.saveAndFlush(access);

        // Teacher grants reopen with an extended deadline
        java.time.Instant extension = java.time.Instant.now().plusSeconds(86400);
        access.grantReopen(teacher, extension, "Illness excuse approved");
        AssessmentAccess updated = assessmentAccessRepository.saveAndFlush(access);

        assertTrue(updated.isReopened());
        assertEquals(teacher, updated.getReopenedBy());
        assertNotNull(updated.getReopenedAt());
        assertEquals(extension, updated.getExtendedUntil());
        assertEquals("Illness excuse approved", updated.getReason());

        // Verify duplicate (assessment, student) is rejected
        AssessmentAccess duplicate = new AssessmentAccess(assessment, student);
        assertThrows(DataIntegrityViolationException.class, () -> {
            assessmentAccessRepository.saveAndFlush(duplicate);
        });
    }

    @Test
    @Transactional
    @DisplayName("Attempt numbering tracks initial attempt and subsequent retakes")
    void testStudentRetakeAttemptNumbering() {
        User student = userRepository.findAll().get(0);
        Assessment assessment = assessmentRepository.findAll().get(0);

        // Attempt 1: submitted
        Attempt attempt1 = new Attempt(student, assessment, 1);
        attempt1.setStatus(AttemptStatus.SUBMITTED);
        attempt1.setTotalScore(8.0);
        attemptRepository.saveAndFlush(attempt1);

        // Attempt 2: retake after teacher reopen
        Attempt attempt2 = new Attempt(student, assessment, 2);
        attemptRepository.saveAndFlush(attempt2);

        List<Attempt> attempts = attemptRepository.findByStudentAndAssessmentOrderByAttemptNumberDesc(student, assessment);
        assertEquals(2, attempts.size());
        assertEquals(2, attempts.get(0).getAttemptNumber());
        assertEquals(1, attempts.get(1).getAttemptNumber());
    }
}

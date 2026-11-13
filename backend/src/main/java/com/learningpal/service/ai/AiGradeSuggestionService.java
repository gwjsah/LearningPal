package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.dto.AiCriterionSuggestionDto;
import com.learningpal.dto.AiGradeSuggestionDto;
import com.learningpal.dto.CriterionScoreRequest;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.RateLimitException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.exception.ServiceUnavailableException;
import com.learningpal.repository.*;
import com.learningpal.service.TenantAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Generates on-demand AI rubric grade suggestions for ESSAY answers.
 * Never writes teacherScore, autoScore, or finalScore; only TeacherClassService.gradeAnswer can set grades.
 */
@Service
public class AiGradeSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(AiGradeSuggestionService.class);
    private static final int MIN_ANSWER_LENGTH_FOR_LLM = 10;

    private final AiConfigProperties aiConfig;
    private final LlmClient llmClient;
    private final AiGenerationWorkerService workerService;
    private final AiGradeSuggestionRepository suggestionRepository;
    private final UserRepository userRepository;
    private final ClassEntityRepository classEntityRepository;
    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final EssayRubricCriterionRepository rubricCriterionRepository;
    private final TenantAccess tenantAccess;
    private final ObjectMapper objectMapper;
    private final AiResponseParser responseParser;

    public AiGradeSuggestionService(
            AiConfigProperties aiConfig,
            LlmClient llmClient,
            AiGenerationWorkerService workerService,
            AiGradeSuggestionRepository suggestionRepository,
            UserRepository userRepository,
            ClassEntityRepository classEntityRepository,
            AttemptRepository attemptRepository,
            AnswerRepository answerRepository,
            EssayRubricCriterionRepository rubricCriterionRepository,
            TenantAccess tenantAccess,
            ObjectMapper objectMapper) {
        this.aiConfig = aiConfig;
        this.llmClient = llmClient;
        this.workerService = workerService;
        this.suggestionRepository = suggestionRepository;
        this.userRepository = userRepository;
        this.classEntityRepository = classEntityRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.rubricCriterionRepository = rubricCriterionRepository;
        this.tenantAccess = tenantAccess;
        this.objectMapper = objectMapper;
        this.responseParser = new AiResponseParser(objectMapper);
    }

    @Transactional
    public AiGradeSuggestionDto suggestEssayGrade(
            String teacherEmail,
            Long classId,
            Long attemptId,
            Long answerId) {
        User teacher = getActiveTeacher(teacherEmail);
        Answer answer = requireOwnedEssayAnswer(teacher, classId, attemptId, answerId);

        if (!aiConfig.isEnabled()) {
            throw new ServiceUnavailableException("AI grade suggestions are currently disabled in server configuration.");
        }
        if (aiConfig.isGeminiProvider() && (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isBlank())) {
            throw new ServiceUnavailableException("AI grade suggestions are unavailable: Gemini API key is not configured.");
        }

        if (aiConfig.getMaxSuggestionsPerTeacherPerHour() > 0) {
            Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
            long recent = suggestionRepository.countByTeacherAndCreatedAtAfter(teacher, oneHourAgo);
            if (recent >= aiConfig.getMaxSuggestionsPerTeacherPerHour()) {
                throw new RateLimitException("Hourly AI suggestion limit reached ("
                        + aiConfig.getMaxSuggestionsPerTeacherPerHour() + " suggestions/hour). Please grade manually or try again later.");
            }
        }

        Question question = answer.getQuestion();
        List<EssayRubricCriterion> criteria = rubricCriterionRepository.findByQuestionOrderByDisplayOrderAsc(question);
        if (criteria.isEmpty()) {
            throw new BadRequestException("Essay question has no rubric criteria configured.");
        }

        String studentAnswer = answer.getTextAnswer() != null ? answer.getTextAnswer().trim() : "";

        AiResponseParser.ParsedEssaySuggestion parsed;
        String providerName;
        String modelName;

        if (studentAnswer.length() < MIN_ANSWER_LENGTH_FOR_LLM) {
            // Avoid calling the LLM for empty or trivially short (<10 char) answers
            List<AiCriterionSuggestionDto> zeroCriteria = criteria.stream()
                    .map(c -> new AiCriterionSuggestionDto(c.getId(), 0, "Student answer is empty or under 10 characters."))
                    .toList();
            parsed = new AiResponseParser.ParsedEssaySuggestion(
                    zeroCriteria,
                    "Student answer is empty or too short to evaluate."
            );
            providerName = "local-rule";
            modelName = "short-answer-check";
        } else {
            providerName = aiConfig.getProvider();
            modelName = aiConfig.getActiveModel();
            parsed = invokeLlmWithSingleRepair(
                    question.getText(),
                    criteria,
                    question.getExplanation(),
                    studentAnswer
            );
        }

        // Supersede any prior pending SUGGESTED record for this answer
        suggestionRepository.findTopByAnswerAndStatusInOrderByCreatedAtDesc(
                answer, List.of(AiGradeSuggestionStatus.SUGGESTED)
        ).ifPresent(prev -> {
            prev.setStatus(AiGradeSuggestionStatus.DISCARDED);
            prev.setResolvedAt(Instant.now());
            suggestionRepository.save(prev);
        });

        String json;
        try {
            json = objectMapper.writeValueAsString(parsed.criteria());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize AI suggestion criteria", e);
        }

        AiGradeSuggestion suggestion = new AiGradeSuggestion(
                answer,
                teacher,
                json,
                parsed.overallFeedback(),
                providerName,
                modelName
        );
        AiGradeSuggestion saved = suggestionRepository.save(suggestion);
        return AiGradeSuggestionDto.fromEntity(saved);
    }

    @Transactional
    public AiGradeSuggestionDto discardSuggestion(
            String teacherEmail,
            Long classId,
            Long attemptId,
            Long answerId,
            Long suggestionId) {
        User teacher = getActiveTeacher(teacherEmail);
        Answer answer = requireOwnedAttemptAnswer(teacher, classId, attemptId, answerId);

        AiGradeSuggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new ResourceNotFoundException("Suggestion not found: " + suggestionId));
        if (!suggestion.getAnswer().getId().equals(answer.getId())) {
            throw new ResourceNotFoundException("Suggestion not found: " + suggestionId);
        }

        if (suggestion.getStatus() == AiGradeSuggestionStatus.SUGGESTED) {
            suggestion.setStatus(AiGradeSuggestionStatus.DISCARDED);
            suggestion.setResolvedAt(Instant.now());
            suggestion = suggestionRepository.save(suggestion);
        }
        return AiGradeSuggestionDto.fromEntity(suggestion);
    }

    @Transactional
    public void resolveActiveSuggestionOnSave(
            Answer answer,
            List<CriterionScoreRequest> savedScores,
            String savedComment) {
        Optional<AiGradeSuggestion> activeOpt = suggestionRepository.findTopByAnswerAndStatusInOrderByCreatedAtDesc(
                answer, List.of(AiGradeSuggestionStatus.SUGGESTED)
        );
        if (activeOpt.isEmpty()) {
            return;
        }
        AiGradeSuggestion suggestion = activeOpt.get();
        AiGradeSuggestionDto dto = AiGradeSuggestionDto.fromEntity(suggestion);

        Map<Long, Integer> suggestedById = new HashMap<>();
        for (AiCriterionSuggestionDto c : dto.criteria()) {
            suggestedById.put(c.criterionId(), c.points());
        }

        boolean pointsMatch = savedScores != null && savedScores.size() == suggestedById.size();
        if (pointsMatch) {
            for (CriterionScoreRequest req : savedScores) {
                if (!Objects.equals(suggestedById.get(req.criterionId()), req.points())) {
                    pointsMatch = false;
                    break;
                }
            }
        }

        String normSuggestedFeedback = dto.overallFeedback() != null ? dto.overallFeedback().trim() : "";
        String normSavedComment = savedComment != null ? savedComment.trim() : "";
        boolean feedbackMatches = Objects.equals(normSuggestedFeedback, normSavedComment);

        suggestion.setStatus(pointsMatch && feedbackMatches ? AiGradeSuggestionStatus.ACCEPTED : AiGradeSuggestionStatus.EDITED);
        suggestion.setResolvedAt(Instant.now());
        suggestionRepository.save(suggestion);
    }

    public AiGradeSuggestionDto getLatestVisibleSuggestion(Answer answer) {
        return suggestionRepository.findTopByAnswerAndStatusInOrderByCreatedAtDesc(
                answer,
                List.of(AiGradeSuggestionStatus.SUGGESTED, AiGradeSuggestionStatus.ACCEPTED, AiGradeSuggestionStatus.EDITED)
        ).map(AiGradeSuggestionDto::fromEntity).orElse(null);
    }

    private AiResponseParser.ParsedEssaySuggestion invokeLlmWithSingleRepair(
            String questionPrompt,
            List<EssayRubricCriterion> criteria,
            String modelAnswerNote,
            String studentAnswer) {
        String systemPrompt = AiPromptBuilder.buildEssaySuggestionSystemPrompt();
        String userPrompt = AiPromptBuilder.buildEssaySuggestionUserPrompt(
                questionPrompt, criteria, modelAnswerNote, studentAnswer, aiConfig.getActiveUserSuffix()
        );
        Map<String, Object> schema = AiPromptBuilder.buildEssaySuggestionJsonSchema();

        return workerService.executeExclusiveSynchronous(() -> {
            try {
                String raw = llmClient.generateChatCompletion(
                        systemPrompt,
                        userPrompt,
                        aiConfig.getTemperature(),
                        aiConfig.getRequestTimeoutSeconds(),
                        schema
                );
                return responseParser.parseAndValidateEssaySuggestion(raw, criteria);
            } catch (LlmRateLimitException rateEx) {
                throw new RateLimitException(rateEx.getMessage());
            } catch (Exception firstEx) {
                log.warn("Primary essay suggestion attempt failed ({}). Executing single repair retry...", firstEx.getMessage());
                try {
                    String repairPrompt = AiPromptBuilder.buildEssaySuggestionRepairPrompt(
                            questionPrompt,
                            criteria,
                            modelAnswerNote,
                            studentAnswer,
                            aiConfig.getActiveUserSuffix(),
                            firstEx.getMessage() != null ? firstEx.getMessage() : "Malformed JSON"
                    );
                    String repairRaw = llmClient.generateChatCompletion(
                            systemPrompt,
                            repairPrompt,
                            aiConfig.getTemperature(),
                            aiConfig.getRequestTimeoutSeconds(),
                            schema
                    );
                    return responseParser.parseAndValidateEssaySuggestion(repairRaw, criteria);
                } catch (LlmRateLimitException rateEx) {
                    throw new RateLimitException(rateEx.getMessage());
                } catch (Exception repairEx) {
                    log.warn("Essay suggestion repair retry failed: {}", repairEx.getMessage());
                    throw new ServiceUnavailableException(
                            "The AI could not produce a valid rubric suggestion right now. Please grade manually or try again."
                    );
                }
            }
        }, aiConfig.getRequestTimeoutSeconds());
    }

    private User getActiveTeacher(String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        if (teacher.getRole() != Role.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new ResourceNotFoundException("Active teacher account required");
        }
        tenantAccess.requireCallerInstitution(teacher);
        return teacher;
    }

    private Answer requireOwnedAttemptAnswer(User teacher, Long classId, Long attemptId, Long answerId) {
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));
        if (attempt.getClassId() == null || !attempt.getClassId().equals(cls.getId())) {
            throw new ResourceNotFoundException("Attempt not found in class: " + attemptId);
        }
        if (attempt.getStatus() != AttemptStatus.SUBMITTED) {
            throw new BadRequestException("Only submitted attempts can be graded.");
        }
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found: " + answerId));
        if (!answer.getAttempt().getId().equals(attempt.getId())) {
            throw new ResourceNotFoundException("Answer does not belong to attempt: " + answerId);
        }
        return answer;
    }

    private Answer requireOwnedEssayAnswer(User teacher, Long classId, Long attemptId, Long answerId) {
        Answer answer = requireOwnedAttemptAnswer(teacher, classId, attemptId, answerId);
        QuestionType qType = answer.getQuestion().getType() != null
                ? answer.getQuestion().getType().canonical()
                : QuestionType.MULTIPLE_CHOICE;
        if (qType != QuestionType.ESSAY) {
            throw new BadRequestException("AI grade suggestions are only supported for ESSAY answers.");
        }
        return answer;
    }
}

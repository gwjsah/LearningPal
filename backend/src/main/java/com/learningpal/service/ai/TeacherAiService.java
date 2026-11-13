package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.*;
import com.learningpal.repository.*;
import com.learningpal.service.TeacherContentService;
import com.learningpal.service.TeacherFileService;
import com.learningpal.service.TenantAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Service managing teacher AI generation workflows, status inquiries,
 * draft evaluations, approvals, and rejections.
 */
@Service
public class TeacherAiService {

    private static final Logger log = LoggerFactory.getLogger(TeacherAiService.class);

    private final AiConfigProperties aiConfig;
    private final LlmClient llmClient;
    private final AiGenerationWorkerService workerService;
    private final AiGenerationJobRepository jobRepository;
    private final AiQuestionDraftRepository draftRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final TeacherFileService teacherFileService;
    private final TeacherContentService teacherContentService;
    private final TenantAccess tenantAccess;
    private final ObjectMapper objectMapper;

    public TeacherAiService(
            AiConfigProperties aiConfig,
            LlmClient llmClient,
            AiGenerationWorkerService workerService,
            AiGenerationJobRepository jobRepository,
            AiQuestionDraftRepository draftRepository,
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            QuestionRepository questionRepository,
            TeacherFileService teacherFileService,
            TeacherContentService teacherContentService,
            TenantAccess tenantAccess,
            ObjectMapper objectMapper) {
        this.aiConfig = aiConfig;
        this.llmClient = llmClient;
        this.workerService = workerService;
        this.jobRepository = jobRepository;
        this.draftRepository = draftRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.teacherFileService = teacherFileService;
        this.teacherContentService = teacherContentService;
        this.tenantAccess = tenantAccess;
        this.objectMapper = objectMapper;
    }

    /**
     * Checks server LLM configuration and local LM Studio connectivity.
     */
    public AiStatusDto getAiStatus(String teacherEmail) {
        getActiveTeacher(teacherEmail);

        boolean enabled = aiConfig.isEnabled();
        boolean reachable = false;
        boolean modelFound = false;
        String provider = aiConfig.getProvider();

        if (enabled) {
            if (aiConfig.isGeminiProvider() && (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isBlank())) {
                reachable = false;
                modelFound = false;
            } else {
                reachable = llmClient.isAvailable();
                if (reachable) {
                    List<String> availableModels = llmClient.listModels();
                    String targetModel = aiConfig.getActiveModel();
                    modelFound = availableModels.stream().anyMatch(m ->
                            m.equalsIgnoreCase(targetModel) ||
                            m.equalsIgnoreCase("models/" + targetModel) ||
                            targetModel.equalsIgnoreCase("models/" + m)
                    );
                }
            }
        }

        return new AiStatusDto(enabled, reachable, aiConfig.getActiveModel(), modelFound, provider);
    }

    /**
     * Creates and enqueues an AI question drafting job from an uploaded file.
     */
    @Transactional
    public AiGenerationJobDto createJob(
            String teacherEmail,
            Long subjectId,
            Long fileId,
            CreateAiJobRequest request) {

        if (!aiConfig.isEnabled()) {
            throw new ServiceUnavailableException("AI question drafting is currently disabled in server configuration.");
        }

        if (aiConfig.isGeminiProvider() && (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isBlank())) {
            throw new ServiceUnavailableException("AI question drafting is unavailable: Gemini API key is not configured.");
        }

        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Topic topic = topicRepository.findById(request.topicId())
                .orElseThrow(() -> new BadRequestException("Topic not found: " + request.topicId()));
        if (!topic.getSubject().getId().equals(subject.getId())) {
            throw new BadRequestException("Topic does not belong to this subject");
        }

        ResourceFile resourceFile = teacherFileService.requireOwnedResourceFile(teacher, fileId);
        if (!resourceFile.getResource().getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("File not found in this subject: " + fileId);
        }

        if (resourceFile.getExtractionStatus() != ExtractionStatus.READY) {
            throw new BadRequestException("File text is not ready for question drafting. Status: " + resourceFile.getExtractionStatus());
        }

        // Enforce max 1 active (QUEUED or RUNNING) job per teacher
        long activeJobs = jobRepository.countByTeacherAndStatusIn(teacher, List.of(AiJobStatus.QUEUED, AiJobStatus.RUNNING));
        if (activeJobs > 0) {
            throw new ConflictException("You already have a generation job in progress. Please wait for it to complete or cancel it.");
        }

        // Enforce hourly rate limit per teacher (fall back to 5 if configured <= 0)
        int maxJobsPerHour = aiConfig.getMaxJobsPerTeacherPerHour() > 0 ? aiConfig.getMaxJobsPerTeacherPerHour() : 5;
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long recentJobs = jobRepository.countByTeacherAndCreatedAtAfter(teacher, oneHourAgo);
        if (recentJobs >= maxJobsPerHour) {
            throw new RateLimitException("Hourly generation limit reached (" + maxJobsPerHour + " jobs/hour). Please try again later.");
        }

        QuestionType targetType = request.questionType() != null
                ? request.questionType().canonical()
                : QuestionType.MULTIPLE_CHOICE;

        // Enforce strict question count rules (max 10 for ESSAY, max 30 for MULTIPLE_CHOICE / ENUMERATION)
        int count = request.count() != null ? request.count() : CreateAiJobRequest.DEFAULT_QUESTIONS;
        int typeMax = targetType == QuestionType.ESSAY
                ? CreateAiJobRequest.MAX_ESSAY_QUESTIONS
                : CreateAiJobRequest.MAX_QUESTIONS;
        int maxAllowed = Math.min(typeMax, aiConfig.getMaxDraftsPerJob());
        if (count < CreateAiJobRequest.MIN_QUESTIONS || count > maxAllowed) {
            throw new BadRequestException("Question count must be between " + CreateAiJobRequest.MIN_QUESTIONS + " and " + maxAllowed);
        }

        AiGenerationJob job = new AiGenerationJob(
                teacher,
                subject,
                topic,
                resourceFile,
                count,
                targetType,
                aiConfig.getActiveModel()
        );

        AiGenerationJob saved = jobRepository.save(job);
        Long savedJobId = saved.getId();

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    workerService.submitJob(savedJobId);
                }
            });
        } else {
            workerService.submitJob(savedJobId);
        }

        return AiGenerationJobDto.fromEntity(saved, 0);
    }

    /**
     * Retrieves status and progress of an AI generation job.
     */
    @Transactional(readOnly = true)
    public AiGenerationJobDto getJob(String teacherEmail, Long jobId) {
        User teacher = getActiveTeacher(teacherEmail);
        AiGenerationJob job = requireOwnedJob(teacher, jobId);
        long draftsCount = draftRepository.countByJob(job);
        return AiGenerationJobDto.fromEntity(job, draftsCount);
    }

    /**
     * Cancels an in-progress or queued AI generation job.
     */
    @Transactional
    public AiGenerationJobDto cancelJob(String teacherEmail, Long jobId) {
        User teacher = getActiveTeacher(teacherEmail);
        AiGenerationJob job = requireOwnedJob(teacher, jobId);

        if (job.getStatus() == AiJobStatus.QUEUED || job.getStatus() == AiJobStatus.RUNNING) {
            workerService.cancelJob(jobId);
            job.setStatus(AiJobStatus.CANCELLED);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        }

        long draftsCount = draftRepository.countByJob(job);
        return AiGenerationJobDto.fromEntity(job, draftsCount);
    }

    /**
     * Lists all generation jobs belonging to the authenticated teacher.
     */
    @Transactional(readOnly = true)
    public List<AiGenerationJobDto> listTeacherJobs(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        List<AiGenerationJob> jobs;
        if (subjectId != null) {
            Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);
            jobs = jobRepository.findByTeacherAndSubjectIdOrderByCreatedAtDesc(teacher, subject.getId());
        } else {
            jobs = jobRepository.findByTeacherOrderByCreatedAtDesc(teacher);
        }

        return jobs.stream()
                .map(j -> AiGenerationJobDto.fromEntity(j, draftRepository.countByJob(j)))
                .toList();
    }

    /**
     * Lists all question drafts associated with a generation job.
     */
    @Transactional(readOnly = true)
    public List<AiQuestionDraftDto> getJobDrafts(String teacherEmail, Long jobId) {
        User teacher = getActiveTeacher(teacherEmail);
        AiGenerationJob job = requireOwnedJob(teacher, jobId);

        return draftRepository.findByJobOrderByIdAsc(job).stream()
                .map(AiQuestionDraftDto::fromEntity)
                .toList();
    }

    /**
     * Edits an AI draft prior to approval.
     */
    @Transactional
    public AiQuestionDraftDto updateDraft(String teacherEmail, Long draftId, UpdateDraftRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        AiQuestionDraft draft = requireOwnedDraft(teacher, draftId);

        if (draft.getStatus() == AiDraftStatus.APPROVED) {
            throw new BadRequestException("Approved drafts cannot be edited directly. Edit the approved question in the question bank instead.");
        }

        QuestionType type = draft.getQuestionType();
        draft.setQuestionText(request.questionText().trim());
        if (request.difficulty() != null) {
            draft.setDifficulty(request.difficulty());
        }

        switch (type) {
            case ENUMERATION -> {
                List<String> variants = request.acceptedAnswers();
                if (variants == null || variants.isEmpty() || variants.size() > 10) {
                    throw new BadRequestException("Enumeration drafts require 1 to 10 accepted answer variants.");
                }
                List<String> cleaned = new ArrayList<>(variants.size());
                for (String v : variants) {
                    if (v == null || v.isBlank() || v.trim().length() > 100) {
                        throw new BadRequestException("Each accepted answer variant must be non-blank and at most 100 characters.");
                    }
                    cleaned.add(v.trim());
                }
                if (request.explanation() == null || request.explanation().isBlank()) {
                    throw new BadRequestException("Explanation is required for enumeration drafts.");
                }
                double pts = request.points() != null ? request.points() : draft.getPoints();
                if (pts <= 0) {
                    throw new BadRequestException("Points must be positive.");
                }
                try {
                    draft.setAcceptedAnswersJson(objectMapper.writeValueAsString(cleaned));
                } catch (Exception e) {
                    throw new IllegalStateException("Failed to serialize accepted answers", e);
                }
                draft.setPoints(pts);
                draft.setExplanation(request.explanation().trim());
            }
            case ESSAY -> {
                List<EssayRubricCriterionDto> criteria = request.rubricCriteria();
                if (criteria == null || criteria.isEmpty() || criteria.size() > 8) {
                    throw new BadRequestException("Essay drafts require 1 to 8 rubric criteria.");
                }
                List<EssayRubricCriterionDto> cleaned = new ArrayList<>(criteria.size());
                int totalPoints = 0;
                for (EssayRubricCriterionDto c : criteria) {
                    if (c == null || c.name() == null || c.name().isBlank() || c.name().trim().length() > 100) {
                        throw new BadRequestException("Each rubric criterion requires a non-blank name (max 100 chars).");
                    }
                    String desc = c.description() != null ? c.description().trim() : "";
                    if (desc.length() > 500) {
                        throw new BadRequestException("Rubric criterion description cannot exceed 500 characters.");
                    }
                    if (c.maxPoints() == null || c.maxPoints() <= 0) {
                        throw new BadRequestException("Rubric criterion maxPoints must be a positive integer.");
                    }
                    totalPoints += c.maxPoints();
                    cleaned.add(new EssayRubricCriterionDto(null, c.name().trim(), desc, c.maxPoints(), cleaned.size()));
                }
                try {
                    draft.setRubricCriteriaJson(objectMapper.writeValueAsString(cleaned));
                } catch (Exception e) {
                    throw new IllegalStateException("Failed to serialize rubric criteria", e);
                }
                draft.setPoints(totalPoints);
                String note = request.modelAnswerNote() != null ? request.modelAnswerNote() : request.explanation();
                draft.setExplanation(note != null && !note.isBlank() ? note.trim() : null);
            }
            default -> {
                List<String> choices = request.choices();
                if (choices == null || choices.size() != 4 || choices.stream().anyMatch(c -> c == null || c.isBlank())) {
                    throw new BadRequestException("Exactly 4 non-blank choices are required.");
                }
                if (request.correctIndex() == null || request.correctIndex() < 0 || request.correctIndex() > 3) {
                    throw new BadRequestException("Correct index must be between 0 and 3.");
                }
                if (request.explanation() == null || request.explanation().isBlank()) {
                    throw new BadRequestException("Explanation cannot be blank.");
                }
                draft.setChoiceA(choices.get(0).trim());
                draft.setChoiceB(choices.get(1).trim());
                draft.setChoiceC(choices.get(2).trim());
                draft.setChoiceD(choices.get(3).trim());
                draft.setCorrectIndex(request.correctIndex());
                draft.setExplanation(request.explanation().trim());
                if (request.points() != null && request.points() > 0) {
                    draft.setPoints(request.points());
                }
            }
        }

        AiQuestionDraft saved = draftRepository.save(draft);
        return AiQuestionDraftDto.fromEntity(saved);
    }

    /**
     * Approves an AI question draft, creating an official question with origin AI and source file linkage.
     * Guaranteed idempotent: repeated approvals of the same draft return the existing approved question.
     */
    @Transactional
    public TeacherQuestionDto approveDraft(String teacherEmail, Long draftId) {
        User teacher = getActiveTeacher(teacherEmail);
        AiQuestionDraft draft = requireOwnedDraft(teacher, draftId);

        if (draft.getStatus() == AiDraftStatus.APPROVED && draft.getApprovedQuestion() != null) {
            return teacherContentService.getQuestion(
                    teacherEmail,
                    draft.getJob().getSubject().getId(),
                    draft.getApprovedQuestion().getId()
            );
        }

        AiGenerationJob job = draft.getJob();
        Long subjectId = job.getSubject().getId();
        Long topicId = job.getTopic().getId();
        QuestionType type = draft.getQuestionType();
        AiQuestionDraftDto dto = AiQuestionDraftDto.fromEntity(draft);

        CreateQuestionRequest createReq = switch (type) {
            case ENUMERATION -> new CreateQuestionRequest(
                    topicId,
                    draft.getQuestionText(),
                    draft.getExplanation(),
                    draft.getDifficulty(),
                    draft.getPoints() > 0 ? draft.getPoints() : 1.0,
                    null,
                    QuestionType.ENUMERATION,
                    dto.acceptedAnswers(),
                    null
            );
            case ESSAY -> {
                int rubricSum = dto.rubricCriteria().stream()
                        .mapToInt(c -> c.maxPoints() != null ? c.maxPoints() : 0)
                        .sum();
                yield new CreateQuestionRequest(
                        topicId,
                        draft.getQuestionText(),
                        draft.getExplanation(),
                        draft.getDifficulty(),
                        (double) rubricSum,
                        null,
                        QuestionType.ESSAY,
                        null,
                        dto.rubricCriteria()
                );
            }
            default -> {
                List<ChoiceDto> choiceRequests = List.of(
                        new ChoiceDto(null, "A", draft.getChoiceA(), draft.getCorrectIndex() == 0),
                        new ChoiceDto(null, "B", draft.getChoiceB(), draft.getCorrectIndex() == 1),
                        new ChoiceDto(null, "C", draft.getChoiceC(), draft.getCorrectIndex() == 2),
                        new ChoiceDto(null, "D", draft.getChoiceD(), draft.getCorrectIndex() == 3)
                );
                yield new CreateQuestionRequest(
                        topicId,
                        draft.getQuestionText(),
                        draft.getExplanation(),
                        draft.getDifficulty(),
                        draft.getPoints() > 0 ? draft.getPoints() : 1.0,
                        choiceRequests,
                        QuestionType.MULTIPLE_CHOICE,
                        null,
                        null
                );
            }
        };

        TeacherQuestionDto created = teacherContentService.createQuestion(
                teacherEmail,
                subjectId,
                createReq,
                QuestionOrigin.AI,
                job.getSourceFile()
        );

        Question approvedEntity = questionRepository.findById(created.id()).orElse(null);
        draft.setStatus(AiDraftStatus.APPROVED);
        draft.setApprovedQuestion(approvedEntity);
        draftRepository.save(draft);

        return created;
    }

    /**
     * Rejects an AI question draft.
     */
    @Transactional
    public AiQuestionDraftDto rejectDraft(String teacherEmail, Long draftId) {
        User teacher = getActiveTeacher(teacherEmail);
        AiQuestionDraft draft = requireOwnedDraft(teacher, draftId);

        draft.setStatus(AiDraftStatus.REJECTED);
        AiQuestionDraft saved = draftRepository.save(draft);
        return AiQuestionDraftDto.fromEntity(saved);
    }

    /**
     * Bulk-approves selected drafts. Strictly requires all selected drafts to be evidence-verified.
     */
    @Transactional
    public List<TeacherQuestionDto> approveSelectedDrafts(String teacherEmail, Long jobId, ApproveSelectedRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        AiGenerationJob job = requireOwnedJob(teacher, jobId);

        List<AiQuestionDraft> draftsToApprove = new ArrayList<>();
        for (Long draftId : request.draftIds()) {
            AiQuestionDraft draft = requireOwnedDraft(teacher, draftId);
            if (!draft.getJob().getId().equals(job.getId())) {
                throw new BadRequestException("Draft " + draftId + " does not belong to job " + jobId);
            }
            if (!draft.isEvidenceVerified()) {
                throw new BadRequestException("Draft " + draftId + " has unverified evidence quote. Only verified drafts can be bulk-approved.");
            }
            draftsToApprove.add(draft);
        }

        List<TeacherQuestionDto> approved = new ArrayList<>();
        for (AiQuestionDraft draft : draftsToApprove) {
            approved.add(approveDraft(teacherEmail, draft.getId()));
        }

        return approved;
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

    private AiGenerationJob requireOwnedJob(User teacher, Long jobId) {
        AiGenerationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Generation job not found: " + jobId));
        if (!job.getTeacher().getId().equals(teacher.getId())) {
            throw new ResourceNotFoundException("Generation job not found: " + jobId);
        }
        return job;
    }

    private AiQuestionDraft requireOwnedDraft(User teacher, Long draftId) {
        AiQuestionDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new ResourceNotFoundException("Question draft not found: " + draftId));
        if (!draft.getJob().getTeacher().getId().equals(teacher.getId())) {
            throw new ResourceNotFoundException("Question draft not found: " + draftId);
        }
        return draft;
    }
}

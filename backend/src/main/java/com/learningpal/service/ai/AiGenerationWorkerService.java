package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.entity.*;
import com.learningpal.exception.RateLimitException;
import com.learningpal.exception.ServiceUnavailableException;
import com.learningpal.repository.AiGenerationJobRepository;
import com.learningpal.repository.AiQuestionDraftRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * Executes asynchronous AI question drafting jobs sequentially on a single worker thread,
 * ensuring local GPU resources are not overwhelmed.
 */
@Service
public class AiGenerationWorkerService {

    private static final Logger log = LoggerFactory.getLogger(AiGenerationWorkerService.class);

    private final AiGenerationJobRepository jobRepository;
    private final AiQuestionDraftRepository draftRepository;
    private final LlmClient llmClient;
    private final AiConfigProperties aiConfig;
    private final ObjectMapper objectMapper;
    private final AiResponseParser responseParser;

    private final ExecutorService singleThreadExecutor;
    private final Semaphore llmSemaphore = new Semaphore(1);
    private final Set<Long> cancelledJobIds = ConcurrentHashMap.newKeySet();
    private final Set<Long> runningJobIds = ConcurrentHashMap.newKeySet();

    public AiGenerationWorkerService(
            AiGenerationJobRepository jobRepository,
            AiQuestionDraftRepository draftRepository,
            LlmClient llmClient,
            AiConfigProperties aiConfig,
            ObjectMapper objectMapper) {
        this.jobRepository = jobRepository;
        this.draftRepository = draftRepository;
        this.llmClient = llmClient;
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.responseParser = new AiResponseParser(objectMapper);
        this.singleThreadExecutor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "ai-generation-worker");
            t.setDaemon(true);
            return t;
        });
    }

    /**
     * Waits until the specified job has finished executing (not QUEUED or RUNNING).
     */
    public void awaitJobCompletion(Long jobId, long timeoutMs) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            AiGenerationJob job = jobRepository.findById(jobId).orElse(null);
            if (job != null && job.getStatus() != AiJobStatus.QUEUED && job.getStatus() != AiJobStatus.RUNNING) {
                return;
            }
            try {
                Thread.sleep(20);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }

    /**
     * On application startup, mark any leftover QUEUED or RUNNING jobs as FAILED.
     */
    @PostConstruct
    @Transactional
    public void cleanupInterruptedJobsOnStartup() {
        try {
            List<AiGenerationJob> interrupted = jobRepository.findByStatusIn(List.of(AiJobStatus.QUEUED, AiJobStatus.RUNNING));
            for (AiGenerationJob job : interrupted) {
                job.setStatus(AiJobStatus.FAILED);
                job.setShortNote("interrupted by restart");
                job.setCompletedAt(Instant.now());
                jobRepository.save(job);
            }
            if (!interrupted.isEmpty()) {
                log.info("Reset {} interrupted AI generation jobs to FAILED on startup.", interrupted.size());
            }
        } catch (Exception e) {
            log.warn("Failed to reset interrupted AI generation jobs: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        singleThreadExecutor.shutdownNow();
    }

    /**
     * Registers a cooperative cancellation request for a job.
     */
    public void cancelJob(Long jobId) {
        cancelledJobIds.add(jobId);
    }

    /**
     * Enqueues a job for background execution.
     */
    public void submitJob(Long jobId) {
        singleThreadExecutor.submit(() -> processJob(jobId));
    }

    /**
     * Runs a synchronous LLM call exclusively on the shared single LLM executor.
     * Immediately throws RateLimitException (429) if another LLM request is already in flight.
     */
    public <T> T executeExclusiveSynchronous(Callable<T> task, int timeoutSeconds) {
        if (!llmSemaphore.tryAcquire()) {
            throw new RateLimitException("The AI assistant is currently busy with another request. Please try again in a moment.");
        }
        Future<T> future = null;
        try {
            future = singleThreadExecutor.submit(task);
            int effectiveTimeout = timeoutSeconds > 0 ? timeoutSeconds : 60;
            return future.get(effectiveTimeout, TimeUnit.SECONDS);
        } catch (TimeoutException te) {
            throw new ServiceUnavailableException("The AI suggestion request timed out. Please grade manually or try again.");
        } catch (ExecutionException ee) {
            Throwable cause = ee.getCause();
            if (cause instanceof RuntimeException re) {
                throw re;
            }
            throw new ServiceUnavailableException("The AI could not complete the suggestion right now. Please grade manually.");
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new ServiceUnavailableException("The AI suggestion request was interrupted.");
        } finally {
            if (future != null && !future.isDone()) {
                future.cancel(true);
            }
            llmSemaphore.release();
        }
    }

    public void processJob(Long jobId) {
        if (!runningJobIds.add(jobId)) {
            return;
        }
        boolean acquired = false;
        try {
            llmSemaphore.acquire();
            acquired = true;
            long startTime = System.currentTimeMillis();
            AiGenerationJob job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ignored) {}
                job = jobRepository.findById(jobId).orElse(null);
                if (job == null) {
                    return;
                }
            }

            if (cancelledJobIds.remove(jobId) || job.getStatus() == AiJobStatus.CANCELLED) {
                job.setStatus(AiJobStatus.CANCELLED);
                job.setCompletedAt(Instant.now());
                jobRepository.save(job);
                return;
            }

            if (job.getStatus() != AiJobStatus.QUEUED) {
                return;
            }

            job.setStatus(AiJobStatus.RUNNING);
            job.setStartedAt(Instant.now());
            job.setModelName(aiConfig.getActiveModel());
            jobRepository.save(job);

            String fullText = job.getSourceFile().getExtractedText();
            List<String> sections = DocumentChunker.chunkText(fullText, aiConfig.getActiveChunkChars());

            if (sections.isEmpty()) {
                job.setStatus(AiJobStatus.FAILED);
                job.setShortNote("No readable text sections found in source file.");
                job.setCompletedAt(Instant.now());
                jobRepository.save(job);
                return;
            }

            job.setSectionsTotal(sections.size());
            jobRepository.save(job);

            QuestionType targetType = job.getQuestionType();
            int typeCap = targetType == QuestionType.ESSAY ? 10 : aiConfig.getMaxDraftsPerJob();
            int totalTarget = Math.min(job.getRequestedCount(), Math.min(typeCap, aiConfig.getMaxDraftsPerJob()));
            int perSectionTarget = Math.max(1, (int) Math.ceil((double) totalTarget / sections.size()));

            Set<String> seenNormalizedQuestions = new HashSet<>();
            int draftsCreated = 0;
            int totalDropped = 0;

            for (int i = 0; i < sections.size(); i++) {
                if (cancelledJobIds.remove(jobId)) {
                    job.setStatus(AiJobStatus.CANCELLED);
                    job.setCompletedAt(Instant.now());
                    jobRepository.save(job);
                    return;
                }

                if (draftsCreated >= totalTarget) {
                    break;
                }

                String sectionText = sections.get(i);
                int needed = Math.min(perSectionTarget, totalTarget - draftsCreated);

                AiResponseParser.ParseBatchResult batchResult;
                try {
                    batchResult = generateWithRepair(targetType, sectionText, needed, seenNormalizedQuestions);
                } catch (LlmRateLimitException rle) {
                    job.setStatus(AiJobStatus.FAILED);
                    job.setShortNote(rle.getMessage());
                    job.setCompletedAt(Instant.now());
                    jobRepository.save(job);
                    log.warn("AI generation job {} failed due to rate limit: {}", job.getId(), rle.getMessage());
                    return;
                }

                totalDropped += batchResult.droppedCount();

                for (AiResponseParser.ParsedDraft pq : batchResult.accepted()) {
                    if (draftsCreated >= totalTarget) {
                        break;
                    }

                    boolean verified = EvidenceVerifier.verifyQuote(pq.evidenceQuote(), sectionText);
                    AiQuestionDraft draft = buildDraftEntity(job, i, pq, verified);

                    draftRepository.save(draft);
                    draftsCreated++;
                }

                job.setSectionsDone(i + 1);
                job.setDroppedCount(totalDropped);
                jobRepository.save(job);
            }

            long durationMs = System.currentTimeMillis() - startTime;
            if (job.getStatus() == AiJobStatus.RUNNING) {
                job.setDroppedCount(totalDropped);
                if (draftsCreated > 0) {
                    job.setStatus(AiJobStatus.COMPLETED);
                    if (totalDropped > 0 && job.getShortNote() == null) {
                        job.setShortNote("Dropped " + totalDropped + " invalid or duplicate draft(s).");
                    }
                } else {
                    job.setStatus(AiJobStatus.FAILED);
                    if (job.getShortNote() == null) {
                        job.setShortNote(totalDropped > 0
                                ? "No valid questions could be drafted from file text (dropped " + totalDropped + " invalid or duplicate draft(s))."
                                : "No valid questions could be drafted from file text.");
                    }
                }
                job.setCompletedAt(Instant.now());
                jobRepository.save(job);
            }

            log.info("AI generation job {} finished with status {} (type: {}, drafts: {}, dropped: {}, duration: {} ms)",
                    job.getId(), job.getStatus(), targetType, draftsCreated, totalDropped, durationMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        } finally {
            if (acquired) {
                llmSemaphore.release();
            }
            runningJobIds.remove(jobId);
        }
    }

    private AiQuestionDraft buildDraftEntity(
            AiGenerationJob job,
            int sectionIndex,
            AiResponseParser.ParsedDraft pq,
            boolean verified) {
        AiQuestionDraft draft = new AiQuestionDraft();
        draft.setJob(job);
        draft.setSectionIndex(sectionIndex);
        draft.setQuestionType(pq.questionType());
        draft.setQuestionText(pq.question());
        draft.setExplanation(pq.explanation());
        draft.setDifficulty(pq.difficulty() != null ? pq.difficulty() : DifficultyLevel.MEDIUM);
        draft.setEvidenceQuote(pq.evidenceQuote());
        draft.setEvidenceVerified(verified);
        draft.setPoints(pq.points() > 0 ? pq.points() : 1.0);
        draft.setStatus(AiDraftStatus.PENDING);

        if (pq.questionType() == QuestionType.MULTIPLE_CHOICE) {
            List<String> choices = pq.choices();
            draft.setChoiceA(choices.get(0));
            draft.setChoiceB(choices.get(1));
            draft.setChoiceC(choices.get(2));
            draft.setChoiceD(choices.get(3));
            draft.setCorrectIndex(pq.correctIndex());
        } else if (pq.questionType() == QuestionType.ENUMERATION) {
            try {
                draft.setAcceptedAnswersJson(objectMapper.writeValueAsString(pq.acceptedAnswers()));
            } catch (Exception e) {
                throw new IllegalStateException("Failed to serialize accepted answers", e);
            }
        } else if (pq.questionType() == QuestionType.ESSAY) {
            try {
                draft.setRubricCriteriaJson(objectMapper.writeValueAsString(pq.rubricCriteria()));
            } catch (Exception e) {
                throw new IllegalStateException("Failed to serialize rubric criteria", e);
            }
        }
        return draft;
    }

    private AiResponseParser.ParseBatchResult generateWithRepair(
            QuestionType questionType,
            String sectionText,
            int count,
            Set<String> seenNormalizedQuestions) {
        String systemPrompt = AiPromptBuilder.buildSystemPrompt(questionType);
        String userPrompt = AiPromptBuilder.buildUserPrompt(questionType, sectionText, count, aiConfig.getActiveUserSuffix());

        try {
            String rawOutput = llmClient.generateChatCompletion(
                    systemPrompt,
                    userPrompt,
                    aiConfig.getTemperature(),
                    aiConfig.getRequestTimeoutSeconds(),
                    questionType
            );

            return responseParser.parseAndValidate(rawOutput, questionType, seenNormalizedQuestions);
        } catch (LlmRateLimitException rateEx) {
            // Do not hammer provider with repair attempt when rate limits are exhausted
            throw rateEx;
        } catch (Exception firstEx) {
            log.warn("Primary generation attempt failed ({}). Executing single repair retry...", firstEx.getMessage());

            // Exactly ONE repair retry informing the model what was wrong
            try {
                String repairPrompt = AiPromptBuilder.buildRepairPrompt(
                        questionType,
                        sectionText,
                        count,
                        aiConfig.getActiveUserSuffix(),
                        firstEx.getMessage() != null ? firstEx.getMessage() : "Malformed JSON syntax"
                );

                String repairOutput = llmClient.generateChatCompletion(
                        systemPrompt,
                        repairPrompt,
                        aiConfig.getTemperature(),
                        aiConfig.getRequestTimeoutSeconds(),
                        questionType
                );

                return responseParser.parseAndValidate(repairOutput, questionType, seenNormalizedQuestions);
            } catch (LlmRateLimitException rateEx) {
                throw rateEx;
            } catch (Exception repairEx) {
                log.warn("Repair retry failed: {}", repairEx.getMessage());
                return new AiResponseParser.ParseBatchResult(Collections.emptyList(), 0);
            }
        }
    }
}

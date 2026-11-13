package com.learningpal.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.entity.*;
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
    private final AiResponseParser responseParser;

    private final ExecutorService singleThreadExecutor;
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

    public void processJob(Long jobId) {
        if (!runningJobIds.add(jobId)) {
            return;
        }
        try {
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

            int totalTarget = Math.min(job.getRequestedCount(), aiConfig.getMaxDraftsPerJob());
            int perSectionTarget = Math.max(1, (int) Math.ceil((double) totalTarget / sections.size()));

            Set<String> seenNormalizedQuestions = new HashSet<>();
            int draftsCreated = 0;

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

                List<AiResponseParser.ParsedQuestion> parsedQuestions;
                try {
                    parsedQuestions = generateWithRepair(sectionText, needed);
                } catch (LlmRateLimitException rle) {
                    job.setStatus(AiJobStatus.FAILED);
                    job.setShortNote(rle.getMessage());
                    job.setCompletedAt(Instant.now());
                    jobRepository.save(job);
                    log.warn("AI generation job {} failed due to rate limit: {}", job.getId(), rle.getMessage());
                    return;
                }

                for (AiResponseParser.ParsedQuestion pq : parsedQuestions) {
                    if (draftsCreated >= totalTarget) {
                        break;
                    }

                    boolean verified = EvidenceVerifier.verifyQuote(pq.evidenceQuote(), sectionText);

                    List<String> choices = pq.choices();
                    AiQuestionDraft draft = new AiQuestionDraft(
                            job,
                            i,
                            pq.question(),
                            choices.get(0),
                            choices.get(1),
                            choices.get(2),
                            choices.get(3),
                            pq.correctIndex(),
                            pq.explanation(),
                            pq.difficulty(),
                            pq.evidenceQuote(),
                            verified
                    );

                    draftRepository.save(draft);
                    draftsCreated++;
                }

                job.setSectionsDone(i + 1);
                jobRepository.save(job);
            }

            long durationMs = System.currentTimeMillis() - startTime;
            if (job.getStatus() == AiJobStatus.RUNNING) {
                if (draftsCreated > 0) {
                    job.setStatus(AiJobStatus.COMPLETED);
                } else {
                    job.setStatus(AiJobStatus.FAILED);
                    if (job.getShortNote() == null) {
                        job.setShortNote("No valid questions could be drafted from file text.");
                    }
                }
                job.setCompletedAt(Instant.now());
                jobRepository.save(job);
            }

            log.info("AI generation job {} finished with status {} (drafts: {}, duration: {} ms)",
                    job.getId(), job.getStatus(), draftsCreated, durationMs);
        } finally {
            runningJobIds.remove(jobId);
        }
    }

    private List<AiResponseParser.ParsedQuestion> generateWithRepair(String sectionText, int count) {
        String systemPrompt = AiPromptBuilder.buildSystemPrompt();
        String userPrompt = AiPromptBuilder.buildUserPrompt(sectionText, count, aiConfig.getActiveUserSuffix());

        try {
            String rawOutput = llmClient.generateChatCompletion(
                    systemPrompt,
                    userPrompt,
                    aiConfig.getTemperature(),
                    aiConfig.getRequestTimeoutSeconds()
            );

            return responseParser.parseAndValidate(rawOutput, new HashSet<>());
        } catch (LlmRateLimitException rateEx) {
            // Do not hammer provider with repair attempt when rate limits are exhausted
            throw rateEx;
        } catch (Exception firstEx) {
            log.warn("Primary generation attempt failed ({}). Executing single repair retry...", firstEx.getMessage());

            // Exactly ONE repair retry informing the model what was wrong
            try {
                String repairPrompt = AiPromptBuilder.buildRepairPrompt(
                        sectionText,
                        count,
                        aiConfig.getActiveUserSuffix(),
                        firstEx.getMessage() != null ? firstEx.getMessage() : "Malformed JSON syntax"
                );

                String repairOutput = llmClient.generateChatCompletion(
                        systemPrompt,
                        repairPrompt,
                        aiConfig.getTemperature(),
                        aiConfig.getRequestTimeoutSeconds()
                );

                return responseParser.parseAndValidate(repairOutput, new HashSet<>());
            } catch (LlmRateLimitException rateEx) {
                throw rateEx;
            } catch (Exception repairEx) {
                log.warn("Repair retry failed: {}", repairEx.getMessage());
                return Collections.emptyList();
            }
        }
    }
}

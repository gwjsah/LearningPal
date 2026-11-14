package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.service.ai.AiPromptBuilder;
import com.learningpal.service.ai.AiResponseParser;
import com.learningpal.service.ai.EvidenceVerifier;
import com.learningpal.service.ai.LmStudioClient;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Tag("manual")
@Disabled("Manual verification only: requires active local LM Studio serving qwen/qwen3-14b on http://127.0.0.1:1234")
public class RealLmStudioVerificationTest {

    @Test
    void testRealGenerationAgainstLocalLmStudio() throws Exception {
        AiConfigProperties config = new AiConfigProperties();
        config.setEnabled(true);
        config.setBaseUrl("http://127.0.0.1:1234");
        config.setModel("qwen/qwen3-14b");
        config.setRequestTimeoutSeconds(60);
        config.setUserSuffix("/no_think");
        config.setTemperature(0.2);

        LmStudioClient client = new LmStudioClient(config, new ObjectMapper());
        assertTrue(client.isAvailable(), "Local LM Studio should be available on http://127.0.0.1:1234");

        String sampleDocumentText = """
                Operating Systems: CPU Scheduling Fundamentals

                The central processing unit (CPU) is the core computational resource of a modern computer.
                CPU executes program instructions and manages system calculations across user tasks.
                In preemptive scheduling, the operating system can interrupt a currently running process to assign the CPU to another higher-priority process.
                Round Robin scheduling allocates a fixed time quantum to each ready process in cyclic order.
                Turnaround time is defined as the total interval from process submission to complete process termination.
                """;

        String systemPrompt = AiPromptBuilder.buildSystemPrompt();
        String userPrompt = AiPromptBuilder.buildUserPrompt(sampleDocumentText, 2, config.getUserSuffix());

        long startTime = System.currentTimeMillis();
        String rawOutput = client.generateChatCompletion(
                systemPrompt,
                userPrompt,
                config.getTemperature(),
                config.getRequestTimeoutSeconds()
        );
        long durationMs = System.currentTimeMillis() - startTime;

        System.out.println("=== REAL LM STUDIO GENERATION RESULT ===");
        System.out.println("Model: " + config.getModel());
        System.out.println("Duration: " + durationMs + " ms (" + (durationMs / 1000.0) + " s)");
        System.out.println("Raw output length: " + rawOutput.length() + " chars");

        AiResponseParser parser = new AiResponseParser(new ObjectMapper());
        List<AiResponseParser.ParsedQuestion> parsedQuestions = parser.parseAndValidate(rawOutput, new HashSet<>());

        System.out.println("Drafts created: " + parsedQuestions.size());

        int verifiedCount = 0;
        for (int i = 0; i < parsedQuestions.size(); i++) {
            AiResponseParser.ParsedQuestion pq = parsedQuestions.get(i);
            boolean verified = EvidenceVerifier.verifyQuote(pq.evidenceQuote(), sampleDocumentText);
            if (verified) verifiedCount++;

            System.out.println("\n--- Draft " + (i + 1) + " ---");
            System.out.println("Q: " + pq.question());
            System.out.println("Choices: " + pq.choices());
            System.out.println("Correct Index: " + pq.correctIndex() + " (" + pq.choices().get(pq.correctIndex()) + ")");
            System.out.println("Difficulty: " + pq.difficulty());
            System.out.println("Explanation: " + pq.explanation());
            System.out.println("Evidence Quote: \"" + pq.evidenceQuote() + "\"");
            System.out.println("Evidence Verified: " + verified);
        }

        System.out.println("\nVerification: " + verifiedCount + " of " + parsedQuestions.size() + " quotes verified against source text.");
        System.out.println("=========================================");

        assertFalse(parsedQuestions.isEmpty(), "Model should produce at least one valid parsed question");
        assertEquals(2, parsedQuestions.size(), "Model should produce exactly requested 2 questions");
    }
}

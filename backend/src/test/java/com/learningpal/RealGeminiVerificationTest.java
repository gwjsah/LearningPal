package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.AiConfigProperties;
import com.learningpal.entity.EssayRubricCriterion;
import com.learningpal.entity.Question;
import com.learningpal.entity.QuestionType;
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
@Disabled("Manual verification only: requires active GEMINI_API_KEY environment variable")
public class RealGeminiVerificationTest {

    @Test
    void testRealGenerationAgainstGoogleGemini() throws Exception {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("SKIPPING RealGeminiVerificationTest: GEMINI_API_KEY not set in environment.");
            return;
        }

        AiConfigProperties config = new AiConfigProperties();
        config.setEnabled(true);
        config.setProvider("gemini");
        config.setGeminiApiKey(apiKey);
        config.setGeminiBaseUrl("https://generativelanguage.googleapis.com/v1beta");
        config.setGeminiModel("gemini-3.5-flash-lite");
        config.setGeminiMaxRetries(3);
        config.setRequestTimeoutSeconds(60);
        config.setTemperature(0.2);

        LmStudioClient client = new LmStudioClient(config, new ObjectMapper());
        assertTrue(client.isAvailable(), "Google Gemini endpoint should be available and authenticated");

        String sampleDocumentText = """
                Operating Systems: CPU Scheduling Fundamentals

                The central processing unit (CPU) is the core computational resource of a modern computer.
                CPU executes program instructions and manages system calculations across user tasks.
                In preemptive scheduling, the operating system can interrupt a currently running process to assign the CPU to another higher-priority process.
                Round Robin scheduling allocates a fixed time quantum to each ready process in cyclic order.
                Turnaround time is defined as the total interval from process submission to complete process termination.
                """;

        String systemPrompt = AiPromptBuilder.buildSystemPrompt();
        String userPrompt = AiPromptBuilder.buildUserPrompt(sampleDocumentText, 2, config.getActiveUserSuffix());

        long startTime = System.currentTimeMillis();
        String rawOutput = client.generateChatCompletion(
                systemPrompt,
                userPrompt,
                config.getTemperature(),
                config.getRequestTimeoutSeconds()
        );
        long durationMs = System.currentTimeMillis() - startTime;

        System.out.println("=== REAL GOOGLE GEMINI GENERATION RESULT ===");
        System.out.println("Model: " + config.getActiveModel());
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
        System.out.println("=============================================");

        assertFalse(parsedQuestions.isEmpty(), "Gemini should produce at least one valid parsed question");
        assertEquals(2, parsedQuestions.size(), "Gemini should produce exactly requested 2 questions");
    }

    @Test
    void testRealEssayGenerationAgainstGoogleGemini() throws Exception {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            return;
        }

        AiConfigProperties config = new AiConfigProperties();
        config.setEnabled(true);
        config.setProvider("gemini");
        config.setGeminiApiKey(apiKey);
        config.setGeminiBaseUrl("https://generativelanguage.googleapis.com/v1beta");
        config.setGeminiModel("gemini-3.5-flash-lite");
        config.setGeminiMaxRetries(3);
        config.setRequestTimeoutSeconds(60);
        config.setTemperature(0.2);

        LmStudioClient client = new LmStudioClient(config, new ObjectMapper());
        String sampleDocumentText = """
                Operating Systems: CPU Scheduling Fundamentals
                In preemptive scheduling, the operating system can interrupt a currently running process to assign the CPU to another higher-priority process.
                Round Robin scheduling allocates a fixed time quantum to each ready process in cyclic order.
                """;

        String systemPrompt = AiPromptBuilder.buildSystemPrompt(QuestionType.ESSAY);
        String userPrompt = AiPromptBuilder.buildUserPrompt(QuestionType.ESSAY, sampleDocumentText, 1, config.getActiveUserSuffix());
        String rawOutput = client.generateChatCompletion(
                systemPrompt, userPrompt, config.getTemperature(), config.getRequestTimeoutSeconds(), QuestionType.ESSAY);

        AiResponseParser parser = new AiResponseParser(new ObjectMapper());
        AiResponseParser.ParseBatchResult result = parser.parseAndValidate(rawOutput, QuestionType.ESSAY, new HashSet<>());
        assertFalse(result.accepted().isEmpty(), "Gemini should produce at least one valid essay draft");
        assertTrue(result.accepted().get(0).rubricCriteria().size() >= 2);
    }

    @Test
    void testRealEssayGradingSuggestionAgainstGoogleGemini() throws Exception {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            return;
        }

        AiConfigProperties config = new AiConfigProperties();
        config.setEnabled(true);
        config.setProvider("gemini");
        config.setGeminiApiKey(apiKey);
        config.setGeminiBaseUrl("https://generativelanguage.googleapis.com/v1beta");
        config.setGeminiModel("gemini-3.5-flash-lite");
        config.setGeminiMaxRetries(3);
        config.setRequestTimeoutSeconds(60);
        config.setTemperature(0.2);

        LmStudioClient client = new LmStudioClient(config, new ObjectMapper());
        Question q = new Question();
        EssayRubricCriterion c1 = new EssayRubricCriterion(q, "Accuracy", "Explains preemption", 5, 0);
        EssayRubricCriterion c2 = new EssayRubricCriterion(q, "Clarity", "Clear writing", 3, 1);
        // Assign synthetic IDs via reflection for standalone manual test
        var idField = EssayRubricCriterion.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(c1, 1L);
        idField.set(c2, 2L);
        List<EssayRubricCriterion> criteria = List.of(c1, c2);

        String systemPrompt = AiPromptBuilder.buildEssaySuggestionSystemPrompt();
        String userPrompt = AiPromptBuilder.buildEssaySuggestionUserPrompt(
                "Explain preemptive scheduling.",
                criteria,
                "Mention interrupting a running process.",
                "Preemptive scheduling lets the OS interrupt a running process for a higher-priority one.",
                config.getActiveUserSuffix()
        );
        String raw = client.generateChatCompletion(
                systemPrompt, userPrompt, config.getTemperature(), config.getRequestTimeoutSeconds(),
                AiPromptBuilder.buildEssaySuggestionJsonSchema()
        );
        AiResponseParser parser = new AiResponseParser(new ObjectMapper());
        AiResponseParser.ParsedEssaySuggestion parsed = parser.parseAndValidateEssaySuggestion(raw, criteria);
        assertEquals(2, parsed.criteria().size());
    }
}

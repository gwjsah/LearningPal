package com.learningpal.service.ai;

import java.util.*;

/**
 * In-memory test implementation of LlmClient that never touches the network.
 */
public class FakeLlmClient implements LlmClient {

    private boolean available = true;
    private List<String> models = new ArrayList<>(List.of("qwen/qwen3-14b"));
    private String customResponse = null;
    private boolean simulateMalformedOnFirstAttempt = false;
    private boolean prependThinkBlock = false;
    private int callCount = 0;
    private final List<String> recordedUserPrompts = new ArrayList<>();
    private final List<String> recordedSystemPrompts = new ArrayList<>();

    public FakeLlmClient() {
    }

    @Override
    public boolean isAvailable() {
        return available;
    }

    @Override
    public List<String> listModels() {
        return new ArrayList<>(models);
    }

    @Override
    public String generateChatCompletion(String systemPrompt, String userPrompt, double temperature, int timeoutSeconds) {
        callCount++;
        recordedSystemPrompts.add(systemPrompt);
        recordedUserPrompts.add(userPrompt);

        if (simulateMalformedOnFirstAttempt && callCount == 1) {
            return "NOT_VALID_JSON{oops";
        }

        if (customResponse != null) {
            return prependThinkBlock ? "<think>Reasoning thoughts here...</think>" + customResponse : customResponse;
        }

        // Default valid question response
        String defaultJson = """
                {
                  "questions": [
                    {
                      "question": "What primary function does a CPU perform in computing?",
                      "choices": [
                        "Executing instructions and coordinating processing",
                        "Storing permanent files indefinitely",
                        "Rendering vector graphics on display panels",
                        "Cooling thermal components"
                      ],
                      "correctIndex": 0,
                      "explanation": "The CPU executes program instructions and manages system calculations.",
                      "difficulty": "EASY",
                      "evidenceQuote": "CPU executes program instructions"
                    }
                  ]
                }
                """;

        return prependThinkBlock ? "<think>Model reasoning block</think>" + defaultJson : defaultJson;
    }

    public void reset() {
        this.available = true;
        this.models = new ArrayList<>(List.of("qwen/qwen3-14b"));
        this.customResponse = null;
        this.simulateMalformedOnFirstAttempt = false;
        this.prependThinkBlock = false;
        this.callCount = 0;
        this.recordedUserPrompts.clear();
        this.recordedSystemPrompts.clear();
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public void setModels(List<String> models) {
        this.models = models;
    }

    public void setCustomResponse(String customResponse) {
        this.customResponse = customResponse;
    }

    public void setSimulateMalformedOnFirstAttempt(boolean simulateMalformedOnFirstAttempt) {
        this.simulateMalformedOnFirstAttempt = simulateMalformedOnFirstAttempt;
    }

    public void setPrependThinkBlock(boolean prependThinkBlock) {
        this.prependThinkBlock = prependThinkBlock;
    }

    public int getCallCount() {
        return callCount;
    }

    public List<String> getRecordedUserPrompts() {
        return recordedUserPrompts;
    }

    public List<String> getRecordedSystemPrompts() {
        return recordedSystemPrompts;
    }
}

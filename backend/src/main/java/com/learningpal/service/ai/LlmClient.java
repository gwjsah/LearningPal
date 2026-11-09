package com.learningpal.service.ai;

import java.util.List;

public interface LlmClient {
    boolean isAvailable();
    List<String> listModels();
    String generateChatCompletion(String systemPrompt, String userPrompt, double temperature, int timeoutSeconds);
}

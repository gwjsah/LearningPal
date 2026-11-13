package com.learningpal.service.ai;

import com.learningpal.entity.QuestionType;

import java.util.List;
import java.util.Map;

public interface LlmClient {
    boolean isAvailable();
    List<String> listModels();
    String generateChatCompletion(String systemPrompt, String userPrompt, double temperature, int timeoutSeconds);

    default String generateChatCompletion(
            String systemPrompt,
            String userPrompt,
            double temperature,
            int timeoutSeconds,
            QuestionType questionType) {
        return generateChatCompletion(systemPrompt, userPrompt, temperature, timeoutSeconds);
    }

    default String generateChatCompletion(
            String systemPrompt,
            String userPrompt,
            double temperature,
            int timeoutSeconds,
            Map<String, Object> responseSchema) {
        return generateChatCompletion(systemPrompt, userPrompt, temperature, timeoutSeconds);
    }
}

package com.learningpal.config;

import com.learningpal.service.ai.LlmClient;
import com.learningpal.service.ai.LmStudioClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiClientConfig {

    @Bean
    @ConditionalOnMissingBean(LlmClient.class)
    public LlmClient llmClient(LmStudioClient lmStudioClient) {
        return lmStudioClient;
    }
}

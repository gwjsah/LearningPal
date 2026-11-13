package com.learningpal.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
public class AiConfigProperties {

    private static final Logger log = LoggerFactory.getLogger(AiConfigProperties.class);

    @Value("${app.llm.enabled:false}")
    private boolean enabled;

    @Value("${app.llm.provider:local}")
    private String provider;

    @Value("${app.llm.base-url:http://localhost:1234}")
    private String baseUrl;

    @Value("${app.llm.model:qwen/qwen3-14b}")
    private String model;

    @Value("${app.llm.request-timeout-seconds:180}")
    private int requestTimeoutSeconds;

    @Value("${app.llm.temperature:0.2}")
    private double temperature;

    @Value("${app.llm.chunk-chars:5000}")
    private int chunkChars;

    @Value("${app.llm.user-suffix:/no_think}")
    private String userSuffix;

    @Value("${app.llm.max-drafts-per-job:30}")
    private int maxDraftsPerJob;

    @Value("${app.llm.max-jobs-per-teacher-per-hour:5}")
    private int maxJobsPerTeacherPerHour;

    // Google AI Studio (Gemini) cloud configuration
    @Value("${GEMINI_API_KEY:${app.llm.gemini.api-key:}}")
    private String geminiApiKey;

    @Value("${app.llm.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl;

    @Value("${app.llm.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    @Value("${app.llm.gemini.chunk-chars:12000}")
    private int geminiChunkChars;

    @Value("${app.llm.gemini.max-retries:3}")
    private int geminiMaxRetries;

    @PostConstruct
    public void init() {
        if (enabled) {
            if (isGeminiProvider()) {
                if (geminiApiKey == null || geminiApiKey.isBlank()) {
                    log.warn("app.llm.provider is configured to 'gemini' but app.llm.gemini.api-key is missing or blank! AI drafting will be unavailable.");
                }
            } else {
                // Non-loopback warning applies only to local provider
                checkLoopback(baseUrl);
            }
        }
    }

    public boolean isGeminiProvider() {
        return "gemini".equalsIgnoreCase(provider);
    }

    public String getActiveBaseUrl() {
        if (isGeminiProvider()) {
            return geminiBaseUrl != null && !geminiBaseUrl.isBlank()
                    ? geminiBaseUrl.trim()
                    : "https://generativelanguage.googleapis.com/v1beta";
        }
        return baseUrl != null && !baseUrl.isBlank() ? baseUrl.trim() : "http://localhost:1234";
    }

    public String getActiveModel() {
        if (isGeminiProvider()) {
            return geminiModel != null && !geminiModel.isBlank() ? geminiModel.trim() : "gemini-3.5-flash-lite";
        }
        return model != null && !model.isBlank() ? model.trim() : "qwen/qwen3-14b";
    }

    public int getActiveChunkChars() {
        if (isGeminiProvider()) {
            return geminiChunkChars > 0 ? geminiChunkChars : 12000;
        }
        return chunkChars > 0 ? chunkChars : 5000;
    }

    public String getActiveUserSuffix() {
        if (isGeminiProvider()) {
            // /no_think suffix applies only to local models (e.g. Qwen in LM Studio)
            return "";
        }
        return userSuffix != null ? userSuffix : "";
    }

    public void checkLoopback(String url) {
        try {
            if (url == null || url.isBlank()) return;
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (host != null && !host.equalsIgnoreCase("localhost")
                    && !host.equals("127.0.0.1")
                    && !host.equals("::1")
                    && !host.equals("[::1]")) {
                log.warn("SECURITY WARNING: app.llm.base-url is configured to a non-loopback host ({}). Teacher content will leave the machine over the network!", host);
            }
        } catch (Exception e) {
            log.warn("Unable to parse app.llm.base-url for loopback check: {}", e.getMessage());
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getRequestTimeoutSeconds() {
        return requestTimeoutSeconds;
    }

    public void setRequestTimeoutSeconds(int requestTimeoutSeconds) {
        this.requestTimeoutSeconds = requestTimeoutSeconds;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public int getChunkChars() {
        return chunkChars;
    }

    public void setChunkChars(int chunkChars) {
        this.chunkChars = chunkChars;
    }

    public String getUserSuffix() {
        return userSuffix;
    }

    public void setUserSuffix(String userSuffix) {
        this.userSuffix = userSuffix;
    }

    public int getMaxDraftsPerJob() {
        return maxDraftsPerJob;
    }

    public void setMaxDraftsPerJob(int maxDraftsPerJob) {
        this.maxDraftsPerJob = maxDraftsPerJob;
    }

    public int getMaxJobsPerTeacherPerHour() {
        return maxJobsPerTeacherPerHour;
    }

    public void setMaxJobsPerTeacherPerHour(int maxJobsPerTeacherPerHour) {
        this.maxJobsPerTeacherPerHour = maxJobsPerTeacherPerHour;
    }

    public String getProvider() {
        return provider != null ? provider.trim() : "local";
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getGeminiApiKey() {
        return geminiApiKey;
    }

    public void setGeminiApiKey(String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
    }

    public String getGeminiBaseUrl() {
        return geminiBaseUrl;
    }

    public void setGeminiBaseUrl(String geminiBaseUrl) {
        this.geminiBaseUrl = geminiBaseUrl;
    }

    public String getGeminiModel() {
        return geminiModel;
    }

    public void setGeminiModel(String geminiModel) {
        this.geminiModel = geminiModel;
    }

    public int getGeminiChunkChars() {
        return geminiChunkChars;
    }

    public void setGeminiChunkChars(int geminiChunkChars) {
        this.geminiChunkChars = geminiChunkChars;
    }

    public int getGeminiMaxRetries() {
        return geminiMaxRetries;
    }

    public void setGeminiMaxRetries(int geminiMaxRetries) {
        this.geminiMaxRetries = geminiMaxRetries;
    }
}

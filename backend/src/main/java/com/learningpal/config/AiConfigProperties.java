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

    @PostConstruct
    public void init() {
        if (enabled) {
            checkLoopback(baseUrl);
        }
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
}

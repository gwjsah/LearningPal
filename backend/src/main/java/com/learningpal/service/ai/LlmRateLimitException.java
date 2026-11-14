package com.learningpal.service.ai;

/**
 * Thrown when an external LLM provider returns HTTP 429 Too Many Requests or 503
 * and bounded backoff retries have been exhausted.
 */
public class LlmRateLimitException extends RuntimeException {

    public LlmRateLimitException(String message) {
        super(message);
    }

    public LlmRateLimitException(String message, Throwable cause) {
        super(message, cause);
    }
}

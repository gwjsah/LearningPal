package com.learningpal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a user exceeds the allowed rate limit for failed actions (e.g. invalid join codes).
 */
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class RateLimitException extends RuntimeException {
    public RateLimitException(String message) {
        super(message);
    }
}


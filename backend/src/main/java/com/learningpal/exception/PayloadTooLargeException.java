package com.learningpal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an uploaded file or payload exceeds permissible size limits (HTTP 413).
 */
@ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
public class PayloadTooLargeException extends RuntimeException {
    public PayloadTooLargeException(String message) {
        super(message);
    }
}

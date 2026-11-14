package com.learningpal.exception;

/**
 * Thrown when an invalid operation or client input is detected.
 * Results in HTTP 400 Bad Request.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}


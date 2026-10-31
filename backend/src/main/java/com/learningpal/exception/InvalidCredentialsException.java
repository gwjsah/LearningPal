package com.learningpal.exception;

/**
 * Thrown when an invalid email or password is supplied.
 * Results in HTTP 401 Unauthorized with identical error message.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}


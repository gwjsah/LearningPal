package com.learningpal.exception;

/**
 * Thrown when attempting to register an email address that is already in use.
 * Results in HTTP 409 Conflict.
 */
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}


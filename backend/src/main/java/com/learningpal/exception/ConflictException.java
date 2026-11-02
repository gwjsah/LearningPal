package com.learningpal.exception;

/**
 * Thrown when an action conflicts with the current state of a resource (e.g. submitting an already-submitted attempt).
 * Results in HTTP 409 Conflict.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}


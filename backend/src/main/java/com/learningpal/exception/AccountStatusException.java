package com.learningpal.exception;

/**
 * Thrown when an authenticated user's account is not in ACTIVE state (e.g. PENDING or REJECTED).
 * Results in HTTP 403 Forbidden.
 */
public class AccountStatusException extends RuntimeException {
    public AccountStatusException(String message) {
        super(message);
    }
}


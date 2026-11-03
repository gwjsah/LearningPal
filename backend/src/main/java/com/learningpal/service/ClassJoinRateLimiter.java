package com.learningpal.service;

import com.learningpal.exception.RateLimitException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter tracking failed join code attempts per student.
 * Limits users to at most 5 failed attempts within any 60-second window.
 * Keyed strictly by the authenticated student ID (not IP address alone) so it cannot be shared or dodged.
 * A successful join or idempotent re-join does NOT reset or reduce the failure counter.
 * Failures expire solely after the 60-second time window passes.
 * NOTE: As designed, this in-memory state automatically resets on application restart.
 */
@Component
public class ClassJoinRateLimiter {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final Map<Long, List<Instant>> failedAttempts = new ConcurrentHashMap<>();

    /**
     * Checks if the user is currently rate-limited before attempting a join.
     * Throws RateLimitException (HTTP 429) if 5 failed attempts occurred in the past 60 seconds.
     */
    public synchronized void checkRateLimit(Long userId) {
        if (userId == null) return;

        Instant now = Instant.now();
        List<Instant> attempts = failedAttempts.computeIfAbsent(userId, k -> new ArrayList<>());
        attempts.removeIf(timestamp -> Duration.between(timestamp, now).compareTo(WINDOW) > 0);

        if (attempts.size() >= MAX_FAILED_ATTEMPTS) {
            Instant oldest = attempts.get(0);
            long secondsPassed = Duration.between(oldest, now).getSeconds();
            long secondsToWait = Math.max(1, WINDOW.getSeconds() - secondsPassed);
            throw new RateLimitException("Too many failed join attempts. Please wait " + secondsToWait + " seconds before trying again.");
        }
    }

    /**
     * Records a failed join attempt (invalid code, wrong institution, closed or archived class).
     */
    public synchronized void recordFailure(Long userId) {
        if (userId == null) return;

        Instant now = Instant.now();
        List<Instant> attempts = failedAttempts.computeIfAbsent(userId, k -> new ArrayList<>());
        attempts.removeIf(timestamp -> Duration.between(timestamp, now).compareTo(WINDOW) > 0);
        attempts.add(now);
    }

    /**
     * Resets rate-limit history for a given user (primarily used in test assertions).
     */
    public synchronized void resetForUser(Long userId) {
        if (userId != null) {
            failedAttempts.remove(userId);
        }
    }
}


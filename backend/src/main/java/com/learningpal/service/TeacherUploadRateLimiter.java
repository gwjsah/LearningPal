package com.learningpal.service;

import com.learningpal.exception.RateLimitException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory rate limiter enforcing maximum uploads per hour per teacher.
 * Documented as resetting on application restart.
 */
@Component
public class TeacherUploadRateLimiter {

    private final ConcurrentHashMap<Long, Deque<Instant>> uploadTimestamps = new ConcurrentHashMap<>();
    private final int maxUploadsPerHour;

    public TeacherUploadRateLimiter(@Value("${app.files.max-uploads-per-hour:20}") int maxUploadsPerHour) {
        this.maxUploadsPerHour = maxUploadsPerHour;
    }

    /**
     * Records an upload attempt for the teacher or throws RateLimitException if hourly quota is exceeded.
     */
    public synchronized void recordUploadOrThrow(Long teacherId) {
        if (teacherId == null) return;

        Instant now = Instant.now();
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);

        Deque<Instant> timestamps = uploadTimestamps.computeIfAbsent(teacherId, k -> new ArrayDeque<>());

        // Evict events older than 1 hour sliding window
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(oneHourAgo)) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxUploadsPerHour) {
            throw new RateLimitException("Upload rate limit reached (maximum " + maxUploadsPerHour + " uploads per hour). Please try again later.");
        }

        timestamps.addLast(now);
    }

    /**
     * Clears in-memory history (useful for test resets).
     */
    public void reset() {
        uploadTimestamps.clear();
    }
}

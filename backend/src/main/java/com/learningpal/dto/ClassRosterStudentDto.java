package com.learningpal.dto;

import java.time.Instant;
import java.util.List;

/**
 * Detailed student roster item showing class-scoped attempt counts, latest diagnostic score,
 * curriculum topic mastery breakdown, and open interventions count.
 */
public record ClassRosterStudentDto(
        Long studentId,
        String name,
        String email,
        Instant joinedAt,
        int attemptsCount,
        LatestDiagnosticDto latestDiagnostic,
        List<ClassTopicMasteryDto> topics,
        int gapCount,
        int developingCount,
        int strengthCount,
        boolean needsAttention,
        int openInterventions
) {
    public ClassRosterStudentDto(
            Long studentId,
            String name,
            String email,
            Instant joinedAt,
            int attemptsCount,
            LatestDiagnosticDto latestDiagnostic,
            List<ClassTopicMasteryDto> topics,
            int gapCount,
            int developingCount,
            int strengthCount,
            boolean needsAttention
    ) {
        this(studentId, name, email, joinedAt, attemptsCount, latestDiagnostic, topics, gapCount, developingCount, strengthCount, needsAttention, 0);
    }
}

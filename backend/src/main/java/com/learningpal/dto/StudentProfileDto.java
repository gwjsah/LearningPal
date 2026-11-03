package com.learningpal.dto;

import java.time.Instant;

public record StudentProfileDto(
        Long studentId,
        String name,
        String email,
        Instant joinedAt,
        boolean needsAttention
) {}


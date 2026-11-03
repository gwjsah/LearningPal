package com.learningpal.dto;

import java.time.Instant;

public record ClassMemberDto(
        Long studentId,
        String fullName,
        String email,
        Instant joinedAt
) {}


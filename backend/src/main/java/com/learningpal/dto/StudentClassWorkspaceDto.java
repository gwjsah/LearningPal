package com.learningpal.dto;

import com.learningpal.entity.ClassStatus;

import java.time.Instant;

public record StudentClassWorkspaceDto(
        Long classId,
        String sectionName,
        SubjectSummaryDto subject,
        String teacherName,
        ClassStatus status,
        Instant enrolledAt,
        boolean canAttempt
) {}


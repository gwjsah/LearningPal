package com.learningpal.dto;

import com.learningpal.entity.ClassStatus;

import java.time.Instant;

public record StudentClassSummaryDto(
        Long classId,
        String sectionName,
        SubjectSummaryDto subject,
        String teacherName,
        ClassStatus status,
        Instant enrolledAt,
        String oneLineStatus,
        TopicProgressDto studyNext,
        int gapsCount,
        int strengthsCount,
        int totalTopics,
        int masteredTopics
) {}


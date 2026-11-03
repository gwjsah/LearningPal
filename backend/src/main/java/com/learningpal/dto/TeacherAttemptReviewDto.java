package com.learningpal.dto;

import java.time.Instant;
import java.util.List;

public record TeacherAttemptReviewDto(
        Long attemptId,
        Long classId,
        String className,
        Long assessmentId,
        String assessmentTitle,
        Long studentId,
        String studentName,
        String studentEmail,
        String status,
        Double totalScore,
        Double maxScore,
        Double percentage,
        Instant submittedAt,
        List<TeacherAnswerReviewDto> answers
) {}


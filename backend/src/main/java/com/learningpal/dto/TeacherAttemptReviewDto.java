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
        List<TeacherAnswerReviewDto> answers,
        boolean awaitingTeacherGrading,
        int ungradedEssayCount
) {
    public TeacherAttemptReviewDto(
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
    ) {
        this(attemptId, classId, className, assessmentId, assessmentTitle, studentId, studentName,
                studentEmail, status, totalScore, maxScore, percentage, submittedAt, answers, false, 0);
    }
}


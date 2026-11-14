package com.learningpal.dto;

import com.learningpal.entity.InterventionOutcome;
import com.learningpal.entity.InterventionStatus;
import com.learningpal.entity.InterventionType;

import java.time.Instant;
import java.time.LocalDate;

public record TeacherInterventionDto(
        Long id,
        Long classId,
        String className,
        Long studentId,
        String studentName,
        String studentEmail,
        Long teacherId,
        String teacherName,
        Long topicId,
        String topicName,
        InterventionType type,
        String note,
        InterventionStatus status,
        Instant createdAt,
        LocalDate followUpDate,
        Instant completedAt,
        Double masteryAtStart,
        Double masteryAtCompletion,
        Double currentMastery,
        InterventionOutcome outcome,
        Double changeSinceCompletion
) {
    public TeacherInterventionDto(
            Long id, Long classId, String className, Long studentId, String studentName, String studentEmail,
            Long teacherId, String teacherName, Long topicId, String topicName, InterventionType type,
            String note, InterventionStatus status, Instant createdAt, LocalDate followUpDate,
            Instant completedAt, Double masteryAtStart, Double masteryAtCompletion,
            Double currentMastery, InterventionOutcome outcome) {
        this(id, classId, className, studentId, studentName, studentEmail, teacherId, teacherName, topicId,
                topicName, type, note, status, createdAt, followUpDate, completedAt, masteryAtStart,
                masteryAtCompletion, currentMastery, outcome, null);
    }
}

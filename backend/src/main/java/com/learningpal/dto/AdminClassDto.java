package com.learningpal.dto;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.ClassStatus;

import java.time.Instant;

/**
 * Representation of a class for the institution administrator.
 */
public record AdminClassDto(
        Long id,
        String name,
        String joinCode,
        ClassStatus status,
        boolean enrollmentOpen,
        Long subjectId,
        String subjectCode,
        String subjectName,
        Long teacherId,
        String teacherName,
        String teacherEmail,
        long studentCount,
        Instant createdAt
) {
    public static AdminClassDto fromEntity(ClassEntity entity, long studentCount) {
        String teacherName = entity.getTeacher() != null ? entity.getTeacher().getFullName() : "Unassigned";
        String teacherEmail = entity.getTeacher() != null ? entity.getTeacher().getEmail() : null;
        Long teacherId = entity.getTeacher() != null ? entity.getTeacher().getId() : null;

        return new AdminClassDto(
                entity.getId(),
                entity.getName(),
                entity.getJoinCode(),
                entity.getStatus(),
                entity.isEnrollmentOpen(),
                entity.getSubject().getId(),
                entity.getSubject().getCode(),
                entity.getSubject().getName(),
                teacherId,
                teacherName,
                teacherEmail,
                studentCount,
                entity.getCreatedAt()
        );
    }
}


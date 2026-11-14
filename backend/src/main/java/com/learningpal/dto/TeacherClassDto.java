package com.learningpal.dto;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.ClassStatus;

import java.time.Instant;

public record TeacherClassDto(
        Long id,
        String name,
        SubjectSummaryDto subject,
        String joinCode,
        ClassStatus status,
        boolean enrollmentOpen,
        long studentCount,
        Instant createdAt
) {
    public static TeacherClassDto fromEntity(ClassEntity cls, long studentCount) {
        return new TeacherClassDto(
                cls.getId(),
                cls.getName(),
                SubjectSummaryDto.fromEntity(cls.getSubject()),
                cls.getJoinCode(),
                cls.getStatus(),
                cls.isEnrollmentOpen(),
                studentCount,
                cls.getCreatedAt()
        );
    }
}


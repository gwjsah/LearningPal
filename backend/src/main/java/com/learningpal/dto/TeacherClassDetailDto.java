package com.learningpal.dto;

import com.learningpal.entity.ClassEntity;
import com.learningpal.entity.ClassStatus;

import java.time.Instant;
import java.util.List;

public record TeacherClassDetailDto(
        Long id,
        String name,
        SubjectSummaryDto subject,
        String joinCode,
        ClassStatus status,
        boolean enrollmentOpen,
        long studentCount,
        Instant createdAt,
        List<ClassMemberDto> members
) {
    public static TeacherClassDetailDto fromEntity(ClassEntity cls, long studentCount, List<ClassMemberDto> members) {
        return new TeacherClassDetailDto(
                cls.getId(),
                cls.getName(),
                SubjectSummaryDto.fromEntity(cls.getSubject()),
                cls.getJoinCode(),
                cls.getStatus(),
                cls.isEnrollmentOpen(),
                studentCount,
                cls.getCreatedAt(),
                members
        );
    }
}


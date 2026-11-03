package com.learningpal.dto;

public record SubjectSummaryDto(
        Long id,
        String code,
        String name,
        String description
) {
    public static SubjectSummaryDto fromEntity(com.learningpal.entity.Subject subject) {
        if (subject == null) return null;
        return new SubjectSummaryDto(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.getDescription()
        );
    }
}


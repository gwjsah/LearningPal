package com.learningpal.dto;

import com.learningpal.entity.Institution;
import com.learningpal.entity.InstitutionStatus;

import java.time.Instant;

/**
 * Summary view of an institution with user and class counts for the platform super administrator.
 */
public record InstitutionSummaryDto(
        Long id,
        String name,
        String code,
        InstitutionStatus status,
        Instant createdAt,
        long userCount,
        long classCount
) {
    public static InstitutionSummaryDto fromEntity(Institution institution, long userCount, long classCount) {
        return new InstitutionSummaryDto(
                institution.getId(),
                institution.getName(),
                institution.getCode(),
                institution.getStatus(),
                institution.getCreatedAt(),
                userCount,
                classCount
        );
    }
}


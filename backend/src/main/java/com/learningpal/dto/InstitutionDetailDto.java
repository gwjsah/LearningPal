package com.learningpal.dto;

import com.learningpal.entity.Institution;
import com.learningpal.entity.InstitutionStatus;

import java.time.Instant;

/**
 * Detailed view of a newly provisioned institution including its administrator.
 */
public record InstitutionDetailDto(
        Long id,
        String name,
        String code,
        InstitutionStatus status,
        Instant createdAt,
        UserDto admin
) {
    public static InstitutionDetailDto fromEntity(Institution institution, UserDto admin) {
        return new InstitutionDetailDto(
                institution.getId(),
                institution.getName(),
                institution.getCode(),
                institution.getStatus(),
                institution.getCreatedAt(),
                admin
        );
    }
}


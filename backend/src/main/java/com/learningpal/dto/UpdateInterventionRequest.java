package com.learningpal.dto;

import com.learningpal.entity.InterventionStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateInterventionRequest(
        @Size(max = 1000, message = "Note cannot exceed 1000 characters")
        String note,

        LocalDate followUpDate,

        InterventionStatus status
) {}


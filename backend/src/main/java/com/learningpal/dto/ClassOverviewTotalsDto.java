package com.learningpal.dto;

/**
 * High-level aggregate metrics for a class section including open interventions.
 */
public record ClassOverviewTotalsDto(
        int enrolledStudents,
        int studentsWithAttempts,
        Double averageDiagnosticPercent,
        int studentsNeedingAttention,
        int openInterventions
) {
    public ClassOverviewTotalsDto(
            int enrolledStudents,
            int studentsWithAttempts,
            Double averageDiagnosticPercent,
            int studentsNeedingAttention
    ) {
        this(enrolledStudents, studentsWithAttempts, averageDiagnosticPercent, studentsNeedingAttention, 0);
    }
}

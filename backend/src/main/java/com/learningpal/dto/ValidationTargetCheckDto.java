package com.learningpal.dto;

/**
 * Verification of the research objective: >=85% agreement across at least 30 students.
 * Status values: MET, NOT_MET, NOT_ENOUGH_RECORDS.
 */
public record ValidationTargetCheckDto(
        double targetAccuracy,
        int minStudentsRequired,
        int studentsEvaluated,
        String status,
        String sentence
) {}


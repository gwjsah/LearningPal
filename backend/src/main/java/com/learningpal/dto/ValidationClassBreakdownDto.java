package com.learningpal.dto;

/**
 * Breakdown of validation progress and metrics for a specific classroom section in the Admin rollup report.
 */
public record ValidationClassBreakdownDto(
        Long classId,
        String className,
        String teacherName,
        int studentsLabeled,
        int totalStudents,
        String status, // "COMPLETE", "IN_PROGRESS", "UNLABELED"
        Double agreementPercent, // null if 0 usable pairs
        String targetStatus // "MET", "NOT_MET", "PRELIMINARY", "SMALL_CLASS_COMPLETE"
) {}

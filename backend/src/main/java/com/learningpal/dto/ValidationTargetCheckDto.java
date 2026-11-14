package com.learningpal.dto;

/**
 * Verification of the research objective: >=85% agreement across at least 30 students.
 * Status values: MET, NOT_MET, NOT_ENOUGH_RECORDS.
 * Banner types: MET, NOT_MET, PRELIMINARY, SMALL_CLASS_COMPLETE.
 */
public record ValidationTargetCheckDto(
        double targetAccuracy,
        int minStudentsRequired,
        int studentsEvaluated,
        String status,
        String sentence,
        String bannerType,
        String warningMessage,
        int totalEligibleStudents,
        int notYetEligible
) {
    /**
     * Backwards-compatible constructor for existing 5-argument calls.
     */
    public ValidationTargetCheckDto(
            double targetAccuracy,
            int minStudentsRequired,
            int studentsEvaluated,
            String status,
            String sentence) {
        this(targetAccuracy, minStudentsRequired, studentsEvaluated, status, sentence,
             status, null, studentsEvaluated, 0);
    }

    /**
     * Backwards-compatible constructor for existing 8-argument calls.
     */
    public ValidationTargetCheckDto(
            double targetAccuracy,
            int minStudentsRequired,
            int studentsEvaluated,
            String status,
            String sentence,
            String bannerType,
            String warningMessage,
            int totalEligibleStudents) {
        this(targetAccuracy, minStudentsRequired, studentsEvaluated, status, sentence,
             bannerType, warningMessage, totalEligibleStudents, 0);
    }
}

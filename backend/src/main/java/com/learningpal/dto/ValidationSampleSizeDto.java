package com.learningpal.dto;

/**
 * Breakdown of validation sample size and excluded labels.
 */
public record ValidationSampleSizeDto(
        int studentsWithUsableLabel,
        int usableStudentTopicPairs,
        int totalLabelsEvaluated,
        int excludedCannotJudge,
        int excludedInsufficientData,
        int excludedStale
) {}


package com.learningpal.dto;

import com.learningpal.entity.ValidationSource;
import java.util.Collections;
import java.util.List;

/**
 * Complete Validation Lab evaluation report.
 */
public record ValidationReportDto(
        Long classId,
        String className,
        String institutionName,
        ValidationSource source,
        boolean isSimulated,
        boolean includeStale,
        ValidationSampleSizeDto sampleSize,
        ValidationMetricsDto metrics,
        ValidationTargetCheckDto targetCheck,
        ValidationConfusionMatrixDto confusionMatrix,
        List<ValidationTopicMetricDto> perTopic,
        List<ValidationThresholdSensitivityDto> thresholdSensitivity,
        Double bestThreshold,
        List<ValidationDisagreementDto> disagreements,
        Integer pooledClassesCount,
        List<ValidationClassBreakdownDto> classBreakdowns,
        Integer notYetEligible,
        Integer eligibleStudents
) {
    /**
     * Backwards-compatible constructor for existing 14-argument invocations.
     */
    public ValidationReportDto(
            Long classId,
            String className,
            String institutionName,
            ValidationSource source,
            boolean isSimulated,
            boolean includeStale,
            ValidationSampleSizeDto sampleSize,
            ValidationMetricsDto metrics,
            ValidationTargetCheckDto targetCheck,
            ValidationConfusionMatrixDto confusionMatrix,
            List<ValidationTopicMetricDto> perTopic,
            List<ValidationThresholdSensitivityDto> thresholdSensitivity,
            Double bestThreshold,
            List<ValidationDisagreementDto> disagreements) {
        this(classId, className, institutionName, source, isSimulated, includeStale,
             sampleSize, metrics, targetCheck, confusionMatrix, perTopic, thresholdSensitivity,
             bestThreshold, disagreements, null, Collections.emptyList(), null, null);
    }

    /**
     * Backwards-compatible constructor for existing 16-argument invocations.
     */
    public ValidationReportDto(
            Long classId,
            String className,
            String institutionName,
            ValidationSource source,
            boolean isSimulated,
            boolean includeStale,
            ValidationSampleSizeDto sampleSize,
            ValidationMetricsDto metrics,
            ValidationTargetCheckDto targetCheck,
            ValidationConfusionMatrixDto confusionMatrix,
            List<ValidationTopicMetricDto> perTopic,
            List<ValidationThresholdSensitivityDto> thresholdSensitivity,
            Double bestThreshold,
            List<ValidationDisagreementDto> disagreements,
            Integer pooledClassesCount,
            List<ValidationClassBreakdownDto> classBreakdowns) {
        this(classId, className, institutionName, source, isSimulated, includeStale,
             sampleSize, metrics, targetCheck, confusionMatrix, perTopic, thresholdSensitivity,
             bestThreshold, disagreements, pooledClassesCount, classBreakdowns, null, null);
    }
}

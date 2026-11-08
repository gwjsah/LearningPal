package com.learningpal.dto;

import com.learningpal.entity.ValidationSource;
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
        List<ValidationDisagreementDto> disagreements
) {}


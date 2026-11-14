package com.learningpal.dto;

import java.util.List;
import java.util.Map;

/**
 * Institution-wide usability survey summary for administrators.
 * Tracks performance against the 4.0 out of 5 target (minimum 5 responses per role).
 */
public record AdminSurveySummaryDto(
        int totalResponses,
        int studentResponsesCount,
        int teacherResponsesCount,
        double studentAverage,
        double teacherAverage,
        double overallAverage,
        double satisfiedRespondentsPercentage,
        Map<String, Double> studentItemAverages,
        Map<String, Double> teacherItemAverages,
        String targetCheckStatus, // MET, NOT_MET, NOT_ENOUGH_DATA
        String targetCheckSentence,
        List<AdminSurveyCommentDto> recentComments
) {}

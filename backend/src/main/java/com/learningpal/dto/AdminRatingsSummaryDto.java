package com.learningpal.dto;

import java.util.List;

/**
 * Institution-wide helpfulness rating summary for administrators.
 * Tracks performance against the 80% helpful rating target (minimum 10 raters).
 */
public record AdminRatingsSummaryDto(
        int totalRaters,
        int totalRatings,
        double helpfulPercentage,
        double satisfiedRatersPercentage,
        List<TeacherTopicRatingSummaryDto> topics,
        List<TeacherResourceRatingSummaryDto> resources,
        String targetCheckStatus, // MET, NOT_MET, NOT_ENOUGH_DATA
        String targetCheckSentence,
        List<TeacherRatingCommentDto> recentComments
) {}

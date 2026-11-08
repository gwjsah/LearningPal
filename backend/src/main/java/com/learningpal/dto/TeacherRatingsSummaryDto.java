package com.learningpal.dto;

import java.util.List;

/**
 * Class-scoped helpfulness rating summary for teachers.
 */
public record TeacherRatingsSummaryDto(
        List<TeacherTopicRatingSummaryDto> topics,
        List<TeacherResourceRatingSummaryDto> resources,
        List<TeacherResourceRatingSummaryDto> lowestRatedResources,
        List<TeacherRatingCommentDto> recentComments
) {}

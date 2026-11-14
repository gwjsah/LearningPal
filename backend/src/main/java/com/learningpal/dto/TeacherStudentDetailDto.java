package com.learningpal.dto;

import java.util.List;
import java.util.Map;

public record TeacherStudentDetailDto(
        StudentProfileDto profile,
        List<TeacherStudentTopicMasteryDto> topicMasteries,
        Map<Long, List<MissedQuestionDto>> missedQuestionsByTopic,
        List<ClassAttemptDto> attempts,
        List<DiagnosticTrendPointDto> diagnosticTrend,
        List<TeacherInterventionDto> interventions
) {}


package com.learningpal.dto;

import com.learningpal.entity.MasteryStatus;

public record TeacherStudentTopicMasteryDto(
        Long topicId,
        String name,
        Double masteryPercent,
        Double previousMasteryPercent,
        String trend,
        MasteryStatus status,
        int questionsAnswered,
        int resourcesCompleted,
        int resourcesRecommended
) {}


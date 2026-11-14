package com.learningpal.dto;

import com.learningpal.entity.MasteryStatus;
import com.learningpal.entity.ValidationLabel;

/**
 * Item where teacher evaluation disagreed with the system's topic classification.
 * Uses a pseudonymous student code (e.g. S001) to protect student privacy.
 */
public record ValidationDisagreementDto(
        String studentCode,
        Long topicId,
        String topicName,
        ValidationLabel teacherLabel,
        MasteryStatus systemStatus,
        Double systemMastery,
        String note,
        boolean isStale
) {}


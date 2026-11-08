package com.learningpal.entity;

/**
 * Ground-truth or human teacher evaluation indicating whether a student has a learning gap in a topic.
 * - WEAK: Student demonstrates a significant gap in this topic.
 * - NOT_WEAK: Student demonstrates adequate or strong mastery.
 * - CANNOT_JUDGE: Insufficient evidence in student's submitted responses to form an evaluation (excluded from agreement metrics).
 */
public enum ValidationLabel {
    WEAK,
    NOT_WEAK,
    CANNOT_JUDGE
}


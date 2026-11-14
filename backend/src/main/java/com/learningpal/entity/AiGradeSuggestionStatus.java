package com.learningpal.entity;

/**
 * Lifecycle state of an on-demand AI essay grade suggestion.
 * Only teacher confirmation via the standard grading path writes any grade.
 */
public enum AiGradeSuggestionStatus {
    SUGGESTED,
    ACCEPTED,
    EDITED,
    DISCARDED
}

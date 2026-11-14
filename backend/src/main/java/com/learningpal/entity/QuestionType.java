package com.learningpal.entity;

/**
 * Supported question format types.
 * MCQ is retained as a legacy alias for MULTIPLE_CHOICE.
 */
public enum QuestionType {
    MULTIPLE_CHOICE,
    ENUMERATION,
    ESSAY,
    MCQ;

    public boolean isMultipleChoice() {
        return this == MULTIPLE_CHOICE || this == MCQ;
    }

    public QuestionType canonical() {
        return this == MCQ ? MULTIPLE_CHOICE : this;
    }
}

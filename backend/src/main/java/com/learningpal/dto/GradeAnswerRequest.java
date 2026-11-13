package com.learningpal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GradeAnswerRequest(
        @DecimalMin(value = "0.0", message = "Score cannot be negative")
        Double teacherScore,

        @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
        String teacherComment,

        @Valid
        List<CriterionScoreRequest> rubricScores
) {
    public GradeAnswerRequest(Double teacherScore, String teacherComment) {
        this(teacherScore, teacherComment, null);
    }
}


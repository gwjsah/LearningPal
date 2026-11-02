package com.learningpal.dto;

import java.util.List;

/**
 * Payload sent when finalizing an attempt submission.
 */
public record SubmitAttemptRequest(
        List<AnswerSubmissionDto> answers
) {}


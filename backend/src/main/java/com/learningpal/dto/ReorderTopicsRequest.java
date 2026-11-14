package com.learningpal.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReorderTopicsRequest(
        @NotEmpty(message = "Topic IDs list must not be empty")
        List<Long> topicIds
) {}

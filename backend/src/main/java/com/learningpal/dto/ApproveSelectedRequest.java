package com.learningpal.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ApproveSelectedRequest(
        @NotEmpty(message = "Draft IDs list cannot be empty")
        List<Long> draftIds
) {}

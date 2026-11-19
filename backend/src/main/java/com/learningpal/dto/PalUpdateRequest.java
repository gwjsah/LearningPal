package com.learningpal.dto;

public record PalUpdateRequest(
        String palName,
        String palStyle,
        String palColor,
        Boolean palEnabled,
        Boolean palQuietInQuiz,
        String palAccessory
) {}

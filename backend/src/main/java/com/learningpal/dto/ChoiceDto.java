package com.learningpal.dto;

import com.learningpal.entity.Choice;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChoiceDto(
        Long id,
        String label,
        @NotBlank(message = "Choice text is required")
        @Size(max = 300, message = "Choice text must be 300 characters or fewer")
        String text,
        boolean isCorrect
) {
    public static ChoiceDto fromEntity(Choice choice) {
        return new ChoiceDto(
                choice.getId(),
                choice.getLabel(),
                choice.getText(),
                choice.isCorrect()
        );
    }
}

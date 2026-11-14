package com.learningpal.dto;

import com.learningpal.entity.ValidationLabel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SaveValidationLabelRequest {

    @NotNull(message = "Validation label is required (WEAK, NOT_WEAK, or CANNOT_JUDGE)")
    private ValidationLabel label;

    @Size(max = 300, message = "Note cannot exceed 300 characters")
    private String note;

    public SaveValidationLabelRequest() {}

    public SaveValidationLabelRequest(ValidationLabel label, String note) {
        this.label = label;
        this.note = note;
    }

    public ValidationLabel getLabel() {
        return label;
    }

    public void setLabel(ValidationLabel label) {
        this.label = label;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}


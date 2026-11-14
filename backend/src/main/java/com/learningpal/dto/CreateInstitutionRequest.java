package com.learningpal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Super Admin request payload to provision a new educational institution along with its primary administrator.
 */
public record CreateInstitutionRequest(
        @NotBlank(message = "Institution name is required")
        String name,

        String code, // Optional; generated if omitted

        @NotBlank(message = "Admin full name is required")
        String adminFullName,

        @NotBlank(message = "Admin email is required")
        @Email(message = "A valid admin email is required")
        String adminEmail,

        @NotBlank(message = "Admin password is required")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "Password needs at least one letter and one number and must be 8+ characters"
        )
        String adminPassword
) {
}


package com.learningpal.dto;

import com.learningpal.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Incoming request payload for public user signup.
 * Requires a valid institution code so every user is tied to an institution.
 */
public class SignupRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "A valid email address is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
        message = "Password needs at least one letter and one number"
    )
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @NotBlank(message = "Institution code is required")
    private String institutionCode;

    public SignupRequest() {
    }

    public SignupRequest(String fullName, String email, String password, Role role) {
        this(fullName, email, password, role, "PILOT-2026");
    }

    public SignupRequest(String fullName, String email, String password, Role role, String institutionCode) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.institutionCode = institutionCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getInstitutionCode() {
        return institutionCode;
    }

    public void setInstitutionCode(String institutionCode) {
        this.institutionCode = institutionCode;
    }
}

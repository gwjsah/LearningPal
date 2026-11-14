package com.learningpal.dto;

import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;

import java.time.Instant;

/**
 * Safe, sanitized user representation for API responses.
 * Passwords and hashes are strictly excluded.
 */
public class UserDto {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private UserStatus status;
    private Long institutionId;
    private String institutionName;
    private String institutionCode;
    private Instant createdAt;

    public UserDto() {
    }

    public UserDto(Long id, String fullName, String email, Role role, UserStatus status, Instant createdAt) {
        this(id, fullName, email, role, status, null, null, null, createdAt);
    }

    public UserDto(Long id, String fullName, String email, Role role, UserStatus status,
                   Long institutionId, String institutionName, String institutionCode, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.status = status;
        this.institutionId = institutionId;
        this.institutionName = institutionName;
        this.institutionCode = institutionCode;
        this.createdAt = createdAt;
    }

    public static UserDto fromEntity(User user) {
        if (user == null) {
            return null;
        }
        Long instId = user.getInstitution() != null ? user.getInstitution().getId() : null;
        String instName = user.getInstitution() != null ? user.getInstitution().getName() : null;
        String instCode = user.getInstitution() != null ? user.getInstitution().getCode() : null;

        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            instId,
            instName,
            instCode,
            user.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Long getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(Long institutionId) {
        this.institutionId = institutionId;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getInstitutionCode() {
        return institutionCode;
    }

    public void setInstitutionCode(String institutionCode) {
        this.institutionCode = institutionCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

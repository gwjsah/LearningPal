package com.csit321g2.codebuds.learningpal.dto;

import com.csit321g2.codebuds.learningpal.entity.Role;
import com.csit321g2.codebuds.learningpal.entity.User;
import com.csit321g2.codebuds.learningpal.entity.UserStatus;

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
    private Instant createdAt;

    public UserDto() {
    }

    public UserDto(Long id, String fullName, String email, Role role, UserStatus status, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static UserDto fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}


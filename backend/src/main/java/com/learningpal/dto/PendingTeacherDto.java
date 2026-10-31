package com.learningpal.dto;

import com.learningpal.entity.User;
import java.time.Instant;

/**
 * Lightweight DTO representing a teacher registration awaiting admin approval.
 */
public class PendingTeacherDto {

    private Long id;
    private String fullName;
    private String email;
    private Instant createdAt;

    public PendingTeacherDto() {
    }

    public PendingTeacherDto(Long id, String fullName, String email, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.createdAt = createdAt;
    }

    public static PendingTeacherDto fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new PendingTeacherDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}


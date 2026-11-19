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
    private String palName;
    private String palStyle;
    private String palColor;
    private Boolean palEnabled;
    private Boolean palQuietInQuiz;

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

        UserDto dto = new UserDto(
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
        dto.setPalName(user.getPalName() != null && !user.getPalName().isBlank() ? user.getPalName() : "Pip");
        dto.setPalStyle(user.getPalStyle() != null && !user.getPalStyle().isBlank() ? user.getPalStyle() : "sticky");
        dto.setPalColor(user.getPalColor() != null && !user.getPalColor().isBlank() ? user.getPalColor() : "yellow");
        dto.setPalEnabled(user.getPalEnabled() != null ? user.getPalEnabled() : Boolean.TRUE);
        dto.setPalQuietInQuiz(user.getPalQuietInQuiz() != null ? user.getPalQuietInQuiz() : Boolean.TRUE);
        return dto;
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

    public String getPalName() {
        return palName;
    }

    public void setPalName(String palName) {
        this.palName = palName;
    }

    public String getPalStyle() {
        return palStyle;
    }

    public void setPalStyle(String palStyle) {
        this.palStyle = palStyle;
    }

    public String getPalColor() {
        return palColor;
    }

    public void setPalColor(String palColor) {
        this.palColor = palColor;
    }

    public Boolean getPalEnabled() {
        return palEnabled;
    }

    public void setPalEnabled(Boolean palEnabled) {
        this.palEnabled = palEnabled;
    }

    public Boolean getPalQuietInQuiz() {
        return palQuietInQuiz;
    }

    public void setPalQuietInQuiz(Boolean palQuietInQuiz) {
        this.palQuietInQuiz = palQuietInQuiz;
    }
}

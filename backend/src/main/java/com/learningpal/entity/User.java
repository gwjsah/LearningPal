package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA Entity mapping the 'users' table in MySQL.
 * Represents all LearningPal users (students, teachers, institution admins, super admins).
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution; // Nullable ONLY for SUPER_ADMIN

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "pal_name", length = 30)
    private String palName;

    @Column(name = "pal_style", length = 20)
    private String palStyle;

    @Column(name = "pal_color", length = 20)
    private String palColor;

    @Column(name = "pal_enabled")
    private Boolean palEnabled;

    @Column(name = "pal_quiet_in_quiz")
    private Boolean palQuietInQuiz;

    @Column(name = "pal_accessory", length = 20)
    private String palAccessory;

    public User() {
    }

    public User(String fullName, String email, String passwordHash, Role role, UserStatus status) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public User(String fullName, String email, String passwordHash, Role role, UserStatus status, Institution institution) {
        this(fullName, email, passwordHash, role, status);
        this.institution = institution;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    // Getters and Setters

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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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

    public Institution getInstitution() {
        return institution;
    }

    public void setInstitution(Institution institution) {
        this.institution = institution;
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

    public String getPalAccessory() {
        return palAccessory;
    }

    public void setPalAccessory(String palAccessory) {
        this.palAccessory = palAccessory;
    }
}

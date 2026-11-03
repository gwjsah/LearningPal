package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Locale;

/**
 * An educational institution (school, university, organization) in LearningPal.
 * Every user (except SUPER_ADMIN) belongs to exactly one institution.
 */
@Entity
@Table(
    name = "institutions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_institution_code", columnNames = {"code"})
    }
)
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InstitutionStatus status = InstitutionStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Institution() {
    }

    public Institution(String name, String code) {
        this(name, code, InstitutionStatus.ACTIVE);
    }

    public Institution(String name, String code, InstitutionStatus status) {
        this.name = name;
        this.code = code != null ? code.trim().toUpperCase(Locale.ROOT) : null;
        this.status = status != null ? status : InstitutionStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.code != null) {
            this.code = this.code.trim().toUpperCase(Locale.ROOT);
        }
        if (this.status == null) {
            this.status = InstitutionStatus.ACTIVE;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code != null ? code.trim().toUpperCase(Locale.ROOT) : null;
    }

    public InstitutionStatus getStatus() {
        return status;
    }

    public void setStatus(InstitutionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}


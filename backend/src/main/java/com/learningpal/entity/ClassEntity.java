package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * An academic class/section within an institution, linked to a platform subject and taught by a teacher.
 * Students enroll into a class using a unique join code.
 */
@Entity
@Table(
    name = "classes",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_institution_join_code", columnNames = {"institution_id", "join_code"})
    }
)
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher; // Nullable only when teacher is deactivated or unassigned

    @Column(name = "name", nullable = false, length = 120)
    private String name; // e.g. "Section A"

    @Column(name = "join_code", nullable = false, length = 20)
    private String joinCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ClassStatus status = ClassStatus.ACTIVE;

    @Column(name = "enrollment_open", nullable = false)
    private boolean enrollmentOpen = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ClassEntity() {
    }

    public ClassEntity(Institution institution, Subject subject, User teacher, String name, String joinCode) {
        this.institution = institution;
        this.subject = subject;
        this.teacher = teacher;
        this.name = name;
        this.joinCode = joinCode;
        this.status = ClassStatus.ACTIVE;
        this.enrollmentOpen = true;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = ClassStatus.ACTIVE;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Institution getInstitution() {
        return institution;
    }

    public void setInstitution(Institution institution) {
        this.institution = institution;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }

    public ClassStatus getStatus() {
        return status;
    }

    public void setStatus(ClassStatus status) {
        this.status = status;
    }

    public boolean isEnrollmentOpen() {
        return enrollmentOpen;
    }

    public void setEnrollmentOpen(boolean enrollmentOpen) {
        this.enrollmentOpen = enrollmentOpen;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}


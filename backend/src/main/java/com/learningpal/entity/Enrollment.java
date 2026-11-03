package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Maps a student's enrollment in an academic class (section).
 * The subject is reached through the class (classEntity.getSubject()).
 * Also retains optional subject for seamless backward compatibility with legacy test fixtures.
 */
@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_class_enrollment", columnNames = {"student_id", "class_id"})
    }
)
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private Instant enrolledAt;

    public Enrollment() {
    }

    public Enrollment(User student, ClassEntity classEntity) {
        this.student = student;
        this.classEntity = classEntity;
        this.subject = classEntity != null ? classEntity.getSubject() : null;
        this.enrolledAt = Instant.now();
    }

    public Enrollment(User student, Subject subject) {
        this.student = student;
        this.subject = subject;
        this.enrolledAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.enrolledAt == null) {
            this.enrolledAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public ClassEntity getClassEntity() {
        return classEntity;
    }

    public void setClassEntity(ClassEntity classEntity) {
        this.classEntity = classEntity;
        if (classEntity != null && this.subject == null) {
            this.subject = classEntity.getSubject();
        }
    }

    public Subject getSubject() {
        if (classEntity != null) {
            return classEntity.getSubject();
        }
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Instant getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(Instant enrolledAt) {
        this.enrolledAt = enrolledAt;
    }
}
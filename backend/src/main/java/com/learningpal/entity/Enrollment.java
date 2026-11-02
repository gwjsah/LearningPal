package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Maps a student's enrollment in an academic subject.
 * Enforces server-side access control so students cannot access assessments
 * or progress data for subjects they are not enrolled in.
 */
@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_subject_enrollment", columnNames = {"student_id", "subject_id"})
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
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private Instant enrolledAt;

    public Enrollment() {
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

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Subject getSubject() {
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


package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Tracks student completion status for individual educational resources.
 */
@Entity
@Table(
    name = "resource_progress",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_resource_progress", columnNames = {"student_id", "resource_id"})
    }
)
public class ResourceProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    @Column(name = "completed_at")
    private Instant completedAt;

    public ResourceProgress() {
    }

    public ResourceProgress(User student, Resource resource) {
        this.student = student;
        this.resource = resource;
        this.status = ProgressStatus.NOT_STARTED;
    }

    public void markCompleted() {
        this.status = ProgressStatus.COMPLETED;
        this.completedAt = Instant.now();
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

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public ProgressStatus getStatus() {
        return status;
    }

    public void setStatus(ProgressStatus status) {
        this.status = status;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}


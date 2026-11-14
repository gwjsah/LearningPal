package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Per-student access and override control for an assessment.
 * Manages one-time attempt rules, schedule extensions, and teacher retake permissions.
 */
@Entity
@Table(
    name = "assessment_access",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_assessment_student_access", columnNames = {"assessment_id", "student_id"})
    }
)
public class AssessmentAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "is_reopened", nullable = false)
    private boolean isReopened = false;

    @Column(name = "extended_until")
    private Instant extendedUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reopened_by")
    private User reopenedBy;

    @Column(name = "reopened_at")
    private Instant reopenedAt;

    @Column(name = "reason", length = 255)
    private String reason;

    public AssessmentAccess() {
    }

    public AssessmentAccess(Assessment assessment, User student) {
        this.assessment = assessment;
        this.student = student;
        this.isReopened = false;
    }

    public void grantReopen(User teacher, Instant extendedUntil, String reason) {
        this.isReopened = true;
        this.reopenedBy = teacher;
        this.reopenedAt = Instant.now();
        this.extendedUntil = extendedUntil;
        this.reason = reason;
    }

    public void consumeReopen() {
        this.isReopened = false;
    }

    public Long getId() {
        return id;
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public boolean isReopened() {
        return isReopened;
    }

    public void setReopened(boolean reopened) {
        isReopened = reopened;
    }

    public Instant getExtendedUntil() {
        return extendedUntil;
    }

    public void setExtendedUntil(Instant extendedUntil) {
        this.extendedUntil = extendedUntil;
    }

    public User getReopenedBy() {
        return reopenedBy;
    }

    public void setReopenedBy(User reopenedBy) {
        this.reopenedBy = reopenedBy;
    }

    public Instant getReopenedAt() {
        return reopenedAt;
    }

    public void setReopenedAt(Instant reopenedAt) {
        this.reopenedAt = reopenedAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}


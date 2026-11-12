package com.csit321g2.codebuds.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attempts")
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber = 1;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "max_score")
    private Double maxScore;

    public Attempt() {
    }

    public Attempt(User student, Assessment assessment) {
        this(student, assessment, 1);
    }

    public Attempt(User student, Assessment assessment, Integer attemptNumber) {
        this.student = student;
        this.assessment = assessment;
        this.attemptNumber = attemptNumber != null ? attemptNumber : 1;
        this.status = AttemptStatus.IN_PROGRESS;
        this.startedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.startedAt == null) {
            this.startedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = AttemptStatus.IN_PROGRESS;
        }
        if (this.attemptNumber == null) {
            this.attemptNumber = 1;
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

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }

    public AttemptStatus getStatus() {
        return status;
    }

    public void setStatus(AttemptStatus status) {
        this.status = status;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }

    public Double getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
}

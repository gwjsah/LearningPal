package com.csit321g2.codebuds.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessments")
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes = 30;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "assessment_questions",
        joinColumns = @JoinColumn(name = "assessment_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private List<Question> questions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Assessment() {
    }

    public Assessment(String title, String description, AssessmentStatus status, Integer timeLimitMinutes) {
        this.title = title;
        this.description = description;
        this.status = status != null ? status : AssessmentStatus.DRAFT;
        this.timeLimitMinutes = timeLimitMinutes != null ? timeLimitMinutes : 30;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = AssessmentStatus.DRAFT;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public AssessmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssessmentStatus status) {
        this.status = status;
    }

    public Integer getTimeLimitMinutes() {
        return timeLimitMinutes;
    }

    public void setTimeLimitMinutes(Integer timeLimitMinutes) {
        this.timeLimitMinutes = timeLimitMinutes;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

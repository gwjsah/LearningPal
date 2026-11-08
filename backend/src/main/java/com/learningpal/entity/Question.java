package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Diagnostic or practice question belonging to exactly one topic.
 * Supports MCQ and future ESSAY formats.
 */
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private QuestionType type;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "explanation", nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 20)
    private DifficultyLevel difficulty;

    @Column(name = "points", nullable = false)
    private Double points = 1.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QuestionStatus status = QuestionStatus.ACTIVE;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "lineage_id")
    private Long lineageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supersedes_id")
    private Question supersedes;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false, length = 20)
    private QuestionOrigin origin = QuestionOrigin.MANUAL;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Question() {
    }

    public Question(Topic topic, QuestionType type, String text, String explanation, DifficultyLevel difficulty, Double points, User createdBy) {
        this.topic = topic;
        this.subject = topic != null ? topic.getSubject() : null;
        this.type = type;
        this.text = text;
        this.explanation = explanation;
        this.difficulty = difficulty;
        this.points = points != null ? points : 1.0;
        this.createdBy = createdBy;
        this.status = QuestionStatus.ACTIVE;
        this.version = 1;
        this.origin = QuestionOrigin.MANUAL;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.points == null) {
            this.points = 1.0;
        }
        if (this.status == null) {
            this.status = QuestionStatus.ACTIVE;
        }
        if (this.version == null) {
            this.version = 1;
        }
        if (this.origin == null) {
            this.origin = QuestionOrigin.MANUAL;
        }
        if (this.subject == null && this.topic != null) {
            this.subject = this.topic.getSubject();
        }
    }

    public Long getId() {
        return id;
    }

    public Topic getTopic() {
        return topic;
    }

    public void setTopic(Topic topic) {
        this.topic = topic;
    }

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public DifficultyLevel getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyLevel difficulty) {
        this.difficulty = difficulty;
    }

    public Double getPoints() {
        return points;
    }

    public void setPoints(Double points) {
        this.points = points;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public QuestionStatus getStatus() {
        return status;
    }

    public void setStatus(QuestionStatus status) {
        this.status = status;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Long getLineageId() {
        return lineageId != null ? lineageId : id;
    }

    public void setLineageId(Long lineageId) {
        this.lineageId = lineageId;
    }

    public Question getSupersedes() {
        return supersedes;
    }

    public void setSupersedes(Question supersedes) {
        this.supersedes = supersedes;
    }

    public QuestionOrigin getOrigin() {
        return origin;
    }

    public void setOrigin(QuestionOrigin origin) {
        this.origin = origin;
    }
}


package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Granular subject unit (e.g. Loops). Gap analysis maps directly to this level.
 */
@Entity
@Table(
    name = "topics",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_topic_subject_name", columnNames = {"subject_id", "name"}),
        @UniqueConstraint(name = "uk_topic_subject_order", columnNames = {"subject_id", "display_order"})
    }
)
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TopicStatus status = TopicStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Topic() {
    }

    public Topic(Subject subject, String name, String description, Integer displayOrder) {
        this.subject = subject;
        this.name = name;
        this.description = description;
        this.displayOrder = displayOrder;
        this.status = TopicStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = TopicStatus.ACTIVE;
        }
    }

    public Long getId() {
        return id;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public TopicStatus getStatus() {
        return status;
    }

    public void setStatus(TopicStatus status) {
        this.status = status;
    }
}


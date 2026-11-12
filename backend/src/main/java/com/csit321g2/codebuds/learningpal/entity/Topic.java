package com.csit321g2.codebuds.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private TopicStatus status = TopicStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Topic() {
    }

    public Topic(String name, String description, Integer displayOrder) {
        this.name = name;
        this.description = description;
        this.displayOrder = displayOrder != null ? displayOrder : 1;
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
        if (this.displayOrder == null) {
            this.displayOrder = 1;
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

    public TopicStatus getStatus() {
        return status;
    }

    public void setStatus(TopicStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

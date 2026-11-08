package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Student helpfulness rating for topic diagnostic feedback.
 * Captures 1-to-5 Likert score, optional comment, and snapshot of topic status at rating time.
 * Unique constraint ensures one rating per student per topic (upsert semantics).
 */
@Entity
@Table(
    name = "feedback_ratings",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_feedback_rating_student_topic", columnNames = {"student_id", "topic_id"})
    }
)
public class FeedbackRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "rating", nullable = false)
    private Integer rating; // 1 to 5

    @Column(name = "comment", length = 300)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "topic_status_at_rating", length = 30)
    private MasteryStatus topicStatusAtRating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public FeedbackRating() {
    }

    public FeedbackRating(User student, Topic topic, Integer rating, String comment, MasteryStatus topicStatusAtRating) {
        this.student = student;
        this.topic = topic;
        this.rating = rating;
        this.comment = comment;
        this.topicStatusAtRating = topicStatusAtRating;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
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

    public Topic getTopic() {
        return topic;
    }

    public void setTopic(Topic topic) {
        this.topic = topic;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public MasteryStatus getTopicStatusAtRating() {
        return topicStatusAtRating;
    }

    public void setTopicStatusAtRating(MasteryStatus topicStatusAtRating) {
        this.topicStatusAtRating = topicStatusAtRating;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

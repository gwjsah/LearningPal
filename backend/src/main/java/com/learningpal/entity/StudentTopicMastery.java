package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Stores aggregated topic performance from gap analysis.
 */
@Entity
@Table(
    name = "student_topic_mastery",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_class_topic_mastery", columnNames = {"student_id", "class_id", "topic_id"})
    }
)
public class StudentTopicMastery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private ClassEntity classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "mastery_percent", nullable = false)
    private Double masteryPercent;

    @Column(name = "previous_mastery_percent")
    private Double previousMasteryPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MasteryStatus status;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StudentTopicMastery() {
    }

    public StudentTopicMastery(User student, ClassEntity classroom, Topic topic, Double masteryPercent, MasteryStatus status) {
        this.student = student;
        this.classroom = classroom;
        this.topic = topic;
        this.masteryPercent = masteryPercent;
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public StudentTopicMastery(User student, Topic topic, Double masteryPercent, MasteryStatus status) {
        this.student = student;
        this.classroom = null;
        this.topic = topic;
        this.masteryPercent = masteryPercent;
        this.status = status;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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

    public ClassEntity getClassroom() {
        return classroom;
    }

    public void setClassroom(ClassEntity classroom) {
        this.classroom = classroom;
    }

    public Topic getTopic() {
        return topic;
    }

    public void setTopic(Topic topic) {
        this.topic = topic;
    }

    public Double getMasteryPercent() {
        return masteryPercent;
    }

    public void setMasteryPercent(Double masteryPercent) {
        this.masteryPercent = masteryPercent;
    }

    public Double getPreviousMasteryPercent() {
        return previousMasteryPercent;
    }

    public void setPreviousMasteryPercent(Double previousMasteryPercent) {
        this.previousMasteryPercent = previousMasteryPercent;
    }

    public MasteryStatus getStatus() {
        return status;
    }

    public void setStatus(MasteryStatus status) {
        this.status = status;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}


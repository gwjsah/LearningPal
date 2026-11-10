package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Stores deterministic random topic assignments for a student within a class
 * for the Validation Lab (3 topics per student, or all eligible if < 3).
 * Never re-rolled once assigned.
 */
@Entity
@Table(
    name = "student_validation_assignments",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_val_assign_student_class_topic", columnNames = {"student_id", "class_id", "topic_id"})
    }
)
public class StudentValidationAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private ClassEntity classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "assigned_order")
    private Integer assignedOrder;

    @Column(name = "seed", length = 64)
    private String seed;

    public StudentValidationAssignment() {}

    public StudentValidationAssignment(User student, ClassEntity classroom, Topic topic, Instant assignedAt, String seed, Integer assignedOrder) {
        this.student = student;
        this.classroom = classroom;
        this.topic = topic;
        this.assignedAt = assignedAt != null ? assignedAt : Instant.now();
        this.seed = seed;
        this.assignedOrder = assignedOrder;
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

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Instant assignedAt) {
        this.assignedAt = assignedAt;
    }

    public Integer getAssignedOrder() {
        return assignedOrder;
    }

    public void setAssignedOrder(Integer assignedOrder) {
        this.assignedOrder = assignedOrder;
    }

    public String getSeed() {
        return seed;
    }

    public void setSeed(String seed) {
        this.seed = seed;
    }
}

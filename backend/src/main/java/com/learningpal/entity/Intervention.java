package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Targeted pedagogical intervention logged by a teacher for a student with a learning gap.
 */
@Entity
@Table(name = "interventions")
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private InterventionType type = InterventionType.ONE_ON_ONE;

    @Column(name = "note", nullable = false, columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InterventionStatus status = InterventionStatus.PLANNED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "mastery_at_start")
    private Double masteryAtStart;

    @Column(name = "mastery_at_completion")
    private Double masteryAtCompletion;

    public Intervention() {
    }

    public Intervention(User student, User teacher, Topic topic, String note, InterventionStatus status, LocalDate followUpDate) {
        this(student, teacher, null, topic, InterventionType.ONE_ON_ONE, note, status, followUpDate, null);
    }

    public Intervention(
            User student,
            User teacher,
            ClassEntity classEntity,
            Topic topic,
            InterventionType type,
            String note,
            InterventionStatus status,
            LocalDate followUpDate,
            Double masteryAtStart) {
        this.student = student;
        this.teacher = teacher;
        this.classEntity = classEntity;
        this.topic = topic;
        this.type = type != null ? type : InterventionType.ONE_ON_ONE;
        this.note = note;
        this.status = status != null ? status : InterventionStatus.PLANNED;
        this.followUpDate = followUpDate;
        this.masteryAtStart = masteryAtStart;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = InterventionStatus.PLANNED;
        }
        if (this.type == null) {
            this.type = InterventionType.ONE_ON_ONE;
        }
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

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public ClassEntity getClassEntity() {
        return classEntity;
    }

    public void setClassEntity(ClassEntity classEntity) {
        this.classEntity = classEntity;
    }

    public Topic getTopic() {
        return topic;
    }

    public void setTopic(Topic topic) {
        this.topic = topic;
    }

    public InterventionType getType() {
        return type;
    }

    public void setType(InterventionType type) {
        this.type = type;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public InterventionStatus getStatus() {
        return status;
    }

    public void setStatus(InterventionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public LocalDate getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(LocalDate followUpDate) {
        this.followUpDate = followUpDate;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Double getMasteryAtStart() {
        return masteryAtStart;
    }

    public void setMasteryAtStart(Double masteryAtStart) {
        this.masteryAtStart = masteryAtStart;
    }

    public Double getMasteryAtCompletion() {
        return masteryAtCompletion;
    }

    public void setMasteryAtCompletion(Double masteryAtCompletion) {
        this.masteryAtCompletion = masteryAtCompletion;
    }
}

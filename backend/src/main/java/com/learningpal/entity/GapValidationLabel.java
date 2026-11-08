package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Validation label used to evaluate gap detection accuracy against ground truth
 * (either synthetic simulation parameters or teacher manual inspection).
 */
@Entity
@Table(name = "gap_validation_labels", uniqueConstraints = {
        @UniqueConstraint(name = "uk_gap_val_student_class_topic_source", columnNames = {"student_id", "class_id", "topic_id", "source"})
})
public class GapValidationLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "label", nullable = false, length = 20)
    private ValidationLabel label;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private ValidationSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "labeled_by")
    private User labeledBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private ClassEntity classroom;

    @Column(name = "note", length = 300)
    private String note;

    @Column(name = "attempt_count_at_label")
    private Integer attemptCountAtLabel;

    @Enumerated(EnumType.STRING)
    @Column(name = "system_status_at_label", length = 30)
    private MasteryStatus systemStatusAtLabel;

    @Column(name = "system_mastery_at_label")
    private Double systemMasteryAtLabel;

    @Column(name = "labeled_at", nullable = false)
    private Instant labeledAt;

    public GapValidationLabel() {}

    public GapValidationLabel(User student, Topic topic, ValidationLabel label, ValidationSource source, User labeledBy, Instant labeledAt) {
        this.student = student;
        this.topic = topic;
        this.label = label;
        this.source = source;
        this.labeledBy = labeledBy;
        this.labeledAt = labeledAt != null ? labeledAt : Instant.now();
    }

    public GapValidationLabel(User student, Topic topic, ValidationLabel label, ValidationSource source, User labeledBy, Instant labeledAt,
                              ClassEntity classroom, String note, Integer attemptCountAtLabel, MasteryStatus systemStatusAtLabel, Double systemMasteryAtLabel) {
        this.student = student;
        this.topic = topic;
        this.label = label;
        this.source = source;
        this.labeledBy = labeledBy;
        this.labeledAt = labeledAt != null ? labeledAt : Instant.now();
        this.classroom = classroom;
        this.note = note;
        this.attemptCountAtLabel = attemptCountAtLabel;
        this.systemStatusAtLabel = systemStatusAtLabel;
        this.systemMasteryAtLabel = systemMasteryAtLabel;
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

    public ValidationLabel getLabel() {
        return label;
    }

    public void setLabel(ValidationLabel label) {
        this.label = label;
    }

    public ValidationSource getSource() {
        return source;
    }

    public void setSource(ValidationSource source) {
        this.source = source;
    }

    public User getLabeledBy() {
        return labeledBy;
    }

    public void setLabeledBy(User labeledBy) {
        this.labeledBy = labeledBy;
    }

    public Instant getLabeledAt() {
        return labeledAt;
    }

    public void setLabeledAt(Instant labeledAt) {
        this.labeledAt = labeledAt;
    }

    public ClassEntity getClassroom() {
        return classroom;
    }

    public void setClassroom(ClassEntity classroom) {
        this.classroom = classroom;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Integer getAttemptCountAtLabel() {
        return attemptCountAtLabel;
    }

    public void setAttemptCountAtLabel(Integer attemptCountAtLabel) {
        this.attemptCountAtLabel = attemptCountAtLabel;
    }

    public MasteryStatus getSystemStatusAtLabel() {
        return systemStatusAtLabel;
    }

    public void setSystemStatusAtLabel(MasteryStatus systemStatusAtLabel) {
        this.systemStatusAtLabel = systemStatusAtLabel;
    }

    public Double getSystemMasteryAtLabel() {
        return systemMasteryAtLabel;
    }

    public void setSystemMasteryAtLabel(Double systemMasteryAtLabel) {
        this.systemMasteryAtLabel = systemMasteryAtLabel;
    }
}


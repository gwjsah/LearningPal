package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Class-scoped schedule, availability window, and retake policy for an assessment.
 * Governs students enrolled in this specific class section.
 */
@Entity
@Table(
    name = "class_assessment_settings",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_class_assessment_setting", columnNames = {"class_id", "assessment_id"})
    }
)
public class ClassAssessmentSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(name = "available_from")
    private Instant availableFrom;

    @Column(name = "available_until")
    private Instant availableUntil;

    @Column(name = "allow_retakes", nullable = false)
    private boolean allowRetakes = false;

    public ClassAssessmentSetting() {
    }

    public ClassAssessmentSetting(ClassEntity classEntity, Assessment assessment, Instant availableFrom, Instant availableUntil, boolean allowRetakes) {
        this.classEntity = classEntity;
        this.assessment = assessment;
        this.availableFrom = availableFrom;
        this.availableUntil = availableUntil;
        this.allowRetakes = allowRetakes;
    }

    public Long getId() {
        return id;
    }

    public ClassEntity getClassEntity() {
        return classEntity;
    }

    public void setClassEntity(ClassEntity classEntity) {
        this.classEntity = classEntity;
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }

    public Instant getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(Instant availableFrom) {
        this.availableFrom = availableFrom;
    }

    public Instant getAvailableUntil() {
        return availableUntil;
    }

    public void setAvailableUntil(Instant availableUntil) {
        this.availableUntil = availableUntil;
    }

    public boolean isAllowRetakes() {
        return allowRetakes;
    }

    public void setAllowRetakes(boolean allowRetakes) {
        this.allowRetakes = allowRetakes;
    }
}


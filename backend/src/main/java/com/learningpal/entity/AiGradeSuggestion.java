package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Stores an on-demand AI rubric grade suggestion for an ESSAY answer.
 * Never writes teacherScore, autoScore, or finalScore; serves as staging and teacher-only audit trail.
 */
@Entity
@Table(name = "ai_grade_suggestions")
public class AiGradeSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private Answer answer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "criterion_suggestions_json", columnDefinition = "TEXT", nullable = false)
    private String criterionSuggestionsJson;

    @Column(name = "overall_feedback", length = 600)
    private String overallFeedback;

    @Column(name = "provider_name", nullable = false, length = 30)
    private String providerName;

    @Column(name = "model_name", nullable = false, length = 120)
    private String modelName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AiGradeSuggestionStatus status = AiGradeSuggestionStatus.SUGGESTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public AiGradeSuggestion() {
    }

    public AiGradeSuggestion(
            Answer answer,
            User teacher,
            String criterionSuggestionsJson,
            String overallFeedback,
            String providerName,
            String modelName) {
        this.answer = answer;
        this.teacher = teacher;
        this.criterionSuggestionsJson = criterionSuggestionsJson;
        this.overallFeedback = overallFeedback;
        this.providerName = providerName;
        this.modelName = modelName;
        this.status = AiGradeSuggestionStatus.SUGGESTED;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = AiGradeSuggestionStatus.SUGGESTED;
        }
    }

    public Long getId() {
        return id;
    }

    public Answer getAnswer() {
        return answer;
    }

    public void setAnswer(Answer answer) {
        this.answer = answer;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public String getCriterionSuggestionsJson() {
        return criterionSuggestionsJson;
    }

    public void setCriterionSuggestionsJson(String criterionSuggestionsJson) {
        this.criterionSuggestionsJson = criterionSuggestionsJson;
    }

    public String getOverallFeedback() {
        return overallFeedback;
    }

    public void setOverallFeedback(String overallFeedback) {
        this.overallFeedback = overallFeedback;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public AiGradeSuggestionStatus getStatus() {
        return status;
    }

    public void setStatus(AiGradeSuggestionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}

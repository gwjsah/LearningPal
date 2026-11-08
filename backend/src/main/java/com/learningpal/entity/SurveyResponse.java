package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Recorded in-app usability survey response for a student or teacher.
 * One response allowed per user per survey version.
 */
@Entity
@Table(
    name = "survey_responses",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_survey_user_version", columnNames = {"user_id", "survey_version"})
    }
)
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(name = "survey_version", nullable = false, length = 20)
    private String surveyVersion = "v1";

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyAnswer> answers = new ArrayList<>();

    public SurveyResponse() {
    }

    public SurveyResponse(User user, Role role, String surveyVersion, String comment) {
        this.user = user;
        this.role = role;
        this.surveyVersion = (surveyVersion != null && !surveyVersion.isBlank()) ? surveyVersion : "v1";
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void addAnswer(String itemKey, Integer score) {
        SurveyAnswer answer = new SurveyAnswer(this, itemKey, score);
        this.answers.add(answer);
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getSurveyVersion() {
        return surveyVersion;
    }

    public void setSurveyVersion(String surveyVersion) {
        this.surveyVersion = surveyVersion;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<SurveyAnswer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<SurveyAnswer> answers) {
        this.answers = answers;
    }
}

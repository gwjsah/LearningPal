package com.learningpal.entity;

import jakarta.persistence.*;

/**
 * Join table linking an assessment to a question at a specific order position.
 * Enables question reuse across multiple assessments.
 */
@Entity
@Table(
    name = "assessment_questions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_assessment_question", columnNames = {"assessment_id", "question_id"}),
        @UniqueConstraint(name = "uk_assessment_position", columnNames = {"assessment_id", "position"})
    }
)
public class AssessmentQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "position", nullable = false)
    private Integer position;

    public AssessmentQuestion() {
    }

    public AssessmentQuestion(Assessment assessment, Question question, Integer position) {
        this.assessment = assessment;
        this.question = question;
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }
}


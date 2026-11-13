package com.learningpal.entity;

import jakarta.persistence.*;

/**
 * Rubric criterion attached to an ESSAY question version.
 * Question points equal the sum of criteria maxPoints.
 */
@Entity
@Table(name = "essay_rubric_criteria")
public class EssayRubricCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "max_points", nullable = false)
    private Integer maxPoints;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 1;

    public EssayRubricCriterion() {
    }

    public EssayRubricCriterion(Question question, String name, String description, Integer maxPoints, Integer displayOrder) {
        this.question = question;
        this.name = name;
        this.description = description;
        this.maxPoints = maxPoints;
        this.displayOrder = displayOrder != null ? displayOrder : 1;
    }

    public Long getId() {
        return id;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
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

    public Integer getMaxPoints() {
        return maxPoints;
    }

    public void setMaxPoints(Integer maxPoints) {
        this.maxPoints = maxPoints;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}

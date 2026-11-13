package com.learningpal.entity;

import jakarta.persistence.*;

/**
 * Per-criterion integer points awarded by a teacher when grading an ESSAY answer.
 */
@Entity
@Table(
    name = "answer_rubric_scores",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_answer_rubric_criterion", columnNames = {"answer_id", "criterion_id"})
    }
)
public class AnswerRubricScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private Answer answer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criterion_id", nullable = false)
    private EssayRubricCriterion criterion;

    @Column(name = "points_awarded", nullable = false)
    private Integer pointsAwarded;

    public AnswerRubricScore() {
    }

    public AnswerRubricScore(Answer answer, EssayRubricCriterion criterion, Integer pointsAwarded) {
        this.answer = answer;
        this.criterion = criterion;
        this.pointsAwarded = pointsAwarded;
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

    public EssayRubricCriterion getCriterion() {
        return criterion;
    }

    public void setCriterion(EssayRubricCriterion criterion) {
        this.criterion = criterion;
    }

    public Integer getPointsAwarded() {
        return pointsAwarded;
    }

    public void setPointsAwarded(Integer pointsAwarded) {
        this.pointsAwarded = pointsAwarded;
    }
}

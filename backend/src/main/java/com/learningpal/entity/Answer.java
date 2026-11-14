package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A student's response to an individual question in an attempt.
 *
 * GRADING RULE:
 * In-app quizzes are auto-graded, but teachers can override any score later.
 * The final score is teacherScore if present, otherwise autoScore.
 * All score recalculations are centralized in recalculateFinalScore().
 */
@Entity
@Table(
    name = "answers",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_answer_attempt_question", columnNames = {"attempt_id", "question_id"})
    }
)
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_choice_id")
    private Choice selectedChoice;

    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "auto_score")
    private Double autoScore;

    @Column(name = "teacher_score")
    private Double teacherScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by")
    private User gradedBy;

    @Column(name = "graded_at")
    private Instant gradedAt;

    public Answer() {
    }

    public Answer(Attempt attempt, Question question, Choice selectedChoice) {
        this.attempt = attempt;
        this.question = question;
        this.selectedChoice = selectedChoice;
    }

    public Answer(Attempt attempt, Question question, String textAnswer) {
        this.attempt = attempt;
        this.question = question;
        this.textAnswer = textAnswer;
    }

    /**
     * Single source of truth for final score resolution.
     * Teacher score always overrides auto score when specified.
     */
    private void recalculateFinalScore() {
        this.finalScore = (this.teacherScore != null) ? this.teacherScore : this.autoScore;
    }

    /**
     * Records auto-graded result (e.g. MCQ matching).
     */
    public void applyAutoScore(Double score) {
        this.autoScore = score;
        recalculateFinalScore();
    }

    /**
     * Records teacher manual grading or override with feedback.
     */
    public void applyTeacherOverride(Double score, String comment, User teacher) {
        this.teacherScore = score;
        this.teacherComment = comment;
        this.gradedBy = teacher;
        this.gradedAt = Instant.now();
        recalculateFinalScore();
    }

    public Long getId() {
        return id;
    }

    public Attempt getAttempt() {
        return attempt;
    }

    public void setAttempt(Attempt attempt) {
        this.attempt = attempt;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public Choice getSelectedChoice() {
        return selectedChoice;
    }

    public void setSelectedChoice(Choice selectedChoice) {
        this.selectedChoice = selectedChoice;
    }

    public String getTextAnswer() {
        return textAnswer;
    }

    public void setTextAnswer(String textAnswer) {
        this.textAnswer = textAnswer;
    }

    public Double getAutoScore() {
        return autoScore;
    }

    public Double getTeacherScore() {
        return teacherScore;
    }

    public Double getFinalScore() {
        return finalScore;
    }

    public String getTeacherComment() {
        return teacherComment;
    }

    public User getGradedBy() {
        return gradedBy;
    }

    public Instant getGradedAt() {
        return gradedAt;
    }
}


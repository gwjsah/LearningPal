package com.learningpal.entity;

import jakarta.persistence.*;

/**
 * Multiple-choice option for an MCQ question.
 */
@Entity
@Table(
    name = "choices",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_choice_question_label", columnNames = {"question_id", "label"})
    }
)
public class Choice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "label", nullable = false, length = 10)
    private String label;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    public Choice() {
    }

    public Choice(Question question, String label, String text, boolean isCorrect) {
        this.question = question;
        this.label = label;
        this.text = text;
        this.isCorrect = isCorrect;
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

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }
}


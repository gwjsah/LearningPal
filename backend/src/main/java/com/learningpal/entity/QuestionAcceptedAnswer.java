package com.learningpal.entity;

import jakarta.persistence.*;

/**
 * Accepted answer variant for an ENUMERATION question version.
 */
@Entity
@Table(name = "question_accepted_answers")
public class QuestionAcceptedAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "answer_text", nullable = false, length = 100)
    private String answerText;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 1;

    public QuestionAcceptedAnswer() {
    }

    public QuestionAcceptedAnswer(Question question, String answerText, Integer displayOrder) {
        this.question = question;
        this.answerText = answerText;
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

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}

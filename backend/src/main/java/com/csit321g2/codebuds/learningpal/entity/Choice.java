package com.csit321g2.codebuds.learningpal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "choices")
public class Choice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect = false;

    @Column(name = "display_order")
    private Integer displayOrder = 1;

    public Choice() {
    }

    public Choice(String text, boolean isCorrect, Integer displayOrder) {
        this.text = text;
        this.isCorrect = isCorrect;
        this.displayOrder = displayOrder != null ? displayOrder : 1;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}

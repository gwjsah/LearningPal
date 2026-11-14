package com.learningpal.entity;

import jakarta.persistence.*;

/**
 * Individual item answer (1 to 5 Likert score) within a survey response.
 */
@Entity
@Table(
    name = "survey_answers",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_survey_answer_item", columnNames = {"response_id", "item_key"})
    }
)
public class SurveyAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    private SurveyResponse response;

    @Column(name = "item_key", nullable = false, length = 50)
    private String itemKey;

    @Column(name = "score", nullable = false)
    private Integer score; // 1 to 5

    public SurveyAnswer() {
    }

    public SurveyAnswer(SurveyResponse response, String itemKey, Integer score) {
        this.response = response;
        this.itemKey = itemKey;
        this.score = score;
    }

    public Long getId() {
        return id;
    }

    public SurveyResponse getResponse() {
        return response;
    }

    public void setResponse(SurveyResponse response) {
        this.response = response;
    }

    public String getItemKey() {
        return itemKey;
    }

    public void setItemKey(String itemKey) {
        this.itemKey = itemKey;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}

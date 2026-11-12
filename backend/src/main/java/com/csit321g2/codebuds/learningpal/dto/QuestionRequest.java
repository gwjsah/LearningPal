package com.csit321g2.codebuds.learningpal.dto;

import com.csit321g2.codebuds.learningpal.entity.Choice;
import com.csit321g2.codebuds.learningpal.entity.DifficultyLevel;
import com.csit321g2.codebuds.learningpal.entity.QuestionType;

import java.util.List;

public class QuestionRequest {
    private Long topicId;
    private QuestionType type;
    private String text;
    private String explanation;
    private DifficultyLevel difficulty;
    private Double points;
    private List<Choice> choices;

    public Long getTopicId() {
        return topicId;
    }

    public void setTopicId(Long topicId) {
        this.topicId = topicId;
    }

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public DifficultyLevel getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(DifficultyLevel difficulty) {
        this.difficulty = difficulty;
    }

    public Double getPoints() {
        return points;
    }

    public void setPoints(Double points) {
        this.points = points;
    }

    public List<Choice> getChoices() {
        return choices;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }
}

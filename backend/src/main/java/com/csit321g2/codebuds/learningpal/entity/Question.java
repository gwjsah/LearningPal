package com.csit321g2.codebuds.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private QuestionType type = QuestionType.MULTIPLE_CHOICE;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", length = 20)
    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    @Column(name = "points", nullable = false)
    private Double points = 1.0;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id")
    private List<Choice> choices = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Question() {
    }

    public Question(Topic topic, QuestionType type, String text, String explanation, DifficultyLevel difficulty, Double points) {
        this.topic = topic;
        this.type = type != null ? type : QuestionType.MULTIPLE_CHOICE;
        this.text = text;
        this.explanation = explanation;
        this.difficulty = difficulty != null ? difficulty : DifficultyLevel.MEDIUM;
        this.points = points != null ? points : 1.0;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.points == null) {
            this.points = 1.0;
        }
        if (this.type == null) {
            this.type = QuestionType.MULTIPLE_CHOICE;
        }
        if (this.difficulty == null) {
            this.difficulty = DifficultyLevel.MEDIUM;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Topic getTopic() {
        return topic;
    }

    public void setTopic(Topic topic) {
        this.topic = topic;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

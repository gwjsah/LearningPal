package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Individual multiple-choice question draft produced by local LLM for teacher review.
 */
@Entity
@Table(name = "ai_question_drafts")
public class AiQuestionDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
    private AiGenerationJob job;

    @Column(name = "section_index", nullable = false)
    private int sectionIndex = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 20)
    private QuestionType questionType = QuestionType.MULTIPLE_CHOICE;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "choice_a", columnDefinition = "TEXT")
    private String choiceA;

    @Column(name = "choice_b", columnDefinition = "TEXT")
    private String choiceB;

    @Column(name = "choice_c", columnDefinition = "TEXT")
    private String choiceC;

    @Column(name = "choice_d", columnDefinition = "TEXT")
    private String choiceD;

    @Column(name = "correct_index")
    private Integer correctIndex = 0;

    @Column(name = "accepted_answers_json", columnDefinition = "TEXT")
    private String acceptedAnswersJson;

    @Column(name = "rubric_criteria_json", columnDefinition = "TEXT")
    private String rubricCriteriaJson;

    @Column(name = "points", nullable = false)
    private double points = 1.0;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 20)
    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    @Column(name = "evidence_quote", columnDefinition = "TEXT")
    private String evidenceQuote;

    @Column(name = "evidence_verified", nullable = false)
    private boolean evidenceVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AiDraftStatus status = AiDraftStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_question_id")
    private Question approvedQuestion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public AiQuestionDraft() {
    }

    public AiQuestionDraft(
            AiGenerationJob job,
            int sectionIndex,
            String questionText,
            String choiceA,
            String choiceB,
            String choiceC,
            String choiceD,
            int correctIndex,
            String explanation,
            DifficultyLevel difficulty,
            String evidenceQuote,
            boolean evidenceVerified) {
        this.job = job;
        this.sectionIndex = sectionIndex;
        this.questionText = questionText;
        this.choiceA = choiceA;
        this.choiceB = choiceB;
        this.choiceC = choiceC;
        this.choiceD = choiceD;
        this.correctIndex = correctIndex;
        this.explanation = explanation;
        this.difficulty = difficulty != null ? difficulty : DifficultyLevel.MEDIUM;
        this.evidenceQuote = evidenceQuote;
        this.evidenceVerified = evidenceVerified;
        this.status = AiDraftStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.questionType == null) {
            this.questionType = QuestionType.MULTIPLE_CHOICE;
        }
        if (this.points <= 0) {
            this.points = 1.0;
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public List<String> getChoicesList() {
        if (questionType != null && !questionType.isMultipleChoice()) {
            return List.of();
        }
        List<String> list = new ArrayList<>(4);
        if (choiceA != null) list.add(choiceA);
        if (choiceB != null) list.add(choiceB);
        if (choiceC != null) list.add(choiceC);
        if (choiceD != null) list.add(choiceD);
        return list;
    }

    public QuestionType getQuestionType() {
        return questionType != null ? questionType.canonical() : QuestionType.MULTIPLE_CHOICE;
    }

    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType != null ? questionType.canonical() : QuestionType.MULTIPLE_CHOICE;
    }

    public Long getId() {
        return id;
    }

    public AiGenerationJob getJob() {
        return job;
    }

    public void setJob(AiGenerationJob job) {
        this.job = job;
    }

    public int getSectionIndex() {
        return sectionIndex;
    }

    public void setSectionIndex(int sectionIndex) {
        this.sectionIndex = sectionIndex;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getChoiceA() {
        return choiceA;
    }

    public void setChoiceA(String choiceA) {
        this.choiceA = choiceA;
    }

    public String getChoiceB() {
        return choiceB;
    }

    public void setChoiceB(String choiceB) {
        this.choiceB = choiceB;
    }

    public String getChoiceC() {
        return choiceC;
    }

    public void setChoiceC(String choiceC) {
        this.choiceC = choiceC;
    }

    public String getChoiceD() {
        return choiceD;
    }

    public void setChoiceD(String choiceD) {
        this.choiceD = choiceD;
    }

    public int getCorrectIndex() {
        return correctIndex != null ? correctIndex : 0;
    }

    public void setCorrectIndex(Integer correctIndex) {
        this.correctIndex = correctIndex;
    }

    public String getAcceptedAnswersJson() {
        return acceptedAnswersJson;
    }

    public void setAcceptedAnswersJson(String acceptedAnswersJson) {
        this.acceptedAnswersJson = acceptedAnswersJson;
    }

    public String getRubricCriteriaJson() {
        return rubricCriteriaJson;
    }

    public void setRubricCriteriaJson(String rubricCriteriaJson) {
        this.rubricCriteriaJson = rubricCriteriaJson;
    }

    public double getPoints() {
        return points;
    }

    public void setPoints(double points) {
        this.points = points;
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

    public String getEvidenceQuote() {
        return evidenceQuote;
    }

    public void setEvidenceQuote(String evidenceQuote) {
        this.evidenceQuote = evidenceQuote;
    }

    public boolean isEvidenceVerified() {
        return evidenceVerified;
    }

    public void setEvidenceVerified(boolean evidenceVerified) {
        this.evidenceVerified = evidenceVerified;
    }

    public AiDraftStatus getStatus() {
        return status;
    }

    public void setStatus(AiDraftStatus status) {
        this.status = status;
    }

    public Question getApprovedQuestion() {
        return approvedQuestion;
    }

    public void setApprovedQuestion(Question approvedQuestion) {
        this.approvedQuestion = approvedQuestion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

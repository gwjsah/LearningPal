package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Asynchronous job record tracking local LLM question generation from an uploaded file resource.
 */
@Entity
@Table(name = "ai_generation_jobs")
public class AiGenerationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_file_id", nullable = false)
    private ResourceFile sourceFile;

    @Column(name = "requested_count", nullable = false)
    private int requestedCount = 10;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AiJobStatus status = AiJobStatus.QUEUED;

    @Column(name = "sections_done", nullable = false)
    private int sectionsDone = 0;

    @Column(name = "sections_total", nullable = false)
    private int sectionsTotal = 0;

    @Column(name = "model_name", length = 120)
    private String modelName;

    @Column(name = "short_note", length = 500)
    private String shortNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public AiGenerationJob() {
    }

    public AiGenerationJob(
            User teacher,
            Subject subject,
            Topic topic,
            ResourceFile sourceFile,
            int requestedCount,
            String modelName) {
        this.teacher = teacher;
        this.subject = subject;
        this.topic = topic;
        this.sourceFile = sourceFile;
        this.requestedCount = requestedCount;
        this.modelName = modelName;
        this.status = AiJobStatus.QUEUED;
        this.sectionsDone = 0;
        this.sectionsTotal = 0;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Topic getTopic() {
        return topic;
    }

    public void setTopic(Topic topic) {
        this.topic = topic;
    }

    public ResourceFile getSourceFile() {
        return sourceFile;
    }

    public void setSourceFile(ResourceFile sourceFile) {
        this.sourceFile = sourceFile;
    }

    public int getRequestedCount() {
        return requestedCount;
    }

    public void setRequestedCount(int requestedCount) {
        this.requestedCount = requestedCount;
    }

    public AiJobStatus getStatus() {
        return status;
    }

    public void setStatus(AiJobStatus status) {
        this.status = status;
    }

    public int getSectionsDone() {
        return sectionsDone;
    }

    public void setSectionsDone(int sectionsDone) {
        this.sectionsDone = sectionsDone;
    }

    public int getSectionsTotal() {
        return sectionsTotal;
    }

    public void setSectionsTotal(int sectionsTotal) {
        this.sectionsTotal = sectionsTotal;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getShortNote() {
        return shortNote;
    }

    public void setShortNote(String shortNote) {
        this.shortNote = shortNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}

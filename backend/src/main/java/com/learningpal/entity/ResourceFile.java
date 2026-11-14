package com.learningpal.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Metadata and extracted text for file resources (PDF and DOCX).
 * Stored files live outside the web root under random UUID storage keys.
 * Extracted text is private to the owning teacher and the backend.
 */
@Entity
@Table(name = "resource_files", indexes = {
        @Index(name = "idx_resource_files_storage_key", columnList = "storage_key", unique = true),
        @Index(name = "idx_resource_files_sha256", columnList = "sha256")
})
public class ResourceFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false, unique = true)
    private Resource resource;

    @Column(name = "storage_key", nullable = false, length = 64, unique = true)
    private String storageKey;

    @Column(name = "file_name", nullable = false, length = 120)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "sha256", nullable = false, length = 64)
    private String sha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "extraction_status", nullable = false, length = 20)
    private ExtractionStatus extractionStatus;

    @Lob
    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "extracted_char_count", nullable = false)
    private int extractedCharCount;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "extraction_note", length = 500)
    private String extractionNote;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    public ResourceFile() {
    }

    public ResourceFile(
            Resource resource,
            String storageKey,
            String fileName,
            String contentType,
            long sizeBytes,
            String sha256,
            ExtractionStatus extractionStatus,
            String extractedText,
            int extractedCharCount,
            Integer pageCount,
            String extractionNote) {
        this.resource = resource;
        this.storageKey = storageKey;
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.sha256 = sha256;
        this.extractionStatus = extractionStatus != null ? extractionStatus : ExtractionStatus.READY;
        this.extractedText = extractedText;
        this.extractedCharCount = extractedCharCount;
        this.pageCount = pageCount;
        this.extractionNote = extractionNote;
        this.uploadedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getSha256() {
        return sha256;
    }

    public void setSha256(String sha256) {
        this.sha256 = sha256;
    }

    public ExtractionStatus getExtractionStatus() {
        return extractionStatus;
    }

    public void setExtractionStatus(ExtractionStatus extractionStatus) {
        this.extractionStatus = extractionStatus;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public int getExtractedCharCount() {
        return extractedCharCount;
    }

    public void setExtractedCharCount(int extractedCharCount) {
        this.extractedCharCount = extractedCharCount;
    }

    public Integer getPageCount() {
        return pageCount;
    }

    public void setPageCount(Integer pageCount) {
        this.pageCount = pageCount;
    }

    public String getExtractionNote() {
        return extractionNote;
    }

    public void setExtractionNote(String extractionNote) {
        this.extractionNote = extractionNote;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}

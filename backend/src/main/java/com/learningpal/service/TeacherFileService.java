package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ConflictException;
import com.learningpal.exception.PayloadTooLargeException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.util.*;

/**
 * Service orchestrating teacher file resource upload, storage, extraction,
 * lifecycle management, and secure downloads.
 */
@Service
public class TeacherFileService {

    private static final Logger log = LoggerFactory.getLogger(TeacherFileService.class);

    private final ResourceRepository resourceRepository;
    private final ResourceFileRepository resourceFileRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final TenantAccess tenantAccess;
    private final DocumentExtractionService extractionService;
    private final TeacherUploadRateLimiter rateLimiter;
    private final QuestionRepository questionRepository;
    private final AiGenerationJobRepository aiGenerationJobRepository;
    private final AiQuestionDraftRepository aiQuestionDraftRepository;

    private final Path storageDirectory;
    private final long maxFileSizeBytes;
    private final long teacherStorageQuotaBytes;
    private final int maxActiveFilesPerSubject;

    public TeacherFileService(
            ResourceRepository resourceRepository,
            ResourceFileRepository resourceFileRepository,
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            UserRepository userRepository,
            TenantAccess tenantAccess,
            DocumentExtractionService extractionService,
            TeacherUploadRateLimiter rateLimiter,
            QuestionRepository questionRepository,
            AiGenerationJobRepository aiGenerationJobRepository,
            AiQuestionDraftRepository aiQuestionDraftRepository,
            @Value("${app.files.storage-dir:./storage/resources}") String storageDirStr,
            @Value("${app.files.max-file-size:10485760}") long maxFileSizeBytes,
            @Value("${app.files.teacher-storage-quota-bytes:209715200}") long teacherStorageQuotaBytes,
            @Value("${app.files.max-active-files-per-subject:25}") int maxActiveFilesPerSubject) {
        this.resourceRepository = resourceRepository;
        this.resourceFileRepository = resourceFileRepository;
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
        this.tenantAccess = tenantAccess;
        this.extractionService = extractionService;
        this.rateLimiter = rateLimiter;
        this.questionRepository = questionRepository;
        this.aiGenerationJobRepository = aiGenerationJobRepository;
        this.aiQuestionDraftRepository = aiQuestionDraftRepository;
        this.storageDirectory = Paths.get(storageDirStr).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.teacherStorageQuotaBytes = teacherStorageQuotaBytes;
        this.maxActiveFilesPerSubject = maxActiveFilesPerSubject;
    }

    @PostConstruct
    public void init() {
        validateStorageDirectorySafety();
        try {
            Files.createDirectories(storageDirectory);
            log.info("Initialized file resource storage directory: {}", storageDirectory);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create file storage directory: " + storageDirectory, e);
        }
    }

    private void validateStorageDirectorySafety() {
        String normalized = storageDirectory.toString().replace('\\', '/').toLowerCase();
        if (normalized.contains("/src/main/resources") ||
                normalized.contains("/src/main/webapp") ||
                normalized.contains("/target/classes") ||
                normalized.contains("/static") ||
                normalized.contains("/public")) {
            throw new IllegalStateException("Security violation: Storage directory cannot be placed inside classpath or web-accessible assets: " + storageDirectory);
        }
    }

    private User getActiveTeacher(String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        if (teacher.getRole() != Role.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new ResourceNotFoundException("Active teacher account required");
        }
        tenantAccess.requireCallerInstitution(teacher);
        return teacher;
    }

    /**
     * Uploads, validates, extracts text from, and stores a PDF or DOCX file resource.
     * Guaranteed atomic: failure at any step removes temporary disk bytes and leaves no orphan rows.
     */
    @Transactional
    public TeacherFileDto uploadFile(
            String teacherEmail,
            Long subjectId,
            MultipartFile file,
            String title,
            String description,
            Long topicId) {

        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        // 1. Rate limit check (max uploads per hour)
        rateLimiter.recordUploadOrThrow(teacher.getId());

        // 2. Validate input fields
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty.");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new BadRequestException("Title is required.");
        }
        String sanitizedTitle = title.trim();
        if (sanitizedTitle.length() > 120) {
            throw new BadRequestException("Title cannot exceed 120 characters.");
        }
        String sanitizedDesc = description != null ? description.trim() : null;
        if (sanitizedDesc != null && sanitizedDesc.length() > 500) {
            throw new BadRequestException("Description cannot exceed 500 characters.");
        }

        // 3. Topic validation if tagged
        Topic topic = null;
        if (topicId != null) {
            topic = topicRepository.findById(topicId)
                    .orElseThrow(() -> new BadRequestException("Topic not found: " + topicId));
            if (!topic.getSubject().getId().equals(subject.getId())) {
                throw new BadRequestException("Topic does not belong to the selected subject.");
            }
        }

        // 4. File size check (10 MB limit)
        long fileSize = file.getSize();
        if (fileSize > maxFileSizeBytes) {
            throw new PayloadTooLargeException("File exceeds maximum allowed size limit of " + (maxFileSizeBytes / (1024 * 1024)) + " MB.");
        }

        // 5. Subject active file limit check (max 25 active files)
        long activeFilesInSubject = resourceRepository.countBySubjectAndTypeAndStatus(subject, ResourceType.FILE, ResourceStatus.ACTIVE);
        if (activeFilesInSubject >= maxActiveFilesPerSubject) {
            throw new BadRequestException("Subject has reached the maximum limit of " + maxActiveFilesPerSubject + " active files.");
        }

        // 6. Teacher total storage quota check (max 200 MB)
        long currentStorageBytes = resourceFileRepository.sumActiveBytesByTeacherId(teacher.getId(), ResourceStatus.ACTIVE);
        if (currentStorageBytes + fileSize > teacherStorageQuotaBytes) {
            throw new BadRequestException("Teacher storage quota exceeded (" + (teacherStorageQuotaBytes / (1024 * 1024)) + " MB limit).");
        }

        String rawOriginalFilename = file.getOriginalFilename();
        String sanitizedDisplayFilename = sanitizeFilename(rawOriginalFilename);

        // 7. Stream upload to a temporary file while computing SHA-256
        String tempStorageName = "temp-" + UUID.randomUUID() + ".tmp";
        Path tempFilePath = storageDirectory.resolve(tempStorageName).normalize();
        verifyStorageContainment(tempFilePath);

        String sha256Hex;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = file.getInputStream();
                 DigestInputStream dis = new DigestInputStream(is, digest);
                 OutputStream os = Files.newOutputStream(tempFilePath, StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
                dis.transferTo(os);
            }
            byte[] hashBytes = digest.digest();
            sha256Hex = bytesToHex(hashBytes);
        } catch (Exception e) {
            deleteFileQuietly(tempFilePath);
            throw new BadRequestException("Failed to receive and store uploaded file.");
        }

        // 8. Duplicate SHA-256 detection within same subject
        boolean isDuplicate = resourceFileRepository.existsBySubjectIdAndSha256AndStatus(subject.getId(), sha256Hex, ResourceStatus.ACTIVE);
        if (isDuplicate) {
            deleteFileQuietly(tempFilePath);
            throw new ConflictException("A file with identical content has already been uploaded to this subject.");
        }

        // 9. Inspect and validate document structure
        DocumentExtractionService.DocumentInspection inspection;
        try {
            inspection = extractionService.inspectAndValidate(tempFilePath.toFile(), sanitizedDisplayFilename);
        } catch (Exception e) {
            deleteFileQuietly(tempFilePath);
            throw e;
        }

        // 10. Hardened text extraction with timeout
        DocumentExtractionService.ExtractionResult extractionResult = extractionService.extractTextSafely(
                tempFilePath.toFile(),
                inspection.detectedContentType(),
                inspection.pageCount()
        );

        // 11. Move temporary file to final UUID storage key
        boolean isPdf = DocumentExtractionService.MIME_PDF.equals(inspection.detectedContentType());
        String finalStorageKey = UUID.randomUUID().toString() + (isPdf ? ".pdf" : ".docx");
        Path finalFilePath = storageDirectory.resolve(finalStorageKey).normalize();
        verifyStorageContainment(finalFilePath);

        try {
            Files.move(tempFilePath, finalFilePath, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException moveEx) {
            try {
                Files.move(tempFilePath, finalFilePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException fallbackEx) {
                deleteFileQuietly(tempFilePath);
                throw new BadRequestException("Failed to persist file in storage.");
            }
        }

        // 12. Persist Resource and ResourceFile entities
        try {
            Resource resource = new Resource(
                    subject,
                    topic,
                    sanitizedTitle,
                    sanitizedDesc,
                    ResourceType.FILE,
                    null,
                    null,
                    DifficultyLevel.EASY,
                    teacher
            );
            resource.setStatus(ResourceStatus.ACTIVE);
            Resource savedResource = resourceRepository.save(resource);

            ResourceFile resourceFile = new ResourceFile(
                    savedResource,
                    finalStorageKey,
                    sanitizedDisplayFilename,
                    inspection.detectedContentType(),
                    fileSize,
                    sha256Hex,
                    extractionResult.status(),
                    extractionResult.extractedText(),
                    extractionResult.extractedCharCount(),
                    extractionResult.pageCount(),
                    extractionResult.note()
            );
            ResourceFile savedFile = resourceFileRepository.save(resourceFile);

            return TeacherFileDto.fromEntity(savedFile);
        } catch (Exception e) {
            // Rollback disk file on database failure
            deleteFileQuietly(finalFilePath);
            throw e;
        }
    }

    /**
     * Lists all file resources for a teacher's subject.
     */
    @Transactional(readOnly = true)
    public List<TeacherFileDto> getSubjectFiles(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        return resourceFileRepository.findBySubjectId(subject.getId()).stream()
                .map(TeacherFileDto::fromEntity)
                .toList();
    }

    /**
     * Updates file resource title, description, and optional topic tag.
     */
    @Transactional
    public TeacherFileDto updateFile(String teacherEmail, Long fileId, UpdateFileRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        ResourceFile resourceFile = requireOwnedResourceFile(teacher, fileId);
        Resource resource = resourceFile.getResource();

        if (request.title() != null && !request.title().trim().isEmpty()) {
            String title = request.title().trim();
            if (title.length() > 120) {
                throw new BadRequestException("Title cannot exceed 120 characters.");
            }
            resource.setTitle(title);
        }

        if (request.description() != null) {
            String desc = request.description().trim();
            if (desc.length() > 500) {
                throw new BadRequestException("Description cannot exceed 500 characters.");
            }
            resource.setDescription(desc.isEmpty() ? null : desc);
        }

        if (request.topicId() != null) {
            Topic topic = topicRepository.findById(request.topicId())
                    .orElseThrow(() -> new BadRequestException("Topic not found: " + request.topicId()));
            if (!topic.getSubject().getId().equals(resource.getSubject().getId())) {
                throw new BadRequestException("Topic does not belong to this subject.");
            }
            resource.setTopic(topic);
        } else {
            resource.setTopic(null);
        }

        resourceRepository.save(resource);
        return TeacherFileDto.fromEntity(resourceFile);
    }

    /**
     * Archives a file resource.
     */
    @Transactional
    public TeacherFileDto archiveFile(String teacherEmail, Long fileId) {
        User teacher = getActiveTeacher(teacherEmail);
        ResourceFile resourceFile = requireOwnedResourceFile(teacher, fileId);
        resourceFile.getResource().setStatus(ResourceStatus.ARCHIVED);
        resourceRepository.save(resourceFile.getResource());
        return TeacherFileDto.fromEntity(resourceFile);
    }

    /**
     * Unarchives a file resource.
     */
    @Transactional
    public TeacherFileDto unarchiveFile(String teacherEmail, Long fileId) {
        User teacher = getActiveTeacher(teacherEmail);
        ResourceFile resourceFile = requireOwnedResourceFile(teacher, fileId);
        resourceFile.getResource().setStatus(ResourceStatus.ACTIVE);
        resourceRepository.save(resourceFile.getResource());
        return TeacherFileDto.fromEntity(resourceFile);
    }

    /**
     * Deletes a file resource from the database and removes stored bytes from disk.
     */
    @Transactional
    public void deleteFile(String teacherEmail, Long fileId) {
        User teacher = getActiveTeacher(teacherEmail);
        ResourceFile resourceFile = requireOwnedResourceFile(teacher, fileId);
        Resource resource = resourceFile.getResource();

        // 1. Block delete if referenced by any approved AI question
        if (questionRepository.existsBySourceFile(resourceFile)) {
            throw new ConflictException("Cannot delete file because approved AI questions depend on it. You may archive the file instead.");
        }

        // 2. Cleanly cascade delete any unapproved generation jobs and drafts for this source file
        List<AiGenerationJob> fileJobs = aiGenerationJobRepository.findBySourceFileOrderByCreatedAtDesc(resourceFile);
        if (!fileJobs.isEmpty()) {
            aiQuestionDraftRepository.deleteByJobIn(fileJobs);
            aiGenerationJobRepository.deleteBySourceFile(resourceFile);
        }

        Path storedFilePath = storageDirectory.resolve(resourceFile.getStorageKey()).normalize();
        verifyStorageContainment(storedFilePath);

        resourceFileRepository.delete(resourceFile);
        resourceRepository.delete(resource);

        deleteFileQuietly(storedFilePath);
    }

    /**
     * Retrieves the first 3,000 characters of extracted text as a preview for the owning teacher.
     */
    @Transactional(readOnly = true)
    public FileTextPreviewDto getTextPreview(String teacherEmail, Long fileId) {
        User teacher = getActiveTeacher(teacherEmail);
        ResourceFile resourceFile = requireOwnedResourceFile(teacher, fileId);

        String fullText = resourceFile.getExtractedText() != null ? resourceFile.getExtractedText() : "";
        String preview = fullText.length() > 3000 ? fullText.substring(0, 3000) : fullText;

        return new FileTextPreviewDto(
                resourceFile.getId(),
                resourceFile.getFileName(),
                resourceFile.getExtractionStatus(),
                resourceFile.getExtractedCharCount(),
                preview,
                resourceFile.getExtractionNote()
        );
    }

    /**
     * Downloads the original file for the owning teacher.
     */
    @Transactional(readOnly = true)
    public ResponseEntity<InputStreamResource> downloadFileForTeacher(String teacherEmail, Long fileId) {
        User teacher = getActiveTeacher(teacherEmail);
        ResourceFile resourceFile = requireOwnedResourceFile(teacher, fileId);

        return serveFileDownload(resourceFile);
    }

    /**
     * Helper to verify ownership and fetch ResourceFile.
     */
    public ResourceFile requireOwnedResourceFile(User teacher, Long fileId) {
        if (fileId == null) {
            throw new ResourceNotFoundException("File not found");
        }
        ResourceFile rf = resourceFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        Resource resource = rf.getResource();
        tenantAccess.requireOwnedSubject(teacher, resource.getSubject().getId(), subjectRepository);
        return rf;
    }

    /**
     * Serves file download with hardened security headers:
     * - Content-Disposition: attachment with sanitized filename
     * - Fixed Content-Type from whitelist
     * - X-Content-Type-Options: nosniff
     * - Cache-Control: no-store
     */
    public ResponseEntity<InputStreamResource> serveFileDownload(ResourceFile resourceFile) {
        Path filePath = storageDirectory.resolve(resourceFile.getStorageKey()).normalize();
        verifyStorageContainment(filePath);

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            log.error("Storage inconsistency: File row exists (id={}) but physical file missing at {}", resourceFile.getId(), filePath);
            throw new ResourceNotFoundException("Stored file not found on disk");
        }

        try {
            InputStream is = Files.newInputStream(filePath);
            ContentDisposition disposition = ContentDisposition.attachment()
                    .filename(resourceFile.getFileName(), StandardCharsets.UTF_8)
                    .build();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(resourceFile.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                    .header("X-Content-Type-Options", "nosniff")
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate")
                    .contentLength(resourceFile.getSizeBytes())
                    .body(new InputStreamResource(is));
        } catch (IOException e) {
            log.error("Failed to read stored file stream: {}", e.getMessage());
            throw new ResourceNotFoundException("Unable to read file");
        }
    }

    private void verifyStorageContainment(Path targetPath) {
        if (!targetPath.startsWith(storageDirectory)) {
            throw new SecurityException("Path traversal attempt detected: " + targetPath);
        }
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "unnamed_document";
        }
        // Extract plain filename without paths
        String name = Paths.get(filename).getFileName().toString();
        // Remove control characters, nulls, and dangerous path characters
        name = name.replaceAll("[\\p{Cntrl}\\\\/:*?\"<>|]", "_").trim();
        if (name.length() > 120) {
            int extIdx = name.lastIndexOf('.');
            String ext = (extIdx >= 0 && extIdx < name.length()) ? name.substring(extIdx) : "";
            int maxBase = Math.max(1, 120 - ext.length());
            name = name.substring(0, maxBase) + ext;
        }
        return name.isEmpty() ? "unnamed_document" : name;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public Path getStorageDirectory() {
        return storageDirectory;
    }

    private void deleteFileQuietly(Path path) {
        if (path != null) {
            try {
                Files.deleteIfExists(path);
            } catch (Exception ignored) {
            }
        }
    }
}

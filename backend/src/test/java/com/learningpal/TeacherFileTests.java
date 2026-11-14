package com.learningpal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpal.config.JwtService;
import com.learningpal.dto.FileTextPreviewDto;
import com.learningpal.dto.TeacherFileDto;
import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.DocumentExtractionService;
import com.learningpal.service.TeacherFileService;
import com.learningpal.service.TeacherUploadRateLimiter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Teacher File Resources & Document Extraction Integration Tests")
public class TeacherFileTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceFileRepository resourceFileRepository;

    @Autowired
    private TeacherUploadRateLimiter teacherUploadRateLimiter;

    @Autowired
    private TeacherFileService teacherFileService;

    @Autowired
    private DocumentExtractionService documentExtractionService;

    @Value("${app.files.storage-dir:./storage/documents}")
    private String configuredStorageDir;

    private Institution instA;
    private Institution instB;

    private User teacherA1;
    private User teacherA2;
    private User adminA;
    private User studentA1;
    private User studentA2;
    private User studentB1;

    private Subject subjectA1;
    private Topic topicA1;
    private ClassEntity classA1;
    private ClassEntity archivedClassA1;

    private String tokenTeacherA1;
    private String tokenTeacherA2;
    private String tokenAdminA;
    private String tokenStudentA1;
    private String tokenStudentA2;
    private String tokenStudentB1;

    @BeforeEach
    void setUp() {
        String suffix = String.valueOf(System.nanoTime());

        // 1. Institutions
        instA = institutionRepository.save(new Institution("Northwest High School " + suffix, "NW_" + suffix, InstitutionStatus.ACTIVE));
        instB = institutionRepository.save(new Institution("Southwest Academy " + suffix, "SW_" + suffix, InstitutionStatus.ACTIVE));

        // 2. Users
        teacherA1 = userRepository.save(new User("Alice Teacher " + suffix, "alice_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, instA));
        teacherA2 = userRepository.save(new User("Bob Teacher " + suffix, "bob_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.TEACHER, UserStatus.ACTIVE, instA));
        adminA = userRepository.save(new User("Carol Admin " + suffix, "admin_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.ADMIN, UserStatus.ACTIVE, instA));

        studentA1 = userRepository.save(new User("Sam Student " + suffix, "sam_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.STUDENT, UserStatus.ACTIVE, instA));
        studentA2 = userRepository.save(new User("Sara Student " + suffix, "sara_" + suffix + "@northwest.edu", passwordEncoder.encode("Pass123!"), Role.STUDENT, UserStatus.ACTIVE, instA));
        studentB1 = userRepository.save(new User("Ben Foreign " + suffix, "ben_" + suffix + "@southwest.edu", passwordEncoder.encode("Pass123!"), Role.STUDENT, UserStatus.ACTIVE, instB));

        // 3. Tokens
        tokenTeacherA1 = jwtService.generateToken(teacherA1);
        tokenTeacherA2 = jwtService.generateToken(teacherA2);
        tokenAdminA = jwtService.generateToken(adminA);
        tokenStudentA1 = jwtService.generateToken(studentA1);
        tokenStudentA2 = jwtService.generateToken(studentA2);
        tokenStudentB1 = jwtService.generateToken(studentB1);

        // 4. Subject & Topic
        subjectA1 = subjectRepository.save(new Subject("CS201_" + suffix, "Advanced Computer Science " + suffix, "Algorithms and Data Structures", teacherA1));
        topicA1 = topicRepository.save(new Topic(subjectA1, "Recursion and Dynamic Programming", "Divide and conquer algorithms", 1));

        // 5. Active Class with Student A1 enrolled
        classA1 = new ClassEntity(instA, subjectA1, teacherA1, "CS201 - Section A", "SCA" + (suffix.length() > 3 ? suffix.substring(suffix.length() - 3) : "1"));
        classA1.setStatus(ClassStatus.ACTIVE);
        classA1 = classEntityRepository.save(classA1);
        enrollmentRepository.save(new Enrollment(studentA1, classA1));

        // 6. Archived Class with Student A1 enrolled
        archivedClassA1 = new ClassEntity(instA, subjectA1, teacherA1, "CS201 - Fall 2025", "SCF" + (suffix.length() > 3 ? suffix.substring(suffix.length() - 3) : "2"));
        archivedClassA1.setStatus(ClassStatus.ARCHIVED);
        archivedClassA1 = classEntityRepository.save(archivedClassA1);
        enrollmentRepository.save(new Enrollment(studentA1, archivedClassA1));
    }

    // =========================================================================
    // 1. Whitelist & Upload Validation Tests
    // =========================================================================

    @Test
    @DisplayName("Upload valid PDF: successfully stored and extracted")
    void testUploadValidPdf() throws Exception {
        byte[] pdfBytes = createPdfWithText("Binary trees and graph traversals for computer science students.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "trees.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Binary Trees Guide")
                        .param("description", "Comprehensive notes on tree traversals")
                        .param("topicId", String.valueOf(topicA1.getId()))
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Binary Trees Guide"))
                .andExpect(jsonPath("$.fileName").value("trees.pdf"))
                .andExpect(jsonPath("$.contentType").value(DocumentExtractionService.MIME_PDF))
                .andExpect(jsonPath("$.sizeBytes").value(pdfBytes.length))
                .andExpect(jsonPath("$.extractionStatus").value("READY"))
                .andExpect(jsonPath("$.extractedCharCount", greaterThan(0)))
                .andExpect(jsonPath("$.pageCount").value(1));
    }

    @Test
    @DisplayName("Upload valid DOCX: successfully stored and extracted")
    void testUploadValidDocx() throws Exception {
        byte[] docxBytes = createDocxWithText("Dynamic programming recurrence relations and memoization tables.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "dp_memo.docx",
                DocumentExtractionService.MIME_DOCX,
                docxBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Dynamic Programming Notes")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("dp_memo.docx"))
                .andExpect(jsonPath("$.contentType").value(DocumentExtractionService.MIME_DOCX))
                .andExpect(jsonPath("$.extractionStatus").value("READY"))
                .andExpect(jsonPath("$.extractedCharCount", greaterThan(0)));
    }

    @Test
    @DisplayName("Reject renamed executable (malware.pdf with MZ bytes)")
    void testRejectRenamedExecutable() throws Exception {
        byte[] exeBytes = "MZ\u0090\u0000\u0003\u0000\u0000\u0000This program cannot be run in DOS mode.".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.pdf",
                DocumentExtractionService.MIME_PDF,
                exeBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Fake Notes")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Unsupported file type")));
    }

    @Test
    @DisplayName("Reject legacy .doc file format")
    void testRejectLegacyDoc() throws Exception {
        // Legacy OLE2 CFBF magic bytes: D0 CF 11 E0 A1 B1 1A E1
        byte[] ole2Bytes = new byte[]{(byte) 0xD0, (byte) 0xCF, (byte) 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1, 0, 0, 0, 0};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "old_assignment.doc",
                "application/msword",
                ole2Bytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Legacy Doc")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Only modern Word documents")));
    }

    @Test
    @DisplayName("Reject DOCX containing macro (vbaProject.bin)")
    void testRejectDocxWithMacro() throws Exception {
        byte[] docmBytes = createZipWithEntry("word/vbaProject.bin", "fake vba macro bytes".getBytes());
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "macro_notes.docx",
                DocumentExtractionService.MIME_DOCX,
                docmBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Macro Notes")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Macro-enabled documents")));
    }

    @Test
    @DisplayName("Reject DOCX with duplicate zip entry names (CVE-2025-31672 defense)")
    void testRejectDocxWithDuplicateZipEntries() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("[Content_Types].xml"));
            zos.write("<Types></Types>".getBytes());
            zos.closeEntry();

            zos.putNextEntry(new ZipEntry("word/document.xml"));
            zos.write("<document>Body 1</document>".getBytes());
            zos.closeEntry();

            // Case-insensitive duplicate entry normalized to same name
            zos.putNextEntry(new ZipEntry("word/DOCUMENT.XML"));
            zos.write("<document>Body 2</document>".getBytes());
            zos.closeEntry();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "duplicate_entries.docx",
                DocumentExtractionService.MIME_DOCX,
                baos.toByteArray()
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Duplicate Entry Docx")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("duplicate archive entries")));
    }

    @Test
    @DisplayName("Reject encrypted / password-protected PDF")
    void testRejectEncryptedPdf() throws Exception {
        byte[] encryptedPdf = createEncryptedPdf();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "encrypted.pdf",
                DocumentExtractionService.MIME_PDF,
                encryptedPdf
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Encrypted PDF")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Encrypted or password-protected PDF files are not supported")));
    }

    @Test
    @DisplayName("Reject empty 0-byte file upload")
    void testRejectEmptyFile() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                DocumentExtractionService.MIME_PDF,
                new byte[0]
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(emptyFile)
                        .param("title", "Empty File")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Uploaded file is empty")));
    }

    @Test
    @DisplayName("Reject mismatched file extension (PDF content renamed to .docx)")
    void testRejectMismatchedExtension() throws Exception {
        byte[] pdfBytes = createPdfWithText("Some valid PDF content.");
        MockMultipartFile mismatchedFile = new MockMultipartFile(
                "file",
                "sneaky.docx",
                DocumentExtractionService.MIME_DOCX,
                pdfBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(mismatchedFile)
                        .param("title", "Mismatched File")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("File extension does not match")));
    }

    @Test
    @DisplayName("Reject real DOCX renamed to .pdf with application/pdf Content-Type")
    void testRejectDocxRenamedToPdfWithPdfContentType() throws Exception {
        byte[] docxBytes = createDocxWithText("Legitimate DOCX content disguised as PDF.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "disguised.pdf",
                DocumentExtractionService.MIME_PDF,
                docxBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Disguised PDF")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("File extension does not match detected DOCX content")));
    }

    // =========================================================================
    // 2. Storage Directory & Path Safety Tests
    // =========================================================================

    @Test
    @DisplayName("Path traversal in filename is sanitized and stored under UUID")
    void testPathSafetyAndStorageDir() throws Exception {
        byte[] pdfBytes = createPdfWithText("Path traversal test content.");
        MockMultipartFile traversalFile = new MockMultipartFile(
                "file",
                "../../../../etc/passwd.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        String responseJson = mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(traversalFile)
                        .param("title", "Traversal Attempt")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("passwd.pdf"))
                .andReturn().getResponse().getContentAsString();

        TeacherFileDto dto = objectMapper.readValue(responseJson, TeacherFileDto.class);
        ResourceFile rf = resourceFileRepository.findById(dto.id()).orElseThrow();

        // Must be stored under UUID without path traversal characters
        assertTrue(rf.getStorageKey().endsWith(".pdf"));
        assertFalse(rf.getStorageKey().contains(".."));
        assertFalse(rf.getStorageKey().contains("/"));
        assertFalse(rf.getStorageKey().contains("\\"));
        assertEquals("passwd.pdf", rf.getFileName());

        // Storage path must reside strictly within configured storage directory
        Path storageDir = teacherFileService.getStorageDirectory();
        Path actualFile = storageDir.resolve(rf.getStorageKey()).normalize();
        assertTrue(actualFile.startsWith(storageDir));
        assertTrue(Files.exists(actualFile));

        // Storage directory cannot be inside web static or classes root
        String storagePathStr = storageDir.toString().replace('\\', '/').toLowerCase();
        assertFalse(storagePathStr.contains("/target/classes/static"));
        assertFalse(storagePathStr.contains("/src/main/resources/static"));
    }

    // =========================================================================
    // 3. Text Extraction Statuses & Preview Tests
    // =========================================================================

    @Test
    @DisplayName("Blank PDF extraction status evaluates to EMPTY with helpful note")
    void testBlankPdfExtractionStatusEmpty() throws Exception {
        byte[] blankPdf = createBlankPdf();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "blank.pdf",
                DocumentExtractionService.MIME_PDF,
                blankPdf
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Scanned or Blank Document")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.extractionStatus").value("EMPTY"))
                .andExpect(jsonPath("$.extractedCharCount").value(0))
                .andExpect(jsonPath("$.extractionNote", containsString("No readable text found")));
    }

    @Test
    @DisplayName("Extraction timeout returns FAILED status and clear note, not silent empty string")
    void testExtractionTimeoutReturnsClearStatus() throws Exception {
        byte[] pdfBytes = createPdfWithText("Text to simulate extraction timeout.");
        Path tempFile = Files.createTempFile("timeout_test", ".pdf");
        try {
            Files.write(tempFile, pdfBytes);
            DocumentExtractionService.ExtractionResult result =
                    documentExtractionService.extractTextSafely(tempFile.toFile(), DocumentExtractionService.MIME_PDF, 1, 0L);

            assertEquals(ExtractionStatus.FAILED, result.status());
            assertEquals("", result.extractedText());
            assertEquals(0, result.extractedCharCount());
            assertNotNull(result.note());
            assertTrue(result.note().contains("timed out"), "Expected timeout note but was: " + result.note());
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    @DisplayName("Teacher can preview extracted text; students cannot view text preview")
    void testExtractedTextPreviewPermissions() throws Exception {
        byte[] pdfBytes = createPdfWithText("Line 1: Hello World.\nLine 2: Teacher preview test.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "preview_doc.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        String res = mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Preview Test")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        TeacherFileDto dto = objectMapper.readValue(res, TeacherFileDto.class);

        // 1. Owning teacher can view preview
        mockMvc.perform(get("/api/teacher/files/" + dto.id() + "/text-preview")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dto.id()))
                .andExpect(jsonPath("$.previewText", containsString("Teacher preview test")))
                .andExpect(jsonPath("$.totalCharCount", greaterThan(0)));

        // 2. Other teacher cannot view preview (404)
        mockMvc.perform(get("/api/teacher/files/" + dto.id() + "/text-preview")
                        .header("Authorization", "Bearer " + tokenTeacherA2))
                .andExpect(status().isNotFound());

        // 3. Student token receives 404 from teacher preview endpoint (zero information leakage)
        mockMvc.perform(get("/api/teacher/files/" + dto.id() + "/text-preview")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 4. Download Access & Multi-Tenant Isolation Matrix
    // =========================================================================

    @Test
    @DisplayName("Download matrix & hardened download headers verified")
    void testDownloadAccessMatrixAndHeaders() throws Exception {
        byte[] pdfBytes = createPdfWithText("Secured lecture notes for enrolled class.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lecture_notes.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        String res = mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Lecture Notes")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        TeacherFileDto dto = objectMapper.readValue(res, TeacherFileDto.class);
        Long fileId = dto.id();

        // 1. Teacher owner download -> 200 with hardened headers
        mockMvc.perform(get("/api/teacher/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString("lecture_notes.pdf")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(content().contentType(DocumentExtractionService.MIME_PDF))
                .andExpect(content().bytes(pdfBytes));

        // 2. Enrolled student download via class workspace -> 200 with hardened headers
        mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString("lecture_notes.pdf")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(content().contentType(DocumentExtractionService.MIME_PDF))
                .andExpect(content().bytes(pdfBytes));

        // 3. Enrolled student in ARCHIVED class download -> 404 (archived class downloads blocked)
        mockMvc.perform(get("/api/student/classes/" + archivedClassA1.getId() + "/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 4. Unenrolled student (Student A2) download -> 404
        mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA2))
                .andExpect(status().isNotFound());

        // 5. Cross-institution student (Student B1) download -> 404
        mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenStudentB1))
                .andExpect(status().isNotFound());

        // 6. Other teacher cannot download via teacher endpoint -> 404
        mockMvc.perform(get("/api/teacher/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenTeacherA2))
                .andExpect(status().isNotFound());

        // 7. Student role calling teacher download endpoint -> 404
        mockMvc.perform(get("/api/teacher/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // 8. Teacher role calling student download endpoint -> 404
        mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/files/" + fileId + "/download")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 5. Business Rules: Duplicates, Quotas, Rate Limiting, & Lifecycle
    // =========================================================================

    @Test
    @DisplayName("Duplicate SHA-256 within the same subject returns 409 Conflict")
    void testDuplicateSha256InSameSubject() throws Exception {
        byte[] pdfBytes = createPdfWithText("Unique content for SHA-256 collision test.");
        MockMultipartFile file1 = new MockMultipartFile(
                "file",
                "original.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file1)
                        .param("title", "First Upload")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated());

        MockMultipartFile file2 = new MockMultipartFile(
                "file",
                "copy_renamed.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file2)
                        .param("title", "Second Upload")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("A file with identical content has already been uploaded to this subject")));
    }

    @Test
    @DisplayName("Rate limiter enforces 20 uploads per hour per teacher")
    void testRateLimiterPerTeacher() {
        Long testTeacherId = 99999L;
        for (int i = 0; i < 20; i++) {
            assertDoesNotThrow(() -> teacherUploadRateLimiter.recordUploadOrThrow(testTeacherId), "Upload " + (i + 1) + " should be allowed");
        }
        assertThrows(com.learningpal.exception.RateLimitException.class,
                () -> teacherUploadRateLimiter.recordUploadOrThrow(testTeacherId),
                "Upload 21 within hour must throw RateLimitException");
    }

    @Test
    @DisplayName("Archiving file hides it from student downloads; unarchiving restores it")
    void testArchivingHidesFileFromStudents() throws Exception {
        byte[] pdfBytes = createPdfWithText("Content to test archival visibility.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "syllabus.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        String res = mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Syllabus")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        TeacherFileDto dto = objectMapper.readValue(res, TeacherFileDto.class);

        // Archive file
        mockMvc.perform(put("/api/teacher/files/" + dto.id() + "/archive")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        // Student attempt to download archived file -> 404
        mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/files/" + dto.id() + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isNotFound());

        // Unarchive file
        mockMvc.perform(put("/api/teacher/files/" + dto.id() + "/unarchive")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Student download works again -> 200
        mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/files/" + dto.id() + "/download")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Deleting file removes database row and disk file atomically")
    void testAtomicDeleteRemovesRowAndDiskBytes() throws Exception {
        byte[] pdfBytes = createPdfWithText("File to be deleted permanently.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "delete_me.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        String res = mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Temporary File")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        TeacherFileDto dto = objectMapper.readValue(res, TeacherFileDto.class);
        ResourceFile rf = resourceFileRepository.findById(dto.id()).orElseThrow();
        Path storageDir = teacherFileService.getStorageDirectory();
        Path diskPath = storageDir.resolve(rf.getStorageKey()).normalize();
        assertTrue(Files.exists(diskPath));

        // Delete file
        mockMvc.perform(delete("/api/teacher/files/" + dto.id())
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isNoContent());

        // Verify DB row deleted
        assertFalse(resourceFileRepository.existsById(dto.id()));
        assertFalse(resourceRepository.existsById(dto.resourceId()));

        // Verify disk file deleted
        assertFalse(Files.exists(diskPath), "Disk file must be deleted upon file removal");
    }

    @Test
    @DisplayName("Extracted text is never exposed in student study materials endpoint")
    void testExtractedTextNeverExposedInStudentMaterials() throws Exception {
        byte[] pdfBytes = createPdfWithText("Secret internal text that should only be visible to teacher AI generation.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "secret_notes.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Secret Notes")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated());

        String studentMaterialsJson = mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/materials")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Extracted text cannot appear in student response
        assertFalse(studentMaterialsJson.contains("Secret internal text"));
        assertFalse(studentMaterialsJson.contains("extractedText"));
    }

    @Test
    @DisplayName("Student responses never contain extractedText, joinCode, or intervention data")
    void testStudentResponsesNeverContainExtractedTextJoinCodesOrInterventions() throws Exception {
        byte[] pdfBytes = createPdfWithText("Teacher proprietary curriculum text never revealed to students.");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "proprietary_guide.pdf",
                DocumentExtractionService.MIME_PDF,
                pdfBytes
        );

        String teacherUploadResponse = mockMvc.perform(multipart("/api/teacher/subjects/" + subjectA1.getId() + "/files")
                        .file(file)
                        .param("title", "Proprietary Guide")
                        .header("Authorization", "Bearer " + tokenTeacherA1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // 1. Teacher file metadata response never contains extractedText, joinCode, or intervention
        assertFalse(teacherUploadResponse.contains("extractedText"));
        assertFalse(teacherUploadResponse.contains("joinCode"));
        assertFalse(teacherUploadResponse.contains("intervention"));

        // 2. Student class materials endpoint never contains extractedText, joinCode, or intervention
        String studentMaterialsResponse = mockMvc.perform(get("/api/student/classes/" + classA1.getId() + "/materials")
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertFalse(studentMaterialsResponse.contains("Teacher proprietary curriculum text"));
        assertFalse(studentMaterialsResponse.contains("extractedText"));
        assertFalse(studentMaterialsResponse.contains("joinCode"));
        assertFalse(studentMaterialsResponse.contains("intervention"));

        // 3. Student class workspace detail endpoint never exposes extractedText or interventions
        String studentWorkspaceResponse = mockMvc.perform(get("/api/student/classes/" + classA1.getId())
                        .header("Authorization", "Bearer " + tokenStudentA1))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertFalse(studentWorkspaceResponse.contains("Teacher proprietary curriculum text"));
        assertFalse(studentWorkspaceResponse.contains("extractedText"));
        assertFalse(studentWorkspaceResponse.contains("intervention"));
    }

    // =========================================================================
    // Test Helpers (PDF / DOCX Generation)
    // =========================================================================

    private byte[] createPdfWithText(String text) throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            String[] lines = text.split("\r?\n");
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = 700;
                for (String line : lines) {
                    if (line.isEmpty()) continue;
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    cs.newLineAtOffset(50, y);
                    cs.showText(line);
                    cs.endText();
                    y -= 15;
                }
            }
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createBlankPdf() throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createEncryptedPdf() throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            AccessPermission ap = new AccessPermission();
            StandardProtectionPolicy spp = new StandardProtectionPolicy("ownerpass", "userpass", ap);
            doc.protect(spp);
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createDocxWithText(String text) throws IOException {
        try (XWPFDocument doc = new XWPFDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            XWPFParagraph p = doc.createParagraph();
            XWPFRun r = p.createRun();
            r.setText(text);
            doc.write(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createZipWithEntry(String entryName, byte[] content) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry(entryName);
            zos.putNextEntry(entry);
            zos.write(content);
            zos.closeEntry();
            return baos.toByteArray();
        }
    }
}

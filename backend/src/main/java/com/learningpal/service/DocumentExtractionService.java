package com.learningpal.service;

import com.learningpal.entity.ExtractionStatus;
import com.learningpal.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Validates document structure and performs hardened, timeout-bounded
 * text extraction for PDF and DOCX files.
 */
@Service
public class DocumentExtractionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentExtractionService.class);

    public static final String MIME_PDF = "application/pdf";
    public static final String MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private final int maxPages;
    private final int maxExtractedChars;
    private final ExecutorService extractionExecutor;

    public DocumentExtractionService(
            @Value("${app.files.max-pages:300}") int maxPages,
            @Value("${app.files.max-extracted-chars:500000}") int maxExtractedChars) {
        this.maxPages = maxPages;
        this.maxExtractedChars = maxExtractedChars;
        this.extractionExecutor = Executors.newFixedThreadPool(2, r -> {
            Thread t = new Thread(r, "doc-extractor-pool");
            t.setDaemon(true);
            return t;
        });
    }

    public record DocumentInspection(
            String detectedContentType,
            Integer pageCount,
            String sha256
    ) {}

    public record ExtractionResult(
            ExtractionStatus status,
            String extractedText,
            int extractedCharCount,
            Integer pageCount,
            String note
    ) {}

    /**
     * Inspects magic bytes and internal archive structures to verify authentic PDF or DOCX content.
     * Rejects legacy .doc, macro-enabled .docm, password-protected PDFs, and mismatched extensions.
     */
    public DocumentInspection inspectAndValidate(File file, String originalFilename) {
        if (file == null || file.length() == 0) {
            throw new BadRequestException("Uploaded file is empty.");
        }

        byte[] header = new byte[8];
        try (InputStream is = new FileInputStream(file)) {
            int read = is.read(header);
            if (read < 4) {
                throw new BadRequestException("File is too small to be a valid document.");
            }
        } catch (Exception e) {
            throw new BadRequestException("Unable to inspect uploaded file.");
        }

        String ext = getFileExtension(originalFilename).toLowerCase();

        // 1. Check for legacy OLE2 binary (.doc)
        if (isOle2Header(header)) {
            throw new BadRequestException("Only modern Word documents (.docx) are supported. Legacy .doc or macro-enabled documents are not permitted.");
        }

        // 2. Check for PDF (%PDF-)
        if (isPdfHeader(header)) {
            if (!"pdf".equals(ext)) {
                throw new BadRequestException("File extension does not match detected PDF content.");
            }
            return inspectPdf(file);
        }

        // 3. Check for ZIP / DOCX (PK\x03\x04)
        if (isZipHeader(header)) {
            if (!"docx".equals(ext)) {
                throw new BadRequestException("File extension does not match detected DOCX content.");
            }
            return inspectDocx(file);
        }

        throw new BadRequestException("Unsupported file type. Only PDF and DOCX documents are accepted.");
    }

    private DocumentInspection inspectPdf(File file) {
        try (PDDocument doc = Loader.loadPDF(file)) {
            if (doc.isEncrypted()) {
                throw new BadRequestException("Encrypted or password-protected PDF files are not supported.");
            }
            int pages = doc.getNumberOfPages();
            if (pages > maxPages) {
                throw new BadRequestException("PDF exceeds maximum allowed page count (" + maxPages + " pages).");
            }
            return new DocumentInspection(MIME_PDF, pages, null);
        } catch (BadRequestException bre) {
            throw bre;
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException ipe) {
            throw new BadRequestException("Encrypted or password-protected PDF files are not supported.");
        } catch (Exception e) {
            log.warn("Corrupt or invalid PDF upload attempt: {}", e.getMessage());
            throw new BadRequestException("Invalid or corrupted PDF file.");
        }
    }

    private DocumentInspection inspectDocx(File file) {
        boolean hasContentTypes = false;
        boolean hasDocumentXml = false;
        int entryCount = 0;
        long totalUncompressedBytes = 0;
        final long MAX_UNCOMPRESSED_BYTES = 52_428_800L; // 50 MB zip-bomb ceiling
        final int MAX_ENTRIES = 1000;
        Set<String> seenEntryNames = new HashSet<>();

        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(file))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entryCount > MAX_ENTRIES) {
                    throw new BadRequestException("Document contains too many archive entries (potential zip-bomb).");
                }

                String rawName = entry.getName();
                String normalizedName = normalizeZipEntryName(rawName);

                if (!seenEntryNames.add(normalizedName)) {
                    throw new BadRequestException("Document contains duplicate archive entries: " + rawName);
                }

                if (normalizedName.contains("vbaproject.bin") || normalizedName.startsWith("word/vba")) {
                    throw new BadRequestException("Macro-enabled documents (.docm or files containing VBA macros) are not permitted.");
                }

                if (normalizedName.equals("[content_types].xml")) {
                    hasContentTypes = true;
                }
                if (normalizedName.equals("word/document.xml")) {
                    hasDocumentXml = true;
                }

                long size = entry.getSize();
                if (size > 0) {
                    totalUncompressedBytes += size;
                    if (totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
                        throw new BadRequestException("Document uncompressed size exceeds security threshold.");
                    }
                }
                zis.closeEntry();
            }
        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception e) {
            throw new BadRequestException("Invalid or corrupted DOCX archive structure.");
        }

        if (!hasContentTypes || !hasDocumentXml) {
            throw new BadRequestException("Invalid DOCX structure: missing required document XML parts.");
        }

        return new DocumentInspection(MIME_DOCX, null, null);
    }

    /**
     * Normalizes a ZIP entry path for case-insensitive duplicate entry detection (CVE-2025-31672 mitigation).
     * Normalizes path separators, collapses consecutive slashes, removes leading/trailing slashes, and lowercases.
     */
    public static String normalizeZipEntryName(String name) {
        if (name == null) {
            return "";
        }
        String normalized = name.replace('\\', '/').trim();
        normalized = normalized.replaceAll("/+", "/");
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized.toLowerCase(Locale.ROOT);
    }

    /**
     * Executes text extraction with a hard 10-second timeout inside a bounded executor.
     * Guarantees safe fallback notes and prevents server thread exhaustion.
     */
    public ExtractionResult extractTextSafely(File file, String contentType, Integer precomputedPages) {
        return extractTextSafely(file, contentType, precomputedPages, 10000L);
    }

    /**
     * Executes text extraction with a configurable timeout inside a bounded executor.
     */
    public ExtractionResult extractTextSafely(File file, String contentType, Integer precomputedPages, long timeoutMs) {
        Future<ExtractionResult> future = extractionExecutor.submit(() -> {
            try {
                if (MIME_PDF.equals(contentType)) {
                    return extractPdfText(file, precomputedPages);
                } else if (MIME_DOCX.equals(contentType)) {
                    return extractDocxText(file);
                } else {
                    return new ExtractionResult(ExtractionStatus.FAILED, "", 0, null, "Unsupported content type.");
                }
            } catch (Exception e) {
                log.warn("Text extraction error: {}", e.getMessage());
                return new ExtractionResult(ExtractionStatus.FAILED, "", 0, precomputedPages, "Text extraction failed: Unable to parse document structure.");
            }
        });

        try {
            return future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException te) {
            future.cancel(true);
            log.warn("Text extraction timed out after {} ms.", timeoutMs);
            return new ExtractionResult(ExtractionStatus.FAILED, "", 0, precomputedPages, "Text extraction timed out after " + (timeoutMs / 1000) + " seconds.");
        } catch (Exception e) {
            log.error("Unexpected error waiting for extraction: {}", e.getMessage());
            return new ExtractionResult(ExtractionStatus.FAILED, "", 0, precomputedPages, "Text extraction failed.");
        }
    }

    private ExtractionResult extractPdfText(File file, Integer precomputedPages) {
        try (PDDocument doc = Loader.loadPDF(file)) {
            if (doc.isEncrypted()) {
                return new ExtractionResult(ExtractionStatus.FAILED, "", 0, precomputedPages, "PDF is password-protected or encrypted.");
            }
            int pages = doc.getNumberOfPages();
            if (pages > maxPages) {
                return new ExtractionResult(ExtractionStatus.FAILED, "", 0, pages, "PDF exceeds maximum allowed page count (" + maxPages + " pages).");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String rawText = stripper.getText(doc);

            return processExtractedText(rawText, pages);
        } catch (Exception e) {
            log.warn("PDFBox extraction failure: {}", e.getMessage());
            return new ExtractionResult(ExtractionStatus.FAILED, "", 0, precomputedPages, "Text extraction failed: Unable to parse PDF structure.");
        }
    }

    private ExtractionResult extractDocxText(File file) {
        try (FileInputStream fis = new FileInputStream(file);
             XWPFDocument document = new XWPFDocument(fis);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {

            String rawText = extractor.getText();
            return processExtractedText(rawText, null);
        } catch (Exception e) {
            log.warn("POI extraction failure: {}", e.getMessage());
            return new ExtractionResult(ExtractionStatus.FAILED, "", 0, null, "Text extraction failed: Unable to parse DOCX content.");
        }
    }

    private ExtractionResult processExtractedText(String rawText, Integer pageCount) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return new ExtractionResult(
                    ExtractionStatus.EMPTY,
                    "",
                    0,
                    pageCount,
                    "No readable text found. Scanned or image-only documents are not supported for AI drafting."
            );
        }

        String normalized = normalizeText(rawText);
        if (normalized.isEmpty()) {
            return new ExtractionResult(
                    ExtractionStatus.EMPTY,
                    "",
                    0,
                    pageCount,
                    "No readable text found. Scanned or image-only documents are not supported for AI drafting."
            );
        }

        if (normalized.length() > maxExtractedChars) {
            normalized = normalized.substring(0, maxExtractedChars);
        }

        return new ExtractionResult(
                ExtractionStatus.READY,
                normalized,
                normalized.length(),
                pageCount,
                "Text extracted successfully."
        );
    }

    /**
     * Normalizes line breaks, collapses excessive horizontal whitespace,
     * and preserves clean paragraph boundaries.
     */
    public String normalizeText(String text) {
        if (text == null) return "";
        // Unify line breaks
        String normalized = text.replace("\r\n", "\n").replace("\r", "\n");
        // Collapse tabs and multiple spaces to a single space
        normalized = normalized.replaceAll("[ \\t]+", " ");
        // Collapse 3+ newlines to double newlines (paragraphs)
        normalized = normalized.replaceAll("\\n{3,}", "\n\n");
        return normalized.trim();
    }

    private boolean isPdfHeader(byte[] b) {
        return b.length >= 5 && b[0] == 0x25 && b[1] == 0x50 && b[2] == 0x44 && b[3] == 0x46 && b[4] == 0x2D;
    }

    private boolean isZipHeader(byte[] b) {
        return b.length >= 4 && b[0] == 0x50 && b[1] == 0x4B &&
                ((b[2] == 0x03 && b[3] == 0x04) || (b[2] == 0x05 && b[3] == 0x06) || (b[2] == 0x07 && b[3] == 0x08));
    }

    private boolean isOle2Header(byte[] b) {
        return b.length >= 8 &&
                (b[0] & 0xFF) == 0xD0 && (b[1] & 0xFF) == 0xCF &&
                (b[2] & 0xFF) == 0x11 && (b[3] & 0xFF) == 0xE0 &&
                (b[4] & 0xFF) == 0xA1 && (b[5] & 0xFF) == 0xB1 &&
                (b[6] & 0xFF) == 0x1A && (b[7] & 0xFF) == 0xE1;
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0 && dot < filename.length() - 1) ? filename.substring(dot + 1) : "";
    }
}

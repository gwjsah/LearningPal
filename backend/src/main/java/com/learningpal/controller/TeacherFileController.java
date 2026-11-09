package com.learningpal.controller;

import com.learningpal.dto.*;
import com.learningpal.service.TeacherFileService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

/**
 * Controller handling teacher file resource management (PDF and DOCX),
 * text extraction inspection, and original file downloads.
 */
@RestController
public class TeacherFileController {

    private final TeacherFileService teacherFileService;

    public TeacherFileController(TeacherFileService teacherFileService) {
        this.teacherFileService = teacherFileService;
    }

    /**
     * Uploads and extracts text from a PDF or DOCX file resource for a subject.
     */
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping(value = "/api/teacher/subjects/{subjectId}/files", consumes = "multipart/form-data")
    public ResponseEntity<TeacherFileDto> uploadFile(
            @PathVariable Long subjectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "topicId", required = false) Long topicId,
            Principal principal
    ) {
        TeacherFileDto created = teacherFileService.uploadFile(
                principal.getName(),
                subjectId,
                file,
                title,
                description,
                topicId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lists all file resources belonging to a teacher's subject.
     */
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/api/teacher/subjects/{subjectId}/files")
    public ResponseEntity<List<TeacherFileDto>> getSubjectFiles(
            @PathVariable Long subjectId,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherFileService.getSubjectFiles(principal.getName(), subjectId));
    }

    /**
     * Updates file metadata (title, description, optional topic tag).
     */
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/api/teacher/files/{id}")
    public ResponseEntity<TeacherFileDto> updateFile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFileRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherFileService.updateFile(principal.getName(), id, request));
    }

    /**
     * Archives a file resource.
     */
    @PreAuthorize("hasRole('TEACHER')")
    @RequestMapping(value = "/api/teacher/files/{id}/archive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherFileDto> archiveFile(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherFileService.archiveFile(principal.getName(), id));
    }

    /**
     * Unarchives a file resource.
     */
    @PreAuthorize("hasRole('TEACHER')")
    @RequestMapping(value = "/api/teacher/files/{id}/unarchive", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<TeacherFileDto> unarchiveFile(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherFileService.unarchiveFile(principal.getName(), id));
    }

    /**
     * Deletes a file resource and removes stored bytes from disk.
     */
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/api/teacher/files/{id}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long id,
            Principal principal
    ) {
        teacherFileService.deleteFile(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves the first 3,000 characters of extracted text as plain text preview.
     */
    @GetMapping("/api/teacher/files/{id}/text-preview")
    public ResponseEntity<FileTextPreviewDto> getTextPreview(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(teacherFileService.getTextPreview(principal.getName(), id));
    }

    /**
     * Downloads the original file for the owning teacher.
     */
    @GetMapping("/api/teacher/files/{id}/download")
    public ResponseEntity<InputStreamResource> downloadFile(
            @PathVariable Long id,
            Principal principal
    ) {
        return teacherFileService.downloadFileForTeacher(principal.getName(), id);
    }
}

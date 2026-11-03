package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ConflictException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service managing student classroom memberships, join-code redemption, and workspace loading.
 * Strictly institution-scoped. NEVER leaks join codes to students.
 */
@Service
public class StudentClassService {

    private final UserRepository userRepository;
    private final ClassEntityRepository classEntityRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TopicRepository topicRepository;
    private final GapAnalysisService gapAnalysisService;
    private final ClassJoinRateLimiter rateLimiter;
    private final TenantAccess tenantAccess;

    public StudentClassService(
            UserRepository userRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            TopicRepository topicRepository,
            GapAnalysisService gapAnalysisService,
            ClassJoinRateLimiter rateLimiter,
            TenantAccess tenantAccess) {
        this.userRepository = userRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.topicRepository = topicRepository;
        this.gapAnalysisService = gapAnalysisService;
        this.rateLimiter = rateLimiter;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Joins a classroom section using an institution-scoped join code.
     * Enforces the 5 failed attempts/minute rate limit.
     * Enforces at most ONE ACTIVE class per subject rule.
     */
    @Transactional
    public StudentClassSummaryDto joinClass(String studentEmail, JoinClassRequest request) {
        User student = getActiveStudent(studentEmail);

        // 1. Rate-limit check (throws 429 if 5 failed attempts in past 60s)
        rateLimiter.checkRateLimit(student.getId());

        String rawCode = request != null && request.code() != null ? request.code() : "";
        String normalizedCode = rawCode.trim().toUpperCase();

        if (normalizedCode.isBlank()) {
            rateLimiter.recordFailure(student.getId());
            throw new BadRequestException("That code isn't valid or the class isn't accepting students");
        }

        Institution institution = tenantAccess.requireCallerInstitution(student);

        // 2. Query class within student's institution
        ClassEntity classEntity = classEntityRepository.findByInstitutionAndJoinCode(institution, normalizedCode)
                .orElse(null);

        // Generic error message so nothing leaks about code existence, archives, or closed enrollment
        if (classEntity == null || classEntity.getStatus() == ClassStatus.ARCHIVED || !classEntity.isEnrollmentOpen()) {
            rateLimiter.recordFailure(student.getId());
            throw new BadRequestException("That code isn't valid or the class isn't accepting students");
        }

        // 3. Idempotent check: student is already in this specific class
        Optional<Enrollment> existingInThisClass = enrollmentRepository.findByStudentAndClassEntity(student, classEntity);
        if (existingInThisClass.isPresent()) {
            return buildClassSummary(student, existingInThisClass.get());
        }

        // 4. One active class per subject rule
        Optional<ClassEntity> activeClassInSubject = enrollmentRepository.findActiveClassByStudentAndSubject(student, classEntity.getSubject());
        if (activeClassInSubject.isPresent()) {
            throw new ConflictException("You're already enrolled in an active class for this subject: " + activeClassInSubject.get().getName());
        }

        // 5. Successful join: enroll and return summary (does not increment failed attempts)
        Enrollment enrollment = new Enrollment(student, classEntity);
        Enrollment saved = enrollmentRepository.save(enrollment);

        return buildClassSummary(student, saved);
    }

    /**
     * Lists the student's own classes. ACTIVE classes appear first, followed by ARCHIVED classes.
     */
    @Transactional(readOnly = true)
    public List<StudentClassSummaryDto> getStudentClasses(String studentEmail) {
        User student = getActiveStudent(studentEmail);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentOrderedForDashboard(student);

        List<StudentClassSummaryDto> list = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            list.add(buildClassSummary(student, enrollment));
        }
        return list;
    }

    /**
     * Retrieves workspace header and details for a specific enrolled class.
     */
    @Transactional(readOnly = true)
    public StudentClassWorkspaceDto getStudentClassWorkspace(String studentEmail, Long classId) {
        User student = getActiveStudent(studentEmail);
        ClassEntity cls = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        Enrollment enrollment = enrollmentRepository.findByStudentAndClassEntity(student, cls)
                .orElseThrow(() -> new ResourceNotFoundException("You are not enrolled in class: " + classId));

        String teacherName = cls.getTeacher() != null ? cls.getTeacher().getFullName() : "Unassigned";
        boolean canAttempt = cls.getStatus() == ClassStatus.ACTIVE;

        return new StudentClassWorkspaceDto(
                cls.getId(),
                cls.getName(),
                SubjectSummaryDto.fromEntity(cls.getSubject()),
                teacherName,
                cls.getStatus(),
                enrollment.getEnrolledAt(),
                canAttempt
        );
    }

    /**
     * Resolves the student's active (or most recent) class ID for a given subject.
     * Enables seamless backwards compatibility when navigating /student/subjects/:subjectId.
     */
    @Transactional(readOnly = true)
    public Long resolveClassIdForSubject(String studentEmail, Long subjectId) {
        User student = getActiveStudent(studentEmail);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentOrderedForDashboard(student);

        for (Enrollment e : enrollments) {
            if (e.getClassEntity() != null && e.getClassEntity().getSubject() != null &&
                    e.getClassEntity().getSubject().getId().equals(subjectId)) {
                return e.getClassEntity().getId();
            }
        }
        return null;
    }

    private StudentClassSummaryDto buildClassSummary(User student, Enrollment enrollment) {
        ClassEntity cls = enrollment.getClassEntity();
        Subject subject = cls.getSubject();

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        StudentProgressResponseDto progress = gapAnalysisService.buildProgressResponse(student, topics);

        boolean hasAnyQuestionsAnswered = progress.topics().stream().anyMatch(t -> t.questionsAnswered() > 0);
        String oneLineStatus;

        if (!hasAnyQuestionsAnswered) {
            oneLineStatus = "Not started yet";
        } else {
            int gapCount = progress.gaps().size();
            int strengthCount = progress.strengths().size();
            String gapWord = gapCount == 1 ? "gap" : "gaps";
            String strengthWord = strengthCount == 1 ? "strength" : "strengths";
            oneLineStatus = String.format("%d %s, %d %s", gapCount, gapWord, strengthCount, strengthWord);
        }

        TopicProgressDto studyNext = progress.studyNext();
        int totalTopics = topics.size();
        int masteredTopics = (int) progress.topics().stream()
                .filter(t -> t.status() == MasteryStatus.STRENGTH)
                .count();
        String teacherName = cls.getTeacher() != null ? cls.getTeacher().getFullName() : "Unassigned";

        return new StudentClassSummaryDto(
                cls.getId(),
                cls.getName(),
                SubjectSummaryDto.fromEntity(subject),
                teacherName,
                cls.getStatus(),
                enrollment.getEnrolledAt(),
                oneLineStatus,
                studyNext,
                progress.gaps().size(),
                progress.strengths().size(),
                totalTopics,
                masteredTopics
        );
    }

    private User getActiveStudent(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        if (student.getRole() != Role.STUDENT || student.getStatus() != UserStatus.ACTIVE) {
            throw new AccessDeniedException("Only active students can access student classroom resources");
        }
        return student;
    }
}


package com.learningpal.service;

import com.learningpal.dto.AvailableSubjectDto;
import com.learningpal.dto.StudentProgressResponseDto;
import com.learningpal.dto.StudentSubjectSummaryDto;
import com.learningpal.dto.TopicProgressDto;
import com.learningpal.entity.*;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Service managing student subject enrollments and dashboard summaries.
 */
@Service
public class StudentEnrollmentService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TopicRepository topicRepository;
    private final AssessmentRepository assessmentRepository;
    private final GapAnalysisService gapAnalysisService;

    public StudentEnrollmentService(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            EnrollmentRepository enrollmentRepository,
            TopicRepository topicRepository,
            AssessmentRepository assessmentRepository,
            GapAnalysisService gapAnalysisService) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.topicRepository = topicRepository;
        this.assessmentRepository = assessmentRepository;
        this.gapAnalysisService = gapAnalysisService;
    }

    /**
     * Lists all subjects the student is currently enrolled in, along with their diagnostic status summary.
     */
    @Transactional(readOnly = true)
    public List<StudentSubjectSummaryDto> getEnrolledSubjects(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentOrderByEnrolledAtDesc(student);
        List<StudentSubjectSummaryDto> summaries = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Subject subject = enrollment.getSubject();
            summaries.add(buildSubjectSummary(student, subject, enrollment));
        }

        return summaries;
    }

    /**
     * Lists subjects available for self-enrollment (subjects the student is not yet enrolled in).
     */
    @Transactional(readOnly = true)
    public List<AvailableSubjectDto> getAvailableSubjects(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        List<Subject> allSubjects = subjectRepository.findAll();
        List<AvailableSubjectDto> available = new ArrayList<>();

        for (Subject subject : allSubjects) {
            if (!enrollmentRepository.existsByStudentAndSubject(student, subject)) {
                int topicCount = (int) topicRepository.countBySubject(subject);
                int assessmentCount = (int) assessmentRepository.countBySubjectAndStatus(subject, AssessmentStatus.PUBLISHED);
                available.add(new AvailableSubjectDto(
                        subject.getId(),
                        subject.getCode(),
                        subject.getName(),
                        subject.getDescription(),
                        topicCount,
                        assessmentCount
                ));
            }
        }

        return available;
    }

    /**
     * Self-enrolls the student in a subject. Idempotent: enrolling twice creates only one record.
     */
    @Transactional
    public StudentSubjectSummaryDto enrollSubject(Long subjectId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        Enrollment enrollment = enrollmentRepository.findByStudentAndSubject(student, subject)
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(student, subject)));

        return buildSubjectSummary(student, subject, enrollment);
    }

    private StudentSubjectSummaryDto buildSubjectSummary(User student, Subject subject, Enrollment enrollment) {
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

        return new StudentSubjectSummaryDto(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.getDescription(),
                oneLineStatus,
                studyNext,
                enrollment.getEnrolledAt(),
                totalTopics,
                masteredTopics
        );
    }
}


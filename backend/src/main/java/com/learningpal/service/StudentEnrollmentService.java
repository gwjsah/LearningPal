package com.learningpal.service;

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
 * Service providing student subject summaries derived from their enrolled classes.
 * Direct subject self-enrollment has been retired; students now join classes via join codes.
 */
@Service
public class StudentEnrollmentService {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TopicRepository topicRepository;
    private final GapAnalysisService gapAnalysisService;

    public StudentEnrollmentService(
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            TopicRepository topicRepository,
            GapAnalysisService gapAnalysisService) {
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.topicRepository = topicRepository;
        this.gapAnalysisService = gapAnalysisService;
    }

    /**
     * Lists all subjects the student is enrolled in through their active and archived classes.
     */
    @Transactional(readOnly = true)
    public List<StudentSubjectSummaryDto> getEnrolledSubjects(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentOrderByEnrolledAtDesc(student);
        List<StudentSubjectSummaryDto> summaries = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            ClassEntity cls = enrollment.getClassEntity();
            if (cls != null && cls.getSubject() != null) {
                summaries.add(buildSubjectSummary(student, cls.getSubject(), enrollment));
            }
        }

        return summaries;
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

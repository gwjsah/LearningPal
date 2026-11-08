package com.learningpal.service;

import com.learningpal.dto.RecommendedResourceDto;
import com.learningpal.dto.ResourceCompletionResponseDto;
import com.learningpal.entity.*;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.ClassEntityRepository;
import com.learningpal.repository.EnrollmentRepository;
import com.learningpal.repository.ResourceProgressRepository;
import com.learningpal.repository.ResourceRatingRepository;
import com.learningpal.repository.ResourceRepository;
import com.learningpal.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing educational resource recommendations and student completion tracking.
 * Completion tracking is scoped per (student, class, resource).
 */
@Service
public class StudentResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceProgressRepository resourceProgressRepository;
    private final ResourceRatingRepository resourceRatingRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassEntityRepository classEntityRepository;

    public StudentResourceService(
            ResourceRepository resourceRepository,
            ResourceProgressRepository resourceProgressRepository,
            ResourceRatingRepository resourceRatingRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            ClassEntityRepository classEntityRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceProgressRepository = resourceProgressRepository;
        this.resourceRatingRepository = resourceRatingRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classEntityRepository = classEntityRepository;
    }

    /**
     * Marks an educational resource as completed for the authenticated student within a specific class.
     * Idempotent: multiple calls maintain completion timestamp and do not violate uniqueness.
     */
    @Transactional
    public ResourceCompletionResponseDto markCompleteInClass(Long classId, Long resourceId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        ClassEntity classroom = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student, classroom)) {
            throw new AccessDeniedException("Student is not enrolled in class: " + classroom.getName());
        }

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        ResourceProgress progress = resourceProgressRepository
                .findByStudentAndClassroomAndResource(student, classroom, resource)
                .orElseGet(() -> new ResourceProgress(student, classroom, resource));

        progress.markCompleted();
        resourceProgressRepository.save(progress);

        return new ResourceCompletionResponseDto(resource.getId(), true, "Resource marked as completed.");
    }

    /**
     * Backward-compatible overload: marks resource as completed by resolving the student's active class for the resource's subject.
     */
    @Transactional
    public ResourceCompletionResponseDto markComplete(Long resourceId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        Subject subject = resource.getTopic() != null ? resource.getTopic().getSubject() : null;
        ClassEntity activeClass = resolveActiveClassForStudentAndSubject(student, subject);

        if (activeClass != null) {
            return markCompleteInClass(activeClass.getId(), resourceId, studentEmail);
        }

        ResourceProgress progress = resourceProgressRepository
                .findByStudentAndResource(student, resource)
                .orElseGet(() -> new ResourceProgress(student, resource));

        progress.markCompleted();
        resourceProgressRepository.save(progress);

        return new ResourceCompletionResponseDto(resource.getId(), true, "Resource marked as completed.");
    }

    /**
     * Removes completion status for an educational resource within a specific class.
     */
    @Transactional
    public ResourceCompletionResponseDto markIncompleteInClass(Long classId, Long resourceId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        ClassEntity classroom = classEntityRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        if (!enrollmentRepository.existsByStudentAndClassEntity(student, classroom)) {
            throw new AccessDeniedException("Student is not enrolled in class: " + classroom.getName());
        }

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        resourceProgressRepository.findByStudentAndClassroomAndResource(student, classroom, resource)
                .ifPresent(resourceProgressRepository::delete);

        return new ResourceCompletionResponseDto(resource.getId(), false, "Resource marked as incomplete.");
    }

    /**
     * Backward-compatible overload: removes completion status by resolving the student's active class.
     */
    @Transactional
    public ResourceCompletionResponseDto markIncomplete(Long resourceId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        Subject subject = resource.getTopic() != null ? resource.getTopic().getSubject() : null;
        ClassEntity activeClass = resolveActiveClassForStudentAndSubject(student, subject);

        if (activeClass != null) {
            return markIncompleteInClass(activeClass.getId(), resourceId, studentEmail);
        }

        resourceProgressRepository.findByStudentAndResource(student, resource)
                .ifPresent(resourceProgressRepository::delete);

        return new ResourceCompletionResponseDto(resource.getId(), false, "Resource marked as incomplete.");
    }

    /**
     * Retrieves recommended resources for a given topic scoped to a classroom.
     */
    @Transactional(readOnly = true)
    public List<RecommendedResourceDto> getRecommendationsForTopic(Topic topic, MasteryStatus status, User student, ClassEntity classroom) {
        List<Resource> allTopicResources = resourceRepository.findByTopic(topic);

        // Fetch student's completed resource IDs in this class
        Set<Long> completedResourceIds;
        if (classroom != null) {
            completedResourceIds = resourceProgressRepository.findByStudentAndClassroom(student, classroom).stream()
                    .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                    .map(p -> p.getResource().getId())
                    .collect(Collectors.toSet());
        } else {
            completedResourceIds = resourceProgressRepository.findByStudent(student).stream()
                    .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                    .map(p -> p.getResource().getId())
                    .collect(Collectors.toSet());
        }

        // Fetch student's ratings for resources
        Map<Long, ResourceRating> studentRatings = resourceRatingRepository.findByStudent(student).stream()
                .collect(Collectors.toMap(r -> r.getResource().getId(), r -> r, (a, b) -> a));

        MasteryStatus effectiveStatus = (status != null) ? status : MasteryStatus.INSUFFICIENT_DATA;

        List<Resource> filteredAndSorted = new ArrayList<>();

        switch (effectiveStatus) {
            case GAP, DEVELOPING -> {
                filteredAndSorted = allTopicResources.stream()
                        .sorted(Comparator.comparingInt((Resource r) -> {
                            if (r.getType() == ResourceType.NOTE) return 0;
                            if (r.getType() == ResourceType.PRACTICE) return 1;
                            return 2;
                        }).thenComparing(Resource::getId))
                        .toList();
            }
            case STRENGTH -> {
                filteredAndSorted = allTopicResources.stream()
                        .filter(r -> r.getType() == ResourceType.PRACTICE)
                        .sorted(Comparator.comparing(Resource::getId))
                        .toList();
            }
            case INSUFFICIENT_DATA -> {
                filteredAndSorted = allTopicResources.stream()
                        .filter(r -> r.getType() == ResourceType.NOTE)
                        .sorted(Comparator.comparing(Resource::getId))
                        .toList();
            }
        }

        return filteredAndSorted.stream()
                .map(r -> {
                    ResourceRating rating = studentRatings.get(r.getId());
                    return new RecommendedResourceDto(
                            r.getId(),
                            r.getTitle(),
                            r.getType(),
                            r.getDescription(),
                            r.getContent(),
                            r.getUrl(),
                            completedResourceIds.contains(r.getId()),
                            rating != null ? rating.getRating() : null,
                            rating != null ? rating.getComment() : null
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecommendedResourceDto> getRecommendationsForTopic(Topic topic, MasteryStatus status, User student) {
        return getRecommendationsForTopic(topic, status, student, null);
    }

    /**
     * Counts completed vs recommended resources for a topic and status within a class.
     */
    @Transactional(readOnly = true)
    public int[] getResourceCountsForTopic(Topic topic, MasteryStatus status, User student, ClassEntity classroom) {
        List<RecommendedResourceDto> recs = getRecommendationsForTopic(topic, status, student, classroom);
        int recommended = recs.size();
        int completed = (int) recs.stream().filter(RecommendedResourceDto::completed).count();
        return new int[]{completed, recommended};
    }

    @Transactional(readOnly = true)
    public int[] getResourceCountsForTopic(Topic topic, MasteryStatus status, User student) {
        return getResourceCountsForTopic(topic, status, student, (ClassEntity) null);
    }

    private ClassEntity resolveActiveClassForStudentAndSubject(User student, Subject subject) {
        if (subject == null) return null;
        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        for (Enrollment e : enrollments) {
            ClassEntity cls = e.getClassEntity();
            if (cls != null && cls.getStatus() == ClassStatus.ACTIVE &&
                    cls.getSubject() != null && cls.getSubject().getId().equals(subject.getId())) {
                return cls;
            }
        }
        return null;
    }
}


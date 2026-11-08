package com.learningpal.service;

import com.learningpal.dto.RecommendedResourceDto;
import com.learningpal.dto.ResourceCompletionResponseDto;
import com.learningpal.entity.*;
import com.learningpal.exception.ResourceNotFoundException;
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
 */
@Service
public class StudentResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceProgressRepository resourceProgressRepository;
    private final ResourceRatingRepository resourceRatingRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public StudentResourceService(
            ResourceRepository resourceRepository,
            ResourceProgressRepository resourceProgressRepository,
            ResourceRatingRepository resourceRatingRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceProgressRepository = resourceProgressRepository;
        this.resourceRatingRepository = resourceRatingRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Marks an educational resource as completed for the authenticated student.
     * Idempotent: multiple calls maintain completion timestamp and do not violate uniqueness.
     */
    @Transactional
    public ResourceCompletionResponseDto markComplete(Long resourceId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        if (resource.getTopic() != null && resource.getTopic().getSubject() != null &&
                !enrollmentRepository.existsByStudentAndSubject(student, resource.getTopic().getSubject())) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + resource.getTopic().getSubject().getName());
        }

        ResourceProgress progress = resourceProgressRepository
                .findByStudentAndResource(student, resource)
                .orElseGet(() -> new ResourceProgress(student, resource));

        progress.markCompleted();
        resourceProgressRepository.save(progress);

        return new ResourceCompletionResponseDto(resource.getId(), true, "Resource marked as completed.");
    }

    /**
     * Removes completion status for an educational resource for the authenticated student.
     * Idempotent: safe to invoke even if not previously completed.
     */
    @Transactional
    public ResourceCompletionResponseDto markIncomplete(Long resourceId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        if (resource.getTopic() != null && resource.getTopic().getSubject() != null &&
                !enrollmentRepository.existsByStudentAndSubject(student, resource.getTopic().getSubject())) {
            throw new AccessDeniedException("Student is not enrolled in subject: " + resource.getTopic().getSubject().getName());
        }

        resourceProgressRepository.findByStudentAndResource(student, resource)
                .ifPresent(resourceProgressRepository::delete);

        return new ResourceCompletionResponseDto(resource.getId(), false, "Resource marked as incomplete.");
    }

    /**
     * Retrieves recommended resources for a given topic filtered and prioritized according to mastery status:
     * - GAP & DEVELOPING: NOTE first, then PRACTICE, then other types.
     * - STRENGTH: only PRACTICE (optional challenge).
     * - INSUFFICIENT_DATA: only NOTE (introductory reading).
     */
    @Transactional(readOnly = true)
    public List<RecommendedResourceDto> getRecommendationsForTopic(Topic topic, MasteryStatus status, User student) {
        List<Resource> allTopicResources = resourceRepository.findByTopic(topic);

        // Fetch student's completed resource IDs
        Set<Long> completedResourceIds = resourceProgressRepository.findByStudent(student).stream()
                .filter(p -> p.getStatus() == ProgressStatus.COMPLETED)
                .map(p -> p.getResource().getId())
                .collect(Collectors.toSet());

        // Fetch student's ratings for resources
        Map<Long, ResourceRating> studentRatings = resourceRatingRepository.findByStudent(student).stream()
                .collect(Collectors.toMap(r -> r.getResource().getId(), r -> r, (a, b) -> a));

        MasteryStatus effectiveStatus = (status != null) ? status : MasteryStatus.INSUFFICIENT_DATA;

        List<Resource> filteredAndSorted = new ArrayList<>();

        switch (effectiveStatus) {
            case GAP, DEVELOPING -> {
                // NOTE first, then PRACTICE, then others
                filteredAndSorted = allTopicResources.stream()
                        .sorted(Comparator.comparingInt((Resource r) -> {
                            if (r.getType() == ResourceType.NOTE) return 0;
                            if (r.getType() == ResourceType.PRACTICE) return 1;
                            return 2;
                        }).thenComparing(Resource::getId))
                        .toList();
            }
            case STRENGTH -> {
                // Only PRACTICE as challenge
                filteredAndSorted = allTopicResources.stream()
                        .filter(r -> r.getType() == ResourceType.PRACTICE)
                        .sorted(Comparator.comparing(Resource::getId))
                        .toList();
            }
            case INSUFFICIENT_DATA -> {
                // Only NOTE to introduce the topic
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

    /**
     * Counts completed vs recommended resources for a topic and status.
     * Returns int[2] where [0] = completedCount, [1] = recommendedCount.
     */
    @Transactional(readOnly = true)
    public int[] getResourceCountsForTopic(Topic topic, MasteryStatus status, User student) {
        List<RecommendedResourceDto> recs = getRecommendationsForTopic(topic, status, student);
        int recommended = recs.size();
        int completed = (int) recs.stream().filter(RecommendedResourceDto::completed).count();
        return new int[]{completed, recommended};
    }
}


package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Part A helpfulness ratings for topic feedback and educational resources.
 * Supports student upsert, teacher classroom summaries, and admin institutional aggregations with 80% target check.
 */
@Service
public class MeasurementRatingService {

    private final FeedbackRatingRepository feedbackRatingRepository;
    private final ResourceRatingRepository resourceRatingRepository;
    private final TopicRepository topicRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassEntityRepository classEntityRepository;
    private final StudentTopicMasteryRepository studentTopicMasteryRepository;
    private final TenantAccess tenantAccess;

    public MeasurementRatingService(
            FeedbackRatingRepository feedbackRatingRepository,
            ResourceRatingRepository resourceRatingRepository,
            TopicRepository topicRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            ClassEntityRepository classEntityRepository,
            StudentTopicMasteryRepository studentTopicMasteryRepository,
            TenantAccess tenantAccess) {
        this.feedbackRatingRepository = feedbackRatingRepository;
        this.resourceRatingRepository = resourceRatingRepository;
        this.topicRepository = topicRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classEntityRepository = classEntityRepository;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Upserts a student's helpfulness rating for diagnostic feedback on a topic.
     * Enforces that the student is enrolled in a class for the topic's subject.
     */
    @Transactional
    public RatingSavedDto saveTopicFeedbackRating(Long topicId, Integer rating, String comment, String studentEmail) {
        validateRatingScore(rating);
        String cleanComment = sanitizeComment(comment);

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));

        if (topic.getSubject() == null || !enrollmentRepository.existsByStudentAndSubject(student, topic.getSubject())) {
            throw new ResourceNotFoundException("Student is not enrolled in a class for this topic");
        }

        MasteryStatus topicStatus = studentTopicMasteryRepository
                .findByStudentIdAndTopicId(student.getId(), topicId)
                .map(StudentTopicMastery::getStatus)
                .orElse(MasteryStatus.INSUFFICIENT_DATA);

        FeedbackRating feedbackRating = feedbackRatingRepository
                .findByStudentAndTopic(student, topic)
                .orElseGet(() -> new FeedbackRating(student, topic, rating, cleanComment, topicStatus));

        feedbackRating.setRating(rating);
        feedbackRating.setComment(cleanComment);
        feedbackRating.setTopicStatusAtRating(topicStatus);
        feedbackRating.setUpdatedAt(Instant.now());

        FeedbackRating saved = feedbackRatingRepository.save(feedbackRating);
        return new RatingSavedDto(saved.getId(), topicId, "TOPIC_FEEDBACK", saved.getRating(), saved.getComment(), saved.getUpdatedAt());
    }

    /**
     * Upserts a student's helpfulness rating for an educational resource.
     * Enforces that the student is enrolled in a class for the resource's subject.
     */
    @Transactional
    public RatingSavedDto saveResourceRating(Long resourceId, Integer rating, String comment, String studentEmail) {
        validateRatingScore(rating);
        String cleanComment = sanitizeComment(comment);

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentEmail));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));

        Subject subject = resource.getTopic() != null ? resource.getTopic().getSubject() : resource.getSubject();
        if (subject == null || !enrollmentRepository.existsByStudentAndSubject(student, subject)) {
            throw new ResourceNotFoundException("Student is not enrolled in a class for this resource");
        }

        ResourceRating resourceRating = resourceRatingRepository
                .findByStudentAndResource(student, resource)
                .orElseGet(() -> new ResourceRating(student, resource, rating, cleanComment));

        resourceRating.setRating(rating);
        resourceRating.setComment(cleanComment);
        resourceRating.setUpdatedAt(Instant.now());

        ResourceRating saved = resourceRatingRepository.save(resourceRating);
        return new RatingSavedDto(saved.getId(), resourceId, "RESOURCE", saved.getRating(), saved.getComment(), saved.getUpdatedAt());
    }

    /**
     * Retrieves class-scoped helpfulness rating summary for an educator's classroom section.
     */
    @Transactional(readOnly = true)
    public TeacherRatingsSummaryDto getTeacherRatingsSummary(Long classId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntity(cls);
        Set<Long> studentIds = enrollments.stream().map(e -> e.getStudent().getId()).collect(Collectors.toSet());

        Long subjectId = cls.getSubject().getId();
        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(cls.getSubject());
        List<Resource> resources = resourceRepository.findBySubjectId(subjectId);

        if (studentIds.isEmpty()) {
            List<TeacherTopicRatingSummaryDto> emptyTopics = topics.stream()
                    .map(t -> new TeacherTopicRatingSummaryDto(t.getId(), t.getName(), 0, 0.0, 0.0))
                    .toList();
            List<TeacherResourceRatingSummaryDto> emptyResources = resources.stream()
                    .map(r -> new TeacherResourceRatingSummaryDto(r.getId(), r.getTitle(), r.getType().name(), 0, 0.0, 0.0))
                    .toList();
            return new TeacherRatingsSummaryDto(emptyTopics, emptyResources, List.of(), List.of());
        }

        List<FeedbackRating> feedbackRatings = feedbackRatingRepository.findByStudentIdInAndSubjectId(studentIds, subjectId);
        List<ResourceRating> resourceRatings = resourceRatingRepository.findByStudentIdInAndSubjectId(studentIds, subjectId);

        Map<Long, List<FeedbackRating>> ratingsByTopic = feedbackRatings.stream()
                .collect(Collectors.groupingBy(r -> r.getTopic().getId()));
        Map<Long, List<ResourceRating>> ratingsByResource = resourceRatings.stream()
                .collect(Collectors.groupingBy(r -> r.getResource().getId()));

        List<TeacherTopicRatingSummaryDto> topicSummaries = topics.stream()
                .map(t -> {
                    List<FeedbackRating> list = ratingsByTopic.getOrDefault(t.getId(), List.of());
                    int total = list.size();
                    double avg = total == 0 ? 0.0 : round1(list.stream().mapToInt(FeedbackRating::getRating).average().orElse(0.0));
                    double helpfulPct = total == 0 ? 0.0 : round1((double) list.stream().filter(r -> r.getRating() >= 4).count() / total * 100.0);
                    return new TeacherTopicRatingSummaryDto(t.getId(), t.getName(), total, avg, helpfulPct);
                })
                .toList();

        List<TeacherResourceRatingSummaryDto> resourceSummaries = resources.stream()
                .map(r -> {
                    List<ResourceRating> list = ratingsByResource.getOrDefault(r.getId(), List.of());
                    int total = list.size();
                    double avg = total == 0 ? 0.0 : round1(list.stream().mapToInt(ResourceRating::getRating).average().orElse(0.0));
                    double helpfulPct = total == 0 ? 0.0 : round1((double) list.stream().filter(rr -> rr.getRating() >= 4).count() / total * 100.0);
                    return new TeacherResourceRatingSummaryDto(r.getId(), r.getTitle(), r.getType().name(), total, avg, helpfulPct);
                })
                .toList();

        // Lowest-rated resources: at least 3 ratings, sorted ascending by average rating
        List<TeacherResourceRatingSummaryDto> lowestRatedResources = resourceSummaries.stream()
                .filter(r -> r.totalRatings() >= 3)
                .sorted(Comparator.comparingDouble(TeacherResourceRatingSummaryDto::averageRating)
                        .thenComparingDouble(TeacherResourceRatingSummaryDto::helpfulPercentage))
                .limit(5)
                .toList();

        // Anonymous recent comments (no student names or emails)
        List<TeacherRatingCommentDto> comments = new ArrayList<>();
        for (FeedbackRating fr : feedbackRatings) {
            if (fr.getComment() != null && !fr.getComment().isBlank()) {
                comments.add(new TeacherRatingCommentDto("TOPIC_FEEDBACK", fr.getTopic().getName(), fr.getRating(), fr.getComment(), fr.getUpdatedAt()));
            }
        }
        for (ResourceRating rr : resourceRatings) {
            if (rr.getComment() != null && !rr.getComment().isBlank()) {
                comments.add(new TeacherRatingCommentDto("RESOURCE", rr.getResource().getTitle(), rr.getRating(), rr.getComment(), rr.getUpdatedAt()));
            }
        }
        comments.sort(Comparator.comparing(TeacherRatingCommentDto::ratedAt).reversed());
        List<TeacherRatingCommentDto> recentComments = comments.stream().limit(10).toList();

        return new TeacherRatingsSummaryDto(topicSummaries, resourceSummaries, lowestRatedResources, recentComments);
    }

    /**
     * Retrieves institution-wide helpfulness rating summary for administrators.
     * Evaluates performance against the 80% helpful rating target.
     */
    @Transactional(readOnly = true)
    public AdminRatingsSummaryDto getAdminRatingsSummary(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));
        Institution institution = tenantAccess.requireCallerInstitution(admin);

        List<FeedbackRating> feedbackRatings = feedbackRatingRepository.findByStudentInstitutionId(institution.getId());
        List<ResourceRating> resourceRatings = resourceRatingRepository.findByStudentInstitutionId(institution.getId());

        Set<Long> raterIds = new HashSet<>();
        Map<Long, List<Integer>> scoresPerStudent = new HashMap<>();

        for (FeedbackRating fr : feedbackRatings) {
            Long stId = fr.getStudent().getId();
            raterIds.add(stId);
            scoresPerStudent.computeIfAbsent(stId, k -> new ArrayList<>()).add(fr.getRating());
        }
        for (ResourceRating rr : resourceRatings) {
            Long stId = rr.getStudent().getId();
            raterIds.add(stId);
            scoresPerStudent.computeIfAbsent(stId, k -> new ArrayList<>()).add(rr.getRating());
        }

        int totalRaters = raterIds.size();
        int totalRatings = feedbackRatings.size() + resourceRatings.size();

        long helpfulCount = feedbackRatings.stream().filter(r -> r.getRating() >= 4).count()
                + resourceRatings.stream().filter(r -> r.getRating() >= 4).count();
        double helpfulPercentage = totalRatings == 0 ? 0.0 : round1((double) helpfulCount / totalRatings * 100.0);

        long satisfiedRatersCount = scoresPerStudent.values().stream()
                .filter(list -> !list.isEmpty() && list.stream().mapToInt(Integer::intValue).average().orElse(0.0) >= 4.0)
                .count();
        double satisfiedRatersPercentage = totalRaters == 0 ? 0.0 : round1((double) satisfiedRatersCount / totalRaters * 100.0);

        // Per-topic breakdown
        Map<Topic, List<FeedbackRating>> ratingsByTopic = feedbackRatings.stream()
                .collect(Collectors.groupingBy(FeedbackRating::getTopic));
        List<TeacherTopicRatingSummaryDto> topicSummaries = ratingsByTopic.entrySet().stream()
                .map(e -> {
                    Topic t = e.getKey();
                    List<FeedbackRating> list = e.getValue();
                    int total = list.size();
                    double avg = round1(list.stream().mapToInt(FeedbackRating::getRating).average().orElse(0.0));
                    double helpfulPct = round1((double) list.stream().filter(r -> r.getRating() >= 4).count() / total * 100.0);
                    return new TeacherTopicRatingSummaryDto(t.getId(), t.getName(), total, avg, helpfulPct);
                })
                .sorted(Comparator.comparing(TeacherTopicRatingSummaryDto::topicName))
                .toList();

        // Per-resource breakdown
        Map<Resource, List<ResourceRating>> ratingsByResource = resourceRatings.stream()
                .collect(Collectors.groupingBy(ResourceRating::getResource));
        List<TeacherResourceRatingSummaryDto> resourceSummaries = ratingsByResource.entrySet().stream()
                .map(e -> {
                    Resource r = e.getKey();
                    List<ResourceRating> list = e.getValue();
                    int total = list.size();
                    double avg = round1(list.stream().mapToInt(ResourceRating::getRating).average().orElse(0.0));
                    double helpfulPct = round1((double) list.stream().filter(rr -> rr.getRating() >= 4).count() / total * 100.0);
                    return new TeacherResourceRatingSummaryDto(r.getId(), r.getTitle(), r.getType().name(), total, avg, helpfulPct);
                })
                .sorted(Comparator.comparing(TeacherResourceRatingSummaryDto::resourceTitle))
                .toList();

        // Target check: >= 80% helpful rating on a minimum of 10 raters
        String targetCheckStatus;
        String targetCheckSentence;
        if (totalRaters < 10) {
            targetCheckStatus = "NOT_ENOUGH_DATA";
            targetCheckSentence = String.format(Locale.US,
                    "Helpfulness target requires at least 10 raters (%d evaluated so far; %.1f%% rated helpful).",
                    totalRaters, helpfulPercentage);
        } else if (helpfulPercentage >= 80.0) {
            targetCheckStatus = "MET";
            targetCheckSentence = String.format(Locale.US,
                    "Helpfulness target MET: %.1f%% of ratings are helpful (≥ 80%% target satisfied across %d raters).",
                    helpfulPercentage, totalRaters);
        } else {
            targetCheckStatus = "NOT_MET";
            targetCheckSentence = String.format(Locale.US,
                    "Helpfulness target NOT MET: %.1f%% of ratings are helpful (< 80%% target across %d raters).",
                    helpfulPercentage, totalRaters);
        }

        // Recent anonymous comments
        List<TeacherRatingCommentDto> comments = new ArrayList<>();
        for (FeedbackRating fr : feedbackRatings) {
            if (fr.getComment() != null && !fr.getComment().isBlank()) {
                comments.add(new TeacherRatingCommentDto("TOPIC_FEEDBACK", fr.getTopic().getName(), fr.getRating(), fr.getComment(), fr.getUpdatedAt()));
            }
        }
        for (ResourceRating rr : resourceRatings) {
            if (rr.getComment() != null && !rr.getComment().isBlank()) {
                comments.add(new TeacherRatingCommentDto("RESOURCE", rr.getResource().getTitle(), rr.getRating(), rr.getComment(), rr.getUpdatedAt()));
            }
        }
        comments.sort(Comparator.comparing(TeacherRatingCommentDto::ratedAt).reversed());
        List<TeacherRatingCommentDto> recentComments = comments.stream().limit(15).toList();

        return new AdminRatingsSummaryDto(
                totalRaters,
                totalRatings,
                helpfulPercentage,
                satisfiedRatersPercentage,
                topicSummaries,
                resourceSummaries,
                targetCheckStatus,
                targetCheckSentence,
                recentComments
        );
    }

    /**
     * Generates a formula-safe CSV export of all institution ratings with stable pseudonymous student codes.
     */
    @Transactional(readOnly = true)
    public String exportAdminRatingsCsv(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));
        Institution institution = tenantAccess.requireCallerInstitution(admin);

        List<FeedbackRating> feedbackRatings = feedbackRatingRepository.findByStudentInstitutionId(institution.getId());
        List<ResourceRating> resourceRatings = resourceRatingRepository.findByStudentInstitutionId(institution.getId());

        // Assign stable pseudonyms (S001, S002, ...) sorted by student ID
        Set<Long> studentIdSet = new HashSet<>();
        feedbackRatings.forEach(r -> studentIdSet.add(r.getStudent().getId()));
        resourceRatings.forEach(r -> studentIdSet.add(r.getStudent().getId()));

        List<Long> sortedStudentIds = new ArrayList<>(studentIdSet);
        Collections.sort(sortedStudentIds);

        Map<Long, String> pseudonyms = new HashMap<>();
        for (int i = 0; i < sortedStudentIds.size(); i++) {
            pseudonyms.put(sortedStudentIds.get(i), String.format("S%03d", i + 1));
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Student Code,Item Type,Item ID,Item Title,Rating,Helpful (>=4),Comment,Rated At\r\n");

        for (FeedbackRating fr : feedbackRatings) {
            sb.append(escapeCsvCell(pseudonyms.getOrDefault(fr.getStudent().getId(), "S000"))).append(",");
            sb.append(escapeCsvCell("TOPIC_FEEDBACK")).append(",");
            sb.append(fr.getTopic().getId()).append(",");
            sb.append(escapeCsvCell(fr.getTopic().getName())).append(",");
            sb.append(fr.getRating()).append(",");
            sb.append(fr.getRating() >= 4 ? "YES" : "NO").append(",");
            sb.append(escapeCsvCell(fr.getComment())).append(",");
            sb.append(escapeCsvCell(fr.getUpdatedAt().toString())).append("\r\n");
        }

        for (ResourceRating rr : resourceRatings) {
            sb.append(escapeCsvCell(pseudonyms.getOrDefault(rr.getStudent().getId(), "S000"))).append(",");
            sb.append(escapeCsvCell("RESOURCE")).append(",");
            sb.append(rr.getResource().getId()).append(",");
            sb.append(escapeCsvCell(rr.getResource().getTitle())).append(",");
            sb.append(rr.getRating()).append(",");
            sb.append(rr.getRating() >= 4 ? "YES" : "NO").append(",");
            sb.append(escapeCsvCell(rr.getComment())).append(",");
            sb.append(escapeCsvCell(rr.getUpdatedAt().toString())).append("\r\n");
        }

        return sb.toString();
    }

    private void validateRatingScore(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Rating must be an integer between 1 and 5");
        }
    }

    private String sanitizeComment(String comment) {
        if (comment == null) return null;
        String trimmed = comment.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.length() > 300) {
            throw new BadRequestException("Comment cannot exceed 300 characters");
        }
        return trimmed;
    }

    private static double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    public static String escapeCsvCell(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")
                || trimmed.startsWith("\t") || trimmed.startsWith("\r")) {
            value = "'" + value;
        }
        if (value.contains("\"") || value.contains(",") || value.contains("\n") || value.contains("\r")) {
            value = "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

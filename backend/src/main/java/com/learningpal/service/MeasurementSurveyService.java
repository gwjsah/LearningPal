package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.SurveyAnswerRepository;
import com.learningpal.repository.SurveyResponseRepository;
import com.learningpal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing Part B in-app usability surveys for students and educators.
 * Measures usability against the 4.0 out of 5 satisfaction target (minimum 5 responses per role).
 */
@Service
public class MeasurementSurveyService {

    public static final String CURRENT_SURVEY_VERSION = "v1";

    public static final List<SurveyItemDto> STUDENT_SURVEY_ITEMS = List.of(
            new SurveyItemDto("results_without_help", "I could find my results without help"),
            new SurveyItemDto("strengths_and_gaps", "I understood my strengths and learning gaps"),
            new SurveyItemDto("feedback_next_steps", "The feedback told me what to study next"),
            new SurveyItemDto("resources_matched", "The recommended resources matched what I needed"),
            new SurveyItemDto("navigation_easy", "Moving around the app was easy"),
            new SurveyItemDto("pages_clear", "The pages were clear and easy to read"),
            new SurveyItemDto("would_use_quizzes", "I would use LearningPal to prepare for quizzes"),
            new SurveyItemDto("overall_easy", "Overall, LearningPal was easy to use")
    );

    public static final List<SurveyItemDto> TEACHER_SURVEY_ITEMS = List.of(
            new SurveyItemDto("identify_needs", "I could see which students need support"),
            new SurveyItemDto("view_progress_easy", "I could view a student's needs and progress easily"),
            new SurveyItemDto("log_intervention_easy", "Logging an intervention was easy"),
            new SurveyItemDto("check_progress_easy", "Checking progress after an intervention was easy"),
            new SurveyItemDto("charts_clear", "The charts and summaries were clear"),
            new SurveyItemDto("grade_override_easy", "Adjusting a grade was easy"),
            new SurveyItemDto("class_setup_easy", "The class setup and join code process was easy"),
            new SurveyItemDto("overall_easy", "Overall, LearningPal was easy to use")
    );

    private final SurveyResponseRepository surveyResponseRepository;
    private final SurveyAnswerRepository surveyAnswerRepository;
    private final UserRepository userRepository;
    private final TenantAccess tenantAccess;

    public MeasurementSurveyService(
            SurveyResponseRepository surveyResponseRepository,
            SurveyAnswerRepository surveyAnswerRepository,
            UserRepository userRepository,
            TenantAccess tenantAccess) {
        this.surveyResponseRepository = surveyResponseRepository;
        this.surveyAnswerRepository = surveyAnswerRepository;
        this.userRepository = userRepository;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Retrieves survey status and role-specific items for the authenticated user.
     */
    @Transactional(readOnly = true)
    public SurveyStatusDto getSurveyStatus(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean alreadyResponded = surveyResponseRepository.existsByUserAndSurveyVersion(user, CURRENT_SURVEY_VERSION);
        List<SurveyItemDto> items = getItemsForRole(user.getRole());

        return new SurveyStatusDto(CURRENT_SURVEY_VERSION, user.getRole().name(), alreadyResponded, items);
    }

    /**
     * Submits survey answers for the authenticated student or educator.
     * Enforces single submission per survey version and complete item answers.
     */
    @Transactional
    public void submitSurvey(SubmitSurveyRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        if (user.getRole() != Role.STUDENT && user.getRole() != Role.TEACHER) {
            throw new BadRequestException("Surveys are only available for students and teachers.");
        }

        String version = (request.surveyVersion() != null && !request.surveyVersion().isBlank())
                ? request.surveyVersion()
                : CURRENT_SURVEY_VERSION;

        if (surveyResponseRepository.existsByUserAndSurveyVersion(user, version)) {
            throw new BadRequestException("You have already submitted a response for survey version: " + version);
        }

        List<SurveyItemDto> expectedItems = getItemsForRole(user.getRole());
        Map<String, Integer> answers = request.answers();
        if (answers == null || answers.isEmpty()) {
            throw new BadRequestException("Survey answers cannot be empty.");
        }

        for (SurveyItemDto item : expectedItems) {
            Integer score = answers.get(item.key());
            if (score == null || score < 1 || score > 5) {
                throw new BadRequestException("Every item must be answered with a score between 1 and 5. Missing or invalid: " + item.key());
            }
        }

        String cleanComment = sanitizeComment(request.comment());

        SurveyResponse response = new SurveyResponse(user, user.getRole(), version, cleanComment);
        for (SurveyItemDto item : expectedItems) {
            response.addAnswer(item.key(), answers.get(item.key()));
        }

        surveyResponseRepository.save(response);
    }

    /**
     * Compiles institution-wide usability survey results and evaluates against the 4.0 out of 5 target.
     */
    @Transactional(readOnly = true)
    public AdminSurveySummaryDto getAdminSurveySummary(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));
        Institution institution = tenantAccess.requireCallerInstitution(admin);

        List<SurveyResponse> responses = surveyResponseRepository.findByUserInstitutionIdWithAnswers(institution.getId());

        List<SurveyResponse> studentResponses = responses.stream().filter(r -> r.getRole() == Role.STUDENT).toList();
        List<SurveyResponse> teacherResponses = responses.stream().filter(r -> r.getRole() == Role.TEACHER).toList();

        int studentCount = studentResponses.size();
        int teacherCount = teacherResponses.size();
        int totalResponses = responses.size();

        // Calculate student item averages
        Map<String, Double> studentItemAverages = computeItemAverages(studentResponses, STUDENT_SURVEY_ITEMS);
        // Calculate teacher item averages
        Map<String, Double> teacherItemAverages = computeItemAverages(teacherResponses, TEACHER_SURVEY_ITEMS);

        // Overall averages
        double studentAvg = computeOverallAverage(studentResponses);
        double teacherAvg = computeOverallAverage(teacherResponses);
        double overallAvg = computeOverallAverage(responses);

        // Percentage of respondents whose personal average score is >= 4.0
        long satisfiedCount = responses.stream()
                .filter(r -> !r.getAnswers().isEmpty() &&
                        r.getAnswers().stream().mapToInt(SurveyAnswer::getScore).average().orElse(0.0) >= 4.0)
                .count();
        double satisfiedPercentage = totalResponses == 0 ? 0.0 : round1((double) satisfiedCount / totalResponses * 100.0);

        // Target check: >= 4.0 out of 5 across at least 5 responses per role
        String targetCheckStatus;
        String targetCheckSentence;
        if (studentCount < 5 || teacherCount < 5) {
            targetCheckStatus = "NOT_ENOUGH_DATA";
            targetCheckSentence = String.format(Locale.US,
                    "Usability target requires at least 5 responses per role (%d student, %d teacher responses recorded; overall average is %.2f / 5.0).",
                    studentCount, teacherCount, overallAvg);
        } else if (overallAvg >= 4.0) {
            targetCheckStatus = "MET";
            targetCheckSentence = String.format(Locale.US,
                    "Usability target MET: Overall average score is %.2f / 5.0 (≥ 4.0 target satisfied across %d respondents).",
                    overallAvg, totalResponses);
        } else {
            targetCheckStatus = "NOT_MET";
            targetCheckSentence = String.format(Locale.US,
                    "Usability target NOT MET: Overall average score is %.2f / 5.0 (< 4.0 target across %d respondents).",
                    overallAvg, totalResponses);
        }

        // Recent anonymous comments (no names or emails)
        List<AdminSurveyCommentDto> comments = responses.stream()
                .filter(r -> r.getComment() != null && !r.getComment().isBlank())
                .sorted(Comparator.comparing(SurveyResponse::getCreatedAt).reversed())
                .limit(20)
                .map(r -> new AdminSurveyCommentDto(r.getRole().name(), r.getComment(), r.getCreatedAt()))
                .toList();

        return new AdminSurveySummaryDto(
                totalResponses,
                studentCount,
                teacherCount,
                studentAvg,
                teacherAvg,
                overallAvg,
                satisfiedPercentage,
                studentItemAverages,
                teacherItemAverages,
                targetCheckStatus,
                targetCheckSentence,
                comments
        );
    }

    /**
     * Generates a formula-safe CSV export of all survey responses with pseudonymous respondent codes.
     */
    @Transactional(readOnly = true)
    public String exportAdminSurveyCsv(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));
        Institution institution = tenantAccess.requireCallerInstitution(admin);

        List<SurveyResponse> responses = surveyResponseRepository.findByUserInstitutionIdWithAnswers(institution.getId());

        // Sort responses stably by user ID
        List<SurveyResponse> sorted = new ArrayList<>(responses);
        sorted.sort(Comparator.comparing(r -> r.getUser().getId()));

        Map<Long, String> pseudonyms = new HashMap<>();
        for (int i = 0; i < sorted.size(); i++) {
            SurveyResponse r = sorted.get(i);
            String prefix = r.getRole() == Role.STUDENT ? "STU" : "TEA";
            pseudonyms.put(r.getUser().getId(), String.format("%s%03d", prefix, i + 1));
        }

        // Item statement lookup map
        Map<String, String> statementLookup = new HashMap<>();
        STUDENT_SURVEY_ITEMS.forEach(item -> statementLookup.put(item.key(), item.statement()));
        TEACHER_SURVEY_ITEMS.forEach(item -> statementLookup.put(item.key(), item.statement()));

        StringBuilder sb = new StringBuilder();
        sb.append("Respondent Code,Role,Survey Version,Item Key,Item Statement,Score,Respondent Average,Comment,Submitted At\r\n");

        for (SurveyResponse r : sorted) {
            String code = pseudonyms.getOrDefault(r.getUser().getId(), "U000");
            double respAvg = round2(r.getAnswers().stream().mapToInt(SurveyAnswer::getScore).average().orElse(0.0));

            for (SurveyAnswer ans : r.getAnswers()) {
                sb.append(MeasurementRatingService.escapeCsvCell(code)).append(",");
                sb.append(MeasurementRatingService.escapeCsvCell(r.getRole().name())).append(",");
                sb.append(MeasurementRatingService.escapeCsvCell(r.getSurveyVersion())).append(",");
                sb.append(MeasurementRatingService.escapeCsvCell(ans.getItemKey())).append(",");
                sb.append(MeasurementRatingService.escapeCsvCell(statementLookup.getOrDefault(ans.getItemKey(), ans.getItemKey()))).append(",");
                sb.append(ans.getScore()).append(",");
                sb.append(String.format(Locale.US, "%.2f", respAvg)).append(",");
                sb.append(MeasurementRatingService.escapeCsvCell(r.getComment())).append(",");
                sb.append(MeasurementRatingService.escapeCsvCell(r.getCreatedAt().toString())).append("\r\n");
            }
        }

        return sb.toString();
    }

    private List<SurveyItemDto> getItemsForRole(Role role) {
        if (role == Role.STUDENT) {
            return STUDENT_SURVEY_ITEMS;
        } else if (role == Role.TEACHER) {
            return TEACHER_SURVEY_ITEMS;
        }
        return List.of();
    }

    private Map<String, Double> computeItemAverages(List<SurveyResponse> responses, List<SurveyItemDto> items) {
        Map<String, List<Integer>> scoresPerItem = new HashMap<>();
        for (SurveyResponse r : responses) {
            for (SurveyAnswer a : r.getAnswers()) {
                scoresPerItem.computeIfAbsent(a.getItemKey(), k -> new ArrayList<>()).add(a.getScore());
            }
        }

        Map<String, Double> result = new LinkedHashMap<>();
        for (SurveyItemDto item : items) {
            List<Integer> scores = scoresPerItem.getOrDefault(item.key(), List.of());
            double avg = scores.isEmpty() ? 0.0 : round2(scores.stream().mapToInt(Integer::intValue).average().orElse(0.0));
            result.put(item.key(), avg);
        }
        return result;
    }

    private double computeOverallAverage(List<SurveyResponse> responses) {
        if (responses.isEmpty()) return 0.0;
        int totalScore = 0;
        int totalCount = 0;
        for (SurveyResponse r : responses) {
            for (SurveyAnswer a : r.getAnswers()) {
                totalScore += a.getScore();
                totalCount++;
            }
        }
        return totalCount == 0 ? 0.0 : round2((double) totalScore / totalCount);
    }

    private String sanitizeComment(String comment) {
        if (comment == null) return null;
        String trimmed = comment.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.length() > 500) {
            throw new BadRequestException("Survey comment cannot exceed 500 characters");
        }
        return trimmed;
    }

    private static double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private static double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}

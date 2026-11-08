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
 * Core service powering the Validation Lab.
 * Enables teachers to label student topic mastery BLIND (without system analysis),
 * tracks snapshots of system mastery at label time, and evaluates accuracy metrics
 * against the project's >=85% agreement objective over a >=30 student sample.
 */
@Service
public class ValidationService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ClassEntityRepository classEntityRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GapValidationLabelRepository gapValidationLabelRepository;
    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final StudentTopicMasteryRepository studentTopicMasteryRepository;
    private final TenantAccess tenantAccess;

    public ValidationService(
            UserRepository userRepository,
            TopicRepository topicRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            GapValidationLabelRepository gapValidationLabelRepository,
            AttemptRepository attemptRepository,
            AnswerRepository answerRepository,
            StudentTopicMasteryRepository studentTopicMasteryRepository,
            TenantAccess tenantAccess) {
        this.userRepository = userRepository;
        this.topicRepository = topicRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.gapValidationLabelRepository = gapValidationLabelRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Lists enrolled students with blind validation progress for a class.
     * CRITICAL: Strictly zero system outputs (no mastery %, status, trend, needsAttention).
     */
    @Transactional(readOnly = true)
    public List<ValidationStudentSummaryDto> getValidationStudents(Long classId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityOrderByEnrolledAtDesc(cls);
        List<Topic> subjectTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(cls.getSubject());
        int totalTopicsCount = subjectTopics.size();
        Set<Long> subjectTopicIds = subjectTopics.stream().map(Topic::getId).collect(Collectors.toSet());

        List<ValidationStudentSummaryDto> result = new ArrayList<>();

        for (Enrollment enr : enrollments) {
            User student = enr.getStudent();
            if (student.getRole() != Role.STUDENT) continue;

            List<GapValidationLabel> labels = gapValidationLabelRepository.findByStudentIdAndSource(
                    student.getId(), ValidationSource.TEACHER
            );

            long currentSubmittedAttempts = attemptRepository.countByStudentIdAndClassIdAndStatus(
                    student.getId(), classId, AttemptStatus.SUBMITTED
            );

            int labeledTopicsCount = 0;
            boolean isStale = false;
            Instant lastLabeledAt = null;

            for (GapValidationLabel l : labels) {
                if (subjectTopicIds.contains(l.getTopic().getId())) {
                    labeledTopicsCount++;
                    if (lastLabeledAt == null || l.getLabeledAt().isAfter(lastLabeledAt)) {
                        lastLabeledAt = l.getLabeledAt();
                    }
                    if (l.getAttemptCountAtLabel() != null && currentSubmittedAttempts > l.getAttemptCountAtLabel()) {
                        isStale = true;
                    }
                }
            }

            result.add(new ValidationStudentSummaryDto(
                    student.getId(),
                    student.getFullName(),
                    student.getEmail(),
                    labeledTopicsCount,
                    totalTopicsCount,
                    isStale,
                    lastLabeledAt
            ));
        }

        // Sort: students needing labeling first, then alphabetically by name
        result.sort(Comparator.comparingInt(ValidationStudentSummaryDto::labeledTopicsCount)
                .thenComparing(ValidationStudentSummaryDto::fullName));

        return result;
    }

    /**
     * Retrieves per-topic raw question evidence and existing teacher labels for a single student.
     * CRITICAL: Strictly zero system outputs (no mastery %, status, trend, needsAttention).
     */
    @Transactional(readOnly = true)
    public ValidationStudentDetailDto getValidationStudentDetail(Long classId, Long studentId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (!enrollmentRepository.existsByStudentIdAndClassEntityId(studentId, classId)) {
            throw new ResourceNotFoundException("Student not enrolled in class: " + classId);
        }

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(cls.getSubject());

        // Raw question evidence: answers from SUBMITTED attempts in this class
        List<Answer> answers = answerRepository.findStudentClassAnswers(studentId, classId, AttemptStatus.SUBMITTED);
        Map<Long, List<Answer>> answersByTopic = new HashMap<>();
        for (Answer ans : answers) {
            if (ans.getQuestion() != null && ans.getQuestion().getTopic() != null) {
                answersByTopic.computeIfAbsent(ans.getQuestion().getTopic().getId(), k -> new ArrayList<>()).add(ans);
            }
        }

        // Existing teacher labels
        List<GapValidationLabel> existingLabels = gapValidationLabelRepository.findByStudentIdAndSource(
                studentId, ValidationSource.TEACHER
        );
        Map<Long, GapValidationLabel> labelByTopic = existingLabels.stream()
                .collect(Collectors.toMap(l -> l.getTopic().getId(), l -> l, (a, b) -> a));

        long currentSubmittedAttempts = attemptRepository.countByStudentIdAndClassIdAndStatus(
                studentId, classId, AttemptStatus.SUBMITTED
        );

        List<ValidationTopicEvidenceDto> topicEvidenceList = new ArrayList<>();

        for (Topic t : topics) {
            List<Answer> topicAnswers = answersByTopic.getOrDefault(t.getId(), Collections.emptyList());
            List<ValidationQuestionEvidenceDto> evidenceItems = new ArrayList<>();

            for (Answer a : topicAnswers) {
                Question q = a.getQuestion();
                double maxPoints = (q.getPoints() != null) ? q.getPoints() : 1.0;
                double earned = (a.getFinalScore() != null) ? a.getFinalScore() : 0.0;
                boolean isCorrect = earned >= maxPoints;

                String studentAns = "Left blank";
                if (a.getSelectedChoice() != null) {
                    studentAns = a.getSelectedChoice().getText();
                } else if (a.getTextAnswer() != null && !a.getTextAnswer().isBlank()) {
                    studentAns = a.getTextAnswer();
                }

                Instant submittedAt = (a.getAttempt().getSubmittedAt() != null)
                        ? a.getAttempt().getSubmittedAt()
                        : a.getAttempt().getStartedAt();

                evidenceItems.add(new ValidationQuestionEvidenceDto(
                        q.getId(),
                        q.getText(),
                        studentAns,
                        isCorrect,
                        earned,
                        maxPoints,
                        submittedAt,
                        a.getAttempt().getAttemptNumber(),
                        a.getAttempt().getAssessment() != null ? a.getAttempt().getAssessment().getTitle() : "Quiz"
                ));
            }

            GapValidationLabel existing = labelByTopic.get(t.getId());
            ValidationLabel curLabel = existing != null ? existing.getLabel() : null;
            String curNote = existing != null ? existing.getNote() : null;
            Instant labeledAt = existing != null ? existing.getLabeledAt() : null;
            boolean isStale = existing != null
                    && existing.getAttemptCountAtLabel() != null
                    && currentSubmittedAttempts > existing.getAttemptCountAtLabel();

            topicEvidenceList.add(new ValidationTopicEvidenceDto(
                    t.getId(),
                    t.getName(),
                    t.getDescription(),
                    curLabel,
                    curNote,
                    labeledAt,
                    isStale,
                    evidenceItems
            ));
        }

        return new ValidationStudentDetailDto(
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                cls.getId(),
                cls.getName(),
                topicEvidenceList
        );
    }

    /**
     * Upserts a teacher's validation label on a topic and takes a server-side snapshot
     * of the system's mastery and status at that exact moment.
     */
    @Transactional
    public ValidationLabelSavedDto saveValidationLabel(
            Long classId,
            Long studentId,
            Long topicId,
            SaveValidationLabelRequest request,
            String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (!enrollmentRepository.existsByStudentIdAndClassEntityId(studentId, classId)) {
            throw new ResourceNotFoundException("Student not enrolled in class: " + classId);
        }

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));

        if (topic.getSubject() == null || !topic.getSubject().getId().equals(cls.getSubject().getId())) {
            throw new BadRequestException("Topic does not belong to the class subject: " + cls.getSubject().getName());
        }

        if (request.getLabel() == null) {
            throw new BadRequestException("Validation label cannot be null");
        }

        String note = request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null;
        if (note != null && note.length() > 300) {
            throw new BadRequestException("Note cannot exceed 300 characters");
        }

        // Server-side snapshot: current class mastery, status, and attempt count in this class
        Optional<StudentTopicMastery> masteryOpt = studentTopicMasteryRepository.findByStudentIdAndClassroomIdAndTopicId(studentId, classId, topicId);
        if (masteryOpt.isEmpty()) {
            masteryOpt = studentTopicMasteryRepository.findByStudentIdAndTopicId(studentId, topicId);
        }
        Double systemMastery = masteryOpt.map(StudentTopicMastery::getMasteryPercent).orElse(0.0);
        MasteryStatus systemStatus = masteryOpt.map(StudentTopicMastery::getStatus).orElse(MasteryStatus.INSUFFICIENT_DATA);

        int currentAttempts = (int) attemptRepository.countByStudentIdAndClassIdAndStatus(
                studentId, classId, AttemptStatus.SUBMITTED
        );

        Instant now = Instant.now();

        GapValidationLabel label = gapValidationLabelRepository.findByStudentIdAndClassroomIdAndTopicIdAndSource(
                studentId, classId, topicId, ValidationSource.TEACHER
        ).orElseGet(() -> gapValidationLabelRepository.findByStudentIdAndTopicIdAndSource(
                studentId, topicId, ValidationSource.TEACHER
        ).orElseGet(() -> new GapValidationLabel(
                student, topic, request.getLabel(), ValidationSource.TEACHER, teacher, now
        )));

        label.setLabel(request.getLabel());
        label.setNote(note);
        label.setLabeledBy(teacher);
        label.setLabeledAt(now);
        label.setClassroom(cls);
        label.setAttemptCountAtLabel(currentAttempts);
        label.setSystemStatusAtLabel(systemStatus);
        label.setSystemMasteryAtLabel(systemMastery);

        gapValidationLabelRepository.save(label);

        return new ValidationLabelSavedDto(topicId, label.getLabel(), label.getNote(), label.getLabeledAt(), false);
    }

    /**
     * Generates a validation report for a teacher's classroom section.
     */
    @Transactional(readOnly = true)
    public ValidationReportDto getClassValidationReport(
            Long classId,
            String sourceParam,
            boolean includeStale,
            String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        ValidationSource source = parseSource(sourceParam);
        List<GapValidationLabel> labels = gapValidationLabelRepository.findByClassIdAndSource(classId, source);

        return computeReport(labels, source, includeStale, cls.getId(), cls.getName(), cls.getInstitution().getName());
    }

    /**
     * Generates an institution-wide validation report for school administrators.
     */
    @Transactional(readOnly = true)
    public ValidationReportDto getAdminValidationReport(
            String sourceParam,
            boolean includeStale,
            String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));
        Institution inst = tenantAccess.requireCallerInstitution(admin);

        ValidationSource source = parseSource(sourceParam);
        List<GapValidationLabel> labels = gapValidationLabelRepository.findByInstitutionIdAndSource(inst.getId(), source);

        return computeReport(labels, source, includeStale, null, "All Institution Classes", inst.getName());
    }

    /**
     * Exports validation records to a formula-safe, pseudonymized CSV format.
     */
    @Transactional(readOnly = true)
    public String exportValidationCsv(Long classId, String sourceParam, boolean includeStale, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        ValidationSource source = parseSource(sourceParam);
        List<GapValidationLabel> labels = gapValidationLabelRepository.findByClassIdAndSource(classId, source);

        // Pseudonymize students: sort student IDs ascending, assign S001, S002...
        List<Long> studentIds = labels.stream()
                .map(l -> l.getStudent().getId())
                .distinct()
                .sorted()
                .toList();

        Map<Long, String> pseudonyms = new HashMap<>();
        for (int i = 0; i < studentIds.size(); i++) {
            pseudonyms.put(studentIds.get(i), String.format("S%03d", i + 1));
        }

        // Cache attempt counts for staleness check
        Map<Long, Long> attemptCounts = new HashMap<>();
        for (Long stId : studentIds) {
            attemptCounts.put(stId, attemptRepository.countByStudentIdAndClassIdAndStatus(stId, classId, AttemptStatus.SUBMITTED));
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Student Code,Topic Name,Teacher Label,System Status,System Mastery %,Stale,Labeled At\r\n");

        for (GapValidationLabel l : labels) {
            boolean isStale = false;
            Long stId = l.getStudent().getId();
            long curAttempts = attemptCounts.getOrDefault(stId, 0L);
            if (l.getAttemptCountAtLabel() != null && curAttempts > l.getAttemptCountAtLabel()) {
                isStale = true;
            }

            if (!includeStale && isStale) {
                continue;
            }

            MasteryStatus status = resolveSystemStatus(l);
            Double mastery = resolveSystemMastery(l);

            sb.append(escapeCsvCell(pseudonyms.getOrDefault(stId, "S000"))).append(",");
            sb.append(escapeCsvCell(l.getTopic().getName())).append(",");
            sb.append(escapeCsvCell(l.getLabel().name())).append(",");
            sb.append(escapeCsvCell(status != null ? status.name() : "INSUFFICIENT_DATA")).append(",");
            sb.append(escapeCsvCell(mastery != null ? String.format(Locale.US, "%.1f", mastery) : "0.0")).append(",");
            sb.append(escapeCsvCell(isStale ? "YES" : "NO")).append(",");
            sb.append(escapeCsvCell(l.getLabeledAt().toString())).append("\r\n");
        }

        return sb.toString();
    }

    /**
     * SINGLE SHARED REPORT COMPUTATION FUNCTION
     * Evaluates accuracy, precision, recall, F1, Cohen's kappa, per-topic accuracy,
     * threshold sensitivity, and 85% research target compliance.
     */
    public ValidationReportDto computeReport(
            List<GapValidationLabel> labels,
            ValidationSource source,
            boolean includeStale,
            Long classId,
            String className,
            String institutionName) {

        // Build stable student pseudonyms
        List<Long> studentIds = labels.stream()
                .map(l -> l.getStudent().getId())
                .distinct()
                .sorted()
                .toList();

        Map<Long, String> pseudonyms = new HashMap<>();
        for (int i = 0; i < studentIds.size(); i++) {
            pseudonyms.put(studentIds.get(i), String.format("S%03d", i + 1));
        }

        // Cache submitted attempts for staleness check
        Map<String, Long> attemptsMap = new HashMap<>();
        for (GapValidationLabel l : labels) {
            Long stId = l.getStudent().getId();
            Long cId = l.getClassroom() != null ? l.getClassroom().getId() : classId;
            if (cId != null) {
                String key = stId + "_" + cId;
                attemptsMap.computeIfAbsent(key, k ->
                        attemptRepository.countByStudentIdAndClassIdAndStatus(stId, cId, AttemptStatus.SUBMITTED)
                );
            }
        }

        int totalLabels = labels.size();
        int excludedCannotJudge = 0;
        int excludedInsufficientData = 0;
        int excludedStale = 0;

        List<UsablePair> usablePairs = new ArrayList<>();

        for (GapValidationLabel l : labels) {
            Long stId = l.getStudent().getId();
            Long cId = l.getClassroom() != null ? l.getClassroom().getId() : classId;
            boolean isStale = false;
            if (cId != null) {
                Long cur = attemptsMap.get(stId + "_" + cId);
                if (cur != null && l.getAttemptCountAtLabel() != null && cur > l.getAttemptCountAtLabel()) {
                    isStale = true;
                }
            }

            if (l.getLabel() == ValidationLabel.CANNOT_JUDGE) {
                excludedCannotJudge++;
                continue;
            }

            MasteryStatus status = resolveSystemStatus(l);
            if (status == null || status == MasteryStatus.INSUFFICIENT_DATA) {
                excludedInsufficientData++;
                continue;
            }

            if (!includeStale && isStale) {
                excludedStale++;
                continue;
            }

            Double mastery = resolveSystemMastery(l);

            usablePairs.add(new UsablePair(l, status, mastery, isStale));
        }

        // 1. Confusion Matrix & Agreement Metrics
        // Positive = WEAK, Negative = NOT_WEAK
        int tp = 0; // Teacher WEAK, System GAP
        int fp = 0; // Teacher NOT_WEAK, System GAP
        int tn = 0; // Teacher NOT_WEAK, System DEVELOPING/STRENGTH
        int fn = 0; // Teacher WEAK, System DEVELOPING/STRENGTH

        Map<Long, TopicAccumulator> perTopicMap = new LinkedHashMap<>();
        Map<Long, StudentAccumulator> perStudentMap = new HashMap<>();
        List<ValidationDisagreementDto> disagreements = new ArrayList<>();

        for (UsablePair pair : usablePairs) {
            boolean teacherWeak = (pair.label.getLabel() == ValidationLabel.WEAK);
            boolean systemWeak = (pair.status == MasteryStatus.GAP);

            if (teacherWeak && systemWeak) tp++;
            else if (!teacherWeak && systemWeak) fp++;
            else if (!teacherWeak && !systemWeak) tn++;
            else fn++;

            boolean isMatch = (teacherWeak == systemWeak);

            // Per Topic
            Topic topic = pair.label.getTopic();
            TopicAccumulator ta = perTopicMap.computeIfAbsent(topic.getId(), k -> new TopicAccumulator(topic.getId(), topic.getName()));
            ta.usableCount++;
            if (isMatch) ta.matchCount++;
            if (teacherWeak) ta.teacherWeakCount++;
            if (systemWeak) ta.systemWeakCount++;

            // Per Student Exact Match
            StudentAccumulator sa = perStudentMap.computeIfAbsent(pair.label.getStudent().getId(), k -> new StudentAccumulator());
            sa.totalCount++;
            if (isMatch) sa.matchCount++;

            // Disagreements list
            if (!isMatch) {
                disagreements.add(new ValidationDisagreementDto(
                        pseudonyms.getOrDefault(pair.label.getStudent().getId(), "S000"),
                        topic.getId(),
                        topic.getName(),
                        pair.label.getLabel(),
                        pair.status,
                        pair.mastery,
                        pair.label.getNote(),
                        pair.isStale
                ));
            }
        }

        int usableCount = usablePairs.size();
        Set<Long> uniqueStudentsWithUsable = perStudentMap.keySet();
        int studentsWithUsableLabel = uniqueStudentsWithUsable.size();

        double accuracy = usableCount > 0 ? round1(((double) (tp + tn) / usableCount) * 100.0) : 0.0;
        double precision = (tp + fp) > 0 ? round1(((double) tp / (tp + fp)) * 100.0) : 0.0;
        double recall = (tp + fn) > 0 ? round1(((double) tp / (tp + fn)) * 100.0) : 0.0;
        double f1 = (precision + recall) > 0 ? round1((2.0 * precision * recall) / (precision + recall)) : 0.0;
        double cohenKappa = calculateCohenKappa(tp, fp, tn, fn);

        // Student-level exact match
        int studentExactMatchCount = 0;
        for (StudentAccumulator sa : perStudentMap.values()) {
            if (sa.totalCount > 0 && sa.totalCount == sa.matchCount) {
                studentExactMatchCount++;
            }
        }
        double studentExactMatchPercent = studentsWithUsableLabel > 0
                ? round1(((double) studentExactMatchCount / studentsWithUsableLabel) * 100.0)
                : 0.0;

        // 2. Target Check: >=85.0% on >=30 students
        String targetStatus;
        String targetSentence;
        if (studentsWithUsableLabel < 30) {
            targetStatus = "NOT_ENOUGH_RECORDS";
            targetSentence = String.format(Locale.US,
                    "Target requires at least 30 validated students with ≥85.0%% agreement. Currently %d evaluated (%d more needed).",
                    studentsWithUsableLabel, 30 - studentsWithUsableLabel
            );
        } else if (accuracy >= 85.0) {
            targetStatus = "MET";
            targetSentence = String.format(Locale.US,
                    "Target met: %.1f%% agreement across %d students (objective is ≥85.0%% on ≥30 records).",
                    accuracy, studentsWithUsableLabel
            );
        } else {
            targetStatus = "NOT_MET";
            targetSentence = String.format(Locale.US,
                    "Target not met: %.1f%% agreement across %d students (objective is ≥85.0%%).",
                    accuracy, studentsWithUsableLabel
            );
        }

        // 3. Per-topic breakdown
        List<ValidationTopicMetricDto> perTopic = perTopicMap.values().stream()
                .map(ta -> new ValidationTopicMetricDto(
                        ta.topicId,
                        ta.topicName,
                        ta.usableCount,
                        ta.matchCount,
                        ta.usableCount > 0 ? round1(((double) ta.matchCount / ta.usableCount) * 100.0) : 0.0,
                        ta.teacherWeakCount,
                        ta.systemWeakCount
                ))
                .toList();

        // 4. Threshold Sensitivity Simulation: [50, 55, 60, 65, 70, 75]
        double[] testThresholds = {50.0, 55.0, 60.0, 65.0, 70.0, 75.0};
        List<ValidationThresholdSensitivityDto> sensitivity = new ArrayList<>();
        Double bestThreshold = 60.0;
        double bestAgreement = -1.0;

        for (double t : testThresholds) {
            int t_tp = 0, t_fp = 0, t_tn = 0, t_fn = 0;
            for (UsablePair pair : usablePairs) {
                boolean teacherWeak = (pair.label.getLabel() == ValidationLabel.WEAK);
                boolean sysWeakAtT = (pair.mastery != null && pair.mastery < t);

                if (teacherWeak && sysWeakAtT) t_tp++;
                else if (!teacherWeak && sysWeakAtT) t_fp++;
                else if (!teacherWeak && !sysWeakAtT) t_tn++;
                else t_fn++;
            }

            double agreementT = usableCount > 0 ? round1(((double) (t_tp + t_tn) / usableCount) * 100.0) : 0.0;
            double recallT = (t_tp + t_fn) > 0 ? round1(((double) t_tp / (t_tp + t_fn)) * 100.0) : 0.0;

            sensitivity.add(new ValidationThresholdSensitivityDto(
                    t, agreementT, recallT, t_tp, t_fp, t_tn, t_fn
            ));

            if (agreementT > bestAgreement || (agreementT == bestAgreement && Math.abs(t - 60.0) < Math.abs(bestThreshold - 60.0))) {
                bestAgreement = agreementT;
                bestThreshold = t;
            }
        }

        return new ValidationReportDto(
                classId,
                className,
                institutionName,
                source,
                source == ValidationSource.SYNTHETIC,
                includeStale,
                new ValidationSampleSizeDto(
                        studentsWithUsableLabel,
                        usableCount,
                        totalLabels,
                        excludedCannotJudge,
                        excludedInsufficientData,
                        excludedStale
                ),
                new ValidationMetricsDto(
                        accuracy,
                        precision,
                        recall,
                        f1,
                        cohenKappa,
                        studentExactMatchCount,
                        studentExactMatchPercent
                ),
                new ValidationTargetCheckDto(
                        85.0,
                        30,
                        studentsWithUsableLabel,
                        targetStatus,
                        targetSentence
                ),
                new ValidationConfusionMatrixDto(tp, fp, tn, fn),
                perTopic,
                sensitivity,
                bestThreshold,
                disagreements
        );
    }

    /**
     * Calculates Cohen's Kappa for inter-rater agreement between Teacher and System.
     */
    public static double calculateCohenKappa(int tp, int fp, int tn, int fn) {
        int n = tp + fp + tn + fn;
        if (n == 0) return 0.0;

        double po = (double) (tp + tn) / n;
        double pYes = ((double) (tp + fn) / n) * ((double) (tp + fp) / n);
        double pNo = ((double) (tn + fp) / n) * ((double) (tn + fn) / n);
        double pe = pYes + pNo;

        if (1.0 - pe == 0.0) {
            return (po == pe) ? 0.0 : 1.0;
        }

        double kappa = (po - pe) / (1.0 - pe);
        return Math.round(kappa * 1000.0) / 1000.0;
    }

    /**
     * Resolves the snapshot or fallback system status for a label.
     */
    private MasteryStatus resolveSystemStatus(GapValidationLabel l) {
        if (l.getSystemStatusAtLabel() != null) {
            return l.getSystemStatusAtLabel();
        }
        // Fallback: look up by class if available, else by student/topic
        if (l.getClassroom() != null) {
            Optional<StudentTopicMastery> classMastery = studentTopicMasteryRepository
                    .findByStudentIdAndClassroomIdAndTopicId(l.getStudent().getId(), l.getClassroom().getId(), l.getTopic().getId());
            if (classMastery.isPresent()) {
                return classMastery.get().getStatus();
            }
        }
        return studentTopicMasteryRepository.findByStudentIdAndTopicId(l.getStudent().getId(), l.getTopic().getId())
                .map(StudentTopicMastery::getStatus)
                .orElse(MasteryStatus.INSUFFICIENT_DATA);
    }

    /**
     * Resolves the snapshot or fallback system mastery percentage for a label.
     */
    private Double resolveSystemMastery(GapValidationLabel l) {
        if (l.getSystemMasteryAtLabel() != null) {
            return l.getSystemMasteryAtLabel();
        }
        if (l.getClassroom() != null) {
            Optional<StudentTopicMastery> classMastery = studentTopicMasteryRepository
                    .findByStudentIdAndClassroomIdAndTopicId(l.getStudent().getId(), l.getClassroom().getId(), l.getTopic().getId());
            if (classMastery.isPresent()) {
                return classMastery.get().getMasteryPercent();
            }
        }
        return studentTopicMasteryRepository.findByStudentIdAndTopicId(l.getStudent().getId(), l.getTopic().getId())
                .map(StudentTopicMastery::getMasteryPercent)
                .orElse(0.0);
    }

    private ValidationSource parseSource(String sourceParam) {
        if (sourceParam == null || sourceParam.isBlank()) {
            return ValidationSource.TEACHER;
        }
        try {
            return ValidationSource.valueOf(sourceParam.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid validation source: " + sourceParam + ". Must be TEACHER or SYNTHETIC.");
        }
    }

    private static double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    /**
     * Formula-injection-safe CSV cell escaper.
     * Escapes standard CSV separators and prefixes active formula triggers (=, +, -, @, \t, \r) with a single quote.
     */
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

    private static class UsablePair {
        final GapValidationLabel label;
        final MasteryStatus status;
        final Double mastery;
        final boolean isStale;

        UsablePair(GapValidationLabel label, MasteryStatus status, Double mastery, boolean isStale) {
            this.label = label;
            this.status = status;
            this.mastery = mastery;
            this.isStale = isStale;
        }
    }

    private static class TopicAccumulator {
        final Long topicId;
        final String topicName;
        int usableCount = 0;
        int matchCount = 0;
        int teacherWeakCount = 0;
        int systemWeakCount = 0;

        TopicAccumulator(Long topicId, String topicName) {
            this.topicId = topicId;
            this.topicName = topicName;
        }
    }

    private static class StudentAccumulator {
        int totalCount = 0;
        int matchCount = 0;
    }
}

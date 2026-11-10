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
 * enforces random topic sampling (3 topics per student, or all eligible if < 3),
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
    private final StudentValidationAssignmentRepository studentValidationAssignmentRepository;
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
            StudentValidationAssignmentRepository studentValidationAssignmentRepository,
            TenantAccess tenantAccess) {
        this.userRepository = userRepository;
        this.topicRepository = topicRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.gapValidationLabelRepository = gapValidationLabelRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.studentValidationAssignmentRepository = studentValidationAssignmentRepository;
        this.tenantAccess = tenantAccess;
    }

    /**
     * Retrieves or deterministically generates the 3 assigned topics for a student in a class.
     * Rules:
     * - If assignments already exist in DB, returns them directly (never re-rolled).
     * - If legacy labels exist, locks them in as assignments so existing labels are never lost.
     * - Eligible topics: student's class mastery is not INSUFFICIENT_DATA (or >= 3 distinct questions).
     * - If fewer than 3 eligible topics, assigns all of them.
     * - If > 3 eligible topics, spreads picks reasonably evenly across topics based on class-wide
     *   assignment frequency, using a deterministic seed for audit.
     * - Never leaks mastery, status, or gap fields to the teacher.
     */
    @Transactional
    public List<Topic> getOrAssignTopicsForStudent(ClassEntity cls, User student) {
        List<StudentValidationAssignment> existing = studentValidationAssignmentRepository
                .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(student.getId(), cls.getId());

        // Check for existing teacher labels in this class for this student
        List<GapValidationLabel> existingLabels = gapValidationLabelRepository
                .findByClassIdAndSource(cls.getId(), ValidationSource.TEACHER)
                .stream()
                .filter(l -> l.getStudent().getId().equals(student.getId()))
                .toList();

        // If assignments already exist:
        // Freeze once the student has at least one saved label, or already has >= 3 assigned topics
        if (!existing.isEmpty()) {
            if (!existingLabels.isEmpty() || existing.size() >= 3) {
                return existing.stream().map(StudentValidationAssignment::getTopic).toList();
            }
        }

        Set<Long> alreadyAssignedTopicIds = new HashSet<>();
        List<Topic> assignedTopics = new ArrayList<>();
        String seed = UUID.randomUUID().toString();
        int order = 1;

        if (!existing.isEmpty()) {
            // Top-up path: zero saved labels and existing.size() < 3. Keep existing topics and order.
            for (StudentValidationAssignment a : existing) {
                assignedTopics.add(a.getTopic());
                alreadyAssignedTopicIds.add(a.getTopic().getId());
            }
            int maxOrder = existing.stream().mapToInt(StudentValidationAssignment::getAssignedOrder).max().orElse(existing.size());
            order = maxOrder + 1;
        } else if (!existingLabels.isEmpty()) {
            // Legacy backfill: student already had labels before assignments table existed
            for (GapValidationLabel l : existingLabels) {
                Topic t = l.getTopic();
                if (t != null && t.getSubject() != null && t.getSubject().getId().equals(cls.getSubject().getId())) {
                    if (alreadyAssignedTopicIds.add(t.getId())) {
                        StudentValidationAssignment sva = new StudentValidationAssignment(
                                student, cls, t, l.getLabeledAt() != null ? l.getLabeledAt() : Instant.now(), seed, order++
                        );
                        studentValidationAssignmentRepository.save(sva);
                        assignedTopics.add(t);
                    }
                }
            }
            if (assignedTopics.size() >= 3) {
                return assignedTopics;
            }
        }

        // Find all topics in the class subject
        List<Topic> subjectTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(cls.getSubject());

        // Find raw answers to count distinct questions per topic in this class
        List<Answer> answers = answerRepository.findStudentClassAnswers(student.getId(), cls.getId(), AttemptStatus.SUBMITTED);
        Map<Long, Set<Long>> distinctQuestionsByTopic = new HashMap<>();
        for (Answer ans : answers) {
            if (ans.getQuestion() != null && ans.getQuestion().getTopic() != null) {
                distinctQuestionsByTopic.computeIfAbsent(ans.getQuestion().getTopic().getId(), k -> new HashSet<>())
                        .add(ans.getQuestion().getId());
            }
        }

        // Determine eligibility: not INSUFFICIENT_DATA (mastery status != INSUFFICIENT_DATA or distinct questions >= 3)
        List<Topic> eligibleTopics = new ArrayList<>();
        for (Topic t : subjectTopics) {
            if (alreadyAssignedTopicIds.contains(t.getId())) {
                continue;
            }
            Optional<StudentTopicMastery> classMastery = studentTopicMasteryRepository
                    .findByStudentIdAndClassroomIdAndTopicId(student.getId(), cls.getId(), t.getId());
            if (classMastery.isEmpty()) {
                classMastery = studentTopicMasteryRepository.findByStudentIdAndTopicId(student.getId(), t.getId());
            }

            int distinctCount = distinctQuestionsByTopic.getOrDefault(t.getId(), Collections.emptySet()).size();
            boolean isEligible = (classMastery.isPresent() && classMastery.get().getStatus() != MasteryStatus.INSUFFICIENT_DATA)
                    || distinctCount >= 3;

            if (isEligible) {
                eligibleTopics.add(t);
            }
        }

        int needed = 3 - assignedTopics.size();
        if (needed <= 0 || eligibleTopics.isEmpty()) {
            return assignedTopics;
        }

        List<Topic> chosen;
        if (eligibleTopics.size() <= needed) {
            chosen = eligibleTopics;
        } else {
            // Spread picks reasonably evenly across topics: count assignments per topic in this class
            List<Object[]> counts = studentValidationAssignmentRepository.countTopicAssignmentsByClassroom(cls.getId());
            Map<Long, Long> topicCounts = counts.stream()
                    .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (Long) arr[1]));

            // Shuffle with seed for audit repeatability, then sort by assignment count ascending
            Random rnd = new Random(seed.hashCode());
            List<Topic> shuffled = new ArrayList<>(eligibleTopics);
            Collections.shuffle(shuffled, rnd);
            shuffled.sort(Comparator.comparingLong(t -> topicCounts.getOrDefault(t.getId(), 0L)));

            chosen = shuffled.subList(0, needed);
        }

        for (Topic t : chosen) {
            StudentValidationAssignment sva = new StudentValidationAssignment(
                    student, cls, t, Instant.now(), seed, order++
            );
            studentValidationAssignmentRepository.save(sva);
            assignedTopics.add(t);
        }

        return assignedTopics;
    }

    /**
     * Lists enrolled students with blind validation progress for a class.
     * CRITICAL: Strictly zero system outputs (no mastery %, status, trend, needsAttention).
     */
    @Transactional
    public List<ValidationStudentSummaryDto> getValidationStudents(Long classId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityOrderByEnrolledAtDesc(cls);
        List<Topic> subjectTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(cls.getSubject());
        int totalTopicsCount = subjectTopics.size();

        List<ValidationStudentSummaryDto> result = new ArrayList<>();

        for (Enrollment enr : enrollments) {
            User student = enr.getStudent();
            if (student.getRole() != Role.STUDENT) continue;

            List<Topic> assignedTopics = getOrAssignTopicsForStudent(cls, student);
            Set<Long> assignedTopicIds = assignedTopics.stream().map(Topic::getId).collect(Collectors.toSet());

            List<GapValidationLabel> labels = gapValidationLabelRepository.findByClassIdAndSource(classId, ValidationSource.TEACHER)
                    .stream()
                    .filter(l -> l.getStudent().getId().equals(student.getId()))
                    .toList();

            long currentSubmittedAttempts = attemptRepository.countByStudentIdAndClassIdAndStatus(
                    student.getId(), classId, AttemptStatus.SUBMITTED
            );

            int labeledTopicsCount = 0;
            boolean isStale = false;
            Instant lastLabeledAt = null;

            for (GapValidationLabel l : labels) {
                if (assignedTopicIds.contains(l.getTopic().getId())) {
                    labeledTopicsCount++;
                    if (lastLabeledAt == null || (l.getLabeledAt() != null && l.getLabeledAt().isAfter(lastLabeledAt))) {
                        lastLabeledAt = l.getLabeledAt();
                    }
                    if (l.getAttemptCountAtLabel() != null && currentSubmittedAttempts > l.getAttemptCountAtLabel()) {
                        isStale = true;
                    }
                }
            }

            int assignedCount = assignedTopics.size();
            String progressState;
            if (assignedCount == 0) {
                progressState = "NOT_ELIGIBLE";
            } else if (labeledTopicsCount == 0) {
                progressState = "UNLABELED";
            } else if (labeledTopicsCount < assignedCount) {
                progressState = "IN_PROGRESS";
            } else {
                progressState = "COMPLETED";
            }

            result.add(new ValidationStudentSummaryDto(
                    student.getId(),
                    student.getFullName(),
                    student.getEmail(),
                    labeledTopicsCount,
                    assignedCount,
                    totalTopicsCount,
                    progressState,
                    isStale,
                    lastLabeledAt
            ));
        }

        // Sort: students needing labeling first (UNLABELED/IN_PROGRESS before COMPLETED), then by fullName
        result.sort(Comparator.comparing((ValidationStudentSummaryDto s) -> "COMPLETED".equals(s.progressState()) ? 1 : 0)
                .thenComparing(ValidationStudentSummaryDto::fullName));

        return result;
    }

    /**
     * Retrieves per-topic raw question evidence and existing teacher labels for a single student.
     * Shows only assigned topics for blind evaluation.
     * CRITICAL: Strictly zero system outputs (no mastery %, status, trend, needsAttention).
     */
    @Transactional
    public ValidationStudentDetailDto getValidationStudentDetail(Long classId, Long studentId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        ClassEntity cls = tenantAccess.requireOwnedClass(teacher, classId, classEntityRepository);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (!enrollmentRepository.existsByStudentIdAndClassEntityId(studentId, classId)) {
            throw new ResourceNotFoundException("Student not enrolled in class: " + classId);
        }

        // Deterministically get or assign the 3 sampled topics for this student
        List<Topic> assignedTopics = getOrAssignTopicsForStudent(cls, student);

        // Raw question evidence: answers from SUBMITTED attempts in this class
        List<Answer> answers = answerRepository.findStudentClassAnswers(studentId, classId, AttemptStatus.SUBMITTED);
        Map<Long, List<Answer>> answersByTopic = new HashMap<>();
        for (Answer ans : answers) {
            if (ans.getQuestion() != null && ans.getQuestion().getTopic() != null) {
                answersByTopic.computeIfAbsent(ans.getQuestion().getTopic().getId(), k -> new ArrayList<>()).add(ans);
            }
        }

        // Existing teacher labels in this class
        List<GapValidationLabel> existingLabels = gapValidationLabelRepository.findByClassIdAndSource(classId, ValidationSource.TEACHER)
                .stream()
                .filter(l -> l.getStudent().getId().equals(studentId))
                .toList();

        Map<Long, GapValidationLabel> labelByTopic = existingLabels.stream()
                .collect(Collectors.toMap(l -> l.getTopic().getId(), l -> l, (a, b) -> a));

        long currentSubmittedAttempts = attemptRepository.countByStudentIdAndClassIdAndStatus(
                studentId, classId, AttemptStatus.SUBMITTED
        );

        List<ValidationTopicEvidenceDto> topicEvidenceList = new ArrayList<>();

        for (Topic t : assignedTopics) {
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

        // Verify the topic is assigned for this student (or existing label exists for back-compat)
        List<Topic> assigned = getOrAssignTopicsForStudent(cls, student);
        boolean isAssigned = assigned.stream().anyMatch(t -> t.getId().equals(topicId));
        boolean hasExistingLabel = gapValidationLabelRepository
                .findByStudentIdAndClassroomIdAndTopicIdAndSource(studentId, classId, topicId, ValidationSource.TEACHER)
                .isPresent();

        if (!isAssigned && !hasExistingLabel) {
            if (assigned.size() < 3) {
                StudentValidationAssignment sva = new StudentValidationAssignment(
                        student, cls, topic, Instant.now(), UUID.randomUUID().toString(), assigned.size() + 1
                );
                studentValidationAssignmentRepository.save(sva);
            } else {
                throw new BadRequestException("Topic is not assigned for validation of this student: " + topic.getName());
            }
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
     * Enforces strictly zero pooling across sections or teachers.
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

        return computeReport(labels, source, includeStale, cls.getId(), cls.getName(), cls.getInstitution().getName(), 1, Collections.emptyList());
    }

    /**
     * Generates an institution-wide validation report for school administrators.
     * Combines classes for the project-level claim and includes a per-class breakdown.
     */
    @Transactional
    public ValidationReportDto getAdminValidationReport(
            String sourceParam,
            boolean includeStale,
            String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));
        Institution inst = tenantAccess.requireCallerInstitution(admin);

        ValidationSource source = parseSource(sourceParam);
        List<GapValidationLabel> labels = gapValidationLabelRepository.findByInstitutionIdAndSource(inst.getId(), source);
        List<ClassEntity> classes = classEntityRepository.findByInstitutionOrderByCreatedAtDesc(inst);

        // Group labels by classroom ID
        Map<Long, List<GapValidationLabel>> labelsByClass = labels.stream()
                .filter(l -> l.getClassroom() != null)
                .collect(Collectors.groupingBy(l -> l.getClassroom().getId()));

        List<ValidationClassBreakdownDto> classBreakdowns = new ArrayList<>();

        for (ClassEntity cls : classes) {
            List<GapValidationLabel> clsLabels = labelsByClass.getOrDefault(cls.getId(), Collections.emptyList());
            List<Enrollment> enrollments = enrollmentRepository.findByClassEntityOrderByEnrolledAtDesc(cls);
            int totalEnrolled = enrollments.size();

            // Count fully labeled students in this class
            Map<Long, List<GapValidationLabel>> studentLabels = clsLabels.stream()
                    .collect(Collectors.groupingBy(l -> l.getStudent().getId()));

            int fullyLabeled = 0;
            for (Enrollment enr : enrollments) {
                Long sId = enr.getStudent().getId();
                List<StudentValidationAssignment> assigns = studentValidationAssignmentRepository
                        .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(sId, cls.getId());
                if (!assigns.isEmpty()) {
                    List<GapValidationLabel> sl = studentLabels.getOrDefault(sId, Collections.emptyList());
                    Set<Long> labeledTopicIds = sl.stream().map(l -> l.getTopic().getId()).collect(Collectors.toSet());
                    boolean allLabeled = assigns.stream().allMatch(a -> labeledTopicIds.contains(a.getTopic().getId()));
                    if (allLabeled) fullyLabeled++;
                } else if (studentLabels.containsKey(sId)) {
                    fullyLabeled++;
                }
            }

            // Calculate class accuracy
            Double classAccuracy = computeClassAgreement(clsLabels, source, includeStale, cls.getId());

            String status;
            if (fullyLabeled == 0) {
                status = "UNLABELED";
            } else if (fullyLabeled >= totalEnrolled && totalEnrolled > 0) {
                status = "COMPLETED";
            } else {
                status = "IN_PROGRESS";
            }

            String targetStatus;
            if (fullyLabeled >= 30) {
                targetStatus = (classAccuracy != null && classAccuracy >= 85.0) ? "MET" : "NOT_MET";
            } else if (fullyLabeled >= totalEnrolled && totalEnrolled > 0) {
                targetStatus = "SMALL_CLASS_COMPLETE";
            } else {
                targetStatus = "PRELIMINARY";
            }

            String teacherName = cls.getTeacher() != null ? cls.getTeacher().getFullName() : "Assigned Teacher";
            classBreakdowns.add(new ValidationClassBreakdownDto(
                    cls.getId(),
                    cls.getName(),
                    teacherName,
                    fullyLabeled,
                    totalEnrolled,
                    status,
                    classAccuracy,
                    targetStatus
            ));
        }

        return computeReport(labels, source, includeStale, null, "All Institution Classes", inst.getName(), classes.size(), classBreakdowns);
    }

    /**
     * Helper to compute agreement accuracy percentage for a single class label set.
     */
    private Double computeClassAgreement(List<GapValidationLabel> clsLabels, ValidationSource source, boolean includeStale, Long classId) {
        int tp = 0, fp = 0, tn = 0, fn = 0;
        int usableCount = 0;

        for (GapValidationLabel l : clsLabels) {
            if (l.getLabel() == ValidationLabel.CANNOT_JUDGE) continue;
            MasteryStatus status = resolveSystemStatus(l);
            if (status == null || status == MasteryStatus.INSUFFICIENT_DATA) continue;

            boolean teacherWeak = (l.getLabel() == ValidationLabel.WEAK);
            boolean systemWeak = (status == MasteryStatus.GAP);

            if (teacherWeak && systemWeak) tp++;
            else if (!teacherWeak && systemWeak) fp++;
            else if (!teacherWeak && !systemWeak) tn++;
            else fn++;

            usableCount++;
        }

        return usableCount > 0 ? round1(((double) (tp + tn) / usableCount) * 100.0) : null;
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
            sb.append(escapeCsvCell(l.getLabeledAt() != null ? l.getLabeledAt().toString() : "")).append("\r\n");
        }

        return sb.toString();
    }

    /**
     * SINGLE SHARED REPORT COMPUTATION FUNCTION (6-argument overload for backwards compatibility).
     */
    public ValidationReportDto computeReport(
            List<GapValidationLabel> labels,
            ValidationSource source,
            boolean includeStale,
            Long classId,
            String className,
            String institutionName) {
        return computeReport(labels, source, includeStale, classId, className, institutionName, 1, Collections.emptyList());
    }

    /**
     * SINGLE SHARED REPORT COMPUTATION FUNCTION
     * Evaluates accuracy, precision, recall, F1, Cohen's kappa, per-topic accuracy,
     * threshold sensitivity, and 85% research target compliance with honest progress banners.
     */
    public ValidationReportDto computeReport(
            List<GapValidationLabel> labels,
            ValidationSource source,
            boolean includeStale,
            Long classId,
            String className,
            String institutionName,
            Integer pooledClassesCount,
            List<ValidationClassBreakdownDto> classBreakdowns) {

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
        Map<Long, List<GapValidationLabel>> labelsByStudent = labels.stream()
                .collect(Collectors.groupingBy(l -> l.getStudent().getId()));

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

        // Count fully labeled students (Decision 1: all assigned topics are labeled)
        int fullyLabeledStudents = 0;
        int eligibleStudentsCount = 0;
        int notYetEligibleCount = 0;
        boolean isSmallClassComplete = false;

        if (classId != null) {
            ClassEntity cls = classEntityRepository.findById(classId).orElse(null);
            if (cls != null) {
                List<Enrollment> enrollments = enrollmentRepository.findByClassEntityOrderByEnrolledAtDesc(cls);
                for (Enrollment enr : enrollments) {
                    User st = enr.getStudent();
                    if (st == null || st.getRole() != Role.STUDENT) {
                        continue;
                    }
                    List<Topic> assigned = getOrAssignTopicsForStudent(cls, st);
                    if (!assigned.isEmpty()) {
                        eligibleStudentsCount++;
                    } else {
                        notYetEligibleCount++;
                    }
                }
            }
        }

        for (Long sId : labelsByStudent.keySet()) {
            List<StudentValidationAssignment> assigns = Collections.emptyList();
            if (classId != null) {
                assigns = studentValidationAssignmentRepository
                        .findByStudentIdAndClassroomIdOrderByAssignedOrderAsc(sId, classId);
            }
            if (!assigns.isEmpty()) {
                List<GapValidationLabel> sl = labelsByStudent.get(sId);
                Set<Long> labeledTopicIds = sl.stream().map(l -> l.getTopic().getId()).collect(Collectors.toSet());
                boolean allLabeled = assigns.stream().allMatch(a -> labeledTopicIds.contains(a.getTopic().getId()));
                if (allLabeled) {
                    fullyLabeledStudents++;
                }
            } else {
                // Backwards-compatible / fixture: if no specific assignments, student counts as labeled
                fullyLabeledStudents++;
            }
        }

        int totalEligibleStudents = Math.max(eligibleStudentsCount, fullyLabeledStudents);

        if (eligibleStudentsCount > 0 && eligibleStudentsCount < 30 && fullyLabeledStudents >= eligibleStudentsCount) {
            isSmallClassComplete = true;
        }

        // 2. Honest Target Check & Result Banners (Decisions 5, 6, 7)
        String targetStatus;
        String targetSentence;
        String bannerType;
        String warningMessage = null;

        if (classId != null) {
            if (totalEligibleStudents == 0 && fullyLabeledStudents == 0) {
                targetStatus = "NOT_ENOUGH_RECORDS";
                bannerType = "NO_ELIGIBLE_STUDENTS";
                targetSentence = "No students are eligible yet: students need at least 3 answered questions in a topic";
                warningMessage = "Students need at least 3 answered questions in a topic before they become eligible for validation labeling.";
            } else if (fullyLabeledStudents < 30) {
                if (isSmallClassComplete) {
                    // Small class complete (Decision 7)
                    targetStatus = "NOT_ENOUGH_RECORDS";
                    bannerType = "SMALL_CLASS_COMPLETE";
                    if (notYetEligibleCount > 0) {
                        targetSentence = String.format(Locale.US,
                                "Complete: %d of %d eligible students (%d enrolled students not yet eligible). Too few students to certify against the 85%% target.",
                                fullyLabeledStudents, totalEligibleStudents, notYetEligibleCount);
                    } else {
                        targetSentence = String.format(Locale.US,
                                "Complete: %d of %d eligible students. Too few students to certify against the 85%% target.",
                                fullyLabeledStudents, totalEligibleStudents);
                    }
                    warningMessage = "All eligible students in this class section have been fully evaluated, but the section size is under 30. Statistical confidence requires at least 30 student records to certify agreement.";
                } else {
                    // Preliminary report (Decision 5)
                    targetStatus = "NOT_ENOUGH_RECORDS";
                    bannerType = "PRELIMINARY";
                    targetSentence = String.format(Locale.US,
                            "Preliminary: %d of 30 students labeled. Currently %d evaluated (%d more needed).",
                            fullyLabeledStudents, fullyLabeledStudents, 30 - fullyLabeledStudents);
                    warningMessage = "Metrics are preliminary based on an incomplete sample and will fluctuate as more students are evaluated. Small samples are statistically unreliable.";
                }
            } else if (accuracy >= 85.0) {
                // Decision 6: Target met
                targetStatus = "MET";
                bannerType = "MET";
                targetSentence = String.format(Locale.US,
                        "Target met: %.1f%% agreement across %d students (objective is ≥85.0%% on ≥30 records).",
                        accuracy, fullyLabeledStudents);
            } else {
                // Decision 6: Target not met
                targetStatus = "NOT_MET";
                bannerType = "NOT_MET";
                targetSentence = String.format(Locale.US,
                        "Target not met: %.1f%% agreement across %d students (objective is ≥85.0%%).",
                        accuracy, fullyLabeledStudents);
            }
        } else {
            // Admin pooled report across classes (Decision 9)
            int pooledCount = pooledClassesCount != null ? pooledClassesCount : 1;
            if (fullyLabeledStudents < 30) {
                targetStatus = "NOT_ENOUGH_RECORDS";
                bannerType = "PRELIMINARY";
                targetSentence = String.format(Locale.US,
                        "Preliminary: %d of 30 students labeled. Currently %d evaluated (%d more needed), pooled across %d classes.",
                        fullyLabeledStudents, fullyLabeledStudents, 30 - fullyLabeledStudents, pooledCount);
                warningMessage = "Pooled metrics are preliminary. Small samples are statistically unreliable.";
            } else if (accuracy >= 85.0) {
                targetStatus = "MET";
                bannerType = "MET";
                targetSentence = String.format(Locale.US,
                        "Target met: %.1f%% agreement pooled across %d classes (%d students).",
                        accuracy, pooledCount, fullyLabeledStudents);
            } else {
                targetStatus = "NOT_MET";
                bannerType = "NOT_MET";
                targetSentence = String.format(Locale.US,
                        "Target not met: %.1f%% agreement pooled across %d classes (%d students).",
                        accuracy, pooledCount, fullyLabeledStudents);
            }
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
                        fullyLabeledStudents,
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
                        fullyLabeledStudents,
                        targetStatus,
                        targetSentence,
                        bannerType,
                        warningMessage,
                        totalEligibleStudents,
                        notYetEligibleCount
                ),
                new ValidationConfusionMatrixDto(tp, fp, tn, fn),
                perTopic,
                sensitivity,
                bestThreshold,
                disagreements,
                pooledClassesCount,
                classBreakdowns,
                notYetEligibleCount,
                totalEligibleStudents
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

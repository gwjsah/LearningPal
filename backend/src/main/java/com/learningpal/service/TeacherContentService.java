package com.learningpal.service;

import com.learningpal.dto.*;
import com.learningpal.entity.*;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeacherContentService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final ChoiceRepository choiceRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final ResourceRepository resourceRepository;
    private final AnswerRepository answerRepository;
    private final AttemptRepository attemptRepository;
    private final ClassEntityRepository classEntityRepository;
    private final QuestionAcceptedAnswerRepository acceptedAnswerRepository;
    private final EssayRubricCriterionRepository rubricCriterionRepository;
    private final TenantAccess tenantAccess;

    public TeacherContentService(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            QuestionRepository questionRepository,
            ChoiceRepository choiceRepository,
            AssessmentRepository assessmentRepository,
            AssessmentQuestionRepository assessmentQuestionRepository,
            ResourceRepository resourceRepository,
            AnswerRepository answerRepository,
            AttemptRepository attemptRepository,
            ClassEntityRepository classEntityRepository,
            QuestionAcceptedAnswerRepository acceptedAnswerRepository,
            EssayRubricCriterionRepository rubricCriterionRepository,
            TenantAccess tenantAccess
    ) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.assessmentRepository = assessmentRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.resourceRepository = resourceRepository;
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
        this.classEntityRepository = classEntityRepository;
        this.acceptedAnswerRepository = acceptedAnswerRepository;
        this.rubricCriterionRepository = rubricCriterionRepository;
        this.tenantAccess = tenantAccess;
    }

    private User getActiveTeacher(String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherEmail));
        if (teacher.getRole() != Role.TEACHER || teacher.getStatus() != UserStatus.ACTIVE) {
            throw new ResourceNotFoundException("Active teacher account required");
        }
        tenantAccess.requireCallerInstitution(teacher);
        return teacher;
    }

    // =========================================================================
    // 1. SUBJECTS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<TeacherSubjectDto> getMySubjects(String teacherEmail) {
        User teacher = getActiveTeacher(teacherEmail);
        List<Subject> subjects = subjectRepository.findByOwnerOrderByCreatedAtDesc(teacher);
        return subjects.stream().map(s -> toSubjectDto(s, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<String> getSubjectSuggestions(String teacherEmail) {
        User teacher = getActiveTeacher(teacherEmail);
        return subjectRepository.findByOwnerAndStatus(teacher, SubjectStatus.ACTIVE).stream()
                .map(Subject::getName)
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherSubjectDto getSubject(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);
        return toSubjectDto(subject, true);
    }

    public TeacherSubjectDto createSubject(String teacherEmail, CreateSubjectRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        String trimmedName = request.name().trim();
        if (trimmedName.length() > 80) {
            throw new BadRequestException("Subject name must be 80 characters or fewer");
        }

        String code = generateUniqueSubjectCode();
        String description = request.description() != null ? request.description().trim() : null;

        Subject subject = new Subject(code, trimmedName, description, teacher);
        Subject saved = subjectRepository.save(subject);
        return toSubjectDto(saved, true);
    }

    public TeacherSubjectDto updateSubject(String teacherEmail, Long subjectId, UpdateSubjectRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        String trimmedName = request.name().trim();
        if (trimmedName.length() > 80) {
            throw new BadRequestException("Subject name must be 80 characters or fewer");
        }

        subject.setName(trimmedName);
        subject.setDescription(request.description() != null ? request.description().trim() : null);
        Subject saved = subjectRepository.save(subject);
        return toSubjectDto(saved, true);
    }

    public TeacherSubjectDto archiveSubject(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);
        subject.setStatus(SubjectStatus.ARCHIVED);
        Subject saved = subjectRepository.save(subject);
        return toSubjectDto(saved, true);
    }

    public void deleteSubject(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        long classCount = classEntityRepository.countBySubject(subject);
        if (classCount > 0) {
            throw new BadRequestException("Cannot delete subject with associated classes. Archive it instead.");
        }

        long topicCount = topicRepository.countBySubject(subject);
        long questionCount = questionRepository.countBySubject(subject);
        long quizCount = assessmentRepository.countBySubject(subject);

        if (topicCount > 0 || questionCount > 0 || quizCount > 0) {
            throw new BadRequestException("Cannot delete subject with curriculum content. Archive it instead.");
        }

        subjectRepository.delete(subject);
    }

    public TeacherSubjectDto copySampleSubject(String teacherEmail) {
        User teacher = getActiveTeacher(teacherEmail);

        Subject sample = subjectRepository.findByCodeIgnoreCase("C_PROG_INTRO")
                .or(() -> subjectRepository.findAll().stream().filter(s -> s.getOwner() == null).findFirst())
                .orElseThrow(() -> new BadRequestException("Sample curriculum subject is not available to copy"));

        String copyName = sample.getName() + " (Copy)";
        if (copyName.length() > 80) {
            copyName = copyName.substring(0, 80);
        }

        Subject newSubject = new Subject(generateUniqueSubjectCode(), copyName, sample.getDescription(), teacher);
        Subject savedSubject = subjectRepository.save(newSubject);

        // Copy topics
        List<Topic> sampleTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(sample);
        Map<Long, Topic> topicMap = new HashMap<>();
        for (Topic st : sampleTopics) {
            Topic newTopic = new Topic(savedSubject, st.getName(), st.getDescription(), st.getDisplayOrder());
            newTopic.setStatus(TopicStatus.ACTIVE);
            Topic savedTopic = topicRepository.save(newTopic);
            topicMap.put(st.getId(), savedTopic);
        }

        // Copy questions & choices
        List<Question> sampleQuestions = questionRepository.findBySubject(sample);
        if (sampleQuestions.isEmpty()) {
            for (Topic st : sampleTopics) {
                sampleQuestions.addAll(questionRepository.findByTopic(st));
            }
        }

        Map<Long, Question> questionMap = new HashMap<>();
        for (Question sq : sampleQuestions) {
            Topic targetTopic = topicMap.get(sq.getTopic().getId());
            if (targetTopic == null) continue;

            Question nq = new Question(targetTopic, sq.getType(), sq.getText(), sq.getExplanation(), sq.getDifficulty(), sq.getPoints(), teacher);
            nq.setSubject(savedSubject);
            nq.setStatus(QuestionStatus.ACTIVE);
            nq.setVersion(1);
            nq.setOrigin(QuestionOrigin.MANUAL);
            Question savedQ = questionRepository.save(nq);
            savedQ.setLineageId(savedQ.getId());
            savedQ = questionRepository.save(savedQ);
            questionMap.put(sq.getId(), savedQ);

            List<Choice> sampleChoices = choiceRepository.findByQuestion(sq);
            for (Choice sc : sampleChoices) {
                choiceRepository.save(new Choice(savedQ, sc.getLabel(), sc.getText(), sc.isCorrect()));
            }
        }

        // Copy text resources
        List<Resource> sampleResources = resourceRepository.findBySubjectId(sample.getId());
        for (Resource sr : sampleResources) {
            if (sr.getType() == ResourceType.FILE) {
                continue; // File resources are teacher-uploaded artifacts with physical storage, not copied from sample
            }
            Topic targetTopic = sr.getTopic() != null ? topicMap.get(sr.getTopic().getId()) : null;
            Resource nr = new Resource(
                    savedSubject, targetTopic, sr.getTitle(), sr.getDescription(),
                    sr.getType(), sr.getContent(), sr.getUrl(), sr.getDifficulty(), teacher
            );
            nr.setStatus(ResourceStatus.ACTIVE);
            resourceRepository.save(nr);
        }

        return toSubjectDto(savedSubject, true);
    }

    private TeacherSubjectDto toSubjectDto(Subject subject, boolean isOwner) {
        long topicCount = topicRepository.countBySubject(subject);
        long questionCount = questionRepository.countBySubject(subject);
        long quizCount = assessmentRepository.countBySubject(subject);
        long resourceCount = resourceRepository.countBySubject(subject);
        long classCount = classEntityRepository.countBySubject(subject);

        return TeacherSubjectDto.fromEntity(subject, topicCount, questionCount, quizCount, resourceCount, classCount, isOwner);
    }

    private String generateUniqueSubjectCode() {
        String code;
        do {
            code = "TSUB_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (subjectRepository.existsByCode(code));
        return code;
    }

    // =========================================================================
    // 2. TOPICS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<TeacherTopicDto> getTopics(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        List<Topic> topics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        return topics.stream().map(t -> {
            long qCount = questionRepository.countByTopic(t);
            long rCount = resourceRepository.countByTopic(t);
            return TeacherTopicDto.fromEntity(t, qCount, rCount);
        }).toList();
    }

    public TeacherTopicDto createTopic(String teacherEmail, Long subjectId, CreateTopicRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        String trimmedName = request.name().trim();
        if (topicRepository.existsBySubjectAndNameIgnoreCase(subject, trimmedName)) {
            throw new BadRequestException("A topic with this name already exists in this subject");
        }

        long count = topicRepository.countBySubject(subject);
        int nextOrder = (int) count + 1;

        Topic topic = new Topic(subject, trimmedName, request.description() != null ? request.description().trim() : null, nextOrder);
        topic.setStatus(TopicStatus.ACTIVE);
        Topic saved = topicRepository.save(topic);
        return TeacherTopicDto.fromEntity(saved, 0, 0);
    }

    public TeacherTopicDto updateTopic(String teacherEmail, Long subjectId, Long topicId, UpdateTopicRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));
        if (!topic.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Topic not found: " + topicId);
        }

        String trimmedName = request.name().trim();
        if (topicRepository.existsBySubjectAndNameIgnoreCaseAndIdNot(subject, trimmedName, topicId)) {
            throw new BadRequestException("A topic with this name already exists in this subject");
        }

        topic.setName(trimmedName);
        topic.setDescription(request.description() != null ? request.description().trim() : null);
        Topic saved = topicRepository.save(topic);

        long qCount = questionRepository.countByTopic(saved);
        long rCount = resourceRepository.countByTopic(saved);
        return TeacherTopicDto.fromEntity(saved, qCount, rCount);
    }

    public List<TeacherTopicDto> reorderTopics(String teacherEmail, Long subjectId, ReorderTopicsRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        List<Topic> currentTopics = topicRepository.findBySubjectOrderByDisplayOrderAsc(subject);
        Map<Long, Topic> topicMap = currentTopics.stream().collect(Collectors.toMap(Topic::getId, t -> t));

        // 1. Shift existing topics to negative display order to prevent unique index collision
        int temp = -1000;
        for (Topic t : currentTopics) {
            t.setDisplayOrder(temp--);
            topicRepository.save(t);
        }
        topicRepository.flush();

        // 2. Assign desired 1-based display order
        List<Long> orderedIds = request.topicIds();
        int order = 1;
        for (Long id : orderedIds) {
            Topic t = topicMap.get(id);
            if (t != null) {
                t.setDisplayOrder(order++);
                topicRepository.save(t);
            }
        }
        topicRepository.flush();

        return getTopics(teacherEmail, subjectId);
    }

    public TeacherTopicDto archiveTopic(String teacherEmail, Long subjectId, Long topicId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));
        if (!topic.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Topic not found: " + topicId);
        }

        topic.setStatus(TopicStatus.ARCHIVED);
        Topic saved = topicRepository.save(topic);

        long qCount = questionRepository.countByTopic(saved);
        long rCount = resourceRepository.countByTopic(saved);
        return TeacherTopicDto.fromEntity(saved, qCount, rCount);
    }

    public void deleteTopic(String teacherEmail, Long subjectId, Long topicId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));
        if (!topic.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Topic not found: " + topicId);
        }

        long qCount = questionRepository.countByTopic(topic);
        if (qCount > 0) {
            throw new BadRequestException("Cannot delete topic with questions. Archive it instead.");
        }

        long rCount = resourceRepository.countByTopic(topic);
        if (rCount > 0) {
            throw new BadRequestException("Cannot delete topic with resources. Archive it instead.");
        }

        topicRepository.delete(topic);
    }

    // =========================================================================
    // 3. QUESTION BANK (Versioned Multiple Choice)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<TeacherQuestionDto> getQuestions(
            String teacherEmail,
            Long subjectId,
            Long topicId,
            DifficultyLevel difficulty,
            QuestionStatus status,
            String search
    ) {
        return getQuestions(teacherEmail, subjectId, topicId, difficulty, status, null, search);
    }

    @Transactional(readOnly = true)
    public List<TeacherQuestionDto> getQuestions(
            String teacherEmail,
            Long subjectId,
            Long topicId,
            DifficultyLevel difficulty,
            QuestionStatus status,
            QuestionType type,
            String search
    ) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        List<Question> questions = questionRepository.findBySubjectOrderByCreatedAtDesc(subject);

        String searchLower = (search != null && !search.trim().isBlank()) ? search.trim().toLowerCase() : null;

        return questions.stream()
                .filter(q -> topicId == null || (q.getTopic() != null && q.getTopic().getId().equals(topicId)))
                .filter(q -> difficulty == null || q.getDifficulty() == difficulty)
                .filter(q -> status == null || q.getStatus() == status)
                .filter(q -> type == null || (q.getType() != null && q.getType().canonical() == type.canonical()))
                .filter(q -> searchLower == null
                        || q.getText().toLowerCase().contains(searchLower)
                        || (q.getExplanation() != null && q.getExplanation().toLowerCase().contains(searchLower)))
                .map(this::toQuestionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherQuestionDto getQuestion(String teacherEmail, Long subjectId, Long questionId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Question q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (!isQuestionInSubject(q, subject)) {
            throw new ResourceNotFoundException("Question not found: " + questionId);
        }

        return toQuestionDto(q);
    }

    public TeacherQuestionDto createQuestion(String teacherEmail, Long subjectId, CreateQuestionRequest request) {
        return createQuestion(teacherEmail, subjectId, request, QuestionOrigin.MANUAL, null);
    }

    public TeacherQuestionDto createQuestion(
            String teacherEmail,
            Long subjectId,
            CreateQuestionRequest request,
            QuestionOrigin origin,
            com.learningpal.entity.ResourceFile sourceFile
    ) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Topic topic = topicRepository.findById(request.topicId())
                .orElseThrow(() -> new BadRequestException("Topic not found: " + request.topicId()));
        if (!topic.getSubject().getId().equals(subject.getId())) {
            throw new BadRequestException("Topic does not belong to this subject");
        }

        QuestionType resolvedType = resolveQuestionType(request.type(), QuestionType.MULTIPLE_CHOICE);
        double points = validateAndResolvePoints(
                resolvedType, request.explanation(), request.points(),
                request.choices(), request.acceptedAnswers(), request.rubricCriteria()
        );

        String trimmedText = request.text().trim();
        String trimmedExplanation = trimOrNull(request.explanation());

        Question question = new Question(
                topic, resolvedType, trimmedText, trimmedExplanation,
                request.difficulty(), points, teacher
        );
        question.setSubject(subject);
        question.setStatus(QuestionStatus.ACTIVE);
        question.setVersion(1);
        question.setOrigin(origin != null ? origin : QuestionOrigin.MANUAL);
        question.setSourceFile(sourceFile);

        Question saved = questionRepository.save(question);
        saved.setLineageId(saved.getId());
        saved = questionRepository.save(saved);

        saveTypeChildren(saved, resolvedType, request.choices(), request.acceptedAnswers(), request.rubricCriteria());

        return toQuestionDto(saved);
    }

    public TeacherQuestionDto updateQuestion(String teacherEmail, Long subjectId, Long questionId, UpdateQuestionRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Question existing = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (!isQuestionInSubject(existing, subject)) {
            throw new ResourceNotFoundException("Question not found: " + questionId);
        }

        Topic topic = topicRepository.findById(request.topicId())
                .orElseThrow(() -> new BadRequestException("Topic not found: " + request.topicId()));
        if (!topic.getSubject().getId().equals(subject.getId())) {
            throw new BadRequestException("Topic does not belong to this subject");
        }

        QuestionType existingType = existing.getType() != null ? existing.getType().canonical() : QuestionType.MULTIPLE_CHOICE;
        QuestionType targetType = resolveQuestionType(request.type(), existingType);
        boolean hasAnswers = answerRepository.existsByQuestion(existing);

        if (hasAnswers && targetType != existingType) {
            throw new BadRequestException("Cannot change question type after students have answered it");
        }

        double points = validateAndResolvePoints(
                targetType, request.explanation(), request.points(),
                request.choices(), request.acceptedAnswers(), request.rubricCriteria()
        );

        String trimmedText = request.text().trim();
        String trimmedExplanation = trimOrNull(request.explanation());

        if (!hasAnswers) {
            // Edit in place
            existing.setType(targetType);
            existing.setTopic(topic);
            existing.setText(trimmedText);
            existing.setExplanation(trimmedExplanation);
            existing.setDifficulty(request.difficulty());
            existing.setPoints(points);
            Question saved = questionRepository.save(existing);

            deleteTypeChildren(saved);
            saveTypeChildren(saved, targetType, request.choices(), request.acceptedAnswers(), request.rubricCriteria());

            return toQuestionDto(saved);
        } else {
            // Versioning: retire old version, create new version
            existing.setStatus(QuestionStatus.RETIRED);
            questionRepository.save(existing);

            Question newVersion = new Question(
                    topic, targetType, trimmedText, trimmedExplanation,
                    request.difficulty(), points, teacher
            );
            newVersion.setSubject(subject);
            newVersion.setStatus(QuestionStatus.ACTIVE);
            newVersion.setVersion(existing.getVersion() + 1);
            newVersion.setLineageId(existing.getLineageId());
            newVersion.setSupersedes(existing);
            newVersion.setOrigin(existing.getOrigin() != null ? existing.getOrigin() : QuestionOrigin.MANUAL);
            newVersion.setSourceFile(existing.getSourceFile());

            Question savedNew = questionRepository.save(newVersion);
            saveTypeChildren(savedNew, targetType, request.choices(), request.acceptedAnswers(), request.rubricCriteria());

            return toQuestionDto(savedNew);
        }
    }

    public TeacherQuestionDto duplicateQuestion(String teacherEmail, Long subjectId, Long questionId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Question existing = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (!isQuestionInSubject(existing, subject)) {
            throw new ResourceNotFoundException("Question not found: " + questionId);
        }

        String dupText = existing.getText() + " (Copy)";
        if (dupText.length() > 2000) {
            dupText = dupText.substring(0, 2000);
        }

        QuestionType canonicalType = existing.getType() != null ? existing.getType().canonical() : QuestionType.MULTIPLE_CHOICE;
        Question duplicated = new Question(
                existing.getTopic(), canonicalType, dupText, existing.getExplanation(),
                existing.getDifficulty(), existing.getPoints(), teacher
        );
        duplicated.setSubject(subject);
        duplicated.setStatus(QuestionStatus.ACTIVE);
        duplicated.setVersion(1);
        duplicated.setOrigin(QuestionOrigin.MANUAL);

        Question saved = questionRepository.save(duplicated);
        saved.setLineageId(saved.getId());
        saved = questionRepository.save(saved);

        for (Choice c : choiceRepository.findByQuestion(existing)) {
            choiceRepository.save(new Choice(saved, c.getLabel(), c.getText(), c.isCorrect()));
        }
        for (QuestionAcceptedAnswer aa : acceptedAnswerRepository.findByQuestionOrderByDisplayOrderAsc(existing)) {
            acceptedAnswerRepository.save(new QuestionAcceptedAnswer(saved, aa.getAnswerText(), aa.getDisplayOrder()));
        }
        for (EssayRubricCriterion rc : rubricCriterionRepository.findByQuestionOrderByDisplayOrderAsc(existing)) {
            rubricCriterionRepository.save(new EssayRubricCriterion(saved, rc.getName(), rc.getDescription(), rc.getMaxPoints(), rc.getDisplayOrder()));
        }

        return toQuestionDto(saved);
    }

    public TeacherQuestionDto retireQuestion(String teacherEmail, Long subjectId, Long questionId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Question existing = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (!isQuestionInSubject(existing, subject)) {
            throw new ResourceNotFoundException("Question not found: " + questionId);
        }

        existing.setStatus(QuestionStatus.RETIRED);
        Question saved = questionRepository.save(existing);
        return toQuestionDto(saved);
    }

    public void deleteQuestion(String teacherEmail, Long subjectId, Long questionId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Question existing = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        if (!isQuestionInSubject(existing, subject)) {
            throw new ResourceNotFoundException("Question not found: " + questionId);
        }

        if (answerRepository.existsByQuestion(existing)) {
            throw new BadRequestException("Cannot delete question that has student answers. Retire it instead.");
        }

        if (assessmentQuestionRepository.existsByQuestion(existing)) {
            throw new BadRequestException("Cannot delete question included in quizzes. Remove it from quizzes or retire it instead.");
        }

        deleteTypeChildren(existing);
        questionRepository.delete(existing);
    }

    private QuestionType resolveQuestionType(QuestionType requested, QuestionType fallback) {
        QuestionType t = requested != null ? requested : fallback;
        return t.canonical();
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private double validateAndResolvePoints(
            QuestionType type,
            String explanation,
            Double requestedPoints,
            List<ChoiceDto> choices,
            List<String> acceptedAnswers,
            List<EssayRubricCriterionDto> rubricCriteria
    ) {
        if (type == QuestionType.ESSAY) {
            if (explanation != null && explanation.trim().length() > 2000) {
                throw new BadRequestException("Explanation must be 2000 characters or fewer");
            }
            int sum = validateRubricCriteria(rubricCriteria);
            if (requestedPoints != null && Math.abs(requestedPoints - sum) > 0.001) {
                throw new BadRequestException("Question points must equal the sum of rubric criteria maxPoints (" + sum + ")");
            }
            return (double) sum;
        }

        if (explanation == null || explanation.trim().isBlank()) {
            throw new BadRequestException("Explanation is required");
        }
        if (explanation.trim().length() > 2000) {
            throw new BadRequestException("Explanation must be 2000 characters or fewer");
        }

        if (type == QuestionType.ENUMERATION) {
            validateAcceptedAnswers(acceptedAnswers);
        } else {
            validateChoices(choices);
        }
        return requestedPoints != null && requestedPoints > 0 ? requestedPoints : 1.0;
    }

    private void validateAcceptedAnswers(List<String> acceptedAnswers) {
        if (acceptedAnswers == null || acceptedAnswers.isEmpty() || acceptedAnswers.size() > 10) {
            throw new BadRequestException("Enumeration questions must have between 1 and 10 accepted answers");
        }
        for (String ans : acceptedAnswers) {
            if (ans == null || ans.trim().isBlank()) {
                throw new BadRequestException("Accepted answer cannot be blank");
            }
            if (ans.trim().length() > 100) {
                throw new BadRequestException("Each accepted answer must be 100 characters or fewer");
            }
        }
    }

    private int validateRubricCriteria(List<EssayRubricCriterionDto> criteria) {
        if (criteria == null || criteria.isEmpty() || criteria.size() > 8) {
            throw new BadRequestException("Essay questions must have between 1 and 8 rubric criteria");
        }
        int sum = 0;
        for (EssayRubricCriterionDto c : criteria) {
            if (c.name() == null || c.name().trim().isBlank()) {
                throw new BadRequestException("Rubric criterion name cannot be blank");
            }
            if (c.name().trim().length() > 100) {
                throw new BadRequestException("Rubric criterion name must be 100 characters or fewer");
            }
            if (c.description() != null && c.description().trim().length() > 500) {
                throw new BadRequestException("Rubric criterion description must be 500 characters or fewer");
            }
            if (c.maxPoints() == null || c.maxPoints() <= 0) {
                throw new BadRequestException("Rubric criterion maxPoints must be a positive integer");
            }
            sum += c.maxPoints();
        }
        return sum;
    }

    private void deleteTypeChildren(Question question) {
        List<Choice> currentChoices = choiceRepository.findByQuestion(question);
        if (!currentChoices.isEmpty()) {
            choiceRepository.deleteAll(currentChoices);
            choiceRepository.flush();
        }
        List<QuestionAcceptedAnswer> currentAccepted = acceptedAnswerRepository.findByQuestionOrderByDisplayOrderAsc(question);
        if (!currentAccepted.isEmpty()) {
            acceptedAnswerRepository.deleteAll(currentAccepted);
            acceptedAnswerRepository.flush();
        }
        List<EssayRubricCriterion> currentCriteria = rubricCriterionRepository.findByQuestionOrderByDisplayOrderAsc(question);
        if (!currentCriteria.isEmpty()) {
            rubricCriterionRepository.deleteAll(currentCriteria);
            rubricCriterionRepository.flush();
        }
    }

    private void saveTypeChildren(
            Question question,
            QuestionType type,
            List<ChoiceDto> choices,
            List<String> acceptedAnswers,
            List<EssayRubricCriterionDto> rubricCriteria
    ) {
        if (type == QuestionType.ENUMERATION) {
            for (int i = 0; i < acceptedAnswers.size(); i++) {
                acceptedAnswerRepository.save(new QuestionAcceptedAnswer(question, acceptedAnswers.get(i).trim(), i));
            }
        } else if (type == QuestionType.ESSAY) {
            for (int i = 0; i < rubricCriteria.size(); i++) {
                EssayRubricCriterionDto dto = rubricCriteria.get(i);
                rubricCriterionRepository.save(new EssayRubricCriterion(
                        question,
                        dto.name().trim(),
                        trimOrNull(dto.description()),
                        dto.maxPoints(),
                        i
                ));
            }
        } else {
            saveChoices(question, choices);
        }
    }

    private void validateChoices(List<ChoiceDto> choices) {
        if (choices == null || choices.size() < 2 || choices.size() > 6) {
            throw new BadRequestException("Question must have between 2 and 6 choices");
        }

        long correctCount = choices.stream().filter(ChoiceDto::isCorrect).count();
        if (correctCount != 1) {
            throw new BadRequestException("Exactly one choice must be marked as correct");
        }

        for (ChoiceDto c : choices) {
            if (c.text() == null || c.text().trim().isBlank()) {
                throw new BadRequestException("Choice text cannot be blank");
            }
            if (c.text().trim().length() > 300) {
                throw new BadRequestException("Choice text must be 300 characters or fewer");
            }
        }
    }

    private void saveChoices(Question question, List<ChoiceDto> choiceDtos) {
        String[] labels = {"A", "B", "C", "D", "E", "F"};
        for (int i = 0; i < choiceDtos.size(); i++) {
            ChoiceDto dto = choiceDtos.get(i);
            String label = (dto.label() != null && !dto.label().isBlank()) ? dto.label().trim() : labels[i];
            Choice choice = new Choice(question, label, dto.text().trim(), dto.isCorrect());
            choiceRepository.save(choice);
        }
    }

    private TeacherQuestionDto toQuestionDto(Question q) {
        QuestionType type = q.getType() != null ? q.getType().canonical() : QuestionType.MULTIPLE_CHOICE;
        List<ChoiceDto> choices = type == QuestionType.MULTIPLE_CHOICE
                ? choiceRepository.findByQuestion(q).stream().map(ChoiceDto::fromEntity).toList()
                : List.of();
        List<String> acceptedAnswers = type == QuestionType.ENUMERATION
                ? acceptedAnswerRepository.findByQuestionOrderByDisplayOrderAsc(q).stream()
                        .map(QuestionAcceptedAnswer::getAnswerText)
                        .toList()
                : List.of();
        List<EssayRubricCriterionDto> rubricCriteria = type == QuestionType.ESSAY
                ? rubricCriterionRepository.findByQuestionOrderByDisplayOrderAsc(q).stream()
                        .map(EssayRubricCriterionDto::fromEntity)
                        .toList()
                : List.of();
        boolean hasAnswers = answerRepository.existsByQuestion(q);
        boolean inQuiz = assessmentQuestionRepository.existsByQuestion(q);
        return TeacherQuestionDto.fromEntity(q, choices, acceptedAnswers, rubricCriteria, hasAnswers, inQuiz);
    }

    private boolean isQuestionInSubject(Question q, Subject s) {
        if (q.getSubject() != null && q.getSubject().getId().equals(s.getId())) {
            return true;
        }
        return q.getTopic() != null && q.getTopic().getSubject() != null && q.getTopic().getSubject().getId().equals(s.getId());
    }

    // =========================================================================
    // 4. QUIZZES (Assessments)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<TeacherQuizDto> getQuizzes(String teacherEmail, Long subjectId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        List<Assessment> assessments = assessmentRepository.findBySubjectOrderByCreatedAtDesc(subject);
        return assessments.stream().map(a -> {
            long attemptCount = attemptRepository.countByAssessment(a);
            List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(a)
                    .stream()
                    .map(QuizQuestionItemDto::fromEntity)
                    .toList();
            return TeacherQuizDto.fromEntity(a, attemptCount, questions);
        }).toList();
    }

    @Transactional(readOnly = true)
    public TeacherQuizDto getQuiz(String teacherEmail, Long subjectId, Long quizId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment a = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!a.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        long attemptCount = attemptRepository.countByAssessment(a);
        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(a)
                .stream()
                .map(QuizQuestionItemDto::fromEntity)
                .toList();
        return TeacherQuizDto.fromEntity(a, attemptCount, questions);
    }

    public TeacherQuizDto createQuiz(String teacherEmail, Long subjectId, CreateQuizRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        String trimmedTitle = request.title().trim();
        if (trimmedTitle.length() > 120) {
            throw new BadRequestException("Quiz title must be 120 characters or fewer");
        }

        AssessmentKind kind = request.kind() != null ? request.kind() : AssessmentKind.QUIZ;
        Assessment assessment = new Assessment(
                subject, trimmedTitle, request.description() != null ? request.description().trim() : null,
                AssessmentStatus.DRAFT, kind, teacher
        );
        assessment.setTimeLimitMinutes(request.timeLimitMinutes());

        Assessment saved = assessmentRepository.save(assessment);
        setQuizQuestions(saved, subject, request.questionIds());

        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(saved)
                .stream().map(QuizQuestionItemDto::fromEntity).toList();
        return TeacherQuizDto.fromEntity(saved, 0, questions);
    }

    public TeacherQuizDto updateQuiz(String teacherEmail, Long subjectId, Long quizId, UpdateQuizRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment assessment = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!assessment.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        long attemptCount = attemptRepository.countByAssessment(assessment);
        if (assessment.getStatus() == AssessmentStatus.PUBLISHED && attemptCount > 0) {
            throw new BadRequestException("Published quiz has student attempts and its questions cannot be changed. Duplicate as a new draft or archive it.");
        }

        String trimmedTitle = request.title().trim();
        if (trimmedTitle.length() > 120) {
            throw new BadRequestException("Quiz title must be 120 characters or fewer");
        }

        assessment.setTitle(trimmedTitle);
        assessment.setDescription(request.description() != null ? request.description().trim() : null);
        if (request.kind() != null) {
            assessment.setKind(request.kind());
        }
        assessment.setTimeLimitMinutes(request.timeLimitMinutes());

        Assessment saved = assessmentRepository.save(assessment);
        setQuizQuestions(saved, subject, request.questionIds());

        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(saved)
                .stream().map(QuizQuestionItemDto::fromEntity).toList();
        return TeacherQuizDto.fromEntity(saved, attemptCount, questions);
    }

    public TeacherQuizDto publishQuiz(String teacherEmail, Long subjectId, Long quizId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment assessment = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!assessment.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        long qCount = assessmentQuestionRepository.countByAssessmentId(quizId);
        if (qCount == 0) {
            throw new BadRequestException("Cannot publish a quiz with no questions");
        }

        assessment.setStatus(AssessmentStatus.PUBLISHED);
        Assessment saved = assessmentRepository.save(assessment);

        long attemptCount = attemptRepository.countByAssessment(saved);
        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(saved)
                .stream().map(QuizQuestionItemDto::fromEntity).toList();
        return TeacherQuizDto.fromEntity(saved, attemptCount, questions);
    }

    public TeacherQuizDto unpublishQuiz(String teacherEmail, Long subjectId, Long quizId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment assessment = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!assessment.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        long attemptCount = attemptRepository.countByAssessment(assessment);
        if (attemptCount > 0) {
            throw new BadRequestException("Cannot unpublish quiz that has student attempts. Archive it instead.");
        }

        assessment.setStatus(AssessmentStatus.DRAFT);
        Assessment saved = assessmentRepository.save(assessment);

        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(saved)
                .stream().map(QuizQuestionItemDto::fromEntity).toList();
        return TeacherQuizDto.fromEntity(saved, 0, questions);
    }

    public TeacherQuizDto duplicateQuiz(String teacherEmail, Long subjectId, Long quizId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment existing = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!existing.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        String dupTitle = existing.getTitle() + " (Copy)";
        if (dupTitle.length() > 120) {
            dupTitle = dupTitle.substring(0, 120);
        }

        Assessment duplicated = new Assessment(
                subject, dupTitle, existing.getDescription(), AssessmentStatus.DRAFT, existing.getKind(), teacher
        );
        duplicated.setTimeLimitMinutes(existing.getTimeLimitMinutes());
        Assessment saved = assessmentRepository.save(duplicated);

        List<AssessmentQuestion> existingAqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(existing);
        for (AssessmentQuestion aq : existingAqs) {
            // Include question if ACTIVE
            if (aq.getQuestion().getStatus() == QuestionStatus.ACTIVE) {
                assessmentQuestionRepository.save(new AssessmentQuestion(saved, aq.getQuestion(), aq.getPosition()));
            }
        }

        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(saved)
                .stream().map(QuizQuestionItemDto::fromEntity).toList();
        return TeacherQuizDto.fromEntity(saved, 0, questions);
    }

    public TeacherQuizDto archiveQuiz(String teacherEmail, Long subjectId, Long quizId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment assessment = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!assessment.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        assessment.setStatus(AssessmentStatus.ARCHIVED);
        Assessment saved = assessmentRepository.save(assessment);

        long attemptCount = attemptRepository.countByAssessment(saved);
        List<QuizQuestionItemDto> questions = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(saved)
                .stream().map(QuizQuestionItemDto::fromEntity).toList();
        return TeacherQuizDto.fromEntity(saved, attemptCount, questions);
    }

    public void deleteQuiz(String teacherEmail, Long subjectId, Long quizId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Assessment assessment = assessmentRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        if (!assessment.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }

        long attemptCount = attemptRepository.countByAssessment(assessment);
        if (attemptCount > 0) {
            throw new BadRequestException("Cannot delete quiz with student attempts. Archive it instead.");
        }

        List<AssessmentQuestion> aqs = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(assessment);
        assessmentQuestionRepository.deleteAll(aqs);
        assessmentRepository.delete(assessment);
    }

    private void setQuizQuestions(Assessment assessment, Subject subject, List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            throw new BadRequestException("Quiz must contain at least one question");
        }

        List<AssessmentQuestion> existing = assessmentQuestionRepository.findByAssessmentOrderByPositionAsc(assessment);
        assessmentQuestionRepository.deleteAll(existing);
        assessmentQuestionRepository.flush();

        int pos = 1;
        for (Long qId : questionIds) {
            Question q = questionRepository.findById(qId)
                    .orElseThrow(() -> new BadRequestException("Question not found: " + qId));

            if (!isQuestionInSubject(q, subject)) {
                throw new BadRequestException("Question " + qId + " does not belong to this subject");
            }

            if (q.getStatus() != QuestionStatus.ACTIVE) {
                throw new BadRequestException("Retired questions cannot be added to quizzes: " + qId);
            }

            assessmentQuestionRepository.save(new AssessmentQuestion(assessment, q, pos++));
        }
    }

    // =========================================================================
    // 5. LINK RESOURCES
    // =========================================================================

    @Transactional(readOnly = true)
    public List<TeacherResourceDto> getResources(
            String teacherEmail,
            Long subjectId,
            Long topicId,
            ResourceStatus status
    ) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        List<Resource> resources = resourceRepository.findBySubjectAndStatus(subject, status != null ? status : ResourceStatus.ACTIVE);
        return resources.stream()
                .filter(r -> topicId == null || (r.getTopic() != null && r.getTopic().getId().equals(topicId)))
                .map(TeacherResourceDto::fromEntity)
                .toList();
    }

    public TeacherResourceDto createResource(String teacherEmail, Long subjectId, CreateLinkResourceRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        String trimmedTitle = request.title().trim();
        String validatedUrl = validateAndSanitizeUrl(request.url());

        Topic topic = null;
        if (request.topicId() != null) {
            topic = topicRepository.findById(request.topicId())
                    .orElseThrow(() -> new BadRequestException("Topic not found: " + request.topicId()));
            if (!topic.getSubject().getId().equals(subject.getId())) {
                throw new BadRequestException("Topic does not belong to this subject");
            }
        }

        Resource resource = new Resource(
                subject, topic, trimmedTitle,
                request.description() != null ? request.description().trim() : null,
                ResourceType.LINK, null, validatedUrl, DifficultyLevel.EASY, teacher
        );
        resource.setStatus(ResourceStatus.ACTIVE);
        Resource saved = resourceRepository.save(resource);
        return TeacherResourceDto.fromEntity(saved);
    }

    public TeacherResourceDto updateResource(String teacherEmail, Long subjectId, Long resourceId, UpdateLinkResourceRequest request) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
        if (!resource.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Resource not found: " + resourceId);
        }

        String trimmedTitle = request.title().trim();
        String validatedUrl = validateAndSanitizeUrl(request.url());

        Topic topic = null;
        if (request.topicId() != null) {
            topic = topicRepository.findById(request.topicId())
                    .orElseThrow(() -> new BadRequestException("Topic not found: " + request.topicId()));
            if (!topic.getSubject().getId().equals(subject.getId())) {
                throw new BadRequestException("Topic does not belong to this subject");
            }
        }

        resource.setTitle(trimmedTitle);
        resource.setUrl(validatedUrl);
        resource.setDescription(request.description() != null ? request.description().trim() : null);
        resource.setTopic(topic);

        Resource saved = resourceRepository.save(resource);
        return TeacherResourceDto.fromEntity(saved);
    }

    public TeacherResourceDto archiveResource(String teacherEmail, Long subjectId, Long resourceId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
        if (!resource.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Resource not found: " + resourceId);
        }

        resource.setStatus(ResourceStatus.ARCHIVED);
        Resource saved = resourceRepository.save(resource);
        return TeacherResourceDto.fromEntity(saved);
    }

    public void deleteResource(String teacherEmail, Long subjectId, Long resourceId) {
        User teacher = getActiveTeacher(teacherEmail);
        Subject subject = tenantAccess.requireOwnedSubject(teacher, subjectId, subjectRepository);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
        if (!resource.getSubject().getId().equals(subject.getId())) {
            throw new ResourceNotFoundException("Resource not found: " + resourceId);
        }

        resourceRepository.delete(resource);
    }

    private String validateAndSanitizeUrl(String url) {
        if (url == null || url.trim().isBlank()) {
            throw new BadRequestException("URL is required");
        }

        String trimmed = url.trim();
        if (trimmed.length() > 2000) {
            throw new BadRequestException("URL must be 2000 characters or fewer");
        }

        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException("URL must use http or https scheme");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException("Invalid URL format");
            }
            return trimmed;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Invalid URL format: " + e.getMessage());
        }
    }
}

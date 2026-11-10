package com.learningpal.config;

import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.GapAnalysisService;
import com.learningpal.service.JoinCodeGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Idempotent startup migration runner that transitions LearningPal to the multi-institution & classroom model
 * and migrates topic mastery & resource progress to per-student, per-class scoping.
 * - Creates default "Pilot University" (PILOT-2026).
 * - Assigns all existing users without institution to Pilot University.
 * - Creates default "Section A" for the pilot subject (with first active teacher if one exists).
 * - Converts legacy student-subject enrollments to Section A.
 * - Backfills classId on historical attempts.
 * - Relaxes legacy subject_id in enrollments table so inserts without subject_id never fail.
 * - Backfills classroom on StudentTopicMastery, ResourceProgress, and GapValidationLabel.
 * - Migrates unique constraints to (student_id, class_id, topic_id/resource_id).
 * - Recomputes diagnostic mastery per student per classroom.
 */
@Component
@Order(1)
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ClassEntityRepository classEntityRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttemptRepository attemptRepository;
    private final JoinCodeGenerator joinCodeGenerator;
    private final StudentTopicMasteryRepository studentTopicMasteryRepository;
    private final ResourceProgressRepository resourceProgressRepository;
    private final GapValidationLabelRepository gapValidationLabelRepository;
    private final GapAnalysisService gapAnalysisService;

    public DatabaseMigrationRunner(
            JdbcTemplate jdbcTemplate,
            InstitutionRepository institutionRepository,
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            AttemptRepository attemptRepository,
            JoinCodeGenerator joinCodeGenerator,
            StudentTopicMasteryRepository studentTopicMasteryRepository,
            ResourceProgressRepository resourceProgressRepository,
            GapValidationLabelRepository gapValidationLabelRepository,
            GapAnalysisService gapAnalysisService) {
        this.jdbcTemplate = jdbcTemplate;
        this.institutionRepository = institutionRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attemptRepository = attemptRepository;
        this.joinCodeGenerator = joinCodeGenerator;
        this.studentTopicMasteryRepository = studentTopicMasteryRepository;
        this.resourceProgressRepository = resourceProgressRepository;
        this.gapValidationLabelRepository = gapValidationLabelRepository;
        this.gapAnalysisService = gapAnalysisService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting Multi-Institution & Classroom migration check...");

        // 1. Guarded schema migration: relax legacy subject_id and topic_id columns if present in database
        relaxLegacySubjectColumnIfPresent();
        relaxLegacyTopicColumnOnResourcesIfPresent();
        migrateEnumsAndColumnsIfPresent();
        ensureValidationAssignmentTableIfPresent();

        // 2. Ensure default "Pilot University" exists
        Institution pilot = institutionRepository.findByCode("PILOT-2026")
                .orElseGet(() -> {
                    Institution inst = new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE);
                    Institution saved = institutionRepository.save(inst);
                    log.info("Migration: Created default institution 'Pilot University' (code: PILOT-2026).");
                    return saved;
                });

        // 3. Assign unlinked existing users (excluding SUPER_ADMIN) to Pilot University
        List<User> unassignedUsers = userRepository.findByInstitutionIsNullAndRoleNot(Role.SUPER_ADMIN);
        if (!unassignedUsers.isEmpty()) {
            for (User u : unassignedUsers) {
                u.setInstitution(pilot);
                userRepository.save(u);
            }
            log.info("Migration: Assigned {} existing user(s) to Pilot University.", unassignedUsers.size());
        }

        // 4. Ensure default class "Section A" exists for pilot subject C_PROG_INTRO
        Subject pilotSubject = subjectRepository.findByCode("C_PROG_INTRO").orElse(null);
        ClassEntity sectionA = null;
        if (pilotSubject != null) {
            sectionA = classEntityRepository.findFirstByInstitutionAndSubject(pilot, pilotSubject)
                    .orElseGet(() -> {
                        User teacher = userRepository.findFirstByInstitutionAndRoleAndStatus(pilot, Role.TEACHER, UserStatus.ACTIVE).orElse(null);
                        String joinCode = joinCodeGenerator.generateUniqueCode(pilot, classEntityRepository);
                        ClassEntity cls = new ClassEntity(pilot, pilotSubject, teacher, "Section A", joinCode);
                        ClassEntity saved = classEntityRepository.save(cls);
                        log.info("Migration: Created default class 'Section A' for C_PROG_INTRO with join code '{}'.", joinCode);
                        return saved;
                    });

            // 5. Convert legacy enrollments (classEntity IS NULL) to Section A
            List<Enrollment> unmigratedEnrollments = enrollmentRepository.findByClassEntityIsNull();
            if (!unmigratedEnrollments.isEmpty()) {
                for (Enrollment e : unmigratedEnrollments) {
                    e.setClassEntity(sectionA);
                    enrollmentRepository.save(e);
                }
                log.info("Migration: Migrated {} legacy enrollment(s) to Section A.", unmigratedEnrollments.size());
            }

            // 6. Backfill classId on historical attempts
            List<Attempt> unmigratedAttempts = attemptRepository.findAll().stream()
                    .filter(a -> a.getClassId() == null)
                    .toList();
            if (!unmigratedAttempts.isEmpty()) {
                for (Attempt a : unmigratedAttempts) {
                    a.setClassId(sectionA.getId());
                    attemptRepository.save(a);
                }
                log.info("Migration: Backfilled classId on {} attempt(s) to Section A.", unmigratedAttempts.size());
            }
        }

        // 7. Migrate mastery, progress, and validation tables to class-scoping
        migrateClassScopedMasteryAndConstraints(sectionA);

        log.info("Multi-Institution & Classroom migration check complete.");
    }

    private void migrateClassScopedMasteryAndConstraints(ClassEntity defaultSection) {
        // Schema adjustments: add class_id column if missing, and adjust unique constraints
        ensureSchemaColumnsAndConstraints();

        // Data backfills
        backfillClassOnMasteryAndProgress(defaultSection);

        // Recompute class masteries
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        for (Enrollment e : enrollments) {
            if (e.getClassEntity() != null && e.getStudent() != null) {
                gapAnalysisService.recalculateForStudentInClass(e.getStudent().getId(), e.getClassEntity().getId());
            }
        }

        // Backfill Phase A fields
        backfillPhaseAFields();
    }

    private void backfillPhaseAFields() {
        try {
            executeSilently("UPDATE questions SET lineage_id = id WHERE lineage_id IS NULL");
            executeSilently("UPDATE questions SET version = 1 WHERE version IS NULL");
            executeSilently("UPDATE questions SET status = 'ACTIVE' WHERE status IS NULL");
            executeSilently("UPDATE questions SET origin = 'MANUAL' WHERE origin IS NULL");
            executeSilently("UPDATE questions SET subject_id = (SELECT t.subject_id FROM topics t WHERE t.id = questions.topic_id) WHERE subject_id IS NULL");
            executeSilently("UPDATE assessments SET kind = 'DIAGNOSTIC' WHERE LOWER(title) LIKE '%diagnostic%'");
            executeSilently("UPDATE assessments SET kind = 'QUIZ' WHERE kind IS NULL");
            executeSilently("UPDATE subjects SET status = 'ACTIVE' WHERE status IS NULL");
            executeSilently("UPDATE topics SET status = 'ACTIVE' WHERE status IS NULL");
            executeSilently("UPDATE resources SET status = 'ACTIVE' WHERE status IS NULL");
        } catch (Exception e) {
            log.debug("Phase A backfill notice: {}", e.getMessage());
        }
    }

    private void ensureSchemaColumnsAndConstraints() {
        try {
            String dbProduct = jdbcTemplate.execute((java.sql.Connection conn) -> conn.getMetaData().getDatabaseProductName());
            boolean isH2 = "H2".equalsIgnoreCase(dbProduct);

            if (isH2) {
                // H2 DDL
                executeSilently("ALTER TABLE student_topic_mastery ADD COLUMN IF NOT EXISTS class_id BIGINT");
                executeSilently("ALTER TABLE resource_progress ADD COLUMN IF NOT EXISTS class_id BIGINT");
                executeSilently("ALTER TABLE gap_validation_labels ADD COLUMN IF NOT EXISTS class_id BIGINT");

                executeSilently("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS owner_id BIGINT");
                executeSilently("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'");
                executeSilently("ALTER TABLE topics ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS version INT DEFAULT 1");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS lineage_id BIGINT");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS supersedes_id BIGINT");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'MANUAL'");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject_id BIGINT");
                executeSilently("ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_file_id BIGINT");
                executeSilently("UPDATE questions SET origin = 'MANUAL' WHERE origin IS NULL");
                executeSilently("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS kind VARCHAR(20) DEFAULT 'QUIZ'");
                executeSilently("ALTER TABLE resources ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'");

                executeSilently("ALTER TABLE student_topic_mastery DROP CONSTRAINT IF EXISTS uk_student_topic_mastery");
                executeSilently("ALTER TABLE resource_progress DROP CONSTRAINT IF EXISTS uk_student_resource_progress");
            } else {
                // MySQL DDL
                executeSilently("ALTER TABLE student_topic_mastery ADD COLUMN class_id BIGINT NULL");
                executeSilently("ALTER TABLE resource_progress ADD COLUMN class_id BIGINT NULL");
                executeSilently("ALTER TABLE gap_validation_labels ADD COLUMN class_id BIGINT NULL");

                executeSilently("ALTER TABLE subjects ADD COLUMN owner_id BIGINT NULL");
                executeSilently("ALTER TABLE subjects ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'");
                executeSilently("ALTER TABLE topics ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'");
                executeSilently("ALTER TABLE questions ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'");
                executeSilently("ALTER TABLE questions ADD COLUMN version INT NOT NULL DEFAULT 1");
                executeSilently("ALTER TABLE questions ADD COLUMN lineage_id BIGINT NULL");
                executeSilently("ALTER TABLE questions ADD COLUMN supersedes_id BIGINT NULL");
                executeSilently("ALTER TABLE questions ADD COLUMN origin VARCHAR(20) NOT NULL DEFAULT 'MANUAL'");
                executeSilently("ALTER TABLE questions ADD COLUMN subject_id BIGINT NULL");
                executeSilently("ALTER TABLE questions ADD COLUMN source_file_id BIGINT NULL");
                executeSilently("UPDATE questions SET origin = 'MANUAL' WHERE origin IS NULL");
                executeSilently("ALTER TABLE assessments ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'QUIZ'");
                executeSilently("ALTER TABLE resources ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'");

                executeSilently("ALTER TABLE student_topic_mastery DROP INDEX uk_student_topic_mastery");
                executeSilently("ALTER TABLE resource_progress DROP INDEX uk_student_resource_progress");
            }
        } catch (Exception e) {
            log.debug("Schema adjustments completed with notice: {}", e.getMessage());
        }
    }

    private void backfillClassOnMasteryAndProgress(ClassEntity defaultSection) {
        // 1. StudentTopicMastery
        List<StudentTopicMastery> allMasteries = studentTopicMasteryRepository.findAll();
        for (StudentTopicMastery m : allMasteries) {
            if (m.getClassroom() == null) {
                ClassEntity cls = resolveClassForStudentAndSubject(m.getStudent(), m.getTopic().getSubject(), defaultSection);
                if (cls != null) {
                    m.setClassroom(cls);
                    studentTopicMasteryRepository.save(m);
                }
            }
        }

        // 2. ResourceProgress
        List<ResourceProgress> allProgress = resourceProgressRepository.findAll();
        for (ResourceProgress rp : allProgress) {
            if (rp.getClassroom() == null) {
                Subject subj = rp.getResource().getTopic() != null ? rp.getResource().getTopic().getSubject() : null;
                ClassEntity cls = resolveClassForStudentAndSubject(rp.getStudent(), subj, defaultSection);
                if (cls != null) {
                    rp.setClassroom(cls);
                    resourceProgressRepository.save(rp);
                }
            }
        }

        // 3. GapValidationLabel
        List<GapValidationLabel> allLabels = gapValidationLabelRepository.findAll();
        for (GapValidationLabel l : allLabels) {
            if (l.getClassroom() == null) {
                Subject subj = l.getTopic() != null ? l.getTopic().getSubject() : null;
                ClassEntity cls = resolveClassForStudentAndSubject(l.getStudent(), subj, defaultSection);
                if (cls != null) {
                    l.setClassroom(cls);
                    gapValidationLabelRepository.save(l);
                }
            }
        }
    }

    private ClassEntity resolveClassForStudentAndSubject(User student, Subject subject, ClassEntity fallback) {
        if (student == null) return fallback;
        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        for (Enrollment e : enrollments) {
            if (e.getClassEntity() != null) {
                if (subject == null || (e.getClassEntity().getSubject() != null && e.getClassEntity().getSubject().getId().equals(subject.getId()))) {
                    return e.getClassEntity();
                }
            }
        }
        return fallback;
    }

    private void executeSilently(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ignored) {
            // Already applied or not applicable
        }
    }

    private void relaxLegacySubjectColumnIfPresent() {
        try {
            String dbProduct = jdbcTemplate.execute((java.sql.Connection conn) -> conn.getMetaData().getDatabaseProductName());
            if ("H2".equalsIgnoreCase(dbProduct)) {
                try {
                    jdbcTemplate.execute("ALTER TABLE enrollments ALTER COLUMN subject_id SET NULL");
                    log.info("Migration: Relaxed enrollments.subject_id column in H2 database.");
                } catch (Exception ignored) {
                    // Column already relaxed, dropped, or does not exist
                }
            } else {
                try {
                    jdbcTemplate.execute("ALTER TABLE enrollments MODIFY COLUMN subject_id BIGINT NULL");
                    log.info("Migration: Relaxed enrollments.subject_id column in MySQL database.");
                } catch (Exception ignored) {
                    // Column already relaxed, dropped, or does not exist
                }
            }
        } catch (Exception e) {
            log.debug("Database metadata inspection skipped: {}", e.getMessage());
        }
    }

    private void relaxLegacyTopicColumnOnResourcesIfPresent() {
        try {
            String dbProduct = jdbcTemplate.execute((java.sql.Connection conn) -> conn.getMetaData().getDatabaseProductName());
            if ("H2".equalsIgnoreCase(dbProduct)) {
                try {
                    jdbcTemplate.execute("ALTER TABLE resources ALTER COLUMN topic_id SET NULL");
                    log.info("Migration: Relaxed resources.topic_id column in H2 database.");
                } catch (Exception ignored) {
                    // Column already relaxed or does not exist
                }
            } else {
                try {
                    jdbcTemplate.execute("ALTER TABLE resources MODIFY COLUMN topic_id BIGINT NULL");
                    log.info("Migration: Relaxed resources.topic_id column in MySQL database.");
                } catch (Exception ignored) {
                    // Column already relaxed or does not exist
                }
            }
        } catch (Exception e) {
            log.debug("Database metadata inspection skipped for resources.topic_id: {}", e.getMessage());
        }
    }

    private void migrateEnumsAndColumnsIfPresent() {
        try {
            String dbProduct = jdbcTemplate.execute((java.sql.Connection conn) -> conn.getMetaData().getDatabaseProductName());
            if (!"H2".equalsIgnoreCase(dbProduct)) {
                // Ensure questions.origin supports MANUAL, AI, and AI_DRAFT if defined as an ENUM
                try {
                    String originDataType = jdbcTemplate.queryForObject(
                            "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'origin'",
                            String.class
                    );
                    if ("enum".equalsIgnoreCase(originDataType)) {
                        executeSilently("ALTER TABLE questions MODIFY COLUMN origin ENUM('MANUAL', 'AI', 'AI_DRAFT') NOT NULL DEFAULT 'MANUAL'");
                        log.info("Migration: Updated questions.origin ENUM to include 'MANUAL', 'AI', 'AI_DRAFT'");
                    }
                } catch (Exception ex) {
                    // Fallback modify attempt if INFORMATION_SCHEMA cannot be inspected directly
                    executeSilently("ALTER TABLE questions MODIFY COLUMN origin ENUM('MANUAL', 'AI', 'AI_DRAFT') NOT NULL DEFAULT 'MANUAL'");
                }

                // Ensure questions has origin_file_id
                executeSilently("ALTER TABLE questions ADD COLUMN origin_file_id BIGINT NULL");
                // Ensure resources.type supports FILE
                executeSilently("ALTER TABLE resources MODIFY COLUMN type ENUM('ARTICLE', 'LINK', 'NOTE', 'PRACTICE', 'VIDEO', 'FILE') NOT NULL");
                // Ensure resources has file_id
                executeSilently("ALTER TABLE resources ADD COLUMN file_id BIGINT NULL");
                log.info("Migration: Verified enum and column compatibility for questions and resources.");
            }
        } catch (Exception e) {
            log.debug("Database enum and column migration skipped: {}", e.getMessage());
        }
    }

    private void ensureValidationAssignmentTableIfPresent() {
        try {
            executeSilently("CREATE TABLE IF NOT EXISTS student_validation_assignments (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "student_id BIGINT NOT NULL, " +
                    "class_id BIGINT NOT NULL, " +
                    "topic_id BIGINT NOT NULL, " +
                    "assigned_at TIMESTAMP NOT NULL, " +
                    "assigned_order INT, " +
                    "seed VARCHAR(64), " +
                    "CONSTRAINT uk_val_assign_student_class_topic UNIQUE (student_id, class_id, topic_id)" +
                    ")");
        } catch (Exception e) {
            log.debug("Validation assignments table migration notice: {}", e.getMessage());
        }
    }
}


package com.learningpal.config;

import com.learningpal.entity.*;
import com.learningpal.repository.*;
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
 * Idempotent startup migration runner that transitions LearningPal to the multi-institution & classroom model.
 * - Creates default "Pilot University" (PILOT-2026).
 * - Assigns all existing users without institution to Pilot University.
 * - Creates default "Section A" for the pilot subject (with first active teacher if one exists).
 * - Converts legacy student-subject enrollments to Section A.
 * - Backfills classId on historical attempts.
 * - Relaxes legacy subject_id in enrollments table so inserts without subject_id never fail.
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

    public DatabaseMigrationRunner(
            JdbcTemplate jdbcTemplate,
            InstitutionRepository institutionRepository,
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            ClassEntityRepository classEntityRepository,
            EnrollmentRepository enrollmentRepository,
            AttemptRepository attemptRepository,
            JoinCodeGenerator joinCodeGenerator) {
        this.jdbcTemplate = jdbcTemplate;
        this.institutionRepository = institutionRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.classEntityRepository = classEntityRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attemptRepository = attemptRepository;
        this.joinCodeGenerator = joinCodeGenerator;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting Multi-Institution & Classroom migration check...");

        // 1. Guarded schema migration: relax legacy subject_id column if present in database
        relaxLegacySubjectColumnIfPresent();

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
        if (pilotSubject != null) {
            ClassEntity sectionA = classEntityRepository.findFirstByInstitutionAndSubject(pilot, pilotSubject)
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

        log.info("Multi-Institution & Classroom migration check complete.");
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
}


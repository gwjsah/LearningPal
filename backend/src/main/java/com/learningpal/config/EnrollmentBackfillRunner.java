package com.learningpal.config;

import com.learningpal.entity.Assessment;
import com.learningpal.entity.Attempt;
import com.learningpal.entity.Enrollment;
import com.learningpal.entity.Subject;
import com.learningpal.entity.User;
import com.learningpal.repository.AttemptRepository;
import com.learningpal.repository.EnrollmentRepository;
import com.learningpal.repository.SubjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup runner that auto-enrolls every student who already has existing attempts
 * into the corresponding subject (including the pilot subject C_PROG_INTRO).
 * This ensures zero disruption to existing student records upon migration.
 */
@Component
@Order(3)
public class EnrollmentBackfillRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EnrollmentBackfillRunner.class);

    private final AttemptRepository attemptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;

    public EnrollmentBackfillRunner(
            AttemptRepository attemptRepository,
            EnrollmentRepository enrollmentRepository,
            SubjectRepository subjectRepository) {
        this.attemptRepository = attemptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Attempt> attempts = attemptRepository.findAll();
        int backfilled = 0;

        for (Attempt attempt : attempts) {
            User student = attempt.getStudent();
            Assessment assessment = attempt.getAssessment();
            if (student != null && assessment != null && assessment.getSubject() != null) {
                Subject subject = assessment.getSubject();
                if (!enrollmentRepository.existsByStudentAndSubject(student, subject)) {
                    enrollmentRepository.save(new Enrollment(student, subject));
                    backfilled++;
                    log.info("Backfilled enrollment for student {} ({}) in subject {}",
                            student.getId(), student.getEmail(), subject.getCode());
                }
            }
        }

        if (backfilled > 0) {
            log.info("Enrollment backfill complete: {} enrollments created from historical attempts.", backfilled);
        } else {
            log.info("Enrollment backfill check complete: all existing attempt owners are enrolled.");
        }
    }
}


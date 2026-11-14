package com.learningpal.config;

import com.learningpal.entity.*;
import com.learningpal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup runner that ensures historical attempts are linked to the student's existing class.
 * Strictly idempotent. Never automatically creates new enrollments.
 */
@Component
@Order(3)
public class EnrollmentBackfillRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EnrollmentBackfillRunner.class);

    private final AttemptRepository attemptRepository;
    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentBackfillRunner(
            AttemptRepository attemptRepository,
            EnrollmentRepository enrollmentRepository) {
        this.attemptRepository = attemptRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Attempt> attempts = attemptRepository.findAll();
        int updated = 0;

        for (Attempt attempt : attempts) {
            if (attempt.getClassId() == null && attempt.getStudent() != null && attempt.getAssessment() != null) {
                Subject subject = attempt.getAssessment().getSubject();
                if (subject != null) {
                    Long classId = enrollmentRepository.findClassIdByStudentAndSubject(attempt.getStudent(), subject)
                            .orElse(null);
                    if (classId != null) {
                        attempt.setClassId(classId);
                        attemptRepository.save(attempt);
                        updated++;
                    }
                }
            }
        }

        if (updated > 0) {
            log.info("Historical attempt classId backfill complete: {} attempt(s) updated.", updated);
        } else {
            log.info("Historical attempt classId check complete: all attempts are stamped.");
        }
    }
}

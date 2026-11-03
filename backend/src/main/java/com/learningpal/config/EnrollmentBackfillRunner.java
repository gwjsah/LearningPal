package com.learningpal.config;

import com.learningpal.entity.*;
import com.learningpal.repository.*;
import com.learningpal.service.JoinCodeGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup runner that auto-enrolls every student who already has existing attempts
 * into the corresponding class/subject for their institution.
 * Ensures zero disruption to student records upon migration.
 */
@Component
@Order(3)
public class EnrollmentBackfillRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EnrollmentBackfillRunner.class);

    private final AttemptRepository attemptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassEntityRepository classEntityRepository;
    private final InstitutionRepository institutionRepository;
    private final JoinCodeGenerator joinCodeGenerator;

    public EnrollmentBackfillRunner(
            AttemptRepository attemptRepository,
            EnrollmentRepository enrollmentRepository,
            ClassEntityRepository classEntityRepository,
            InstitutionRepository institutionRepository,
            JoinCodeGenerator joinCodeGenerator) {
        this.attemptRepository = attemptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classEntityRepository = classEntityRepository;
        this.institutionRepository = institutionRepository;
        this.joinCodeGenerator = joinCodeGenerator;
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
                Institution inst = student.getInstitution();
                if (inst == null) {
                    inst = institutionRepository.findByCode("PILOT-2026")
                            .orElseGet(() -> institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));
                    student.setInstitution(inst);
                }

                final Institution studentInst = inst;
                ClassEntity defaultClass = classEntityRepository.findFirstByInstitutionAndSubject(studentInst, subject)
                        .orElseGet(() -> {
                            String code = joinCodeGenerator.generateUniqueCode(studentInst, classEntityRepository);
                            return classEntityRepository.save(new ClassEntity(studentInst, subject, null, "Section A", code));
                        });

                if (!enrollmentRepository.existsByStudentAndSubject(student, subject)) {
                    enrollmentRepository.save(new Enrollment(student, defaultClass));
                    backfilled++;
                    log.info("Backfilled enrollment for student {} ({}) in class {} ({})",
                            student.getId(), student.getEmail(), defaultClass.getName(), subject.getCode());
                }

                if (attempt.getClassId() == null) {
                    attempt.setClassId(defaultClass.getId());
                    attemptRepository.save(attempt);
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

package com.learningpal.service;

import com.learningpal.dto.CreateInstitutionRequest;
import com.learningpal.dto.InstitutionDetailDto;
import com.learningpal.dto.InstitutionSummaryDto;
import com.learningpal.dto.UserDto;
import com.learningpal.entity.Institution;
import com.learningpal.entity.InstitutionStatus;
import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.ConflictException;
import com.learningpal.exception.DuplicateEmailException;
import com.learningpal.repository.ClassEntityRepository;
import com.learningpal.repository.InstitutionRepository;
import com.learningpal.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Service managing platform super-administrator capabilities:
 * creating educational institutions and provisioning their initial administrative users.
 */
@Service
public class SuperAdminService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,72}$");

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final ClassEntityRepository classEntityRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminService(
            InstitutionRepository institutionRepository,
            UserRepository userRepository,
            ClassEntityRepository classEntityRepository,
            PasswordEncoder passwordEncoder) {
        this.institutionRepository = institutionRepository;
        this.userRepository = userRepository;
        this.classEntityRepository = classEntityRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Provisions a new institution and its primary administrator account atomically in one transaction.
     */
    @Transactional
    public InstitutionDetailDto createInstitution(CreateInstitutionRequest request) {
        if (!PASSWORD_PATTERN.matcher(request.adminPassword()).matches()) {
            throw new BadRequestException("Admin password must be at least 8 characters and include at least one letter and one number");
        }

        String code = request.code();
        if (code == null || code.isBlank()) {
            // Generate readable unique code
            code = "INST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
            while (institutionRepository.existsByCode(code)) {
                code = "INST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
            }
        } else {
            code = code.trim().toUpperCase(Locale.ROOT);
            if (institutionRepository.existsByCode(code)) {
                throw new ConflictException("Institution code already exists: " + code);
            }
        }

        String normalizedEmail = request.adminEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("An account with this email already exists: " + normalizedEmail);
        }

        Institution institution = new Institution(request.name().trim(), code, InstitutionStatus.ACTIVE);
        Institution savedInstitution = institutionRepository.save(institution);

        User admin = new User(
                request.adminFullName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.adminPassword()),
                Role.ADMIN,
                UserStatus.ACTIVE,
                savedInstitution
        );
        User savedAdmin = userRepository.save(admin);

        return InstitutionDetailDto.fromEntity(savedInstitution, UserDto.fromEntity(savedAdmin));
    }

    /**
     * Lists all platform institutions along with their registered user and class counts.
     */
    @Transactional(readOnly = true)
    public List<InstitutionSummaryDto> getInstitutions() {
        return institutionRepository.findAll().stream().map(inst -> {
            long userCount = userRepository.countByInstitution(inst);
            long classCount = classEntityRepository.countByInstitution(inst);
            return InstitutionSummaryDto.fromEntity(inst, userCount, classCount);
        }).toList();
    }
}


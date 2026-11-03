package com.learningpal.config;

import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;
import com.learningpal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Seeds the platform SUPER_ADMIN account if configured in application properties.
 * If credentials are not configured, logs a clear warning and skips seeding.
 * Never logs or exposes passwords.
 */
@Component
@Order(4)
public class SuperAdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String superAdminEmail;
    private final String superAdminPassword;
    private final String superAdminFullName;

    public SuperAdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.superadmin.email:#{null}}") String superAdminEmail,
            @Value("${app.superadmin.password:#{null}}") String superAdminPassword,
            @Value("${app.superadmin.full-name:LearningPal Super Admin}") String superAdminFullName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.superAdminEmail = superAdminEmail;
        this.superAdminPassword = superAdminPassword;
        this.superAdminFullName = superAdminFullName;
    }

    @Override
    public void run(String... args) {
        if (superAdminEmail == null || superAdminEmail.isBlank() ||
            superAdminPassword == null || superAdminPassword.isBlank()) {
            log.warn("SUPER_ADMIN SEED SKIPPED: 'app.superadmin.email' or 'app.superadmin.password' is not configured.");
            return;
        }

        if (superAdminPassword.length() < 8 || "REPLACE_WITH_STRONG_PASSWORD".equalsIgnoreCase(superAdminPassword.trim())) {
            log.warn("SUPER_ADMIN SEED SKIPPED: password is placeholder or shorter than 8 characters.");
            return;
        }

        if (!userRepository.existsByRole(Role.SUPER_ADMIN)) {
            String normalizedEmail = superAdminEmail.trim().toLowerCase(Locale.ROOT);
            User superAdmin = new User(
                    superAdminFullName,
                    normalizedEmail,
                    passwordEncoder.encode(superAdminPassword),
                    Role.SUPER_ADMIN,
                    UserStatus.ACTIVE
            );
            superAdmin.setInstitution(null); // SUPER_ADMIN has NO institution
            userRepository.save(superAdmin);
            log.info("SUPER_ADMIN account seeded: [{}]", normalizedEmail);
        } else {
            log.info("SUPER_ADMIN account already exists. Skipping seeder.");
        }
    }
}


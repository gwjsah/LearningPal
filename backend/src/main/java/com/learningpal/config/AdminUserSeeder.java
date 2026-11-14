package com.learningpal.config;

import com.learningpal.entity.Institution;
import com.learningpal.entity.InstitutionStatus;
import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;
import com.learningpal.repository.InstitutionRepository;
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
 * Initializes the default system administrator if no administrator exists in the database.
 * The administrator is assigned to Pilot University (PILOT-2026).
 */
@Component
@Order(2)
public class AdminUserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFullName;

    public AdminUserSeeder(
            UserRepository userRepository,
            InstitutionRepository institutionRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword,
            @Value("${app.admin.full-name:LearningPal System Admin}") String adminFullName) {
        this.userRepository = userRepository;
        this.institutionRepository = institutionRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminFullName = adminFullName;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByRole(Role.ADMIN)) {
            if (adminPassword == null || adminPassword.isBlank() || adminPassword.length() < 8 || "REPLACE_WITH_STRONG_PASSWORD".equalsIgnoreCase(adminPassword.trim())) {
                log.error("ADMIN SEED SKIPPED: 'app.admin.password' is unset, placeholder, or shorter than 8 characters. Set a secure password via APP_ADMIN_PASSWORD environment variable.");
                return;
            }
            if ("AdminPass123".equals(adminPassword)) {
                log.warn("SECURITY WARNING: Using default development admin password. Set APP_ADMIN_PASSWORD in production!");
            }

            Institution pilot = institutionRepository.findByCode("PILOT-2026")
                    .orElseGet(() -> institutionRepository.save(new Institution("Pilot University", "PILOT-2026", InstitutionStatus.ACTIVE)));

            String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
            User admin = new User(
                    adminFullName,
                    normalizedEmail,
                    passwordEncoder.encode(adminPassword),
                    Role.ADMIN,
                    UserStatus.ACTIVE,
                    pilot
            );
            userRepository.save(admin);
            log.warn("================================================================================");
            log.warn("SEED ADMIN CREATED: [{}] at Pilot University", normalizedEmail);
            log.warn("CRITICAL: Default admin credentials must be changed for production environments");
            log.warn("and excluded from version control!");
            log.warn("================================================================================");
        } else {
            log.info("Administrator account already exists. Skipping admin seed.");
        }
    }
}

package com.learningpal.service;

import com.learningpal.config.JwtService;
import com.learningpal.dto.AuthResponse;
import com.learningpal.dto.LoginRequest;
import com.learningpal.dto.SignupRequest;
import com.learningpal.dto.UserDto;
import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.entity.UserStatus;
import com.learningpal.exception.AccountStatusException;
import com.learningpal.exception.BadRequestException;
import com.learningpal.exception.DuplicateEmailException;
import com.learningpal.exception.InvalidCredentialsException;
import com.learningpal.exception.ResourceNotFoundException;
import com.learningpal.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing user signup, authentication, and session retrieval.
 */
@Service
public class AuthService {

    // shortcut: in-memory map clears on restart; upgrade to distributed rate limiter (Redis/Bucket4j) for clustered deployments.
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000L;
    private final ConcurrentHashMap<String, FailedAttempt> loginAttempts = new ConcurrentHashMap<>();

    private record FailedAttempt(int count, long lockUntil, long lastAttempt) {}

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Registers a new user.
     * - Rejects ADMIN role registration.
     * - Enforces unique lowercase emails.
     * - Student signups become ACTIVE immediately with a signed JWT.
     * - Teacher signups become PENDING with no token until approved by an admin.
     */
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // Enforce that only STUDENT and TEACHER accounts can be registered through public signup
        if (request.getRole() == null || request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Public signup is only available for STUDENT or TEACHER roles");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("An account with this email already exists");
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());

        if (request.getRole() == Role.STUDENT) {
            // Students are active immediately
            User student = new User(
                    request.getFullName().trim(),
                    normalizedEmail,
                    passwordHash,
                    Role.STUDENT,
                    UserStatus.ACTIVE
            );
            User saved = userRepository.save(student);
            String token = jwtService.generateToken(saved);
            return new AuthResponse(token, UserDto.fromEntity(saved), "Student account created successfully");
        } else {
            // Teachers are queued for administrator review
            User teacher = new User(
                    request.getFullName().trim(),
                    normalizedEmail,
                    passwordHash,
                    Role.TEACHER,
                    UserStatus.PENDING
            );
            User saved = userRepository.save(teacher);
            return new AuthResponse(
                    null,
                    UserDto.fromEntity(saved),
                    "Request sent. An admin needs to approve your teacher account before you can log in."
            );
        }
    }

    /**
     * Authenticates an existing user.
     * - Wrong email and wrong password return the identical 401 error.
     * - Temporarily locks out email after 5 consecutive failed attempts.
     * - Account status is evaluated ONLY after the password is confirmed valid.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        long now = System.currentTimeMillis();
        FailedAttempt attempt = loginAttempts.get(normalizedEmail);
        if (attempt != null && attempt.lockUntil() > 0 && now < attempt.lockUntil()) {
            long minutesRemaining = Math.max(1, (attempt.lockUntil() - now + 59999L) / 60000L);
            throw new AccountStatusException("Too many failed login attempts. Please try again in " + minutesRemaining + " minute(s).");
        }

        // Find user by normalized email
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);

        // Verify credentials against BCrypt hash
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            recordFailedLogin(normalizedEmail);
            throw new InvalidCredentialsException("Incorrect email or password");
        }

        // Credentials valid: clear failed attempts
        loginAttempts.remove(normalizedEmail);

        // Verify account approval status
        if (user.getStatus() == UserStatus.PENDING) {
            throw new AccountStatusException("Your teacher account is awaiting admin approval");
        }
        if (user.getStatus() == UserStatus.REJECTED) {
            throw new AccountStatusException("Your teacher account request was declined");
        }

        // Active account: issue JWT
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, UserDto.fromEntity(user));
    }

    private void recordFailedLogin(String email) {
        long now = System.currentTimeMillis();
        loginAttempts.compute(email, (k, current) -> {
            if (current == null || (current.lockUntil() > 0 && now >= current.lockUntil()) || (now - current.lastAttempt() > LOCKOUT_DURATION_MS)) {
                return new FailedAttempt(1, 0L, now);
            }
            int newCount = current.count() + 1;
            long lockUntil = newCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0L;
            return new FailedAttempt(newCount, lockUntil, now);
        });
    }

    /**
     * Retrieves current user data for session restoration (/api/auth/me).
     */
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserDto.fromEntity(user);
    }
}


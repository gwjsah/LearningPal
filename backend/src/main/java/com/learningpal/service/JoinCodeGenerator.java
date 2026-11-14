package com.learningpal.service;

import com.learningpal.entity.Institution;
import com.learningpal.repository.ClassEntityRepository;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * Generates 6-character classroom join codes from an unambiguous alphabet:
 * Uppercase letters A-Z (excluding O, I) and digits 2-9 (excluding 0, 1).
 * Ensures collision-free uniqueness per institution.
 */
@Component
public class JoinCodeGenerator {

    /**
     * Unambiguous character set: 24 uppercase letters + 8 numbers = 32 chars.
     * Guaranteed never to contain '0', '1', 'O', or 'I'.
     */
    public static final String ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    public static final int CODE_LENGTH = 6;
    private static final int MAX_ATTEMPTS = 50;

    private final SecureRandom random = new SecureRandom();

    /**
     * Generates a single raw 6-character code from the unambiguous alphabet.
     */
    public String generateRawCode() {
        char[] chars = new char[CODE_LENGTH];
        for (int i = 0; i < CODE_LENGTH; i++) {
            chars[i] = ALPHABET.charAt(random.nextInt(ALPHABET.length()));
        }
        return new String(chars);
    }

    /**
     * Generates a code that is verified unique within the given institution using ClassEntityRepository.
     */
    public String generateUniqueCode(Institution institution, ClassEntityRepository classEntityRepository) {
        return generateUniqueCodeWithPredicate(code -> classEntityRepository.existsByInstitutionAndJoinCode(institution, code));
    }

    /**
     * Pure generation loop accepting an existence test predicate (useful for unit testing without full DB).
     */
    public String generateUniqueCodeWithPredicate(Predicate<String> existsPredicate) {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String code = generateRawCode();
            if (!existsPredicate.test(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate a unique join code after " + MAX_ATTEMPTS + " attempts");
    }
}


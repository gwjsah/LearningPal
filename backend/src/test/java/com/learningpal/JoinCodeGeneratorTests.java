package com.learningpal;

import com.learningpal.service.JoinCodeGenerator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JoinCodeGenerator Unit Tests")
class JoinCodeGeneratorTests {

    private final JoinCodeGenerator generator = new JoinCodeGenerator();

    @Test
    @DisplayName("Generated code must have length 6 and use only unambiguous characters")
    void testCodeFormatAndAlphabet() {
        Set<Character> forbidden = Set.of('0', '1', 'O', 'I', 'o', 'i');

        for (int i = 0; i < 200; i++) {
            String code = generator.generateRawCode();
            assertNotNull(code);
            assertEquals(6, code.length(), "Code must be exactly 6 characters");

            for (char c : code.toCharArray()) {
                assertFalse(forbidden.contains(c), "Code must not contain forbidden character: " + c);
                assertTrue(JoinCodeGenerator.ALPHABET.indexOf(c) >= 0, "Character must belong to defined alphabet: " + c);
            }
        }
    }

    @Test
    @DisplayName("Generator retries on collision until an unused code is found")
    void testRetryOnCollision() {
        AtomicInteger attemptCount = new AtomicInteger(0);

        // Simulate collisions on first 2 attempts, then success
        String uniqueCode = generator.generateUniqueCodeWithPredicate(code -> {
            int current = attemptCount.incrementAndGet();
            return current <= 2;
        });

        assertNotNull(uniqueCode);
        assertEquals(6, uniqueCode.length());
        assertEquals(3, attemptCount.get(), "Expected 3 attempts (2 collisions + 1 success)");
    }

    @Test
    @DisplayName("Generator throws IllegalStateException if all 50 attempts collide")
    void testExhaustionThrowsException() {
        assertThrows(IllegalStateException.class, () ->
                generator.generateUniqueCodeWithPredicate(code -> true)
        );
    }
}


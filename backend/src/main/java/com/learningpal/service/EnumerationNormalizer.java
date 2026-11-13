package com.learningpal.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Deterministic normalization for rule-based ENUMERATION grading.
 * Order: Unicode NFKC -> trim & collapse whitespace -> strip surrounding punctuation -> lowercase.
 * No fuzzy matching.
 */
public final class EnumerationNormalizer {

    private static final Pattern MULTI_WHITESPACE = Pattern.compile("\\s+");

    private EnumerationNormalizer() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String nfkc = Normalizer.normalize(raw, Normalizer.Form.NFKC).trim();
        String stripped = stripSurroundingPunctuation(nfkc);
        String collapsed = MULTI_WHITESPACE.matcher(stripped.trim()).replaceAll(" ");
        return collapsed.toLowerCase(Locale.ROOT);
    }

    /**
     * Strips decorative edge punctuation (quotes, brackets, trailing sentence marks) while
     * preserving numeric signs (-3, +5), leading decimal points (.5), and trailing percent (50%).
     */
    private static String stripSurroundingPunctuation(String s) {
        int start = 0;
        int end = s.length();

        while (start < end) {
            char c = s.charAt(start);
            if (Character.isWhitespace(c)) {
                start++;
                continue;
            }
            if (isUnicodePunctuation(c)) {
                boolean isNumericSign = (c == '-' || c == '+') && start + 1 < end
                        && (Character.isDigit(s.charAt(start + 1))
                        || (s.charAt(start + 1) == '.' && start + 2 < end && Character.isDigit(s.charAt(start + 2))));
                boolean isLeadingDecimal = c == '.' && start + 1 < end && Character.isDigit(s.charAt(start + 1));
                if (!isNumericSign && !isLeadingDecimal) {
                    start++;
                    continue;
                }
            }
            break;
        }

        while (end > start) {
            char c = s.charAt(end - 1);
            if (Character.isWhitespace(c)) {
                end--;
                continue;
            }
            if (isUnicodePunctuation(c)) {
                boolean isPercentAfterDigit = c == '%' && end - 2 >= start && Character.isDigit(s.charAt(end - 2));
                if (!isPercentAfterDigit) {
                    end--;
                    continue;
                }
            }
            break;
        }

        return s.substring(start, end);
    }

    private static boolean isUnicodePunctuation(char c) {
        return switch (Character.getType(c)) {
            case Character.CONNECTOR_PUNCTUATION,
                 Character.DASH_PUNCTUATION,
                 Character.START_PUNCTUATION,
                 Character.END_PUNCTUATION,
                 Character.INITIAL_QUOTE_PUNCTUATION,
                 Character.FINAL_QUOTE_PUNCTUATION,
                 Character.OTHER_PUNCTUATION -> true;
            default -> false;
        };
    }

    public static boolean matchesAny(String studentText, List<String> acceptedVariants) {
        if (acceptedVariants == null || acceptedVariants.isEmpty()) {
            return false;
        }
        String normalizedStudent = normalize(studentText);
        if (normalizedStudent.isEmpty()) {
            return false;
        }
        for (String variant : acceptedVariants) {
            String normalizedVariant = normalize(variant);
            if (!normalizedVariant.isEmpty() && normalizedStudent.equals(normalizedVariant)) {
                return true;
            }
        }
        return false;
    }
}

package com.learningpal.service;

import com.learningpal.entity.MasteryStatus;

/**
 * Pure, deterministic classification logic for gap analysis.
 * Contains no side-effects or external dependencies.
 */
public final class GapAnalysisClassifier {

    public static final double DEFAULT_STRENGTH_THRESHOLD = 80.0;
    public static final double DEFAULT_GAP_THRESHOLD = 60.0;
    public static final int DEFAULT_MIN_QUESTIONS = 3;

    private GapAnalysisClassifier() {
        // Utility class
    }

    /**
     * Pure classification function evaluating raw points and question count against thresholds.
     *
     * Rules:
     * - If distinct questions evaluated < minQuestions: INSUFFICIENT_DATA
     * - If total possible points <= 0: INSUFFICIENT_DATA
     * - Otherwise:
     *   - score >= strengthThreshold: STRENGTH
     *   - score >= gapThreshold: DEVELOPING
     *   - score < gapThreshold: GAP
     */
    public static MasteryStatus classify(
            double earnedPoints,
            double totalPossiblePoints,
            int distinctQuestionCount,
            double strengthThreshold,
            double gapThreshold,
            int minQuestions) {

        if (distinctQuestionCount < minQuestions || totalPossiblePoints <= 0.0) {
            return MasteryStatus.INSUFFICIENT_DATA;
        }

        double percent = (earnedPoints / totalPossiblePoints) * 100.0;
        return classifyPercent(percent, distinctQuestionCount, strengthThreshold, gapThreshold, minQuestions);
    }

    /**
     * Overload using standard default thresholds (80.0, 60.0, 3 questions).
     */
    public static MasteryStatus classify(double earnedPoints, double totalPossiblePoints, int distinctQuestionCount) {
        return classify(
                earnedPoints,
                totalPossiblePoints,
                distinctQuestionCount,
                DEFAULT_STRENGTH_THRESHOLD,
                DEFAULT_GAP_THRESHOLD,
                DEFAULT_MIN_QUESTIONS
        );
    }

    /**
     * Pure classification function evaluating computed percentage and question count.
     */
    public static MasteryStatus classifyPercent(
            Double masteryPercent,
            int distinctQuestionCount,
            double strengthThreshold,
            double gapThreshold,
            int minQuestions) {

        if (distinctQuestionCount < minQuestions || masteryPercent == null || Double.isNaN(masteryPercent)) {
            return MasteryStatus.INSUFFICIENT_DATA;
        }

        if (masteryPercent >= strengthThreshold) {
            return MasteryStatus.STRENGTH;
        }
        if (masteryPercent >= gapThreshold) {
            return MasteryStatus.DEVELOPING;
        }
        return MasteryStatus.GAP;
    }

    /**
     * Computes trend comparing current mastery with previous mastery.
     * Returns "UP", "DOWN", or "SAME".
     */
    public static String calculateTrend(Double currentPercent, Double previousPercent) {
        if (previousPercent == null || currentPercent == null) {
            return "SAME";
        }

        double delta = currentPercent - previousPercent;
        if (delta > 0.05) {
            return "UP";
        }
        if (delta < -0.05) {
            return "DOWN";
        }
        return "SAME";
    }
}


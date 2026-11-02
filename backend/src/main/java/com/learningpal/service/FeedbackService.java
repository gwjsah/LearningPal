package com.learningpal.service;

import com.learningpal.dto.FeedbackDto;
import com.learningpal.dto.MissedQuestionDto;
import com.learningpal.entity.MasteryStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Pure rule-based feedback generator for student topic mastery.
 * Produces warm, concise, and actionable guidance without AI or persistent tables.
 */
@Service
public class FeedbackService {

    /**
     * Pure function generating feedback from topic metrics, status, trend, and missed questions.
     */
    public static FeedbackDto generateFeedback(
            String topicName,
            Double masteryPercent,
            MasteryStatus status,
            String trend,
            Double previousMasteryPercent,
            List<MissedQuestionDto> missedQuestions) {

        List<MissedQuestionDto> reviewList = (missedQuestions != null) ? missedQuestions : Collections.emptyList();
        int missesCount = reviewList.size();

        // Calculate delta for trend wording if available
        Integer pointsDelta = null;
        if (masteryPercent != null && previousMasteryPercent != null) {
            int diff = (int) Math.round(Math.abs(masteryPercent - previousMasteryPercent));
            if (diff > 0) {
                pointsDelta = diff;
            }
        }

        String headline;
        String message;

        MasteryStatus effectiveStatus = (status != null) ? status : MasteryStatus.INSUFFICIENT_DATA;
        switch (effectiveStatus) {
            case GAP -> {
                headline = "Needs attention: let's build up your " + topicName + " fundamentals";
                if ("UP".equalsIgnoreCase(trend) && pointsDelta != null) {
                    message = "You are making progress (up " + pointsDelta + " points since last time!), but this topic still needs attention. Start with the study note, then the exercise to close the gap.";
                } else if ("DOWN".equalsIgnoreCase(trend) && pointsDelta != null) {
                    message = "This topic needs attention (down " + pointsDelta + " points since last time). Start with the study note, then the exercise to rebuild your confidence.";
                } else {
                    message = "This topic needs attention. Start with the study note, then the exercise to build a solid foundation.";
                }
            }
            case DEVELOPING -> {
                headline = "Good progress: you're close to a strength in " + topicName;
                if ("UP".equalsIgnoreCase(trend) && pointsDelta != null) {
                    message = "Encouraging momentum—up " + pointsDelta + " points since last time! You're close to a strength. Focus on the specific misses below to master this topic.";
                } else if ("DOWN".equalsIgnoreCase(trend) && pointsDelta != null) {
                    message = "You are down " + pointsDelta + " points since last time, but still close to a strength. Review the specific misses below to get back on track.";
                } else {
                    message = "You have a solid foundation and are close to a strength. Focus on the specific misses below to push your score over 80%.";
                }
            }
            case STRENGTH -> {
                headline = "Solid understanding: excellent work on " + topicName;
                if (missesCount == 0) {
                    if ("UP".equalsIgnoreCase(trend) && pointsDelta != null) {
                        message = "Outstanding work! Up " + pointsDelta + " points since last time with a flawless score. Try the practice challenge below to keep your skills sharp.";
                    } else {
                        message = "Outstanding work! You demonstrated complete mastery on all tested questions. Try the practice challenge below to keep your skills sharp.";
                    }
                } else {
                    if ("UP".equalsIgnoreCase(trend) && pointsDelta != null) {
                        message = "Great job! Up " + pointsDelta + " points since last time with strong conceptual mastery. Review the minor detail below and try the practice challenge to stay sharp.";
                    } else if ("DOWN".equalsIgnoreCase(trend) && pointsDelta != null) {
                        message = "You maintained a strong grasp on this topic (down " + pointsDelta + " points since last time). Review the question below and try the practice challenge to stay sharp.";
                    } else {
                        message = "Great job! You showed strong conceptual command. Review the minor detail below and try the practice challenge to stay sharp.";
                    }
                }
            }
            case INSUFFICIENT_DATA -> {
                headline = "More practice needed to assess " + topicName;
                message = "You have answered fewer than 3 questions on this topic. Start with the study note and complete more quiz questions to unlock your diagnostic analysis.";
            }
            default -> {
                headline = "More practice needed to assess " + topicName;
                message = "You have answered fewer than 3 questions on this topic. Start with the study note and complete more quiz questions to unlock your diagnostic analysis.";
            }
        }

        return new FeedbackDto(headline, message, new ArrayList<>(reviewList));
    }
}

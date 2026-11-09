package com.learningpal.service.ai;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits extracted document text into logical, cohesive sections aligned with local LLM context limits.
 */
public class DocumentChunker {

    private static final int MIN_USEFUL_CHARS = 100;

    public static List<String> chunkText(String fullText, int maxChunkChars) {
        List<String> chunks = new ArrayList<>();
        if (fullText == null || fullText.isBlank()) {
            return chunks;
        }

        int targetLimit = maxChunkChars > 500 ? maxChunkChars : 5000;

        // Split on blank lines or markdown heading boundaries
        String[] rawParagraphs = fullText.split("(\\r?\\n\\s*\\r?\\n|(?<=\\n)(?=#{1,6}\\s))");

        StringBuilder currentChunk = new StringBuilder();

        for (String rawPara : rawParagraphs) {
            String para = rawPara.trim();
            if (para.isEmpty()) {
                continue;
            }

            if (para.length() > targetLimit) {
                // If current accumulated chunk has content, flush it first
                if (currentChunk.length() >= MIN_USEFUL_CHARS) {
                    chunks.add(currentChunk.toString().trim());
                    currentChunk.setLength(0);
                } else if (currentChunk.length() > 0) {
                    currentChunk.setLength(0);
                }

                // Split oversized paragraph into targetLimit slices
                List<String> slices = sliceOversizedParagraph(para, targetLimit);
                for (String slice : slices) {
                    if (slice.length() >= MIN_USEFUL_CHARS) {
                        chunks.add(slice);
                    }
                }
                continue;
            }

            if (currentChunk.length() + para.length() + 2 > targetLimit) {
                if (currentChunk.length() >= MIN_USEFUL_CHARS) {
                    chunks.add(currentChunk.toString().trim());
                }
                currentChunk.setLength(0);
            }

            if (currentChunk.length() > 0) {
                currentChunk.append("\n\n");
            }
            currentChunk.append(para);
        }

        if (currentChunk.length() >= MIN_USEFUL_CHARS) {
            chunks.add(currentChunk.toString().trim());
        } else if (chunks.isEmpty() && currentChunk.length() >= 50) {
            // Keep single short text if it's the only content in the document
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    private static List<String> sliceOversizedParagraph(String text, int limit) {
        List<String> slices = new ArrayList<>();
        int start = 0;
        int len = text.length();

        while (start < len) {
            int end = Math.min(start + limit, len);
            if (end < len) {
                // Look backward for a sentence boundary or line break
                int lastPeriod = text.lastIndexOf(". ", end);
                int lastNewline = text.lastIndexOf('\n', end);
                int breakPoint = Math.max(lastPeriod >= start ? lastPeriod + 1 : -1, lastNewline >= start ? lastNewline : -1);

                if (breakPoint > start + (limit / 2)) {
                    end = breakPoint;
                }
            }
            String slice = text.substring(start, end).trim();
            if (!slice.isEmpty()) {
                slices.add(slice);
            }
            start = end;
        }
        return slices;
    }
}

package com.learningpal.entity;

/**
 * Lifecycle status of automated document text extraction.
 */
public enum ExtractionStatus {
    /** Text successfully extracted and ready for downstream use. */
    READY,
    /** Document parsed successfully, but contains no extractable text (e.g. scanned image-only PDF). */
    EMPTY,
    /** Text extraction failed due to parsing error, corruption, or policy violation. */
    FAILED
}

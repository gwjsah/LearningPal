package com.learningpal.entity;

/**
 * Defines the account approval status.
 * - ACTIVE: Can log in immediately (students and approved teachers/admins)
 * - PENDING: Awaiting administrator approval (new teacher registrations)
 * - REJECTED: Denied administrator approval
 * - DEACTIVATED: Disabled by administrator; cannot log in, tokens invalidated
 */
public enum UserStatus {
    ACTIVE,
    PENDING,
    REJECTED,
    DEACTIVATED
}

package com.learningpal.entity;

/**
 * Defines user roles within the LearningPal platform.
 * - STUDENT: Enrolls in classes and takes assessments.
 * - TEACHER: Manages classes, sets schedules, and monitors student mastery.
 * - ADMIN: Manages users and classes within their own institution.
 * - SUPER_ADMIN: Platform owner; creates institutions and provisions school admins.
 */
public enum Role {
    STUDENT,
    TEACHER,
    ADMIN,
    SUPER_ADMIN
}

package com.learningpal.service;

import com.learningpal.entity.Institution;
import com.learningpal.entity.Role;
import com.learningpal.entity.User;
import com.learningpal.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Central multi-tenant access enforcer.
 * Guarantees that users cannot view or manipulate data belonging to another institution.
 * Any cross-tenant access violation immediately throws ResourceNotFoundException (HTTP 404)
 * to prevent attackers from discovering other institutions' data by ID enumeration.
 */
@Component
public class TenantAccess {

    /**
     * Enforces that the caller and the target user belong to the same institution.
     */
    public void requireSameInstitution(User caller, User target) {
        if (caller == null || target == null) {
            throw new ResourceNotFoundException("Entity not found");
        }
        if (caller.getRole() == Role.SUPER_ADMIN) {
            return; // Super admin has cross-tenant oversight
        }
        requireSameInstitution(caller, target.getInstitution());
    }

    /**
     * Enforces that the caller belongs to the target institution.
     */
    public void requireSameInstitution(User caller, Institution targetInstitution) {
        if (caller == null || targetInstitution == null) {
            throw new ResourceNotFoundException("Entity not found");
        }
        if (caller.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        Institution callerInstitution = caller.getInstitution();
        if (callerInstitution == null || !callerInstitution.getId().equals(targetInstitution.getId())) {
            throw new ResourceNotFoundException("Entity not found");
        }
    }

    /**
     * Returns caller's institution or throws 404 if not found.
     */
    public Institution requireCallerInstitution(User caller) {
        if (caller == null || caller.getInstitution() == null) {
            throw new ResourceNotFoundException("Institution not assigned for user");
        }
        return caller.getInstitution();
    }

    /**
     * Enforces that the teacher owns the specified class in the same institution.
     * Returns 404 if class does not exist, belongs to another institution, or is taught by another educator.
     */
    public com.learningpal.entity.ClassEntity requireOwnedClass(User teacher, Long classId, com.learningpal.repository.ClassEntityRepository repository) {
        if (teacher == null || classId == null) {
            throw new ResourceNotFoundException("Class not found: " + classId);
        }
        com.learningpal.entity.ClassEntity cls = repository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));
        requireSameInstitution(teacher, cls.getInstitution());
        if (cls.getTeacher() == null || !cls.getTeacher().getId().equals(teacher.getId())) {
            throw new ResourceNotFoundException("Class not found: " + classId);
        }
        return cls;
    }

    /**
     * Enforces that the teacher owns the specified subject in the same institution.
     * Returns 404 if subject does not exist, belongs to another educator,
     * belongs to another institution, or has no owner (platform-seeded subject).
     */
    public com.learningpal.entity.Subject requireOwnedSubject(
            User teacher,
            Long subjectId,
            com.learningpal.repository.SubjectRepository repository) {
        if (teacher == null || subjectId == null) {
            throw new ResourceNotFoundException("Subject not found: " + subjectId);
        }
        com.learningpal.entity.Subject subject = repository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));
        if (subject.getOwner() == null || !subject.getOwner().getId().equals(teacher.getId())) {
            throw new ResourceNotFoundException("Subject not found: " + subjectId);
        }
        requireSameInstitution(teacher, subject.getOwner().getInstitution());
        return subject;
    }

    /**
     * Central authorization rule for whether a teacher may inspect a student's learning data.
     * Evaluates to true ONLY IF:
     * 1. Teacher and Student are non-null and belong to the same institution.
     * 2. The student is enrolled (ACTIVE or ARCHIVED class) in a section OWNED by this teacher.
     */
    public boolean canTeacherAccessStudentData(
            User teacher,
            User student,
            com.learningpal.repository.EnrollmentRepository enrollmentRepository) {
        if (teacher == null || student == null) {
            return false;
        }
        if (teacher.getRole() != Role.TEACHER || student.getRole() != Role.STUDENT) {
            return false;
        }
        if (teacher.getInstitution() == null || student.getInstitution() == null) {
            return false;
        }
        if (!teacher.getInstitution().getId().equals(student.getInstitution().getId())) {
            return false;
        }
        return enrollmentRepository.existsByStudentAndTeacherAndInstitution(student, teacher, teacher.getInstitution());
    }

    /**
     * Enforces that the teacher is authorized to access the student's learning data.
     * Throws ResourceNotFoundException (HTTP 404) if unauthorized to prevent student discovery.
     */
    public void requireTeacherCanAccessStudentData(
            User teacher,
            User student,
            com.learningpal.repository.EnrollmentRepository enrollmentRepository) {
        if (!canTeacherAccessStudentData(teacher, student, enrollmentRepository)) {
            throw new ResourceNotFoundException("Student learning data not found");
        }
    }
}


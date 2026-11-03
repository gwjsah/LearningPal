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
}


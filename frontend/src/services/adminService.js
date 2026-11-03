import { apiRequest } from './api';

/**
 * Administrator service managing institution-scoped pending teachers, user accounts, and classes.
 */
export const adminService = {
  /**
   * Retrieves all teachers currently awaiting administrator approval in the admin's institution.
   * @returns {Promise<Array<{ id: number, fullName: string, email: string, createdAt: string }>>}
   */
  async getPendingTeachers() {
    return apiRequest('/admin/teachers/pending', {
      method: 'GET',
    });
  },

  /**
   * Approves a pending teacher account (sets status to ACTIVE).
   * @param {number|string} id - Teacher user ID
   * @returns {Promise<{ message: string }>}
   */
  async approveTeacher(id) {
    return apiRequest(`/admin/teachers/${id}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Rejects a pending teacher account (sets status to REJECTED).
   * @param {number|string} id - Teacher user ID
   * @returns {Promise<{ message: string }>}
   */
  async rejectTeacher(id) {
    return apiRequest(`/admin/teachers/${id}/reject`, {
      method: 'POST',
    });
  },

  /**
   * Retrieves users in the admin's institution, with optional filtering.
   * @param {string} [role] - Optional role filter (STUDENT, TEACHER, ADMIN)
   * @param {string} [status] - Optional status filter (ACTIVE, PENDING, REJECTED, DEACTIVATED)
   * @returns {Promise<Array<Object>>}
   */
  async getUsers(role, status) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';

    return apiRequest(`/admin/users${query}`, {
      method: 'GET',
    });
  },

  /**
   * Deactivates a user in the caller's institution.
   * @param {number|string} id - User ID
   * @returns {Promise<{ message: string }>}
   */
  async deactivateUser(id) {
    return apiRequest(`/admin/users/${id}/deactivate`, {
      method: 'POST',
    });
  },

  /**
   * Reactivates a deactivated user in the caller's institution.
   * @param {number|string} id - User ID
   * @returns {Promise<{ message: string }>}
   */
  async reactivateUser(id) {
    return apiRequest(`/admin/users/${id}/reactivate`, {
      method: 'POST',
    });
  },

  /**
   * Lists classes in the admin's institution.
   * @returns {Promise<Array<Object>>}
   */
  async getClasses() {
    return apiRequest('/admin/classes', {
      method: 'GET',
    });
  },

  /**
   * Reassigns a class to an active teacher in the same institution.
   * @param {number|string} classId
   * @param {number|string} teacherId
   * @returns {Promise<{ message: string }>}
   */
  async reassignClassTeacher(classId, teacherId) {
    return apiRequest(`/admin/classes/${classId}/teacher`, {
      method: 'PUT',
      body: JSON.stringify({ teacherId }),
    });
  },
};

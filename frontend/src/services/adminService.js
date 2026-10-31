import { apiRequest } from './api';

/**
 * Administrator service managing pending teacher verification and approval workflows.
 */
export const adminService = {
  /**
   * Retrieves all teachers currently awaiting administrator approval.
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
};


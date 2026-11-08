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

  /**
   * Validation Lab: Retrieves institution-wide validation agreement report.
   * @param {string} [source='TEACHER'] - TEACHER or SYNTHETIC
   * @param {boolean} [includeStale=false]
   */
  async getValidationReport(source = 'TEACHER', includeStale = false) {
    const params = new URLSearchParams({
      source,
      includeStale: String(includeStale),
    });
    return apiRequest(`/admin/validation/report?${params.toString()}`);
  },

  /**
   * Helpfulness Ratings: Retrieves institution-wide ratings summary.
   */
  async getRatingsSummary() {
    return apiRequest('/admin/ratings/summary');
  },

  /**
   * Helpfulness Ratings: Downloads institution ratings CSV export.
   */
  async downloadRatingsExport() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('learningpal_token');
    const url = `${API_BASE_URL}/admin/ratings/export`;

    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `ratings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Usability Survey: Retrieves institution survey summary.
   */
  async getSurveySummary() {
    return apiRequest('/admin/survey/summary');
  },

  /**
   * Usability Survey: Downloads institution survey responses CSV export.
   */
  async downloadSurveyExport() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('learningpal_token');
    const url = `${API_BASE_URL}/admin/survey/export`;

    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `survey-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

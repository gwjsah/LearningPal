import { apiRequest } from './api';

/**
 * Super Administrator service for platform-level institution provisioning and user directory management.
 * Backed by SuperAdminController (/api/super/**, ROLE_SUPER_ADMIN).
 */
export const superAdminService = {
  /**
   * Lists all educational institutions on the platform with user and class counts.
   * @returns {Promise<Array<{ id: number, name: string, code: string, status: string, createdAt: string, userCount: number, classCount: number }>>}
   */
  async getInstitutions() {
    return apiRequest('/super/institutions', {
      method: 'GET',
    });
  },

  /**
   * Provisions a new institution along with its initial administrator account.
   * @param {{ name: string, code?: string, adminFullName: string, adminEmail: string, adminPassword: string }} payload
   * @returns {Promise<{ id: number, name: string, code: string, status: string, createdAt: string, admin: Object }>}
   */
  async createInstitution(payload) {
    return apiRequest('/super/institutions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Lists platform users with optional role, institutionId, status, and search filters.
   * @param {{ role?: string, institutionId?: string|number, status?: string, search?: string }} [filters]
   * @returns {Promise<Array<{ id: number, fullName: string, email: string, role: string, status: string, institutionId: number|null, institutionName: string|null, institutionCode: string|null, createdAt: string }>>}
   */
  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.institutionId) params.append('institutionId', String(filters.institutionId));
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search.trim());
    const query = params.toString() ? `?${params.toString()}` : '';

    return apiRequest(`/super/users${query}`, {
      method: 'GET',
    });
  },

  /**
   * Deactivates a user account on the platform.
   * @param {number|string} id
   * @returns {Promise<{ message: string }>}
   */
  async deactivateUser(id) {
    return apiRequest(`/super/users/${id}/deactivate`, {
      method: 'POST',
    });
  },

  /**
   * Reactivates a user account on the platform.
   * @param {number|string} id
   * @returns {Promise<{ message: string }>}
   */
  async reactivateUser(id) {
    return apiRequest(`/super/users/${id}/reactivate`, {
      method: 'POST',
    });
  },
};

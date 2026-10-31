import { apiRequest } from './api';

/**
 * Authentication service handling signup, login, and current session inspection.
 */
export const authService = {
  /**
   * Registers a new Student or Teacher.
   * @param {{ fullName: string, email: string, password: string, role: 'STUDENT' | 'TEACHER' }} credentials
   * @returns {Promise<{ token?: string, user: object, message?: string }>}
   */
  async signup({ fullName, email, password, role }) {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role }),
    });
  },

  /**
   * Authenticates an existing user.
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login({ email, password }) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Retrieves the current user's profile using the stored Bearer token.
   * @returns {Promise<object>} User profile DTO
   */
  async me() {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },
};


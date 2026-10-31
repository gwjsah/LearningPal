/**
 * Central API Client for LearningPal.
 * Handles base URL configuration, Bearer token attachment, JSON serialization,
 * and unified error parsing ({ message: "..." }).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Universal fetch wrapper for LearningPal endpoints.
 * Automatically injects the stored JWT if present.
 *
 * @param {string} endpoint - Path relative to /api (e.g. '/auth/login')
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Retrieve JWT from local storage
  const token = localStorage.getItem('learningpal_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // Graceful error when backend server is offline or unreachable
    console.error('Network connectivity failure:', networkError);
    throw new Error('Unable to connect to the LearningPal server. Please check your connection or ensure the backend is running.');
  }

  // Handle empty responses (such as 204 No Content)
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    // Backend standardizes all error messages into { "message": "..." }
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}


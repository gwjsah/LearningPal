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
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Do not set Content-Type for FormData so the browser automatically sets multipart/form-data with boundary
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

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
    if (response.status === 401) {
      // shortcut: client-side token wipe on 401; upgrade to refresh-token rotation in production.
      localStorage.removeItem('learningpal_token');
    }

    // Backend standardizes all error messages into { "message": "..." }
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Downloads a binary file stream with auth token and triggers browser save dialog.
 * Respects Content-Disposition attachment filename when present.
 *
 * @param {string} endpoint - Path relative to /api (e.g. '/student/classes/1/files/5/download')
 * @param {string} fallbackFilename - Fallback filename if header is missing
 */
export async function apiDownload(endpoint, fallbackFilename = 'document') {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem('learningpal_token');

  const response = await fetch(url, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `Download failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) errorMsg = data.message;
    } catch (_) {
      // not JSON
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}


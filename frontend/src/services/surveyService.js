import { apiRequest } from './api';

/**
 * Service client for in-app usability surveys.
 */
export const surveyService = {
  /**
   * Retrieves usability survey status and role-specific items for the current user.
   */
  getSurveyStatus: () => apiRequest('/survey'),

  /**
   * Submits survey answers and optional comment.
   */
  submitSurvey: ({ surveyVersion, answers, comment }) =>
    apiRequest('/survey', {
      method: 'POST',
      body: JSON.stringify({ surveyVersion, answers, comment }),
    }),
};

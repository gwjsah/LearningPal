import { apiRequest } from './api';

/**
 * Service client for student assessment operations.
 */
export const studentService = {
  /**
   * Fetches subjects the current student is enrolled in with diagnostic summaries.
   */
  getEnrolledSubjects: () => apiRequest('/student/subjects'),

  /**
   * Fetches subjects available for self-enrollment.
   */
  getAvailableSubjects: () => apiRequest('/student/subjects/available'),

  /**
   * Self-enrolls the student in a subject (idempotent).
   */
  enrollSubject: (subjectId) =>
    apiRequest(`/student/subjects/${subjectId}/enroll`, {
      method: 'POST',
    }),

  /**
   * Fetches published assessments scoped to a subject.
   */
  getSubjectAssessments: (subjectId) => apiRequest(`/student/subjects/${subjectId}/assessments`),

  /**
   * Fetches diagnostic progress scoped to a subject.
   */
  getSubjectProgress: (subjectId) => apiRequest(`/student/subjects/${subjectId}/progress`),

  /**
   * Fetches published assessments with current student's attempt status.
   */
  getAssessments: () => apiRequest('/student/assessments'),

  /**
   * Starts or resumes an assessment attempt.
   */
  startAttempt: (assessmentId) =>
    apiRequest(`/student/assessments/${assessmentId}/attempts`, {
      method: 'POST',
    }),

  /**
   * Submits answers and triggers atomic auto-grading.
   */
  submitAttempt: (attemptId, answers) =>
    apiRequest(`/student/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  /**
   * Retrieves detailed score, topic breakdown, and review explanations for a submitted attempt.
   */
  getAttemptResult: (attemptId) => apiRequest(`/student/attempts/${attemptId}/result`),

  /**
   * Retrieves diagnostic gap analysis progress across all curriculum topics.
   */
  getProgress: () => apiRequest('/student/progress'),

  /**
   * Retrieves detailed mastery and answer history for a specific topic.
   */
  getTopicProgress: (topicId) => apiRequest(`/student/progress/topics/${topicId}`),

  /**
   * Marks an educational resource as completed.
   */
  completeResource: (resourceId) =>
    apiRequest(`/student/resources/${resourceId}/complete`, {
      method: 'POST',
    }),

  /**
   * Removes completion status for an educational resource.
   */
  uncompleteResource: (resourceId) =>
    apiRequest(`/student/resources/${resourceId}/complete`, {
      method: 'DELETE',
    }),
};


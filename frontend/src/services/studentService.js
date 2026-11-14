import { apiRequest, apiDownload } from './api';

/**
 * Service client for student classroom, assessment, and diagnostic operations.
 */
export const studentService = {
  /**
   * Fetches the current student's enrolled classes with diagnostic summaries.
   */
  getClasses: () => apiRequest('/student/classes'),

  /**
   * Joins a classroom section using a 6-character institution-scoped join code.
   */
  joinClass: (code) =>
    apiRequest('/student/classes/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  /**
   * Fetches workspace header and attempt permission details for an enrolled class.
   */
  getClassWorkspace: (classId) => apiRequest(`/student/classes/${classId}`),

  /**
   * Fetches general link study materials for a class.
   */
  getClassStudyMaterials: (classId) => apiRequest(`/student/classes/${classId}/materials`),

  /**
   * Downloads an educational file resource (PDF/DOCX) for an enrolled class.
   */
  downloadClassFile: (classId, fileId, filename) =>
    apiDownload(`/student/classes/${classId}/files/${fileId}/download`, filename),

  /**
   * Resolves a student's classId for a given subjectId (for URL backwards compatibility).
   */
  resolveClassForSubject: (subjectId) => apiRequest(`/student/classes/resolve-by-subject/${subjectId}`),

  /**
   * Fetches enrolled subject summaries (backwards compatibility).
   */
  getEnrolledSubjects: () => apiRequest('/student/subjects'),

  /**
   * Fetches published assessments scoped to a subject.
   */
  getSubjectAssessments: (subjectId) => apiRequest(`/student/subjects/${subjectId}/assessments`),

  /**
   * Fetches diagnostic progress scoped to a classroom.
   */
  getClassProgress: (classId) => apiRequest(`/student/classes/${classId}/progress`),

  /**
   * Fetches detailed topic progress scoped to a classroom.
   */
  getClassTopicProgress: (classId, topicId) =>
    apiRequest(`/student/classes/${classId}/progress/topics/${topicId}`),

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
   * Marks an educational resource as completed (optionally class-scoped).
   */
  completeResource: (resourceId, classId) =>
    classId
      ? apiRequest(`/student/classes/${classId}/resources/${resourceId}/complete`, {
          method: 'POST',
        })
      : apiRequest(`/student/resources/${resourceId}/complete`, {
          method: 'POST',
        }),

  /**
   * Removes completion status for an educational resource (optionally class-scoped).
   */
  uncompleteResource: (resourceId, classId) =>
    classId
      ? apiRequest(`/student/classes/${classId}/resources/${resourceId}/complete`, {
          method: 'DELETE',
        })
      : apiRequest(`/student/resources/${resourceId}/complete`, {
          method: 'DELETE',
        }),

  /**
   * Submits or updates helpfulness rating for topic diagnostic feedback.
   */
  rateTopicFeedback: (topicId, { rating, comment }) =>
    apiRequest(`/student/topics/${topicId}/feedback-rating`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
    }),

  /**
   * Submits or updates helpfulness rating for an educational resource.
   */
  rateResource: (resourceId, { rating, comment }) =>
    apiRequest(`/student/resources/${resourceId}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
    }),
};

import { apiRequest } from './api';

/**
 * Service client for educator classroom management operations.
 */
export const teacherService = {
  /**
   * Fetches subjects available for class creation.
   */
  getSubjects: () => apiRequest('/teacher/subjects'),

  /**
   * Fetches classes taught by the authenticated teacher.
   */
  getClasses: () => apiRequest('/teacher/classes'),

  /**
   * Creates a new class section.
   */
  createClass: ({ subjectId, name }) =>
    apiRequest('/teacher/classes', {
      method: 'POST',
      body: JSON.stringify({ subjectId, name }),
    }),

  /**
   * Retrieves class details and student member roster.
   */
  getClassDetail: (id) => apiRequest(`/teacher/classes/${id}`),

  /**
   * Retrieves full student roster with topic mastery breakdown and diagnostic scores.
   */
  getClassRoster: (id) => apiRequest(`/teacher/classes/${id}/roster`),

  /**
   * Retrieves aggregate class overview analytics and ranked topic gap distributions.
   */
  getClassOverview: (id) => apiRequest(`/teacher/classes/${id}/overview`),

  /**
   * Archives a class section.
   */
  archiveClass: (id) =>
    apiRequest(`/teacher/classes/${id}/archive`, {
      method: 'PUT',
    }),

  /**
   * Regenerates the 6-character join code for an active class.
   */
  regenerateJoinCode: (id) =>
    apiRequest(`/teacher/classes/${id}/regenerate-code`, {
      method: 'POST',
    }),

  /**
   * Toggles whether new student enrollment is open or closed.
   */
  toggleEnrollment: (id, open) =>
    apiRequest(`/teacher/classes/${id}/enrollment`, {
      method: 'PUT',
      body: JSON.stringify({ open }),
    }),

  /**
   * Fetches assessments for a class with class-scoped scheduling & retake settings.
   */
  getClassAssessments: (id) => apiRequest(`/teacher/classes/${id}/assessments`),

  /**
   * Updates class-scoped assessment availability window and retake allowance.
   */
  updateClassAssessmentSetting: (id, assessmentId, settings) =>
    apiRequest(`/teacher/classes/${id}/assessments/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  /**
   * Reopens an assessment attempt for an individual student.
   */
  unlockStudentAssessment: (id, assessmentId, { studentId, reason, extendedUntil }) =>
    apiRequest(`/teacher/classes/${id}/assessments/${assessmentId}/unlock-student`, {
      method: 'POST',
      body: JSON.stringify({ studentId, reason, extendedUntil }),
    }),

  /**
   * Retrieves comprehensive student profile, topic masteries, missed questions, attempts, and interventions.
   */
  getStudentDetail: (classId, studentId) =>
    apiRequest(`/teacher/classes/${classId}/students/${studentId}`),

  /**
   * Retrieves an attempt with question answers for teacher review and grading.
   */
  getAttemptReview: (classId, attemptId) =>
    apiRequest(`/teacher/classes/${classId}/attempts/${attemptId}`),

  /**
   * Overrides or reverts a student's score on a question answer.
   */
  gradeAnswer: (classId, attemptId, answerId, { teacherScore, teacherComment }) =>
    apiRequest(`/teacher/classes/${classId}/attempts/${attemptId}/answers/${answerId}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ teacherScore, teacherComment }),
    }),

  /**
   * Creates a pedagogical intervention for a student in this class.
   */
  createIntervention: (classId, studentId, { topicId, type, note, followUpDate }) =>
    apiRequest(`/teacher/classes/${classId}/students/${studentId}/interventions`, {
      method: 'POST',
      body: JSON.stringify({ topicId, type, note, followUpDate }),
    }),

  /**
   * Lists interventions for a class, filterable by status and student.
   */
  getClassInterventions: (classId, { status, studentId } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (studentId) params.append('studentId', studentId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/teacher/classes/${classId}/interventions${qs}`);
  },

  /**
   * Updates an intervention (note, follow-up date, or marks DONE/CANCELLED).
   */
  updateIntervention: (classId, id, { note, followUpDate, status }) =>
    apiRequest(`/teacher/classes/${classId}/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ note, followUpDate, status }),
    }),

  /**
   * Validation Lab: Retrieves enrolled students with blind labeling progress.
   */
  getValidationStudents: (classId) =>
    apiRequest(`/teacher/classes/${classId}/validation/students`),

  /**
   * Validation Lab: Retrieves blind topic evidence and current labels for a student.
   */
  getValidationStudentDetail: (classId, studentId) =>
    apiRequest(`/teacher/classes/${classId}/validation/students/${studentId}`),

  /**
   * Validation Lab: Upserts a teacher's blind label and optional note for a topic.
   */
  saveValidationLabel: (classId, studentId, topicId, { label, note }) =>
    apiRequest(`/teacher/classes/${classId}/validation/students/${studentId}/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify({ label, note }),
    }),

  /**
   * Validation Lab: Retrieves the agreement & validation metrics report.
   */
  getValidationReport: (classId, source = 'TEACHER', includeStale = false) => {
    const params = new URLSearchParams({
      source,
      includeStale: String(includeStale),
    });
    return apiRequest(`/teacher/classes/${classId}/validation/report?${params.toString()}`);
  },

  /**
   * Validation Lab: Downloads formula-safe pseudonymized validation CSV export.
   */
  downloadValidationExport: async (classId, source = 'TEACHER', includeStale = false) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('learningpal_token');
    const params = new URLSearchParams({
      source,
      includeStale: String(includeStale),
    });
    const url = `${API_BASE_URL}/teacher/classes/${classId}/validation/export?${params.toString()}`;

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
    link.download = `validation-export-class-${classId}-${source.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Helpfulness Ratings: Retrieves class feedback and resource rating summary.
   */
  getClassRatingsSummary: (classId) =>
    apiRequest(`/teacher/classes/${classId}/ratings-summary`),
};



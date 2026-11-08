# Multi-Tenant & Classroom Isolation Matrix

This document defines the strict multi-tenant and ownership isolation rules across all endpoints taking an ID or returning tenant-scoped data in LearningPal.

> [!IMPORTANT]
> **Zero Information Leakage:** Querying or mutating a resource that does not exist or belongs to another institution, teacher, or student **always returns HTTP 404 Not Found** (never HTTP 403 or 200). This completely prevents timing and resource existence enumeration attacks.

---

| Endpoint | Who May Call It | Scope Rule | Test Name |
|---|---|---|---|
| `POST /api/admin/teachers/{id}/approve` | `ADMIN` | Target teacher must belong to caller's institution (404 on foreign institution) | `testAdminEndpointsRefuseForeignIds` |
| `POST /api/admin/teachers/{id}/reject` | `ADMIN` | Target teacher must belong to caller's institution (404 on foreign institution) | `testAdminEndpointsRefuseForeignIds` |
| `POST /api/admin/users/{id}/deactivate` | `ADMIN` | Target user must belong to caller's institution; cannot deactivate self or super-admin (404 on foreign institution) | `testAdminEndpointsRefuseForeignIds` |
| `POST /api/admin/users/{id}/reactivate` | `ADMIN` | Target user must belong to caller's institution (404 on foreign institution) | `testAdminEndpointsRefuseForeignIds` |
| `PUT /api/admin/classes/{id}/teacher` | `ADMIN` | Class and target teacher must belong to caller's institution (404 on foreign institution) | `testAdminEndpointsRefuseForeignIds` |
| `GET /api/admin/teachers/pending` | `ADMIN` | Scoped strictly to caller's institution | `testCollectionEndpointsDoNotLeakForeignTenantRecords` |
| `GET /api/admin/users` | `ADMIN` | Scoped strictly to caller's institution | `testCollectionEndpointsDoNotLeakForeignTenantRecords` |
| `GET /api/admin/classes` | `ADMIN` | Scoped strictly to caller's institution | `testCollectionEndpointsDoNotLeakForeignTenantRecords` |
| `GET /api/teacher/classes` | `TEACHER` | Scoped strictly to classes taught by the caller | `testCollectionEndpointsDoNotLeakForeignTenantRecords` |
| `GET /api/teacher/classes/{id}` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `PUT /api/teacher/classes/{id}/archive` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `POST /api/teacher/classes/{id}/regenerate-code` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `PUT /api/teacher/classes/{id}/enrollment` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/teacher/classes/{id}/roster` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/teacher/classes/{id}/overview` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/teacher/classes/{id}/assessments` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherBIsolationOnClassAssessments` |
| `PUT /api/teacher/classes/{id}/assessments/{assessmentId}` | `TEACHER` | Class must be owned by caller in same institution; assessment must belong to class subject (404 on foreign teacher, institution, or foreign assessment) | `testTeacherBIsolationOnClassAssessments` |
| `POST /api/teacher/classes/{id}/assessments/{assessmentId}/unlock-student` | `TEACHER` | Class must be owned by caller; student must be enrolled in class (404 on foreign teacher or unenrolled student) | `testTeacherCannotUnlockUnenrolledStudent` |
| `GET /api/teacher/classes/{classId}/students/{studentId}` | `TEACHER` | Class must be owned by caller; student must be enrolled in target class (404 on foreign teacher, unenrolled student, or foreign institution) | `testTeacherStudentViewTests` |
| `GET /api/teacher/classes/{classId}/attempts/{attemptId}` | `TEACHER` | Class must be owned by caller; attempt must belong to target class (404 on foreign teacher, foreign attempt, or foreign class) | `testTeacherStudentViewTests` |
| `PUT /api/teacher/classes/{classId}/attempts/{attemptId}/answers/{answerId}/grade` | `TEACHER` | Class must be owned by caller; attempt must belong to class; answer must belong to attempt (404 on foreign teacher or foreign attempt/class) | `testGradeOverrideWorkflowRecalculatesTotalScoreAndGapAnalysis` |
| `POST /api/teacher/classes/{classId}/students/{studentId}/interventions` | `TEACHER` | Class must be owned by caller and ACTIVE; student must be enrolled; topic must belong to class subject (404 on foreign teacher/student; 400 on archived class) | `testInterventionsLifecycleAndOutcomes` |
| `GET /api/teacher/classes/{classId}/interventions` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `PUT /api/teacher/classes/{classId}/interventions/{id}` | `TEACHER` | Class must be owned by caller; intervention must belong to class; finalized interventions cannot be modified (404 on foreign teacher; 400 if already DONE/CANCELLED) | `testInterventionsLifecycleAndOutcomes` |
| `GET /api/teacher/classes/{classId}/validation/students` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/teacher/classes/{classId}/validation/students/{studentId}` | `TEACHER` | Class must be owned by caller; student must be enrolled in class (404 on foreign teacher or unenrolled student) | `testTeacherEndpointsRefuseForeignIds` |
| `PUT /api/teacher/classes/{classId}/validation/students/{studentId}/topics/{topicId}` | `TEACHER` | Class must be owned by caller; student must be enrolled; topic must belong to class subject (404 on foreign teacher/student; 400 on foreign topic) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/teacher/classes/{classId}/validation/report` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/teacher/classes/{classId}/validation/export` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testTeacherEndpointsRefuseForeignIds` |
| `GET /api/admin/validation/report` | `ADMIN` | Scoped strictly to caller's institution | `testValidationLabSecurityAndIsolation` |
| `GET /api/student/classes` | `STUDENT` | Scoped strictly to caller's enrolled classes | `testCollectionEndpointsDoNotLeakForeignTenantRecords` |
| `GET /api/student/classes/{id}` | `STUDENT` | Student must be enrolled in target class in same institution (404 if not enrolled or foreign institution) | `testStudentEndpointsRefuseForeignIds` |
| `GET /api/student/classes/resolve-by-subject/{subjectId}` | `STUDENT` | Resolves student's active class for subject; returns 404 if not enrolled in that subject | `testStudentEndpointsRefuseForeignIds` |
| `GET /api/student/attempts/{attemptId}/result` | `STUDENT` | Attempt must belong to calling student (404 on another student's attempt) | `testStudentEndpointsRefuseForeignIds` |
| `POST /api/student/attempts/{attemptId}/submit` | `STUDENT` | Attempt must belong to calling student (404 on another student's attempt) | `testStudentEndpointsRefuseForeignIds` |
| `PUT /api/student/topics/{topicId}/feedback-rating` | `STUDENT` | Student must be enrolled in an active or archived class of topic's subject (404 if unenrolled) | `testMeasurementToolsSecurityAndIsolation` |
| `PUT /api/student/resources/{resourceId}/rating` | `STUDENT` | Student must be enrolled in an active or archived class of resource's subject (404 if unenrolled) | `testMeasurementToolsSecurityAndIsolation` |
| `GET /api/teacher/classes/{classId}/ratings-summary` | `TEACHER` | Class must be owned by caller in same institution (404 on foreign teacher or institution) | `testMeasurementToolsSecurityAndIsolation` |
| `GET /api/admin/ratings/summary` | `ADMIN` | Scoped strictly to caller's institution; checks 80% target with ≥ 10 raters threshold | `testMeasurementToolsSecurityAndIsolation` |
| `GET /api/admin/ratings/export` | `ADMIN` | Scoped strictly to caller's institution; pseudonyms (`S001`), formula-injection safe | `testMeasurementToolsSecurityAndIsolation` |
| `GET /api/survey` | `STUDENT`, `TEACHER` | Scoped to caller's user and role; returns role-specific items and submission status | `testMeasurementToolsSecurityAndIsolation` |
| `POST /api/survey` | `STUDENT`, `TEACHER` | Enforces exact role items, bounds 1-5, single submission per version | `testMeasurementToolsSecurityAndIsolation` |
| `GET /api/admin/survey/summary` | `ADMIN` | Scoped strictly to caller's institution; checks 4.0 target with ≥ 5 responses per role | `testMeasurementToolsSecurityAndIsolation` |
| `GET /api/admin/survey/export` | `ADMIN` | Scoped strictly to caller's institution; pseudonyms (`STU001`, `TEA001`), formula-safe | `testMeasurementToolsSecurityAndIsolation` |

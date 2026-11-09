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
| `GET /api/student/classes/{classId}/progress` | `STUDENT` | Student must be enrolled in target class (403 if not enrolled) | `testFreshMasteryOnNewClass` |
| `GET /api/student/classes/{classId}/progress/topics/{topicId}` | `STUDENT` | Student must be enrolled in target class and topic must match class subject (403 if not enrolled, 404 if topic invalid) | `testFreshMasteryOnNewClass` |
| `POST /api/student/classes/{classId}/resources/{resourceId}/complete` | `STUDENT` | Student must be enrolled in target class (403 if not enrolled) | `testResourceProgressPerClass` |
| `DELETE /api/student/classes/{classId}/resources/{resourceId}/complete` | `STUDENT` | Student must be enrolled in target class (403 if not enrolled) | `testResourceProgressPerClass` |
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
| `GET /api/teacher/subjects` | `TEACHER` | Scoped strictly to subjects owned by the caller (403 for student/admin) | `testSubjectCreationAndAccessControl` |
| `POST /api/teacher/subjects` | `TEACHER` | Creates private subject owned by caller with unique `TSUB_` code | `testSubjectCreationAndAccessControl` |
| `POST /api/teacher/subjects/copy-sample` | `TEACHER` | Creates private clone of seeded C subject owned by caller | `testSubjectCreationAndAccessControl` |
| `GET /api/teacher/subjects/{id}` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testSubjectCreationAndAccessControl` |
| `PUT /api/teacher/subjects/{id}` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testSubjectCreationAndAccessControl` |
| `POST /api/teacher/subjects/{id}/archive` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testSubjectCreationAndAccessControl` |
| `DELETE /api/teacher/subjects/{id}` | `TEACHER` | Subject must be owned by caller and have 0 topics, questions, quizzes, or classes | `testArchiveNotDelete` |
| `GET /api/teacher/subjects/{id}/topics` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testTopicLifecycle` |
| `POST /api/teacher/subjects/{id}/topics` | `TEACHER` | Subject must be owned by caller; topic name unique per subject | `testTopicLifecycle` |
| `PUT /api/teacher/subjects/{id}/topics/{topicId}` | `TEACHER` | Subject must be owned by caller; topic must belong to subject | `testTopicLifecycle` |
| `PUT /api/teacher/subjects/{id}/topics/reorder` | `TEACHER` | Subject must be owned by caller; topic IDs must belong to subject | `testTopicLifecycle` |
| `POST /api/teacher/subjects/{id}/topics/{topicId}/archive` | `TEACHER` | Subject must be owned by caller; topic must belong to subject | `testTopicLifecycle` |
| `DELETE /api/teacher/subjects/{id}/topics/{topicId}` | `TEACHER` | Subject must be owned by caller; topic must have 0 questions and 0 resources | `testArchiveNotDelete` |
| `GET /api/teacher/subjects/{id}/questions` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testQuestionValidation` |
| `POST /api/teacher/subjects/{id}/questions` | `TEACHER` | Subject must be owned by caller; requires 2-6 choices and exactly 1 correct | `testQuestionValidation` |
| `PUT /api/teacher/subjects/{id}/questions/{qId}` | `TEACHER` | Subject must be owned by caller; in-place edit if 0 answers; creates v(N+1) & retires v(N) if answered | `testQuestionVersioningAndGapAnalysis` |
| `POST /api/teacher/subjects/{id}/questions/{qId}/duplicate` | `TEACHER` | Subject must be owned by caller; clones into new active question | `testQuestionVersioningAndGapAnalysis` |
| `POST /api/teacher/subjects/{id}/questions/{qId}/retire` | `TEACHER` | Subject must be owned by caller; marks question RETIRED | `testQuestionVersioningAndGapAnalysis` |
| `DELETE /api/teacher/subjects/{id}/questions/{qId}` | `TEACHER` | Subject must be owned by caller; allowed only if 0 answers and not in any quiz | `testArchiveNotDelete` |
| `GET /api/teacher/subjects/{id}/quizzes` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testQuizFreezeAndUnpublish` |
| `POST /api/teacher/subjects/{id}/quizzes` | `TEACHER` | Subject must be owned by caller; questions must be ACTIVE and belong to subject | `testQuizFreezeAndUnpublish` |
| `PUT /api/teacher/subjects/{id}/quizzes/{quizId}` | `TEACHER` | Subject must be owned by caller; rejected (400) if PUBLISHED with student attempts | `testQuizFreezeAndUnpublish` |
| `POST /api/teacher/subjects/{id}/quizzes/{quizId}/publish` | `TEACHER` | Subject must be owned by caller; requires ≥ 1 active question | `testQuizFreezeAndUnpublish` |
| `POST /api/teacher/subjects/{id}/quizzes/{quizId}/unpublish` | `TEACHER` | Subject must be owned by caller; allowed only if 0 student attempts | `testQuizFreezeAndUnpublish` |
| `POST /api/teacher/subjects/{id}/quizzes/{quizId}/duplicate` | `TEACHER` | Subject must be owned by caller; clones questions into new DRAFT quiz | `testQuizFreezeAndUnpublish` |
| `POST /api/teacher/subjects/{id}/quizzes/{quizId}/archive` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testQuizFreezeAndUnpublish` |
| `DELETE /api/teacher/subjects/{id}/quizzes/{quizId}` | `TEACHER` | Subject must be owned by caller; allowed only if 0 student attempts | `testQuizFreezeAndUnpublish` |
| `GET /api/teacher/subjects/{id}/resources` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher/institution) | `testLinkResourceValidation` |
| `POST /api/teacher/subjects/{id}/resources` | `TEACHER` | Subject must be owned by caller; strictly http/https and ≤ 2000 chars | `testLinkResourceValidation` |
| `PUT /api/teacher/subjects/{id}/resources/{resId}` | `TEACHER` | Subject must be owned by caller; strictly http/https | `testLinkResourceValidation` |
| `POST /api/teacher/subjects/{id}/resources/{resId}/archive` | `TEACHER` | Subject must be owned by caller | `testLinkResourceValidation` |
| `DELETE /api/teacher/subjects/{id}/resources/{resId}` | `TEACHER` | Subject must be owned by caller | `testLinkResourceValidation` |
| `GET /api/student/classes/{classId}/materials` | `STUDENT` | Student must be enrolled in class (403/404 if unenrolled); returns general links and file resources without extractedText | `testFreshMasteryOnNewClass`, `testExtractedTextNeverExposedInStudentMaterials` |
| `POST /api/teacher/subjects/{id}/files` | `TEACHER` | Subject must be owned by caller; validates PDF/DOCX magic bytes, 10MB size limit, 25 active files/subject, 200MB teacher quota, 20/hr rate limit, duplicate SHA-256 (409) | `testUploadValidPdf`, `testUploadValidDocx`, `testDuplicateSha256InSameSubject` |
| `GET /api/teacher/subjects/{id}/files` | `TEACHER` | Subject must be owned by caller (404 on foreign teacher or institution) | `testFileResourcesSecurityAndIsolation` |
| `PUT /api/teacher/files/{id}` | `TEACHER` | File's subject must be owned by caller; validates title, description, topic tag | `testDownloadAccessMatrixAndHeaders` |
| `PUT /api/teacher/files/{id}/archive` | `TEACHER` | File's subject must be owned by caller; hides file from student downloads | `testArchivingHidesFileFromStudents` |
| `PUT /api/teacher/files/{id}/unarchive` | `TEACHER` | File's subject must be owned by caller; restores file visibility | `testArchivingHidesFileFromStudents` |
| `DELETE /api/teacher/files/{id}` | `TEACHER` | File's subject must be owned by caller; fails with 409 Conflict if any approved AI questions reference file; atomic deletion of DB record and disk bytes | `testFileDeleteRuleApprovedAiQuestionReturns409` |
| `GET /api/teacher/files/{id}/text-preview` | `TEACHER` | File's subject must be owned by caller (404 on other teacher, admin, super-admin, or student); returns first 3,000 chars | `testAdminAndSuperAdminGet404OnTeacherFileDownloadAndPreview` |
| `GET /api/teacher/files/{id}/download` | `TEACHER` | File's subject must be owned by caller (404 on other teacher, admin, super-admin, or student); hardened download headers | `testAdminAndSuperAdminGet404OnTeacherFileDownloadAndPreview` |
| `GET /api/student/classes/{classId}/files/{fileId}/download` | `STUDENT` | Student must be actively or historically enrolled in class; file must belong to class subject and be ACTIVE (404 on unenrolled, foreign institution, foreign subject, teacher, admin, super-admin, or ARCHIVED); hardened download headers | `testDownloadAccessMatrixAndHeaders`, `testFileResourcesSecurityAndIsolation` |
| `GET /api/teacher/ai/status` | `TEACHER` | Scoped to authenticated teacher; 404 for admin, super-admin, student; reports local LLM availability | `testAiDisabledReturns503AndDoesNotCallLlm` |
| `POST /api/teacher/subjects/{id}/files/{fileId}/ai/generate` | `TEACHER` | Subject and file must be owned by caller; file extraction must be READY; max 1 active job (409); max 5 jobs/hr (429); 503 if flag off; 404 for unauthorized callers | `testMultiTenantAndRoleIsolationReturns404`, `testRateLimitingAndSingleActiveJobConstraint` |
| `GET /api/teacher/ai/jobs/{id}` | `TEACHER` | Job must be owned by calling teacher (404 for other teacher, admin, super-admin, student) | `testMultiTenantAndRoleIsolationReturns404` |
| `POST /api/teacher/ai/jobs/{id}/cancel` | `TEACHER` | Job must be owned by calling teacher; cooperative cancellation (404 for unauthorized callers) | `testCancelAndStartupRecovery` |
| `GET /api/teacher/ai/jobs` | `TEACHER` | Scoped strictly to jobs initiated by the calling teacher | `testMultiTenantAndRoleIsolationReturns404` |
| `GET /api/teacher/ai/jobs/{id}/drafts` | `TEACHER` | Job must be owned by calling teacher (404 for unauthorized callers) | `testMultiTenantAndRoleIsolationReturns404` |
| `PATCH /api/teacher/ai/drafts/{id}` | `TEACHER` | Draft's job must be owned by calling teacher; allows editing prior to approval (404 for unauthorized callers) | `testApproveDraftIdempotencyAndVersioningLinkage` |
| `POST /api/teacher/ai/drafts/{id}/approve` | `TEACHER` | Draft's job must be owned by calling teacher; publishes to question bank with origin AI and sourceFile link; idempotent (404 for unauthorized callers) | `testApproveDraftIdempotencyAndVersioningLinkage` |
| `POST /api/teacher/ai/drafts/{id}/reject` | `TEACHER` | Draft's job must be owned by calling teacher; marks draft REJECTED (404 for unauthorized callers) | `testMultiTenantAndRoleIsolationReturns404` |
| `POST /api/teacher/ai/jobs/{id}/approve-selected` | `TEACHER` | Job must be owned by calling teacher; all selected drafts must have evidenceVerified = true (400 if any unverified); 404 for unauthorized callers | `testEvidenceQuoteVerificationAndBulkApprovalConstraint` |

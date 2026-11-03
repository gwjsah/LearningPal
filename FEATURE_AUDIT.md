# LearningPal: Comprehensive System Feature Audit
**Audit Date:** November 3, 2026  
**Auditor Perspective:** Senior Full-Stack Engineer & Patient Teacher  
**Target Audience:** Project Student & Development Team  
**Git Branch Verified:** `gwjsah/dev` (commit `ac3e339`)  
**Verification Status:** 47/47 Backend Tests Passing (`mvn test`), Frontend Production Build Clean (`npm run build`)

---

## 1. Executive Summary

- **End-to-End Functional Core:** The entire Student Learning Loop is 100% operational—students can sign up, log in, browse and enroll in subjects, take timed or untimed multi-topic assessments with an interactive question runner, receive immediate auto-graded results with explanations, view algorithmic topic gap diagnostics (Strengths, Developing, Gaps), read automated personalized pedagogical feedback, explore recommended learning materials (`NOTE` and `PRACTICE`), and mark study resources completed.
- **Administrative Control:** The Admin Portal is fully functional—administrators can securely log in, review pending teacher registration requests, and approve or reject instructor accounts with instant account status activation.
- **The Teacher Wing Status:** The Teacher Portal is currently an early-stage architectural shell; while database entities and repositories exist for teacher interventions and assessment access control, teacher-specific REST endpoints, intervention logging, assessment authoring, and class-wide analytics heatmaps have not yet been built.
- **Architectural Health:** The codebase is exceptionally lean and disciplined, featuring stateless JWT role-based security, unified notebook-themed UI components across dark and light modes, deterministic rule engines (zero external AI billing/delays), and comprehensive integration test coverage for all active student paths.
- **Overall Completion:** **~60% of the complete product vision** (Student side: ~95% complete; Admin side: ~90% complete; Teacher side: ~15% complete).

---

## 2. Comprehensive Feature Inventory

*Analogy to understand feature status:*
- **Done:** The house has walls, a roof, plumbing, and electricity. You can live in it right now.
- **Partial:** The house has framing and pipes, but the faucets aren't connected to the water main yet.
- **Stubbed:** There is a sign on an empty lot that says "Future Kitchen Coming Soon", or a blueprint sitting on a desk.
- **Not Started:** It's an idea in the notebook that hasn't been coded at all.

| Feature Area | Status | Location (Frontend & Backend) | Target Audience | Known Gaps / TODOs | Test Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Authentication & Session Management** | **Done** | `pages/Login.jsx`, `pages/Signup.jsx`, `context/AuthContext.jsx`<br>`AuthController.java`, `AuthService.java`, `JwtService.java`, `JwtAuthFilter.java`, `User.java` | All (Student, Teacher, Admin) | Password reset flow ("Forgot password") is not yet implemented. | **Yes** (9 tests in `LearningPalApplicationTests`) |
| **Admin Teacher Approval Queue** | **Done** | `pages/AdminHome.jsx`, `services/adminService.js`<br>`AdminController.java`, `AdminService.java`, `UserRepository.java` | Admin | No bulk approval or pagination if pending teacher list exceeds hundreds of records. | **Yes** (Tested via Spring MockMvc in `LearningPalApplicationTests`) |
| **Subject Dashboard & Self-Enrollment** | **Done** | `pages/StudentSubjectsHome.jsx`, `pages/SubjectDashboard.jsx`, `services/studentService.js`<br>`StudentSubjectController.java`, `StudentEnrollmentService.java`, `Enrollment.java`, `Subject.java` | Student | Teachers cannot manually enroll or unenroll students yet; students currently self-enroll from available subjects catalog. | **Yes** (5 tests in `StudentEnrollmentTests`) |
| **Curriculum Catalog & Assessments List** | **Done** | `pages/SubjectDashboard.jsx`, `services/studentService.js`<br>`StudentAssessmentController.java`, `StudentAssessmentService.java`, `Assessment.java` | Student | Assessments are currently fixed to seeded data; filtering by assessment tag or category is not yet added. | **Yes** (9 tests in `StudentAssessmentApiTests`) |
| **Assessment Taking Loop (Quiz Runner)** | **Done** | `pages/TakeAssessment.jsx`, `services/studentService.js`<br>`StudentAssessmentController.java`, `StudentAssessmentService.java`, `Attempt.java`, `Answer.java` | Student | Question randomization per attempt is not yet enabled (questions are served by sequence position). | **Yes** (Covered in `StudentAssessmentApiTests`) |
| **Auto-Grading & Results Breakdown** | **Done** | `pages/AttemptResult.jsx`, `services/studentService.js`<br>`GradingService.java`, `StudentAssessmentService.java`, `Choice.java`, `Answer.java` | Student | Only multiple-choice questions are auto-graded. Teacher subjective manual scoring exists in data model but lacks a UI editor. | **Yes** (Covered in `StudentAssessmentApiTests`) |
| **Topic Gap Analysis Engine** | **Done** | `pages/StudentProgress.jsx`, `services/studentService.js`<br>`GapAnalysisService.java`, `GapAnalysisClassifier.java`, `StudentTopicMastery.java` | Student | Analysis runs automatically upon quiz submission; does not yet support custom teacher-defined score weights. | **Yes** (7 tests in `GapAnalysisTests`) |
| **Personalized Feedback Generator** | **Done** | `pages/TopicProgressDetail.jsx`, `services/studentService.js`<br>`FeedbackService.java`, `GapAnalysisService.java`, `FeedbackDto.java` | Student | Rule-based heuristics; lacks student feedback rating (e.g. "Was this helpful?"). | **Yes** (5 tests in `FeedbackAndResourceTests`) |
| **Educational Resource Recommendations** | **Done** | `pages/TopicProgressDetail.jsx`, `services/studentService.js`<br>`StudentResourceService.java`, `Resource.java`, `ResourceRepository.java` | Student | Only `NOTE` and `PRACTICE` resource types are currently seeded; external video/link embeds are not yet rich-rendered. | **Yes** (Covered in `FeedbackAndResourceTests`) |
| **Resource Progress & Gap Monitoring** | **Done** | `pages/TopicProgressDetail.jsx`, `services/studentService.js`<br>`StudentResourceController.java`, `StudentResourceService.java`, `ResourceProgress.java` | Student | Does not track time spent reading, only a binary complete/incomplete toggle. | **Yes** (Covered in `FeedbackAndResourceTests`) |
| **Single Attempt Enforcement & Scheduling** | **Partial** | Database table `AssessmentAccess.java`, `AssessmentAccessRepository.java`<br>`AttemptRepository.java` | Student, Teacher | The database schema and entities support schedule windows (`extendedUntil`) and retake authorization (`isReopened`), but `StudentAssessmentService` currently creates new attempts without blocking retakes. | **Partial** (Entity logic verified in `LearningDataModelTests`, but API gate is pending) |
| **Teacher Intervention Ledger** | **Stubbed** | `pages/TeacherHome.jsx` (preview cards)<br>`Intervention.java`, `InterventionRepository.java` | Teacher | Entity and repository exist and pass JPA mapping tests, but there is no `TeacherController`, no backend service, and no interactive frontend UI. | **Partial** (Entity tested in `LearningDataModelTests`; no API tests) |
| **Teacher Class Analytics & Heatmap** | **Stubbed** | `pages/TeacherHome.jsx` (Phase 2 preview badge) | Teacher | Only static informational cards exist explaining the upcoming feature; no database aggregation query or charts. | **No** |
| **Teacher Assessment Authoring** | **Not Started** | None (Assessments are loaded via `LearningDataSeeder.java`) | Teacher | Teachers cannot create new questions, set answer keys, or publish quizzes from the UI yet. | **No** |
| **Study Plans & Calendar Reminders** | **Not Started** | None | Student | High-level "Study Next" topic card exists, but automated calendar scheduling or email reminders do not exist. | **No** |
| **Student Feedback on Resources** | **Not Started** | None | Student | Students cannot rate or leave comments on recommended notes or exercises. | **No** |

---

## 3. Project Requirements & Objectives Coverage

### MUST-HAVE Requirements (Core Diagnostic Loop)
| Requirement | Status | Verification & Evidence |
| :--- | :---: | :--- |
| **1. Students view results and progress** | **100% Done** | Students see immediate scores on `AttemptResult.jsx` and longitudinal mastery bars across all curriculum topics on `StudentProgress.jsx`. |
| **2. Analysis by topic finds strengths and gaps** | **100% Done** | `GapAnalysisClassifier.java` categorizes topics into `STRENGTH` ($\ge 80\%$), `DEVELOPING` ($60\% - 79\%$), `GAP` ($< 60\%$), or `INSUFFICIENT_DATA` ($< 3$ questions answered). |
| **3. Personalized feedback** | **100% Done** | `FeedbackService.java` dynamically calculates score deltas (e.g. "+12 points since last attempt"), tracks trends (`UP`, `DOWN`, `STABLE`), and provides targeted messages. |
| **4. Recommended resources or activities** | **100% Done** | `StudentResourceService.java` pulls tailored `NOTE` (study summaries) and `PRACTICE` (exercises) directly attached to identified gap topics. |
| **5. Students monitor progress in gap areas** | **100% Done** | Students can click "Mark Completed" on learning items, updating `ResourceProgress` in real-time and reviewing historical question attempts on `TopicProgressDetail.jsx`. |
*Must-Have Completion:* **100%** (All 5/5 requirements are completely implemented and verified by automated tests).

---

### SHOULD-HAVE Requirements (Teacher & Classroom Tools)
| Requirement | Status | Verification & Evidence |
| :--- | :---: | :--- |
| **1. Teachers view students' needs and progress** | **Stubbed** | `TeacherHome.jsx` renders a placeholder workspace. Backend queries to aggregate student grades across classes do not exist yet. |
| **2. Visual summaries (charts)** | **Partial** | Frontend provides SVG progress rings, color-coded status badges, and mastery progress bars. Dedicated multi-student cohort heatmaps remain in stub state. |
| **3. Teachers record and monitor interventions** | **Stubbed** | `Intervention.java` and `InterventionRepository.java` exist in backend code, but no REST endpoint or teacher form is wired up. |
| **4. Resources organized by student need** | **100% Done** | Resource recommendations are sorted and filtered strictly by the student's mastery gaps on the topic level. |
| **5. Teachers create assessments and record scores per topic** | **Not Started** | Seed data handles assessment creation; teacher authoring UI and manual grading override forms are not yet built. |
*Should-Have Completion:* **~20%** (1 Done, 1 Partial, 2 Stubbed, 1 Not Started).

---

### NICE-TO-HAVE Requirements (Engagement & Expansion)
| Requirement | Status | Verification & Evidence |
| :--- | :---: | :--- |
| **1. Multi-week study plans** | **Not Started** | The system suggests what to study *next* (`studyNextTopic`), but does not generate a calendar schedule. |
| **2. Automated reminders** | **Not Started** | No push notifications, browser alerts, or background email jobs exist. |
| **3. Multiple resource types** | **100% Done** | Distinct `NOTE` (conceptual text) and `PRACTICE` (hands-on problem) types exist in both data model and frontend badges. |
| **4. Students give feedback on resources** | **Not Started** | No thumbs-up/down or comment mechanism on study materials. |
| **5. Students mark resources completed** | **100% Done** | Interactive button toggles state between "Mark Completed" and "Completed" via `POST /api/student/resources/{id}/complete`. |
*Nice-to-Have Completion:* **~40%** (2 Done, 3 Not Started).

---

### Overall Completion Assessment
$$\text{Overall Completion Score: } \mathbf{\approx 60\%}$$
> **One-Line Justification:** The student-facing learning and diagnostic loop is complete and rock-solid (100% of Must-Haves), but the instructor gradebook and classroom intervention features (Should-Haves) are still in early foundation/stub stage.

---

## 4. System Route & Endpoint Architecture

### Frontend Client Routes (`App.jsx`)
All routes wrapped in `ProtectedRoute` inspect the decoded JWT token and automatically redirect unauthorized roles to their respective dashboards.

| Route Path | Role Guard | React Component | Purpose & Description |
| :--- | :--- | :--- | :--- |
| `/` | *Public* | `LandingPage.jsx` | Marketing homepage with interactive demo notebook and curriculum preview. |
| `/login` | *Public* | `Login.jsx` | User sign-in supporting Students, Teachers, and Admin with demo credential quick-fill. |
| `/signup` | *Public* | `Signup.jsx` | Account registration for Students (instant) and Teachers (pending approval). |
| `/student` | `ROLE_STUDENT` | `StudentSubjectsHome.jsx` | **Student Desk:** Lists all enrolled subjects with diagnostic summaries + enrollment catalog. |
| `/student/subjects/:subjectId` | `ROLE_STUDENT` | `SubjectDashboard.jsx` | **Subject Workspace:** Quizzes catalog, latest scores, and diagnostic test CTA. |
| `/student/subjects/:subjectId/assessments/:id/take` | `ROLE_STUDENT` | `TakeAssessment.jsx` | **Quiz Engine:** Interactive single-question runner with navigator and submit modal. |
| `/student/subjects/:subjectId/attempts/:id/result` | `ROLE_STUDENT` | `AttemptResult.jsx` | **Scorecard:** Score breakdown, topic badges, and question answer explanations. |
| `/student/subjects/:subjectId/progress` | `ROLE_STUDENT` | `StudentProgress.jsx` | **Gap Analysis:** Overall mastery score, Strengths/Developing/Gaps breakdown. |
| `/student/subjects/:subjectId/progress/topics/:id` | `ROLE_STUDENT` | `TopicProgressDetail.jsx` | **Topic Drilldown:** Pedagogical feedback, recommended resources, and attempt history. |
| `/teacher` | `ROLE_TEACHER` | `TeacherHome.jsx` | **Teacher Gradebook:** Session verification bar and roadmap preview cards. |
| `/admin` | `ROLE_ADMIN` | `AdminHome.jsx` | **Admin Console:** Review, approve, or reject pending teacher account registrations. |

*(Note: Legacy flat routes such as `/student/progress` and `/student/assessments/:id/take` are preserved in `App.jsx` for backward compatibility).*

---

### Backend REST API Endpoints

#### Authentication & Session (`AuthController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public (`permitAll`) | Registers a new student or teacher account. |
| `POST` | `/api/auth/login` | Public (`permitAll`) | Authenticates credentials and returns JWT bearer token. |
| `GET` | `/api/auth/me` | Authenticated | Returns current profile and role authority on page reload. |

#### Administrator Operations (`AdminController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/teachers/pending` | `ROLE_ADMIN` | Lists all pending teacher account registration requests. |
| `POST` | `/api/admin/teachers/{id}/approve` | `ROLE_ADMIN` | Approves teacher account, transitioning status to `ACTIVE`. |
| `POST` | `/api/admin/teachers/{id}/reject` | `ROLE_ADMIN` | Declines teacher account registration. |

#### Student Subjects & Enrollment (`StudentSubjectController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/subjects` | `ROLE_STUDENT` | Returns enrolled subjects with live diagnostic status metrics. |
| `GET` | `/api/student/subjects/available` | `ROLE_STUDENT` | Returns list of subjects open for self-enrollment. |
| `POST` | `/api/student/subjects/{id}/enroll` | `ROLE_STUDENT` | Enrolls student into a chosen subject with zero data loss. |

#### Student Assessments & Auto-Grading (`StudentAssessmentController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/assessments` | `ROLE_STUDENT` | Lists published assessments across all subjects. |
| `GET` | `/api/student/subjects/{id}/assessments` | `ROLE_STUDENT` | Lists assessments strictly scoped to an enrolled subject. |
| `POST` | `/api/student/assessments/{id}/attempts` | `ROLE_STUDENT` | Starts a new attempt or resumes existing in-progress attempt. |
| `POST` | `/api/student/attempts/{id}/submit` | `ROLE_STUDENT` | Auto-grades submitted attempt and triggers gap recalculation. |
| `GET` | `/api/student/attempts/{id}/result` | `ROLE_STUDENT` | Returns detailed score review and explanation breakdown. |

#### Student Diagnostic Gap Analysis (`StudentProgressController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/progress` | `ROLE_STUDENT` | Retrieves curriculum-wide mastery percentages and gap lists. |
| `GET` | `/api/student/subjects/{id}/progress` | `ROLE_STUDENT` | Scopes gap analysis strictly to a single enrolled subject. |
| `GET` | `/api/student/progress/topics/{id}` | `ROLE_STUDENT` | Retrieves topic feedback, study resources, and missed questions. |

#### Student Learning Resources (`StudentResourceController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/student/resources/{id}/complete` | `ROLE_STUDENT` | Idempotently marks a study resource as completed. |
| `DELETE` | `/api/student/resources/{id}/complete` | `ROLE_STUDENT` | Reverts completion status back to incomplete. |

#### Diagnostic & Smoke Testing (`TestPingController.java`)
| Method | Path | Security | Functionality |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/ping` | `ROLE_STUDENT` | Verifies student session role authorization. |
| `GET` | `/api/teacher/ping` | `ROLE_TEACHER` | Verifies teacher session role authorization. |

---

## 5. Architectural Debt, Stubs & Leftover Artifacts

When building an enterprise system, it is completely normal to have stepping stones left behind. Here is the inventory of items that are dead, temporary, or partially wired:

1. **`TestPingController.java` (`/api/student/ping`, `/api/teacher/ping`):**
   - *Status:* Temporary smoke-test controller.
   - *Note:* The teacher frontend (`TeacherHome.jsx`) currently uses `/api/teacher/ping` to prove authentication. It should be replaced with real gradebook endpoints before production release.
2. **`StudentHome.jsx`:**
   - *Status:* 9-line backward compatibility shim.
   - *Note:* Simply re-exports `SubjectDashboard.jsx`. Can be cleanly removed once all legacy bookmarks are retired.
3. **`Intervention.java` & `InterventionRepository.java`:**
   - *Status:* Orphaned database layer.
   - *Note:* The entity, table schema, and database repository exist, but there is no `TeacherInterventionService` or controller reading/writing this table.
4. **`AssessmentAccess.java` & `AssessmentAccessRepository.java`:**
   - *Status:* Unwired policy entity.
   - *Note:* The table and JPA methods for one-time attempt enforcement, deadline extensions, and teacher retake unlocks exist in the database, but `StudentAssessmentService.java` does not check this entity yet. It currently creates subsequent attempts freely.
5. **Question Randomization Absence:**
   - *Status:* Feature gap.
   - *Note:* Questions are currently returned strictly in database position order (`findByAssessmentOrderByPositionAsc`), meaning questions and options do not shuffle between attempts.
6. **Hardcoded Fallback Secret in `AdminUserSeeder.java`:**
   - *Status:* Development convenience flag.
   - *Note:* A default password (`AdminPass123`) is supported for local prototyping if the environment variable `APP_ADMIN_PASSWORD` is omitted. The application logs a prominent warning on startup.

---

## 6. Recommended Next Steps (Priority Roadmap)

To take LearningPal from a student prototype to a complete classroom-ready application, here is the recommended sequence of work:

### Priority 1: Enforce Assessment Retake Restrictions & Scheduling
- **Why:** The database table `assessment_access` is already built. Students should not be able to retake diagnostic exams without teacher permission.
- **Action:**
  1. In `StudentAssessmentService.startOrResumeAttempt`, check if a prior submitted attempt exists.
  2. If an attempt exists, check `AssessmentAccess.isReopened()`. If `false`, throw a `403 Forbidden` ("Assessment closed. Contact your instructor for a retake.").
  3. Verify deadline scheduling against `AssessmentAccess.extendedUntil` or `Assessment.dueDate`.

### Priority 2: Build the Teacher Roster & Diagnostic Heatmap
- **Why:** This completes the core value proposition of LearningPal ("dual perspectives: student + teacher").
- **Action:**
  1. Create `TeacherController.java` with `GET /api/teacher/subjects/{id}/roster` and `GET /api/teacher/subjects/{id}/gap-distribution`.
  2. Return a class-wide breakdown showing the percentage of students in `GAP`, `DEVELOPING`, and `STRENGTH` for each topic.
  3. Replace the placeholder preview cards in `TeacherHome.jsx` with an interactive student roster and topic matrix.

### Priority 3: Build the Teacher Intervention Action Center
- **Why:** The `Intervention` database table is already designed and waiting.
- **Action:**
  1. Add endpoints `POST /api/teacher/interventions` and `GET /api/teacher/students/{id}/interventions`.
  2. Provide teachers a 1-click modal to log: "Assigned extra pointers practice" or "1-on-1 tutoring scheduled".
  3. Show the intervention history on the student's topic detail page so students see teacher recommendations.

### Priority 4: Implement Question & Choice Randomization
- **Why:** Prevents students from memorizing answer letter positions (A, B, C, D) across retakes.
- **Action:**
  1. Add an optional `isRandomized` flag to `Assessment`.
  2. In `startOrResumeAttempt`, shuffle questions and choice options before returning the DTO to the student runner.

---
*Report generated and validated autonomously against project repository commit `ac3e339`.*


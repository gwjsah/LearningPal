# LearningPal Security Audit 2 (Targeted Read-Only Review)

**Date:** 2026-11-13  
**Scope:** Changes since the prior security audit (Cloud LLM / Gemini, AI Essay Grade Suggestion, `ENUMERATION` & `ESSAY` question types, Validation Lab redesign, Admin/Landing/Class tabs, Tenant Isolation sweep, Dependencies & Git Hygiene, Error/CORS/Headers, and `LEAD-NV-001` / `LEAD-NV-002`).  
**Baseline Verification:** Full backend test suite (`cd backend && .\mvnw.cmd clean test`): **218 run, 0 failures, 0 errors, 4 skipped** (`RealGeminiVerificationTest` `@Disabled`).

---

## Severity Summary

| ID | Severity | Area | Summary | Verdict |
|---|---|---|---|---|
| SEC2-001 | **HIGH** | Secrets & Git Hygiene | Real Google API key (`AIzaSy...`) committed in git history (`7a8ae13`) + fallback key embedded in `application.properties:77` | **CONFIRMED** |
| SEC2-002 | **HIGH** | Auth / Config Hygiene | `app.jwt.secret` in `application.properties` still uses the public `application-test.properties` hex secret (unrotated) | **CONFIRMED** |
| SEC2-003 | **MEDIUM** | `EnumerationNormalizer` | `-3` vs `3` and `50` vs `50%` collide under `\p{P}` stripping, awarding full credit for wrong answers | **CONFIRMED** |
| SEC2-004 | **MEDIUM** | Answer-Key Leakage | `StudentAssessmentService.java:453` returns `Question.explanation` (`modelAnswerNote`) on ungraded `ESSAY` attempts | **CONFIRMED** |
| SEC2-005 | **MEDIUM** | Tenant Isolation | `AdminService.java:131-138` throws `400` for `SUPER_ADMIN` before `requireSameInstitution` (`404`), allowing user-ID/role enumeration | **CONFIRMED** |
| SEC2-006 | **MEDIUM** | Tenant Isolation | `ValidationService.java:401-406` throws `400` instead of `404` when `topicId` belongs to another subject | **CONFIRMED** |
| SEC2-007 | **MEDIUM** | Dependencies (`npm`) | `esbuild <=0.24.2` / `vite <=6.4.3` dev-server advisory (1 moderate, 1 high) | **CONFIRMED** |
| SEC2-008 | **LOW** | Tenant Isolation / Matrix | `SecurityConfig.java:73` returns `403` instead of `404` on `/ai-suggest` & `/discard` for non-teachers; `ISOLATION_MATRIX.md` missing 2 routes & has 2 stale entries | **CONFIRMED** |
| SEC2-009 | **LOW** | AI Availability / Config | Shared `Semaphore(1)` starves essay suggestions during drafting jobs; `future.get` doesn't `cancel(true)` on timeout; local `application.properties:91` sets `max-jobs-per-teacher-per-hour=0` | **CONFIRMED** |
| SEC2-010 | **LOW** | Input Bounds / Prompt | `EssayRubricCriterionDto.maxPoints` lacks `@Max` (int overflow); `AiPromptBuilder.java:229` doesn't strip literal delimiter strings from student text | **CONFIRMED** |
| SEC2-011 | **LOW** | Security Headers & Copy | `SecurityConfig.java` lacks explicit CSP / `Referrer-Policy` / `Permissions-Policy`; landing `content.js:117-120` understates Gemini & new AI types | **CONFIRMED** |
| LEAD-NV-001 | **NEEDS VALIDATION** | Extraction Pool | `DocumentExtractionService.java:46-50,230-256` uses 2-thread pool + non-preemptible `future.cancel(true)` | **NEEDS VALIDATION** |
| LEAD-NV-002 | **NEEDS VALIDATION** | Local LLM Sockets | `LmStudioClient.java:45-48,210-218` configures 5s connect + request timeout; OS socket release under mid-stream stall unverified live | **NEEDS VALIDATION** |

---

## Detailed Findings

### SEC2-001 — Gemini API Key in Git History & Local Fallback Default (`HIGH` · `CONFIRMED`)
- **Location:** Git commit `7a8ae13`; `backend/src/main/resources/application.properties:77`
- **Evidence:**
  - `git log -S "AIzaSy" --oneline` returned commit `7a8ae13` (`feat(ai,ui): add cloud LLM provider support...`).
  - `application.properties:77` embeds a literal fallback key (`app.llm.gemini.api-key=${GEMINI_API_KEY:<REDACTED>}`), although `application.properties` itself is ignored by `.gitignore:26`.
- **Impact:** Anyone with git history access can extract the historical `AIzaSy...` key; sharing or packaging `application.properties` exposes the fallback key.
- **Recommended Fix:** Rotate/revoke both the historical Google AI Studio key and the fallback key immediately, purge the key from git history (`git filter-repo`), and set `app.llm.gemini.api-key=${GEMINI_API_KEY:}` (empty default).

### SEC2-002 — Unrotated JWT Signing Secret (`HIGH` · `CONFIRMED`)
- **Location:** `backend/src/main/resources/application.properties` (`app.jwt.secret`) vs. `backend/src/test/resources/application-test.properties:8`
- **Evidence:** Automated check confirmed `app.jwt.secret` in `application.properties` still equals the public `application-test.properties` hex string.
- **Impact:** Anyone who reads the repository's `application-test.properties` can forge valid HS256 JWTs for any user or role if the local/dev config is deployed.
- **Recommended Fix:** Generate a fresh 256-bit secret (`openssl rand -base64 32`) in `application.properties` and production environment variables.

### SEC2-003 — `EnumerationNormalizer` Strips Minus Signs & Percent Symbols (`MEDIUM` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/service/EnumerationNormalizer.java:15-29`
- **Evidence:**
  - `SURROUNDING_PUNCT` (`^[\\p{P}\\s]+|[\\p{P}\\s]+$`) strips leading/trailing Unicode punctuation (`\p{P}`):
    - `-3` vs `3`: `-` is Unicode `Pd` (matched by `\p{P}`), so `normalize("-3") == "3" == normalize("3")` (**COLLISION**).
    - `50` vs `50%`: `%` is Unicode `Po` (matched by `\p{P}`), so `normalize("50%") == "50" == normalize("50")` (**COLLISION**).
    - `+5` vs `5`: `+` is Unicode `Sm` (not `\p{P}`), so `normalize("+5") == "+5"` (**DISTINCT**).
    - `1.5` vs `15`: `.` is internal, so `normalize("1.5") == "1.5"` (**DISTINCT**, though leading `.5` strips `.` -> `"5"`).
- **Impact:** Students answering `3` for `-3` or `50` for `50%` (or vice versa) receive full auto-graded credit for mathematically incorrect answers.
- **Recommended Fix:** Preserve leading `-` (and `+`) before digits and trailing `%` after digits when stripping surrounding punctuation.

### SEC2-004 — `ESSAY` Model Answer Note (`explanation`) Returned Before Grading (`MEDIUM` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/service/StudentAssessmentService.java:414-453`; `TeacherAiService.java:335-336,407`
- **Evidence:** `StudentAssessmentService.java:416-428` gates `rubricScores` behind `graded` (`ans.getFinalScore() != null`), but line `453` unconditionally sets `q.getExplanation()` in `QuestionReviewDto`. For `ESSAY` questions, `explanation` stores the teacher's `modelAnswerNote`.
- **Impact:** Immediately after submitting an attempt, a student can read the teacher's model answer note via `GET /api/student/attempts/{attemptId}/result` before the essay is graded (and reuse it on retakes).
- **Recommended Fix:** Pass `null` for `explanation` in `StudentAssessmentService.java:453` when `type == QuestionType.ESSAY && !graded`.

### SEC2-005 — `AdminService.deactivateUser` Leaks `SUPER_ADMIN` User IDs (`MEDIUM` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/service/AdminService.java:131-138`
- **Evidence:** Line `134` checks `target.getRole() == Role.SUPER_ADMIN` (`400 BadRequestException`) **before** `tenantAccess.requireSameInstitution(admin, target)` at line `138` (`404`).
- **Impact:** An `ADMIN` can enumerate `SUPER_ADMIN` user IDs across the platform (`400` vs `404`).
- **Recommended Fix:** Move `tenantAccess.requireSameInstitution(admin, target)` above the `SUPER_ADMIN` role check.

### SEC2-006 — `ValidationService.saveValidationLabel` Leaks Cross-Subject `topicId` (`MEDIUM` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/service/ValidationService.java:401-406`
- **Evidence:** `topicRepository.findById(topicId)` succeeds for any subject's topic and line `405` throws `400 BadRequestException("Topic does not belong to the class subject: ...")` instead of `404`.
- **Impact:** Allows an authenticated teacher to distinguish valid foreign `topicId`s (`400`) from nonexistent ones (`404`).
- **Recommended Fix:** Throw `ResourceNotFoundException` (`404`) when the topic does not belong to the class's subject.

### SEC2-007 — Frontend Build Tool Vulnerabilities (`MEDIUM` · `CONFIRMED`)
- **Location:** `frontend/package.json` (`vite <=6.4.3`, `esbuild <=0.24.2`)
- **Evidence:** `npm audit` reports 2 vulnerabilities (1 moderate, 1 high) in `esbuild` / `vite` (GHSA-67mh-4wv8-2f99: dev server cross-origin request exposure).
- **Impact:** Affects local development server only (not production static bundle).
- **Recommended Fix:** Upgrade `vite` when ready (`npm audit fix --force` updates to Vite 8, breaking change; test build/HMR).

### SEC2-008 — Tenant Isolation Matrix Drift & `403` vs `404` on `/ai-suggest` (`LOW` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/config/SecurityConfig.java:72-75`; `docs/ISOLATION_MATRIX.md:111-126`
- **Evidence:**
  - `/api/teacher/classes/.../ai-suggest` and `.../discard` fall under `.requestMatchers("/api/teacher/**").hasRole("TEACHER")`, returning `403` to `STUDENT`/`ADMIN` instead of `404` as documented in `ISOLATION_MATRIX.md:112-113`.
  - Missing from `ISOLATION_MATRIX.md` / `IsolationMatrixTests`: `POST /api/student/classes/join` (`StudentClassController.java:33`) and `GET /api/teacher/subjects/suggest` (`TeacherSubjectController.java:38`).
  - Stale entries in `ISOLATION_MATRIX.md`: line `111` (`approve-selected` missing `jobs/{jobId}/`), line `126` (`POST /api/super/admins` does not exist).
  - `SUPER_ADMIN` receives `403`/`404` on `/api/admin/validation/report` (`SecurityConfig.java:74`, `ValidationService.java:502`).
- **Recommended Fix:** Align `ISOLATION_MATRIX.md`, add `IsolationMatrixTests` cases for the two missing routes, and decide whether `ai-suggest` should return `404` to non-teachers (like `/api/teacher/ai/**`) or update the matrix to `403`.

### SEC2-009 — Shared `Semaphore(1)` Contention, Timeout Cancellation & Local Rate Limit (`LOW` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/service/ai/AiGenerationWorkerService.java:125-147`; `backend/src/main/resources/application.properties:91`
- **Evidence:**
  - `llmSemaphore` (`Semaphore(1)`) is always released in `finally` (no deadlock), but a multi-chunk drafting job blocks all teachers' on-demand essay suggestions with `429`.
  - `future.get(effectiveTimeout, TimeUnit.SECONDS)` (`line 131`) does not call `future.cancel(true)` on `TimeoutException`, leaving `singleThreadExecutor` occupied until upstream backoff finishes.
  - `application.properties:91` sets `app.llm.max-jobs-per-teacher-per-hour=0` (disables drafting hourly limit locally).
- **Recommended Fix:** Call `future.cancel(true)` on `TimeoutException`, remove `=0` override in `application.properties`, and consider separating or queueing on-demand suggestions if multi-teacher concurrency grows.

### SEC2-010 — Missing `@Max` on Rubric `maxPoints` & Unescaped Delimiters (`LOW` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/dto/EssayRubricCriterionDto.java:19`; `AiPromptBuilder.java:229`
- **Evidence:** `maxPoints` has `@Min(1)` without `@Max`, allowing `int` sum overflow in `TeacherContentService.java:715`; `AiPromptBuilder.java:229` embeds `studentAnswer` verbatim without stripping `--- BEGIN/END UNTRUSTED STUDENT ANSWER ---`.
- **Recommended Fix:** Add `@Max(1000)` on `maxPoints` and sanitize/escape the delimiter marker inside `studentAnswer`.

### SEC2-011 — Explicit Security Headers & Landing Copy Drift (`LOW` · `CONFIRMED`)
- **Location:** `backend/src/main/java/com/learningpal/config/SecurityConfig.java:50-82`; `frontend/src/data/content.js:117-120`
- **Evidence:** `SecurityConfig.java` relies on Spring defaults without explicit `Content-Security-Policy`, `Referrer-Policy`, or `Permissions-Policy`. `content.js:117-120` describes AI as "local model" + "multiple-choice" only, omitting Gemini and Enumeration/Essay AI features (core "off by default" and "AI never auto-grades" claims remain true).
- **Recommended Fix:** Add explicit security headers in `SecurityConfig.java` (or reverse proxy) and update `content.js` copy.

---

## Open Leads (`NEEDS VALIDATION`)

- **LEAD-NV-001 (`DocumentExtractionService.java:46-50,230-256`):** Confirmed by code that `extractionExecutor` is a 2-thread pool and `future.cancel(true)` cannot preempt CPU-bound PDFBox/POI loops that ignore `Thread.isInterrupted()`. **Needs live validation** with a crafted slow/malformed PDF/DOCX to measure actual pool saturation.
- **LEAD-NV-002 (`LmStudioClient.java:45-48,210-218`):** Confirmed by code that `HttpClient` sets 5s `connectTimeout` and per-request `.timeout(...)` (`180s` default). **Needs live validation** against a stalled mock HTTP server to verify OS-level socket closure/cleanup.

---

## Verified Safe (`REJECTED`)

- **Gemini key runtime/API/frontend leakage & SSRF:** Key is sent only via `x-goog-api-key`, never logged or returned in `/api/teacher/ai/status` or frontend bundle; `baseUrl`/`model` are config-bound only (`AiConfigProperties.java`).
- **Gemini request PII:** Prompts contain only question/rubric/model-note + single student's answer (`store: false`); zero student names, emails, or IDs.
- **AI score/mastery isolation & teacher-only visibility:** `AiGradeSuggestionService` never writes `Answer` scores or `StudentTopicMastery`; `aiSuggestion` is absent from all student DTOs.
- **Pre-submit answer-key leakage, Validation Lab blind rule, synthetic isolation, CSV injection, Admin frontend filtering/XSS, Class page URL tab state, Error stack-trace leakage, CORS:** All verified safe in source.

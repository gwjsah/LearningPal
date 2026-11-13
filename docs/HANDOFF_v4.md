# LearningPal Handoff v4 (replaces v3)

Continuing from `LearningPal_Handoff_v3.md`. Same working style: Claude writes prompts and reviews agent reports critically; Jepoy pastes reports back. Prompts go in ONE fenced code block and follow the skeleton in v3 section 7. Analogy-based, concise explanations. Settled decisions in v3 section 3 still apply unless changed below.

## 1. Progress since v3

| # | Work | Status | Tests after |
|---|---|---|---|
| 22 | Full security audit (6 findings) | Done | 172 |
| 22b | Fix pass: class-subject IDOR (001), assessment catalog leak (002), 403 oracle to 404 (003), questions.origin enum migration (004), zip header size bypass (005), JWT secret placeholder (006), 13 endpoints added to isolation matrix | Done, re-checked read-only, all PASS | 181 (180 pass, 1 skipped) |
| 23 | UX audit and proposal (`docs/UX_PROPOSAL_TEACHER_ADMIN.md`) | Done, reviewed with corrections | n/a |
| 24 | Phases 1-3: shared table/tab primitives, slim class header, 5 tabs (Overview, Students, Assessments, Interventions, Ratings), per-topic bar chart with 60% and 80% lines, client-side tables | Done | ~182 |
| 25 | Phase 4: Validation Lab redesign (see 2) plus 2 fixes (top-up before first label, eligible-only denominator) | Done | 189 |
| 26 | Phases 5-6: admin pages (tables, search, explainers) and landing demo rebuild (`docs/LANDING_PARITY.md`), taste skill applied to landing page only | Prompt delivered; **report not yet reviewed by Claude** | ? |
| 27 | Cloud LLM provider (Google AI Studio / Gemini), config switch, local default | Prompt delivered and implemented (RealGeminiVerificationTest exists); **summary not reviewed in detail** | ~207 |
| 28 | New question types ENUMERATION and ESSAY with rubrics, rule-based enumeration grading, teacher rubric grading | Done and reviewed | 207 (2 skipped) |
| 29 | AI drafting of ENUMERATION and ESSAY questions (one type per job) | Done and reviewed | 211 (3 skipped) |
| 30 | AI "Suggest grade" for essays (suggest only, teacher confirms) | Done and reviewed | 218 (4 skipped) |
| 31 | **Targeted security audit 2 (read-only, `docs/SECURITY_AUDIT_2.md`)** | **Prompt delivered; waiting for report** | n/a |

## 2. Decisions made since v3 (update to settled decisions)

**Security**
- Cross-tenant access returns 404. The one accepted 403: role checks on `/api/teacher/**` and `/api/admin/**` URL prefixes and `getActiveTeacher()` (role, not resource existence).
- Old JWT secret and `database_backup.sql` are in git history. Jepoy must rotate the secret and superadmin password. Never print or paste real keys.

**UI/UX**
- Class page = slim header + tabs (state in URL). Anything that grows with data is a table with search, filter, pagination (client-side, default 10). Archived items hidden behind "Include archived". Bar chart has 60% and 80% reference lines. Interventions keep the existing modal.
- Deferred: `TeacherSubjectDetail.jsx` (huge single component) rework. Student pages not redesigned.

**Validation Lab (per class, no pooling between classes in a class report)**
- Gate = 30 students per class. Each student gets 3 random eligible topics (eligible = at least 3 distinct questions with final scores). Assignments are seeded, saved, balanced across topics, topped up only while the student has zero labels, then frozen.
- Preliminary report from the first label, banner "Preliminary: X of 30". At 30+ students: honest "Target met / not met (xx% vs 85%)". Small class complete: "Complete: N of N eligible students (M not yet eligible). Too few to certify." No eligible students: neutral empty state.
- Admin rollup is the only place classes are combined ("pooled across N classes") with a per-class breakdown. Synthetic labels never count toward real figures.
- No adviser exists (course final project); decisions documented in `docs/VALIDATION.md`.

**AI (local default, optional cloud)**
- `app.llm.provider=local|gemini`, restart to switch, key via env var `GEMINI_API_KEY` or the untracked real `application.properties`. Never in the example file, logs, endpoints, or browser. Project will never be deployed, so cloud use with demo or developer data is accepted; a cloud notice is still shown in the UI.
- Reversed: "remote LLMs out of scope" and "no AI for grading". Rule now: **AI may suggest scores, only teacher-confirmed scores count.** Students never see suggestions or that AI was used.
- Question types: MULTIPLE_CHOICE, ENUMERATION (teacher-listed accepted variants, normalized exact match, no fuzzy or AI), ESSAY (rubric of 1-8 criteria with integer maxPoints, no levels). Ungraded essay points are excluded from mastery (not zero) until graded.
- AI drafting: one type per job; essay max 10 per job; approval goes through the normal creation path. AI grading is on demand per essay answer, stored as a separate suggestion record (SUGGESTED/ACCEPTED/EDITED/DISCARDED), 30 per teacher per hour, one shared single-flight LLM lock (busy returns 429).

## 3. Open items and risks (check these first)

1. **Review the Phase 5-6 report** (admin pages, `docs/LANDING_PARITY.md` remaining gaps) and the Gemini provider summary if not yet done.
2. **Enumeration sign edge case**: confirm `-3` vs `3`, `+5`, `50%`, `1.5` vs `15` are distinct answers (included in audit 2; fix prompt if it fails).
3. **Hand checks not yet confirmed done:** MySQL `SHOW COLUMNS FROM questions LIKE 'origin'`; validation top-up behavior; admin per-class table uses eligible-only denominators; one real Gemini run for drafting and grading; comparing AI suggestions with Jepoy's own grades on a few essays.
4. **Secrets**: rotate JWT secret and superadmin password; confirm `application.properties` and keys are not tracked.
5. **Commits**: commit in separate pieces on `gwjsah/dev` (security fixes, class tabs, validation lab, admin/landing, cloud provider, question types, AI drafting, AI grading). Back up MySQL before running new versions (new tables and altered columns).
6. **No frontend test runner** is configured; frontend verified by build plus manual steps. Mention in the write-up.
7. Open leads: LEAD-NV-001 (extraction pool under load), LEAD-NV-002 (socket release when local LLM stalls).
8. Groupmate's RTX 3050 VRAM still unknown.
9. Demo populator may need to include sample essay and enumeration questions; landing demo may need a mention of question types (check parity doc).

## 4. Next steps

1. Paste audit 2 summary; Claude triages into MUST FIX / DECIDE / NEEDS VALIDATION / IGNORE and writes ONE fix prompt, then a read-only re-check.
2. Fix pass, re-check, commit.
3. Clean-database run of the demo populator; update docs; align landing page with new question types and AI features (honestly).
4. Real validation and user testing (developers, friends, instructors only, per `docs/USER_TESTING_PLAN.md`): 85% agreement on 30+ students per class labeled blind, usability 4.0, helpful 80%, task completion 90%. Report honestly even if a target is missed. Teachers should archive, not delete, files during testing (ratings feed the 80% target).
5. Rehearse the demo; record on the home PC (RX 6750 XT, `qwen/qwen3-14b`) or in cloud mode.

## 5. Quick reference

- Repo: `gwjsah/dev`; folders `backend/`, `frontend/`, `docs/`. Skills: Graphify, Ponytail, Impeccable, design-taste-frontend (landing page only, notebook tokens win), security-audit.
- Docs added: `UX_PROPOSAL_TEACHER_ADMIN.md`, `VALIDATION_AUDIT.md`, `LANDING_PARITY.md`, `QUESTION_TYPES.md`, `SECURITY_AUDIT_2.md` (pending), plus updates to `VALIDATION.md`, `DATA_MODEL.md`, `ISOLATION_MATRIX.md`, `AI_SETUP.md`.
- Review checklist: v3 section 8 still applies. Add: no answer keys, rubrics, suggestions, or model notes in student payloads; essay grades only via the single grading method; AI never writes final scores; cloud keys never logged.

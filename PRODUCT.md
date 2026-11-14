# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Learners (K-12, Secondary, University, and Self-Directed Students)**: Studying across subjects (such as Biology, Mathematics, and foundational coursework) who see raw test or quiz scores but struggle to identify *which specific sub-topics* caused errors. Their job is to diagnose topic-level misconceptions quickly, skip re-studying material already at ≥80% mastery, and complete focused 10–15 minute learning activities to close priority gaps before assessments.
- **Educators (Classroom Teachers, Instructors, and Tutors)**: Managing multiple sections and dozens of learners with limited grading time. Their job is to spot individual and class-wide concept gaps at a glance, group learners who share the same misconception, assign targeted resources, log 1-on-1 or small-group interventions, and track post-intervention mastery growth.
- **Administrators (School / Platform Admins)**: Responsible for institutional trust and access governance. Their job is to verify and approve or decline pending educator account requests before granting access to student diagnostic gradebooks.

## Product Purpose

LearningPal is a data-driven learning-support system that translates raw quiz scores, unit assessments, and classroom activities into granular, topic-level diagnostic roadmaps. It exists so learners stop passively re-reading entire textbooks and educators stop manually cross-referencing test questions against syllabus sub-topics.

Success is measured against five transparent project benchmarks established in `frontend/src/data/content.js`:
- **90% Unassisted Student Navigation**: Learners locate assessment results and weak topics without external help.
- **85% Teacher-Validated Gap Match**: Automated gap detection aligns with topics independently flagged by subject educators.
- **80% Helpful Resource Rating**: Learners rate personalized topic recommendations and micro-activities as genuinely helpful.
- **90% Teacher Task Completion**: Educators successfully identify class gaps and log targeted interventions.
- **4.0+ / 5.0 Overall System Usability**: Minimum average usability score across learner and educator evaluation cohorts.

## Positioning

Unlike generic LMS gradebooks that flatten performance into a single percentage or one-size-fits-all video libraries that prescribe identical review packets to every learner, LearningPal links everyday assessment signals directly to topic-level mastery thresholds (`Strength ≥ 80%`, `On Track 70%–79%`, `Gap Detected < 70%`, `Priority Gap < 60%`) and pairs learner-facing micro-remediation with educator-verified intervention logs in one shared notebook workflow.

## Operating Context

- Used in classroom study halls, home study sessions (including night-time study via Chalkboard Mode), faculty planning periods, and administrative review queues across desktop, tablet, and mobile web browsers.
- Role-based onboarding and security lifecycle:
  - **Student accounts** (`ROLE_STUDENT`) activate immediately upon signup and receive a stateless JWT session.
  - **Teacher accounts** (`ROLE_TEACHER`) register in a `PENDING` state without a token and require explicit administrator approval (`POST /api/admin/teachers/{id}/approve`) before login is permitted.
  - **Admin accounts** (`ROLE_ADMIN`) are provisioned via server-side seeding (`AdminUserSeeder`) and can never be created through public registration.

## Capabilities and Constraints

- **Implemented Capabilities**:
  - Public marketing and interactive showcase surface (`/`) featuring a live dual-mode Student Notebook & Teacher Gradebook simulator (`Honors Biology BIO-204` and `Algebra II MTH-301`), interactive resource completion mastery boosts, Recharts topic comparisons, and live teacher intervention logging.
  - End-to-end authentication and session restoration (`/login`, `/signup`, `GET /api/auth/me`) backed by Spring Boot 3.3.4, Spring Security, BCrypt, MySQL/H2, and JJWT (HS256, 24-hour expiry).
  - Protected role portals (`/student`, `/teacher`, `/admin`) guarded by `ProtectedRoute` and role-specific API authorization rules.
  - Admin verification queue (`/admin`) with instant approve/reject actions, empty states, and retryable error recovery.
- **Technical & Security Constraints**:
  - Unified error envelope (`{ "message": "..." }`) across all backend validation and exception handlers.
  - Anti-enumeration login behavior: wrong email and wrong password return the exact same HTTP 401 message (`"Incorrect email or password"`), and account status (`PENDING` / `REJECTED`) is checked only after password verification.
  - Password policy enforced on signup only: 8–72 characters (aligned with BCrypt's 72-byte boundary) requiring at least one letter and one number.
- **Planned / Coming Soon Capabilities** (explicitly labeled as roadmap items, not yet live in backend):
  - Personalized Weekly Study Plans, Gentle Study Reminders, and Student Resource Helpfulness Ratings.

## Brand Commitments

- **Name**: LearningPal
- **Tagline**: *"Stop studying everything. Study what actually needs your attention."*
- **Voice & Tone**: Warm, encouraging, structured, and unpretentious — like a thoughtful tutor writing constructive margin notes in a well-kept notebook. Free of corporate SaaS jargon or punitive grading language.
- **Identity Assets**: Custom inline hand-drawn SVG vocabulary (`frontend/src/components/Doodles.jsx`), including `LearningPalLogo` (ruled notebook page with red margin and yellow pencil), `PushPin`, `PaperClip`, `WashiTape`, `StarDoodle`, `HandDrawnCircle`, and `SquigglyUnderline`.

## Evidence on Hand

- Structured curriculum & diagnostic dataset in `frontend/src/data/content.js` covering `Honors Biology (BIO-204)` and `Algebra II (MTH-301)` with topic-level mastery breakdowns, student roster records, and teacher intervention logs.
- Automated 7-scenario Spring Boot integration test suite in `backend/src/test/java/com/learningpal/LearningPalApplicationTests.java`.
- Project evaluation benchmarks in `GoalsImpact.jsx` are explicitly badged as *"Transparent Project Benchmarks — Evaluated in Student & Teacher Usability Testing"* and must never be misrepresented as fabricated third-party customer testimonials or press quotes.

## Product Principles

1. **Topic Clarity Over Raw Scores**: Always break aggregate percentages down into actionable sub-topics so learners see what they have already mastered alongside the 1–2 priority gaps that need attention.
2. **Thirty-Second Scanability**: Both learners and educators must be able to identify their top priority action within 30 seconds of opening a page, without digging through nested menus.
3. **Constructive Diagnostic Framing**: Treat low scores as specific, solvable concept gaps paired with immediate 10–15 minute activities rather than static failure labels.
4. **Two Sides of One Shared Record**: Keep learner study checklists and educator intervention logs aligned around the same underlying topic taxonomy.
5. **Honest Governance & Security**: Protect student and classroom records through verified educator onboarding while keeping student entry frictionless.

## Accessibility & Inclusion

- **WCAG AA Compliance**: High-contrast fountain-pen ink (`#1B2534` on `#FDFBF7` cream paper, 13.8:1 contrast ratio) and accessible dark red ink (`#B52B1E`) for text annotations.
- **Keyboard & Assistive Tech Support**: Skip-to-content link, semantic form labels, `role="alert"` / `aria-live="polite"` status banners, `role="radiogroup"` segmented controls, and contextual `aria-label` attributes on row-level admin actions (`Approve <Name>`, `Reject <Name>`).
- **Motion Sensitivity**: Full `prefers-reduced-motion: reduce` support disabling smooth scroll, SVG draw animations, and card tilt transforms.


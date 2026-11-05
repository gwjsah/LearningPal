# LearningPal Demo Guide: Realistic Cohort Data & Validation Walkthroughs

Welcome to the **LearningPal Demo Guide**. This document explains how to activate, navigate, and present the realistic demo dataset populated in LearningPal. 

Whether you are preparing for a project demonstration, testing teacher workflows, or validating gap classification accuracy, this dataset provides realistic student learning journeys, teacher interventions, grade overrides, and class rosters.

---

## 1. Safety & Architecture

The demo data populator is designed with strict production safety guardrails:
- **Tenancy Isolation:** All demo users share the domain `@demo.learningpal.local`. Classes and institutions are strictly partitioned (Pilot University `PILOT-2026` and Demo Institute `DEMO-2026`).
- **Base Seed Protection:** Real seed accounts (`admin@learningpal.edu`, `superadmin@learningpal.edu`) and the core curriculum (topics, questions, choices, study resources) are **never** modified or deleted.
- **Environment & DB Safeguards:** The populator automatically refuses to execute if the active profile is `prod` or if connected to a non-local database (unless `app.seed.demo.allow-remote=true` is explicitly provided).
- **No Hardcoded Passwords:** Password values are never committed or logged. You configure your own password via `app.seed.demo.password`.
- **True Production Code Paths:** Scores, attempts, masteries, trends, and overrides are calculated by invoking the exact production grading and gap analysis services (`GradingService`, `GapAnalysisService`, `TeacherClassService`), guaranteeing that data represents real system behavior.

---

## 2. Enabling and Resetting Demo Data

To enable demo data, add the following properties to your local `application.properties` (never committed):

```properties
# Enable demo populator on application startup
app.seed.demo.enabled=true

# Choose any secure password (minimum 8 characters, at least 1 letter and 1 number)
app.seed.demo.password=DemoPassword123!

# Set to true if you want to wipe demo data and repopulate fresh on restart
app.seed.demo.reset=false
```

### Resetting Demo Data
If you have altered demo data during testing or presentations and want a clean slate:
1. Set `app.seed.demo.reset=true` in `application.properties`.
2. Start the backend (`mvn spring-boot:run` or run in your IDE).
3. The populator will safely delete all `@demo.learningpal.local` records and repopulate the deterministic 6-week cohort journey.
4. Set `app.seed.demo.reset=false` once repopulated.

---

## 3. Directory of Demo Accounts

All accounts below authenticate using the password configured in `app.seed.demo.password` (e.g. `DemoPassword123!`).

### A. Administrators

| Email | Role | Institution | Purpose |
|---|---|---|---|
| `admin.pilot@demo.learningpal.local` | `ADMIN` | Pilot University (`PILOT-2026`) | Approves pending teachers, oversees Section A, B, Honors, and Archived classes. |
| `admin.demo@demo.learningpal.local` | `ADMIN` | Demo Institute (`DEMO-2026`) | Demonstrates institution isolation and independent admin controls. |
| `superadmin@learningpal.edu` | `SUPER_ADMIN` | Platform Wide | System owner; manages all institutions across the network. |

### B. Teachers

| Email | Full Name | Institution | Assigned Class | Status |
|---|---|---|---|---|
| `teacher.pilot1@demo.learningpal.local` | Dr. Alan Turing | Pilot University | Section A (`PILOT1`) | `ACTIVE` |
| `teacher.pilot2@demo.learningpal.local` | Prof. Grace Hopper | Pilot University | Section B (`PILOT2`) | `ACTIVE` |
| `teacher.pilot3@demo.learningpal.local` | Prof. John von Neumann | Pilot University | Honors C (`EMPTY1`) | `ACTIVE` |
| `teacher.pending@demo.learningpal.local` | Mr. Claude Shannon | Pilot University | — | `PENDING` (Needs admin approval) |
| `teacher.demo@demo.learningpal.local` | Dr. Ada Lovelace | Demo Institute | Demo Section (`DEMO01`) | `ACTIVE` |

### C. Featured Showcase & Edge-Case Students

| Email | Full Name | Class / Section | Key Characteristics |
|---|---|---|---|
| `showcase@demo.learningpal.local` | Alex Rivera (Showcase) | Section A (`PILOT1`) | **Full Journey Student:** Multiple attempts; initial gap in Loops; teacher intervention logged; study resource completed; retake with improving trend; teacher grade override with comment. |
| `fresh1@demo.learningpal.local` | Jordan Lee (Fresh A) | Section A (`PILOT1`) | **Zero Attempts:** Newly enrolled student with no assessments taken yet. Validates empty states. |
| `fresh2@demo.learningpal.local` | Taylor Swift (Fresh B) | Section B (`PILOT2`) | **Zero Attempts:** Fresh student in Section B for empty-state verification. |
| `student.p01@demo.learningpal.local` – `student.p16@demo.learningpal.local` | Pilot Students 1–16 | Section A (`PILOT1`) | Diverse skill profiles (strong, mixed, weak in specific topics) with realistic diagnostic and quiz histories. |
| `student.p17@demo.learningpal.local` – `student.p33@demo.learningpal.local` | Pilot Students 17–33 | Section B (`PILOT2`) | Second classroom section cohort. |
| `student.d01@demo.learningpal.local` – `student.d08@demo.learningpal.local` | Demo Students 1–8 | Demo Section (`DEMO01`) | Isolated students in Demo Institute. |

---

## 4. Classrooms & Join Codes

| Class Name | Join Code | Instructor | Enrolled | Status | Notes |
|---|---|---|---|---|---|
| **Section A - Systems Programming** | `PILOT1` | Dr. Alan Turing | 18 students | `ACTIVE` | Primary presentation section with Showcase student, overrides, and interventions. |
| **Section B - Software Architecture** | `PILOT2` | Prof. Grace Hopper | 18 students | `ACTIVE` | Active parallel section; verifies teacher isolation and multi-section gradebooks. |
| **Honors C Programming** | `EMPTY1` | Prof. John von Neumann | 0 students | `ACTIVE` | Empty classroom section; validates roster empty-state UI and join code workflow. |
| **Section X - Fall 2025 (Legacy)** | `ARCH01` | Dr. Alan Turing | 2 students | `ARCHIVED` | Archived class; verifies read-only history, enrollment closed banner, and attempt lock. |
| **Demo Section - Applied Computing** | `DEMO01` | Dr. Ada Lovelace | 8 students | `ACTIVE` | Demo Institute section; verifies cross-institution access denial. |

---

## 5. Presentation & Testing Walkthroughs

### Walkthrough 1: The Teacher's Class Cockpit
1. Log in as **Dr. Alan Turing** (`teacher.pilot1@demo.learningpal.local`).
2. You land on the Teacher Dashboard showing assigned classes: **Section A**, **Section X (Archived)**.
3. Click into **Section A**:
   - **Metrics Row:** Notice total students (18), class average mastery, and students needing attention.
   - **Topic Overview Radar:** Topics are ranked by highest count of learning gaps. Notice which foundational topics (e.g. Loops, Functions) require lecture reteaching.
   - **Student Roster:** Notice sortable columns by Name, Diagnostic Score, and Gaps. Jordan Lee shows as fresh with no attempts yet.

### Walkthrough 2: Student Deep Dive & Diagnostic Profile
1. In Section A's roster, click on **Alex Rivera (Showcase)**.
2. Observe Alex's individual learning profile:
   - **Topic Mastery Cards:** Strengths in *Variables* and *Operators*, but notice *Loops* has an **Improving (↗)** trend!
   - **Diagnostic Mistake Analysis:** Expand the Loops topic card to view specific questions missed on the diagnostic quiz.
   - **Completed Resources:** Notice the completed study resource chip with timestamp.

### Walkthrough 3: Grade Overrides with Teacher Feedback
1. In Alex Rivera's student view, scroll to **Section Attempts**.
2. Click into the **Comprehensive Diagnostic Assessment**.
3. Inspect the question list:
   - Notice the green badge: *"Adjusted by your teacher"*.
   - Read Dr. Turing's comment: *"Awarded partial credit for sound algorithm structure despite minor boundary condition."*
   - Observe how the override adjusted the attempt score from 0.0 to 1.0, which dynamically recalculated Alex's mastery percentage.

### Walkthrough 4: Pedagogical Interventions & Enduring Outcomes
1. Scroll down to the **Pedagogical Interventions** section on Alex Rivera's page or on Section A's class overview.
2. Notice the 4 distinct outcome states rendered in clear plain language:
   - **Improved (+X%):** The student completed the intervention, took a subsequent quiz, and their current mastery jumped by $\ge +10$ points (e.g., Alex Rivera on Loops jumped from 33.3% to 83.3%).
   - **Stable (±X%):** Subsequent quiz mastery remained within $\pm 10$ points of the baseline.
   - **Declined (-X%):** Subsequent quiz score dropped $\le -10$ points.
   - **Waiting for next quiz:** A recently planned intervention (e.g., integer division worksheet) where the student has not yet taken a post-intervention quiz in that class. Rendered with an intuitive clock icon.
3. Click **"Log Intervention"** to record a new one-on-one session or remedial review for any student.

### Walkthrough 5: Teacher Approval Workflow
1. Log out and log in as the **Pilot Admin** (`admin.pilot@demo.learningpal.local`).
2. Navigate to the Admin Portal.
3. Notice **Mr. Claude Shannon** listed under **Pending Teachers**.
4. Click **"Approve"** to activate Claude Shannon's teacher account.

### Walkthrough 6: Cross-Institution Isolation
1. As Dr. Alan Turing, attempt to access Demo Institute's class URL (`/teacher/classes/{demoClassId}`).
2. Verify that the system securely returns a **404 Not Found** rather than unauthorized data, preventing tenant enumeration.

---

## 6. Ground Truth Gap Validation (`gap_validation_labels`)
For researchers and ML evaluation:
- Each demo student has 6 rows in the `gap_validation_labels` table (one for each topic in the pilot subject).
- Labels are marked `WEAK` if the student's true latent simulation skill was $< 0.55$, and `NOT_WEAK` otherwise.
- Evaluation scripts can compare student mastery status (`GAP` vs `STRENGTH`/`DEVELOPING`) against `gap_validation_labels` with `source = 'SYNTHETIC'` to evaluate classification precision, recall, and F1-score without circularity.


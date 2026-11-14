# LearningPal Empirical User Testing Plan & Research Protocol

## 1. Executive Summary & Evaluation Targets

This testing plan operationalizes empirical user research for the **LearningPal** adaptive diagnostic learning system. It establishes formal, repeatable testing protocols to measure system performance against the four core project research targets:

| Objective # | Focus Area | Empirical Metric | Target Success Threshold | Target Population / Min Sample |
| :--- | :--- | :--- | :--- | :--- |
| **Obj 1** | **Student Usability & Navigation** | Unassisted Task Success Rate | **$\ge 90.0\%$** unassisted completion | $\ge 15$ Students across diverse cohorts |
| **Obj 2** | **Teacher Workflow Usability** | Unassisted Task Success Rate | **$\ge 90.0\%$** unassisted completion | $\ge 10$ Teachers across active sections |
| **Obj 3** | **Feedback & Resource Quality (N4)** | Helpfulness Rating ($\ge 4$ on 1–5 scale) | **$\ge 80.0\%$** rated Helpful ($4$ or $5$) | $\ge 10$ Distinct raters across curriculum |
| **Obj 4** | **Platform Usability & Satisfaction** | Mean Likert Usability Score (1–5) | **$\ge 4.0 / 5.0$** overall average score | $\ge 5$ Respondents per role |

---

## 2. Methodology & Participant Recruitment

### 2.1 Sample Size & Demographics
- **Student Cohort ($N = 15$ to $20$):**
  - **Eligibility**: Undergraduate or introductory students enrolled in programming/CS courses (e.g., C Language Basics).
  - **Diversity**: Mix of complete beginners ($\approx 40\%$), intermediate students ($\approx 40\%$), and repeating/review students ($\approx 20\%$). Balanced gender and device access (laptop, desktop, phone).
  - **Exclusion**: Prior direct participation in developing or designing LearningPal.
- **Teacher Cohort ($N = 10$ to $12$):**
  - **Eligibility**: Higher education faculty, lecturers, lab teaching assistants, and adjunct instructors with grading or course moderation responsibilities.
  - **Diversity**: Mix of high-tech teaching experience ($\ge 5$ years LMS usage) and low-tech/traditional paper-and-board instructors.

### 2.2 Session Format & Architecture
- **Duration**: 35 to 45 minutes per participant.
- **Setting**: In-person lab session or 1-on-1 virtual screen-share with webcam enabled.
- **Protocol**: Concurrent Think-Aloud (CTA) protocol. Participants speak their thoughts, intentions, confusion, and discoveries out loud while completing tasks.

---

## 3. Facilitator Protocol & Neutrality Rules

### 3.1 Facilitator Non-Coaching Mandate
The facilitator's primary duty is unbiased observation without leading questions or coaching:
1. **Silence is Golden**: Allow the participant to explore, read, hesitate, and self-correct.
2. **Neutral Prompts Only**:
   - *"What are you thinking right now?"*
   - *"What do you expect to happen next?"*
   - *"What are you looking for on this page?"*
3. **No Leading Hints**: Never say *"Click the top button"*, *"Look at the red badge"*, or *"That's on the other tab"*.
4. **The 2-Minute Intervention Boundary**:
   - If a participant is completely stuck or explicitly gives up after **2 consecutive minutes** of unproductive struggle, the facilitator may offer the minimum instruction required to advance to the next task.
   - **Critical Rule**: Any facilitated assistance marks the task outcome as **`SUCCESS_ASSISTED`** or **`FAILED`**. In statistical evaluations, **only `SUCCESS_UNASSISTED` counts toward the $\ge 90\%$ target**.

### 3.2 Facilitator Verbatim Script

#### Introduction & Welcome (2 Minutes)
> *"Hello and welcome! Thank you so much for taking the time to participate in our study today. My name is [Facilitator Name], and I will be guiding you through today's session.*
>
> *Today, we are evaluating LearningPal, a learning platform designed to diagnose student learning gaps in computer programming and recommend targeted study resources. We are testing the platform, not you. There are no wrong answers, mistakes, or bad questions. If something feels confusing, difficult, or counter-intuitive, that is a flaw in our design, and identifying it is our most valuable finding.*
>
> *During the session, I will ask you to work through a series of everyday tasks. As you do, please 'think aloud'—tell me what you are looking at, what you are trying to do, and what you expect to see.*
>
> *I won't be able to answer questions about how to use the software while you work, but once each task is finished, we can discuss any impressions you had. Do you have any questions before we begin?"*

#### Consent & Recording Acknowledgment
> *"Before we begin, please review this brief Informed Consent form. We will record screen audio and video solely for analysis. All data, task sheets, and reports will use anonymized codes (e.g., STU-01 or TEA-01), and your name will never be linked to any published metrics. Do you agree to participate?"*

---

## 4. Participant Task Lists & Success Criteria

### 4.1 Student Task Protocol

| Task # | Task Description | Starting State | Precise Success Criteria | Max Time |
| :--- | :--- | :--- | :--- | :--- |
| **STU-T1** | **Join a Class Section** | Logged in as student on `/student` | Enters join code (e.g. `VPPBMT`), clicks 'Join Class', verifies Section A appears in Active Classes. | 3 min |
| **STU-T2** | **Take Diagnostic Assessment** | On class workspace `/student/classes/:id` | Navigates to active quiz, answers questions, submits attempt, views Attempt Result summary. | 10 min |
| **STU-T3** | **Identify Weak Topic & Feedback** | On Curriculum Progress `/student/progress` | Locates topic with `GAP` status, clicks to open `TopicProgressDetail`, reviews diagnostic feedback headline & message. | 3 min |
| **STU-T4** | **Study Resource & Mark Complete** | On Topic Progress `/student/progress/topics/:id` | Reads study note or practice challenge, toggles completion checkbox, confirms completion bar increments. | 4 min |
| **STU-T5** | **Rate Feedback & Resource Helpfulness** | On Topic Progress `/student/progress/topics/:id` | Selects rating (1–5) for feedback and resource, enters optional comment, clicks 'Save Rating', sees confirmation badge. | 3 min |

### 4.2 Teacher Task Protocol

| Task # | Task Description | Starting State | Precise Success Criteria | Max Time |
| :--- | :--- | :--- | :--- | :--- |
| **TEA-T1** | **Create Class & Share Join Code** | Logged in as teacher on `/teacher` | Clicks 'Create Class', selects subject, inputs name, generates 6-char join code, copies to clipboard. | 3 min |
| **TEA-T2** | **Inspect Roster & Identify Gaps** | Class detail page `/teacher/classes/:id` | Scans roster/overview, sorts by gap count or uses search, clicks a student flagged 'Needs Attention'. | 3 min |
| **TEA-T3** | **Review Student Diagnostic Attempt** | Student detail page | Opens student's submitted quiz attempt, reviews question-by-question auto-scores and selected choices. | 4 min |
| **TEA-T4** | **Blind Validation Labeling** | Validation Lab `/teacher/classes/:id/validation` | Opens student blind evidence, reviews raw question responses (without seeing mastery % or status), selects WEAK / NOT_WEAK label. | 5 min |
| **TEA-T5** | **Audit Feedback Quality & Survey** | Class detail page `/teacher/classes/:id` | Navigates to 'Feedback Quality' section, inspects topic ratings and lowest-rated resources, opens usability survey via top bar. | 4 min |

---

## 5. Metric Computation & Honest Reporting Standards

### 5.1 Task Success Rate Mathematical Formula

Every attempted task $i \in \{1, \dots, N\}$ must be graded strictly into one of three mutually exclusive outcomes:
- `SUCCESS_UNASSISTED`: Participant accomplished the terminal success criteria without any prompting or guidance from the facilitator.
- `SUCCESS_ASSISTED`: Participant required facilitator guidance, hints, or intervention after the 2-minute struggle threshold.
- `FAILED`: Participant was unable to finish the task, abandoned it, or encountered an unrecoverable failure.

$$\text{Task Success Rate} = \frac{\sum \mathbb{I}(\text{Outcome} = \text{SUCCESS\_UNASSISTED})}{\text{Total Tasks Attempted}} \times 100\%$$

> [!IMPORTANT]
> **Zero Soft-Grading Policy**: Under no circumstances may `SUCCESS_ASSISTED` be counted as successful toward the $\ge 90\%$ target. Assisted tasks are recorded as usability failures in the research ledger.

### 5.2 Helpfulness Rating Target (Objective 3)

Helpfulness ratings for diagnostic feedback and learning resources are collected on a 5-point scale:
- Ratings $4$ ("Very helpful") and $5$ ("Extremely helpful") are classified as **HELPFUL**.
- Ratings $1, 2, 3$ are classified as **NOT_HELPFUL**.

$$\text{Helpfulness Rate} = \frac{\text{Count}(\text{Rating} \ge 4)}{\text{Total Valid Ratings}} \times 100\% \quad (\text{Target} \ge 80.0\%)$$

### 5.3 Usability Likert Score Target (Objective 4)

Responses from the 8-item standardized usability survey ($1$ = Strongly Disagree to $5$ = Strongly Agree) are averaged across items and participants:

$$\text{Mean Usability} = \frac{1}{M} \sum_{j=1}^M \text{Score}_j \quad (\text{Target} \ge 4.0 / 5.0)$$

---

## 6. Privacy, Ethics & Data Governance

1. **Informed Consent**: Every student and teacher participant must sign an IRB-compliant Institutional Informed Consent protocol prior to session kickoff.
2. **Pseudonymization Mandate**: All field notes, observer log sheets, CSV exports, and audio transcripts must strictly use non-reversible pseudonym codes (`STU-001`, `STU-002`, `TEA-001`, etc.).
3. **Storage Security**: Raw session screen recordings must be stored on encrypted institution storage (`AES-256`) accessible only to designated evaluation investigators.
4. **Destruction Schedule**: All raw recordings and unredacted participant identification crosswalk tables must be permanently purged 60 calendar days following the conclusion of the research study.

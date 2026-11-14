# The Validation Lab: Blind Ground-Truth Verification

This document provides a comprehensive, plain-language guide to the **Validation Lab** in LearningPal. It outlines our verification methodology, explaining why blind labeling is scientifically necessary, how educators conduct a validation session, what each metric means, our worked numerical example, and how to communicate findings transparently.

---

## 1. Why We Validate

LearningPal is designed to accurately identify foundational learning gaps in students so teachers can deliver targeted remedial support before students fall behind.

The core research objective of this project is:
> **The system's identified weak topics must match teacher-validated results in at least 85% of cases on a representative sample of at least 30 student records.**

### The Need for Blind Labeling
In automated educational systems, human validation is susceptible to **rater anchoring bias** (confirmation bias). If an instructor inspects a student while looking at the system's calculated mastery percentage (e.g., *Variables: 34%, Status: GAP*), the instructor is cognitively primed to agree with that diagnosis.

To produce genuine ground-truth data:
1. **Zero System Leaks:** The educator sees only the student's raw evidence—the specific questions answered, the student's submitted responses, whether each answer was correct, and submission dates. Zero algorithmic mastery percentages, gap badges, or automated diagnostics are transmitted before a label is saved.
2. **Deterministic Balanced Topic Sampling (3 Topics per Student):** Rather than overwhelming teachers with entire subject syllabi, the system samples 3 topics at random per student from eligible topics (topics where the student has answered at least 3 distinct questions, excluding `INSUFFICIENT_DATA`). Topic selection is balanced across class-wide topic counts, persisted in `student_validation_assignments`, and seeded for audit reproducibility. If fewer than 3 eligible topics exist, all eligible topics are assigned.
3. **Independent Human Judgment:** The teacher labels each assigned topic independently as:
   - `WEAK`: Student has a significant conceptual gap or recurring misconception.
   - `NOT_WEAK`: Student demonstrates adequate or strong understanding.
   - `CANNOT_JUDGE`: Insufficient question evidence to make a confident pedagogical determination.
4. **Server-Side Snapshot:** When the teacher saves a label, the system quietly records a snapshot of its own mastery percentage and status at that exact moment, along with the student's submitted attempt count.
5. **Stale Protection:** If the student completes more quizzes after being labeled, the label is stamped as **stale** because the student's knowledge state may have changed. Stale labels are excluded from primary validation metrics by default.

---

## 2. How to Run a Real Validation Session

To execute a statistically sound validation study:

### Step 1: Accumulate Sufficient Student Submissions
Ensure students in the classroom section have completed at least one baseline assessment (such as the Comprehensive Diagnostic Assessment or targeted topic quizzes). Topics become eligible for validation once a student has answered $\ge 3$ distinct questions.

### Step 2: Access the Validation Lab
1. Sign in as a `TEACHER` and open your classroom period (`/teacher/classes/:classId`).
2. Navigate to the **Validation Lab** (`/teacher/classes/:classId/validation`).
3. Notice the sample size tracker indicating your progress toward the 30-student minimum.

### Step 3: Blind Labeling Workflow
1. Select a student from the roster by clicking **"Evaluate"** or **"Review Labels"**.
2. For each assigned topic (up to 3):
   - Review the student's answered questions and choices.
   - Select `Weak`, `Not weak`, or `Can't judge`.
   - Optionally add an instructor note (up to 300 characters, plain text).
   - Click **"Save Label"**.
3. Repeat this process across your class roster. A student counts as labeled once **all of their assigned topics** are evaluated. Progress states track `UNLABELED`, `IN_PROGRESS`, and `COMPLETED`.

### Step 4: Inspect the Validation Report
1. Open the **Validation Report** (`/teacher/classes/:classId/validation/report`).
2. Review the honest result banner:
   - **Preliminary Banner:** Displayed from the very first label until 30 students are fully labeled: *"Preliminary: X of 30 students labeled. Metrics are calculated from current data, but small samples are statistically unreliable."*
   - **Small Class Complete (Eligible-Only Denominator):** Uses strictly the count of enrolled students who have at least one eligible topic as the denominator. Students with no eligible topic (<3 answered questions) are reported explicitly: *"Complete: N of N eligible students (M enrolled students not yet eligible). Too few students to certify against the 85% target."* (the parenthetical is omitted when M is 0).
   - **No Eligible Students State:** If zero enrolled students are eligible, displays a clean empty state: *"No students are eligible yet: students need at least 3 answered questions in a topic"*, never Complete.
   - **Target Met / Not Met:** Once $\ge 30$ students are evaluated, compares empirical agreement directly against 85%. Never awards a "validated" badge based on count alone.
3. Review accuracy, precision, recall, F1, Cohen's kappa, per-topic breakdown, and threshold sensitivity analysis.
4. Export the pseudonymized CSV report for formal academic documentation.

---

## 2.1 Administrative Rollup and Isolation

- **Classroom Isolation:** Each class report uses strictly only labels originating from that specific classroom. Labels from different class periods are never pooled into a teacher's class report.
- **Admin Institutional Rollup:** The institution-wide report (`/api/admin/validation/report`) is the only place classes are pooled. It clearly states *"Pooled across N classes"* and displays a **Per-Class Breakdown Table** (`class`, `students labeled / total`, `status`, `agreement %`, `target status`).
- **Synthetic Separation:** Simulated benchmark labels (`source=SYNTHETIC`) are strictly segregated from real teacher evaluations and clearly flagged. Real figures never include simulated rows.

---

## 3. What Each Metric Means (With an Analogy)

| Metric | Everyday Analogy | Mathematical Definition |
| :--- | :--- | :--- |
| **Accuracy (Agreement %)** | *How often did the teacher and the system give the exact same verdict?* | $\frac{TP + TN}{TP + TN + FP + FN}$ |
| **Precision (for WEAK)** | *When the system flags a topic as a gap, how often is it right?* | $\frac{TP}{TP + FP}$ |
| **Recall (for WEAK)** | *Of all the real gaps the teacher identified, what percentage did the system catch?* | $\frac{TP}{TP + FN}$ |
| **F1 Score** | *The harmonic balance between catching gaps (recall) and avoiding false alarms (precision).* | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ |
| **Cohen's Kappa ($\kappa$)** | *Agreement beyond pure coincidence or guessing.* | $\frac{P_o - P_e}{1 - P_e}$ |

### Understanding the 2x2 Confusion Matrix

In our classification model:
- **Positive Condition:** `WEAK` (Teacher label = `WEAK`, System status = `GAP`)
- **Negative Condition:** `NOT_WEAK` (Teacher label = `NOT_WEAK`, System status = `DEVELOPING` or `STRENGTH`)

```
                        System Diagnosed GAP      System Diagnosed Adequate
Teacher Labeled WEAK      True Positive (TP)         False Negative (FN)
Teacher Labeled NOT_WEAK  False Positive (FP)        True Negative (TN)
```

- **True Positive (TP):** Teacher found a gap, and system flagged `GAP`.
- **False Positive (FP):** System flagged `GAP`, but teacher judged student adequate.
- **True Negative (TN):** Teacher judged student adequate, and system classified `DEVELOPING`/`STRENGTH`.
- **False Negative (FN):** Teacher found a gap, but system classified `DEVELOPING`/`STRENGTH`.

### Excluded Labels
- `CANNOT_JUDGE`: Excluded because the teacher did not form a definitive opinion.
- `INSUFFICIENT_DATA`: Excluded because the student has not attempted enough distinct questions on that topic for the system to evaluate it.
- **Stale Labels:** Excluded by default when `includeStale=false` because the student submitted newer work after the evaluation.

---

## 4. Complete Worked Numerical Example

Consider a validation trial of **6 students across 3 topics** (18 usable student-topic pairs):

### Raw Counts:
- $TP = 8$ (Both agreed student was WEAK)
- $FP = 2$ (System flagged GAP, but Teacher judged NOT_WEAK)
- $TN = 6$ (Both agreed student was NOT_WEAK)
- $FN = 2$ (Teacher judged WEAK, but System classified DEVELOPING)
- Total Usable $N = 8 + 2 + 6 + 2 = 18$ pairs

### Calculations:
1. **Agreement (Accuracy):**
   $$\text{Accuracy} = \frac{TP + TN}{N} = \frac{8 + 6}{18} = \frac{14}{18} \approx 77.8\%$$

2. **Precision (Weak):**
   $$\text{Precision} = \frac{TP}{TP + FP} = \frac{8}{8 + 2} = \frac{8}{10} = 80.0\%$$

3. **Recall (Weak):**
   $$\text{Recall} = \frac{TP}{TP + FN} = \frac{8}{8 + 2} = \frac{8}{10} = 80.0\%$$

4. **F1 Score:**
   $$\text{F1} = 2 \cdot \frac{80.0 \cdot 80.0}{80.0 + 80.0} = 80.0\%$$

5. **Cohen's Kappa ($\kappa$):**
   - Observed Agreement: $P_o = \frac{14}{18} \approx 0.7778$
   - Teacher Positive Rate: $P(\text{Teacher Weak}) = \frac{TP + FN}{N} = \frac{10}{18} \approx 0.5556$
   - System Positive Rate: $P(\text{System Weak}) = \frac{TP + FP}{N} = \frac{10}{18} \approx 0.5556$
   - Teacher Negative Rate: $\frac{8}{18} \approx 0.4444$
   - System Negative Rate: $\frac{8}{18} \approx 0.4444$
   - Expected Chance Agreement:
     $$P_e = (0.5556 \cdot 0.5556) + (0.4444 \cdot 0.4444) = 0.3086 + 0.1975 = 0.5062$$
   - Kappa:
     $$\kappa = \frac{P_o - P_e}{1 - P_e} = \frac{0.7778 - 0.5062}{1 - 0.5062} = \frac{0.2716}{0.4938} = 0.550$$
   - *Interpretation:* $\kappa = 0.550$ represents **moderate to substantial inter-rater reliability** well above chance.

---

## 5. Threshold Sensitivity Analysis

LearningPal uses a production gap threshold of **60.0%**: any student scoring below 60.0% mastery on tested questions is classified as having a learning `GAP`.

The Validation Lab includes a non-destructive sensitivity analysis across candidate cutoffs: `[50%, 55%, 60%, 65%, 70%, 75%]`.
- For each threshold $T$, the system recalculates whether snapshot mastery $< T$.
- It reports agreement and recall for each cutoff and highlights the **best-performing threshold**.
- This enables researchers to verify whether the 60.0% cutoff aligns best with expert human educators without altering production database configurations.

---

## 6. Study Limitations & Ethical Reporting

### Known Limitations:
1. **Class-Scoped Evidence vs. Subject-Scoped Mastery:**
   The teacher labels based solely on quiz attempts submitted in *their specific class period*. In contrast, cumulative student mastery is subject-scoped. If a student took diagnostic exams in a previous class section, the system's baseline mastery reflects all attempts, while the class teacher's evidence focuses on current coursework.
2. **Sample Size Requirements:**
   Evaluations on fewer than 30 students are flagged as `NOT_ENOUGH_RECORDS` because statistical confidence intervals on small samples are wide.
3. **Single-Rater Subjectivity:**
   A single instructor may have idiosyncratic grading standards (e.g. harsher penalties for syntax slips). Multi-section validation across multiple teachers mitigates this.
4. **Simulated (Synthetic) Labels:**
   Synthetic labels generated by the demo populator are intended purely for pipeline testing and software demonstration. Every synthetic report displays a prominent warning banner and must never be represented as actual educator validation in academic publications.

### Reporting Honestly Even Below 85%
If a trial yields an agreement score below 85.0%:
- **Do not artificially alter thresholds or discard outliers.**
- Consult the **Disagreements Table** to identify specific questions that split the system and the teacher.
- Often, disagreements reveal ambiguous question wording, tricky trick questions, or students guessing correctly on multiple-choice items.
- Reporting an honest 81% or 83% agreement with transparent analysis of discrepancies is considered rigorous, defensible science.


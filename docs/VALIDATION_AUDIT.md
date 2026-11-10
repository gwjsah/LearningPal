# Validation Lab Architecture Audit

This audit document records the state of the LearningPal Validation Lab prior to the redesign.

---

## 1. Unit of Evaluation
- **One Label**: A record in `gap_validation_labels` representing a teacher's pedagogical judgment on a **single student-topic pair** (`student_id`, `topic_id`, `class_id`, `source`).
- **Options Available to Teacher**:
  - `WEAK`: Significant conceptual gap or misconception.
  - `NOT_WEAK`: Demonstrates adequate or proficient understanding.
  - `CANNOT_JUDGE`: Insufficient or ambiguous question evidence to form a judgment.
  - Optional instructor note (max 300 characters, plain text).

## 2. Blind Protocol & Information Hiding
- **What is Hidden**:
  - The labeling endpoint (`GET /api/teacher/classes/{classId}/validation/students/{studentId}`) returns raw question answers only: question text, student's submitted response, correctness, points earned / max points, attempt number, submission date, and quiz title.
  - **Zero system outputs** are revealed: no mastery percentage, no mastery status (`GAP`, `DEVELOPING`, `STRENGTH`, `INSUFFICIENT_DATA`), no trend indicators, and no needs-attention flags.
- **When Snapshot is Taken**:
  - Server-side snapshot occurs at label save time in `ValidationService.saveValidationLabel()` (`PUT .../students/{studentId}/topics/{topicId}`).
  - Records `systemStatusAtLabel` (from `student_topic_mastery`), `systemMasteryAtLabel` (percentage), `attemptCountAtLabel` (total submitted attempts in class), `labeledAt` (timestamp), and `labeledBy` (teacher).

## 3. What the 30 Gate Counted
- **Previous Gate Definition**: Counted **any student with at least 1 usable label** (`studentsWithUsableLabel`).
  - In `ValidationService.computeReport()`: Any student who had even a single non-`CANNOT_JUDGE`, non-`INSUFFICIENT_DATA` label incremented `studentsWithUsableLabel`.
  - In `TeacherValidationHub.jsx`: `labeledStudentsCount = students.filter(s => s.labeledTopicsCount > 0).length`.
  - **Flaw**: A student with only 1 out of 6 topics labeled was counted as a validated student toward the 30-student sample size requirement.

## 4. Metrics Displayed in the Report
- **Agreement / Accuracy**: $\frac{TP + TN}{TP + TN + FP + FN} \times 100$
- **Precision (for WEAK)**: $\frac{TP}{TP + FP} \times 100$
- **Recall (for WEAK)**: $\frac{TP}{TP + FN} \times 100$
- **F1 Score**: $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$
- **Cohen's Kappa ($\kappa$)**: Chance-corrected inter-rater agreement.
- **Confusion Matrix**: $2 \times 2$ grid ($TP, FP, TN, FN$).
- **Student Exact Match %**: Percentage of students where teacher and system agreed across 100% of evaluated topics.
- **Per-Topic Breakdown**: Usable count, agreement %, teacher weak vs. system weak counts.
- **Threshold Sensitivity Analysis**: Simulation across candidate cutoffs `[50%, 55%, 60%, 65%, 70%, 75%]` highlighting the best-performing threshold.
- **Disagreements Table**: Pseudonymized case-by-case review of misalignments.

## 5. Synthetic vs. Teacher Data Separation
- **`ValidationSource` Enum**: Values `TEACHER` and `SYNTHETIC`.
- All queries (`findByClassIdAndSource`, `findByInstitutionIdAndSource`) strictly partition by source.
- Default source is `TEACHER`. Synthetic data from `DemoDataPopulator` is only accessible when explicitly requested with `?source=SYNTHETIC` and is clearly marked with a simulated banner.

## 6. Data Scope
- **Class Report (`/api/teacher/classes/{classId}/validation/report`)**: Intended for a single class section owned by the requesting teacher. (However, the previous repository query joined through student enrollments which could inadvertently pick up labels from the same student in another class).
- **Admin Report (`/api/admin/validation/report`)**: Aggregated across all classes in the admin's institution.

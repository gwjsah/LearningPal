# LearningPal Question Types & Grading Rules

## Supported Question Types

1. **`MULTIPLE_CHOICE`** (legacy `MCQ` normalized to `MULTIPLE_CHOICE` in API responses)
   - 2 to 6 choices, exactly 1 marked correct, explanation required.
   - Auto-graded on submit (`autoScore = points` if correct, else `0.0`).

2. **`ENUMERATION`**
   - Prompt (max 2000 chars), 1 to 10 accepted answer variants (each max 100 chars), explanation required.
   - Student submits short text answer (max 200 chars).
   - **Rule-based normalization (`EnumerationNormalizer`)**:
     1. Unicode `NFKC` normalization
     2. Trim leading/trailing whitespace and strip surrounding punctuation (`[\p{P}\s]+`)
     3. Collapse internal whitespace runs to a single space
     4. Lowercase (`Locale.ROOT`)
   - Exact match against any normalized accepted variant awards full `points`; otherwise `0.0`. No fuzzy matching, no AI.

3. **`ESSAY`**
   - Prompt (max 2000 chars), optional model answer/explanation (max 2000 chars), 1 to 8 rubric criteria (`name` max 100 chars, optional `description` max 500 chars, positive integer `maxPoints`).
   - Question `points` equals the sum of all rubric criteria `maxPoints`.
   - Student submits plain text answer (max 5000 chars).
   - Starts **UNGRADED** (`autoScore = null`, `teacherScore = null`, `finalScore = null`).
   - Teacher grades each criterion with an integer `0..maxPoints` plus optional feedback (max 2000 chars). Saving writes `teacherScore` through `Answer.applyTeacherOverride(...)` and recalculates `Attempt.totalScore` and `StudentTopicMastery` in one transaction.

## Safest Mastery Rule (Ungraded Essays)
- While any `ESSAY` answer in a submitted attempt has `finalScore == null`:
  - Attempt status shows `"Awaiting teacher grading"`.
  - **Ungraded essay points are excluded from per-topic mastery and `INSUFFICIENT_DATA` / Validation Lab `distinctQuestionCount`** (not counted as zero) until graded, so students are not penalized while waiting for teacher review.
- Students never see rubric criteria/scores before an essay is graded, and never see accepted answers or rubric criteria in quiz-taking payloads.

## AI Question Drafting Support
- Teachers can draft `MULTIPLE_CHOICE`, `ENUMERATION`, or `ESSAY` questions from uploaded PDF/DOCX resources (one type per job).
- Count bounds: `5–30` (default `10`) for `MULTIPLE_CHOICE` and `ENUMERATION`; `5–10` (default `10`) for `ESSAY`.
- Drafts undergo per-type JSON schema validation, single repair retry, near-duplicate dropping (`droppedCount`), and `evidenceQuote` verification before teacher review.
- Approval routes through `TeacherContentService.createQuestion` with `origin = AI` and `originFile` linkage, applying the same validation rules as manual creation. Drafts, model-answer notes, and unapproved rubrics never appear in student responses.

## On-Demand AI Essay Grade Suggestions (Teacher Review)
- On the teacher attempt review screen, `ESSAY` answers include an optional **"Suggest grade with AI"** button (never automatic, owner-teacher only, `app.llm.max-suggestions-per-teacher-per-hour=30`).
- Sends only the essay prompt, rubric criteria (`criterionId`, `name`, `description`, `maxPoints`), optional teacher model-answer note, and the student's text wrapped in untrusted data delimiters (never student identifiers).
- Answers shorter than 10 trimmed characters receive a local 0-point suggestion without calling the LLM.
- Suggestions are stored in `ai_grade_suggestions` (`SUGGESTED`, `ACCEPTED`, `EDITED`, `DISCARDED`) and **never write `teacherScore`, `autoScore`, `finalScore`, or mastery**. Only the teacher's explicit Save via `gradeAnswer` / `gradeEssayByRubric` writes the grade.
- Students never see AI suggestions, per-criterion AI reasons, or whether an AI suggestion was used.

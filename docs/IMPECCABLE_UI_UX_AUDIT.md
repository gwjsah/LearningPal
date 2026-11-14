# LearningPal Frontend — Impeccable UI/UX Design Audit

**Audit Date:** 2026-11-14  
**Scope:** Read-only design systems, layout, clarity, accessibility, and responsive audit across all portals (Public/Landing, Auth, Student, Teacher, Admin, Super Admin) and shared primitives (`frontend/src/`).  
**Reference Specs:** `DESIGN.md`, `PRODUCT.md`, `frontend/tailwind.config.js`, `frontend/src/index.css`.

---

## 1. Executive Summary & UI Health Score

### Overall Grade: **C+ (76 / 100)**

LearningPal has a genuinely distinctive, cohesive **composition-notebook identity** (`paper` `#FDFBF7` / `paper-card` `#FFFDF9`, `ink` `#1B2534`, `redpen` `#D93829`, `highlighter-mint` / `highlighter-yellow`, `chalkboard` dark mode, and tactile `shadow-notebook` borders). Crucially, handwriting fonts (`font-hand` / `font-note`) are **never** abused in tables, forms, or body paragraphs—they are properly restricted to brand marks, decorative callouts, and (inappropriately, as a minor polish item) loading messages. Recently standardized `NotebookButton` and `NotebookBackButton` primitives also give header navigation a consistent, tactile anchor.

However, the application's UI health is pulled down by **structural bloat, broken accessibility wiring, dead primitive props, and inconsistent operational feedback**:
- **Monolithic complexity:** `TeacherSubjectDetail.jsx` is **4,209 lines** long with ~50 state hooks and **11 inline modals** (some stacked on top of each other).
- **Silent primitive/prop bugs:** `NotebookButton` does not forward refs (`ConfirmModal` initial focus fails silently); `NotebookCard` ignores `pattern` and `borderStyle` props passed by 8+ pages (while outer `p-6`/`p-8` + inner `marginLine` creates double padding); `SuperAdminDashboard.jsx` passes `htmlFor` instead of `id` to `<Field>`.
- **Rogue palette drift & native dialogs:** Several operational pages fall back to raw Tailwind `cyan-*`, `rose-*`, `red-*`, `emerald-*`, `amber-*`, `blue-*`, and `bg-white`, while `AdminHome.jsx`, `AdminEvaluationDashboard.jsx`, and `TeacherValidationReport.jsx` still trigger native `window.confirm()` / `alert()` dialogs and leak raw `err.message` strings.
- **360px mobile resilience gaps:** Missing `flex-wrap` on badge/filter rows, non-scrollable modal containers, and unassociated `<label>` tags hurt mobile and keyboard/screen-reader users.

### Audit Rollup

| Severity | Count | Primary Themes |
| :--- | :---: | :--- |
| **Quick Wins (< 5 min)** | **14** | Dead `NotebookCard` props, `border-3` / `shadow-xs` / `backdrop-blur-xs` invalid classes, `alert()` replacement, `font-hand` loading text, `flex-wrap` fixes, `role="alert"` / `aria-hidden` additions, `redpen-dark` contrast fixes |
| **High Friction** | **9** | Monolithic `TeacherSubjectDetail.jsx`, broken modal focus & missing `role="dialog"` on 12 modals, unassociated form labels, double-padded `NotebookCard`s crushing 360px grids, `TopicProgressDetail.jsx` scroll wall, silent `.catch()` errors, raw `window.confirm()` vs zero-confirm deactivation, `SubjectDashboard` `classId` breadcrumb loss |
| **Medium Friction** | **11** | Rogue Tailwind colors, raw `<table>` in `ValidationReportView.jsx`, `AttemptResult.jsx` duplicate CTAs & unfilterable review list, `TakeAssessment.jsx` missing `PortalShell` & width mismatch, `TeacherAttemptReview.jsx` unnavigable long review, heading skips, missing `focus-visible` rings, non-dark-mode Recharts hexes |
| **Low Friction** | **5** | `DESIGN.md` vs `Navbar.jsx` drift, loading indicator inconsistency, `Field` missing `disabled` prop, auth chrome mismatch, tab `?tab=` URL sync gaps |

---

## 2. Top 5 Worst UI/UX Friction Points

### 1. Monolithic `TeacherSubjectDetail.jsx` & Stacked Modal Proliferation
- **File & Lines:** `frontend/src/pages/TeacherSubjectDetail.jsx` (4,209 lines; tabs `1447–1495`, Question Bank `1717–1845`, inline modals `2398, 2478, 2772, 2854, 2977, 3179, 3257, 3364, 3560, 3627, 4025`).
- **Visual Defect:** Houses 4 tabs, 2 resource sub-tabs, and 11 inline modals in one file. Question Bank cards stack up to 8 metadata chips in a single row with no pagination. Clicking "Edit Draft" inside the AI Review modal (`3627`) stacks a second `z-50` modal (`4025`) on top of the first, while `ConfirmModal` (`4189`) can trigger underneath/above. None of the 10 inline modals have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, or `max-h-[90vh] overflow-y-auto`.
- **User Impact:** Teachers face heavy cognitive overload, lose their active tab on refresh (no `?tab=` URL sync), risk clipped modal submit buttons on 360px/laptop screens, and keyboard/screen-reader users cannot trap focus or press `Escape` to close modals.

### 2. Broken Form Label & Modal Focus Wiring Across Shared Primitives
- **Files & Lines:**
  - `frontend/src/components/NotebookPrimitives.jsx:31` (`NotebookButton` lacks `React.forwardRef`) & `ConfirmModal.jsx:45–51, 153–167` (`cancelBtnRef` / `confirmBtnRef` remain `null`).
  - `frontend/src/pages/SuperAdminDashboard.jsx:884, 899, 921, 934, 949` (passes `htmlFor` instead of `id` to `<Field>`, producing `<label for="undefined">` and `aria-describedby="undefined-hint"`).
  - `frontend/src/pages/TeacherSubjectDetail.jsx` (25+ `<label>`s), `TeacherClassDetail.jsx` (10 `<label>`s), `TeacherStudentDetail.jsx` (6 `<label>`s), `EnumerationQuestionEditor.jsx:29, 58`, `EssayRubricEditor.jsx:81–105, 143–150`.
- **Visual / Functional Defect:** Clicking a label does not focus its input, screen readers announce unlabeled inputs, and opening `ConfirmModal` leaves keyboard focus behind the backdrop.
- **User Impact:** Severe accessibility failure for keyboard-only and assistive-technology users on core CRUD workflows (creating institutions, logging interventions, authoring questions).

### 3. Dead `NotebookCard` Props & Double Padding Crushing 360px Viewports
- **Files & Lines:**
  - `frontend/src/components/NotebookPrimitives.jsx:202–210` (`NotebookCard` only supports `pageLabel`, `ruled`, `marginLine`, `lifted`, `className`, `bodyClassName`).
  - `AdminEvaluationDashboard.jsx:180–183, 214–219, 327–332, 455–460` and `ValidationReportView.jsx:483–486, 570–573, 652–655, 724–727, 801–804` pass `borderStyle="sketch"` (ignored) plus `p-6 sm:p-8` on the outer `NotebookCard` while `marginLine` adds `p-6 sm:p-8 pl-12 sm:pl-16` on the inner wrapper.
  - `SubjectDashboard.jsx`, `TakeAssessment.jsx`, `AttemptResult.jsx`, `StudentProgress.jsx`, `TopicProgressDetail.jsx`, and `UsabilitySurvey.jsx` similarly pass ignored `pattern="grid"` / `pattern="ruled"` / `borderStyle="sketch"` props.
- **Visual Defect:** Ruled/grid textures silently fail to render on Student pages, while Admin/Validation cards get **96px–120px of combined horizontal padding** on 360px mobile screens, squishing 2-column KPI tiles.
- **User Impact:** Broken visual rhythm on Student cards and cramped, hard-to-scan metric cards on mobile Admin/Teacher reports.

### 4. `TopicProgressDetail.jsx` Extreme Scroll Wall & 360px Overflow
- **File & Lines:** `frontend/src/pages/TopicProgressDetail.jsx` (1,102 lines; badge bar `580–593`, Likert form `572–728`, Missed Questions `730–818`, Resources `820–1032`, Answer Log `1034–1096`).
- **Visual Defect:** Stacks 4 dense sections unconditionally with inline code blocks, per-resource rating widgets, and a full answer log. At `580–593`, the badge row (`Diagnostic Feedback` + `StatusBadge` + `TrendIndicator`) uses `flex items-center gap-2` without `flex-wrap`, overflowing a 360px viewport.
- **User Impact:** Students reviewing a weak topic face a daunting vertical scroll wall on desktop and horizontal clipping on mobile.

### 5. Native Dialogs, Inconsistent Destructive Flows & Silent Error Swallowing
- **Files & Lines:**
  - `AdminHome.jsx:281` (`window.confirm()` on user deactivation) vs `SuperAdminDashboard.jsx:303–329` (zero confirmation on user deactivation) vs `AdminHome.jsx:524–543` (inline Confirm/Cancel on teacher rejection).
  - `AdminEvaluationDashboard.jsx:96, 107` and `TeacherValidationReport.jsx:42` (native `alert()` on CSV export failure).
  - `SubjectDashboard.jsx:106–110` (`.catch(() => null)` / `.catch(() => [])` silently swallows API errors on progress and study materials).
  - `TakeAssessment.jsx:439–517` (inaccessible custom submit modal without `role="dialog"`, `Escape` handler, or focus management).
- **Visual Defect:** Jarring OS-level browser popups break the composition-notebook aesthetic, while silent `.catch()` handlers display misleading `"Topic Radar Locked"` empty states when an API actually failed.
- **User Impact:** Accidental account deactivations, jarring alert boxes, and false "no data" states during network hiccups.

---

## 3. Page-by-Page Audit Ledger

### A. Core Design System & Shared Primitives
- **`tailwind.config.js` (`15–16`) & `index.css`:** `paper.hover` and `paper.pressed` are `#FFFFFF`, violating `DESIGN.md` ("Never use pure `#FFFFFF` as a page or card background in light mode"). `animate-scaleUp`, `backdrop-blur-xs`, `shadow-xs`, and `border-3` are used across pages despite not being defined in `tailwind.config.js`.
- **`NotebookPrimitives.jsx`:**
  - `NotebookButton` (`31`) needs `React.forwardRef` so `ConfirmModal` (`45–51, 153–167`) can focus Cancel/Confirm buttons on open.
  - `Field` (`124–197`) lacks a `disabled` prop; its password toggle (`178`) is `32×32px` (< 44px touch target); small `text-redpen` (`#D93829`) hints/asterisks (`191, 227, 464`) sit at ~4.15:1 on cream paper (use `redpen-dark` `#B52B1E` for ≥ 4.5:1).
  - `NotebookCard` (`202–210`) should either support or remove `pattern` / `borderStyle` usages across pages.
- **`NotebookTablePrimitives.jsx`:**
  - `SearchInput` (`142, 155`) and `PaginationControls` (`201, 224, 233`) lack `focus-visible:ring-2` styles; pagination buttons are ~`30×30px`; search placeholder `text-ink-muted/60` drops to ~2.7:1 contrast.
  - `EmptyState` (`345`) hardcodes `<h4>`, causing skipped heading levels when placed directly under `<h1>` or `<h2>`.
- **`MasteryPrimitives.jsx`:**
  - `StatusBadge` (`46–53`) ignores `size="xs"` passed by `InteractiveDemo.jsx` (6 places); `MASTERY_CONFIG` (`16–30`) and `TrendIndicator` (`73–84`) use raw `emerald-*` / `amber-*` / `red-*` instead of notebook `highlighter-*` and `redpen` tokens.

### B. Public Landing & Auth (`LandingPage`, `Navbar`, `Hero`, `HowItWorks`, `InteractiveDemo`, `FinalCTA`, `Footer`, `Login`, `Signup`)
- **`Navbar.jsx`:** Hand-rolls auth buttons (`87, 95, 161, 169`) with `border` (1px) and `shadow-sm` instead of `NotebookButton`; duplicates `Log In` on mobile (`116, 159`); `scrollIntoView` (`17`) ignores `prefers-reduced-motion`; `DESIGN.md` (`236, 239`) describes folder-tab links and a Navbar demo switcher that no longer exist.
- **`Hero.jsx`:** `role="list"` (`334–399`) directly wraps `<button>` elements without `role="listitem"`; 3-column Trust Pills (`136`, `grid-cols-3`) squeeze into ~90px columns at 360px; sticky note (`404`) crowds `Explore →` on mobile; SVG labels (`251, 266`) in `#059669` / `#D93829` fail 4.5:1 contrast.
- **`InteractiveDemo.jsx`:** Filtered tables (`1039–1080, 1189–1218`) render blank `<tbody>` with no `EmptyState`; intervention filter bar (`1090`) lacks `flex-wrap` and overflows at 360px; exposes raw enums (`Status: COMPLETED`, `<select>` `IN_PROGRESS` at `609, 1212–1214`); Recharts `ReferenceLine` labels (`883, 901–921`) clip on 360px; star rating `aria-pressed` (`625`) only marks the exact star rather than `<= currentRating` or using `radiogroup`; star buttons (`626`) are `24×24px`.
- **`FinalCTA.jsx` & `Footer.jsx`:** `FinalCTA.jsx:12` ignores `prefers-reduced-motion`; `56, 64` hand-roll CTAs; `Footer.jsx:16, 45, 52` links lack `focus-visible:ring-2`.
- **`Login.jsx` & `Signup.jsx`:** Mismatched back-link copy/weight (`← Back to Cover Page` vs `← Back to home`, missing back link on teacher-pending view `Signup.jsx:114–116`); `Signup.jsx:221–253` `radiogroup` lacks arrow-key roving `tabIndex`; `Signup.jsx:126` `animate-pulse` lacks `motion-reduce:animate-none`.

### C. Student Portal (`StudentSubjectsHome`, `SubjectDashboard`, `TakeAssessment`, `AttemptResult`, `StudentProgress`, `TopicProgressDetail`, `UsabilitySurvey`)
- **`StudentSubjectsHome.jsx`:** Uses undefined `animate-scaleUp` / `backdrop-blur-xs` (`457, 459`); modal (`75–86`) lacks full `Tab` focus trapping; aggressive `max-w-[150px]` truncation (`365`).
- **`SubjectDashboard.jsx` (1,014L):** Silently swallows errors (`106–110`); `classId` is dropped when navigating to quizzes/results (`365, 442, 626, 713, 727`), forcing redirect round-trips; sticky sidebar (`875–1008`) lacks `max-h` + `overflow-y-auto`, clipping bottom CTA on shorter viewports; quiz filter pills (`527–550`) lack `role="tablist"`/`role="tab"`; rogue `blue-100`/`red-100`/`amber-*` badges; inconsistent `h2`/`h3` (`517` vs `752`).
- **`TakeAssessment.jsx`:** Bypasses `PortalShell` (no skip link or dark-mode toggle); 360px header (`213–242`) crushes quiz title; `<main>` (`max-w-7xl`) mismatches `<footer>` (`max-w-4xl`); submit confirmation modal (`439–517`) lacks `role="dialog"`, `aria-modal`, `Escape`, and focus management; navigator pills (`282–290`) lack `aria-current="step"` and answered status in `aria-label`.
- **`AttemptResult.jsx`:** Renders **3** back buttons (`150, 195, 537`) and **2** Retake buttons (`199, 542`); breadcrumb shows raw `Subject #${validSubjectId}` (`159`); choice badges (`488–510`) squeeze option text at 360px; long review list (`311–532`) lacks *Incorrect Only* filter.
- **`StudentProgress.jsx`:** Uses clickable `<div role="link">` (`266–277`) instead of `<Link>`; skips `h2` (`142, 174, 254`).
- **`TopicProgressDetail.jsx` (1,102L):** Extreme vertical density without tabs/collapsing; 360px horizontal overflow on non-wrapping badge row (`580–593`); auto-dismissing feedback (`76–79, 302`) vanishes too quickly for assistive tech; missing `role="alert"` on error banners (`556, 863`).
- **`UsabilitySurvey.jsx`:** Uses rogue `red-500`/`red-50` error cards (`120, 284`) without `role="alert"`.

### D. Teacher Portal (`TeacherHome`, `TeacherSubjects`, `TeacherSubjectDetail`, `CreateQuizModal`, `TeacherClassDetail` + tabs, `TeacherAssessmentSubmissions`, `TeacherAttemptReview`, `TeacherStudentDetail`, `TeacherValidation*`)
- **`TeacherHome.jsx` & `TeacherSubjects.jsx`:** `headerRight` (`158` / `215`) lacks `flex-wrap` for 360px; modals (`484` / `494, 592`) lack `max-h-[90vh] overflow-y-auto`; `TeacherSubjects.jsx:509, 607` close `X` buttons lack `aria-label`; `TeacherHome.jsx:31` has unused `subjectSuggestions` state; `handleCopyCode` (`80–87`) silently swallows clipboard failures.
- **`TeacherSubjectDetail.jsx` (4,209L) & Quiz/Question Editors:** Needs decomposition into tab/modal components; 10 inline modals lack `role="dialog"`/`aria-modal`; 25+ `<label>`s lack `htmlFor`/`id` (plus `EnumerationQuestionEditor.jsx:29, 58` and `EssayRubricEditor.jsx:81–105, 143–150`); icon-only row buttons (`1542–1611, 1765–1795, 2361–2381`) have `title` only, no `aria-label`; custom tabs (`1447–1495`) lack `role="tablist"` and `?tab=` URL sync; resource sub-tabs (`2008–2039`) lack `flex-wrap`; renders duplicate `<h1>` (`1424`).
- **`TeacherClassDetail.jsx` & `class-tabs/*.jsx`:** Recharts in `ClassOverviewTab.jsx` use hardcoded `#64748B` / `#1B2534` that don't adapt to dark mode; `ClassStudentsTab.jsx` & `ClassInterventionsTab.jsx` use rogue `cyan-*`; `ClassAssessmentsTab.jsx:297–336` packs 3 action buttons per row requiring wide horizontal scroll on 360px; inline modals (`709, 811, 920`) duplicate the "Log Intervention" modal from `TeacherStudentDetail.jsx`.
- **`TeacherAssessmentSubmissions.jsx`:** Filter pills (`241`) use `text-white` on `bg-ink`; table (`290–395`) relies on horizontal scroll at 360px.
- **`TeacherAttemptReview.jsx`:** Duplicate `<h1>` (`415`); long 20+ question review has no jump strip or "Ungraded Essays First" filter; `419` student metadata string wraps awkwardly at 360px.
- **`TeacherStudentDetail.jsx`:** Duplicate `<h1>` (`267`); non-standard `border-3` (`263, 782, 906, 986`); unassociated modal `<label>`s (`798–935`); `max-h` missing on modals.
- **`TeacherValidationHub.jsx`, `TeacherValidationLabeling.jsx`, `TeacherValidationReport.jsx`:** Plain text loading (`Hub:200–203`), rogue `red-50/500`, native `alert()` on export (`Report:42`).

### E. Admin & Super Admin Portals (`AdminHome`, `AdminEvaluationDashboard`, `AdminValidationReport`, `ValidationReportView`, `SuperAdminDashboard`)
- **`AdminHome.jsx`:** Native `window.confirm()` (`281`) for deactivation vs inline Confirm/Cancel for teacher rejection (`524–543`); invalid `border-3` (`655, 867`) leaves spinners borderless; `headerActions` (`354`) crowds 640px–768px tablet headers; `<select className="w-32 sm:w-40 truncate">` (`962`) clips long teacher names; missing `dark:` variants on `actionNotice` (`429–432`) and `DEACTIVATED` pill (`743`).
- **`AdminEvaluationDashboard.jsx`:** Native `alert()` (`96, 107`) on export failures; double-padded `NotebookCard` (`218, 331, 459`) with `ruled` lines behind metric grids; inverted heading hierarchy (`h2` `text-sm` < `h3` `text-xl`).
- **`AdminValidationReport.jsx` & `ValidationReportView.jsx`:** No direct link from `/admin/validation` to `/admin/evaluation`; `ValidationReportView.jsx` stacks 7 dense sections with redundant Kappa explainers, uses 4 raw `<table>` elements (`502, 669, 750, 823`) missing `scope="col"`/`scope="row"`, uses rogue `amber-*`/`emerald-*`/`blue-*`/`red-*` + `⚠️` emoji (`271`), and its Kappa popover (`388`) overflows 360px.
- **`SuperAdminDashboard.jsx`:** `Field` `htmlFor` vs `id` bug breaks all 5 modal inputs (`884–949`); zero confirmation before user deactivation (`303–329`); raw `<button>`s for table actions (`794–815`); lacks `?tab=` URL sync; role/status filter pills (`625–660`) lack `aria-pressed`.

---

## 4. Prioritized Fix Recommendations

### High Priority
1. **Fix Shared Primitives (`NotebookPrimitives.jsx`, `ConfirmModal.jsx`):**
   - Wrap `NotebookButton` in `React.forwardRef`.
   - Either implement `pattern` / `borderStyle` on `NotebookCard` or remove dead props and outer `p-6`/`p-8` overrides so cards never double-pad.
   - Create a reusable `NotebookModal` primitive (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` close, focus trap, `max-h-[90vh] overflow-y-auto`, backdrop `overflow-y-auto`) and migrate all inline modals (starting with `TeacherSubjectDetail.jsx`, `TakeAssessment.jsx`, `TeacherHome.jsx`, `TeacherSubjects.jsx`, `TeacherClassDetail.jsx`, `TeacherStudentDetail.jsx`, `SuperAdminDashboard.jsx`).
2. **Decompose `TeacherSubjectDetail.jsx` (4,209L):**
   - Split into `SubjectTopicsTab`, `SubjectQuestionsTab` (with pagination), `SubjectQuizzesTab`, `SubjectResourcesTab`, and extracted modal components; adopt `NotebookTabs` with `?tab=` URL persistence.
3. **Fix Form Label & Dialog Accessibility:**
   - Change `htmlFor=` to `id=` on all `<Field>` calls in `SuperAdminDashboard.jsx:884–949`.
   - Add `htmlFor`/`id` (or `aria-label`) to all form controls in `TeacherSubjectDetail.jsx`, `TeacherClassDetail.jsx`, `TeacherStudentDetail.jsx`, `EnumerationQuestionEditor.jsx`, and `EssayRubricEditor.jsx`.
   - Add `aria-label` to all icon-only table/card buttons (`TeacherSubjectDetail.jsx`, `TeacherSubjects.jsx`).
4. **Replace Native Dialogs & Standardize Destructive Confirmations:**
   - Replace `window.confirm()` (`AdminHome.jsx:281`) and `alert()` (`AdminEvaluationDashboard.jsx:96, 107`, `TeacherValidationReport.jsx:42`) with `ConfirmModal` and inline `role="alert"` banners.
   - Add a `ConfirmModal` guard to user deactivation in `SuperAdminDashboard.jsx:303–329`.
5. **De-clutter `TopicProgressDetail.jsx` & Surface Silent Errors:**
   - Group `TopicProgressDetail.jsx` into `NotebookTabs` (*Feedback & Misses*, *Study Resources*, *Answer Log*) and add `flex-wrap` to the header badge bar (`580–593`).
   - Remove `.catch(() => null)` / `.catch(() => [])` in `SubjectDashboard.jsx:106–110` so partial failures show a retryable alert, and preserve `classId` in quiz/result navigation links.

### Medium Priority
1. **Standardize Color Tokens & Dark Mode:** Replace rogue `cyan-*`, `rose-*`, `red-*`, `emerald-*`, `amber-*`, `blue-*`, `bg-white`, and Recharts hardcoded hexes with `DESIGN.md` tokens (`highlighter-*`, `redpen*`, `ink`, `paper*`, `chalkboard-*`) and add missing `dark:` variants (`AdminHome.jsx`, `ValidationReportView.jsx`).
2. **Table & Review Scalability:** Migrate raw `<table>` elements in `ValidationReportView.jsx` to `NotebookTable` with `scope="col"`/`scope="row"`; add an *Incorrect / Ungraded Only* filter and question jump strip to `AttemptResult.jsx` and `TeacherAttemptReview.jsx`.
3. **Fix Heading Hierarchy & Duplicate `<h1>`s:** Ensure `PortalShell` owns the sole `<h1>` per page; remove secondary `<h1>` tags in `TeacherSubjectDetail.jsx:1424`, `TeacherStudentDetail.jsx:267`, and `TeacherAttemptReview.jsx:415`; fix `h2`/`h3` inversions in `AdminEvaluationDashboard.jsx` and `SubjectDashboard.jsx`.
4. **Sanitize Error Messages:** Add a shared `formatApiError(err, fallback)` helper so raw HTTP status strings or stack fragments never render directly in UI banners.
5. **Add `TakeAssessment.jsx` Landmark & Width Alignment:** Align `<main>` and `<footer>` max-width, add `flex-wrap` / responsive truncation to the 360px quiz header, and add `aria-current="step"` + answered status to navigator pills.

### Low Priority
1. **Unify Loading States:** Replace inconsistent spinners and `font-hand` loading text with a shared `<NotebookLoader>` or skeleton component.
2. **Sync `DESIGN.md` & `Navbar.jsx`:** Update `DESIGN.md` to match the current `Navbar.jsx` links and remove duplicate mobile `Log In`.
3. **URL Tab Persistence & Cross-Links:** Sync `?tab=` in `SuperAdminDashboard.jsx` and `TeacherSubjectDetail.jsx`; add a direct cross-link between `/admin/validation` and `/admin/evaluation`.
4. **Auth Polish:** Align `Login.jsx` and `Signup.jsx` back-link copy/placement, add roving arrow-key navigation to `Signup.jsx`'s `radiogroup`, and add `disabled` support to `Field`.

---

## 5. Quick-Win Checklist (< 5 Minutes Each)

1. **`tailwind.config.js:15–16`:** Change `paper.hover` and `paper.pressed` from `#FFFFFF` to `#FFFDF9` / `#F6F1E6`.
2. **`NotebookPrimitives.jsx:31`:** Wrap `NotebookButton` in `React.forwardRef` so `ConfirmModal` initial focus works immediately.
3. **`SuperAdminDashboard.jsx:884–949`:** Rename `htmlFor=` prop to `id=` on the 5 `<Field>` components.
4. **`AdminHome.jsx:655, 867` & `TeacherStudentDetail.jsx:263, 782, 906, 986`:** Replace invalid `border-3` with `border-2`.
5. **`AdminEvaluationDashboard.jsx:96, 107` & `TeacherValidationReport.jsx:42`:** Replace `alert(...)` with inline `error` banner state.
6. **`InteractiveDemo.jsx:1090` & `TopicProgressDetail.jsx:580`:** Add `flex-wrap` to prevent 360px horizontal overflow.
7. **`TeacherHome.jsx:158`, `TeacherSubjects.jsx:215`, `TeacherSubjectDetail.jsx:2008`:** Add `flex-wrap` to header/sub-tab action bars.
8. **`InteractiveDemo.jsx:1039–1080, 1189–1218`:** Render `<EmptyState>` when filtered table rows equal `0`.
9. **`MasteryPrimitives.jsx:46–53`:** Add `xs` key to `StatusBadge` size map.
10. **`NotebookPrimitives.jsx:191, 227, 464` & `SubjectDashboard.jsx:856` & `TopicProgressDetail.jsx:109, 1014`:** Switch small `text-redpen` text on cream/warm paper to `text-redpen-dark` for ≥ 4.5:1 WCAG AA contrast.
11. **`TeacherHome.jsx:204`, `TeacherSubjects.jsx:282`, `TeacherSubjectDetail.jsx:1398`, `TeacherClassDetail.jsx:441`:** Replace `font-hand text-2xl` on loading messages with `font-mono text-sm`.
12. **`SubjectDashboard.jsx:761`, `TopicProgressDetail.jsx:556, 863`, `TakeAssessment.jsx:481`, `UsabilitySurvey.jsx:119, 283`:** Add `role="alert"` to error banners.
13. **`ValidationReportView.jsx:271`:** Replace literal `⚠️` emoji with `<AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />`.
14. **`ValidationReportView.jsx:388`:** Add `right-0 sm:left-0 sm:right-auto max-w-[calc(100vw-3rem)]` to the Cohen's Kappa popover so it never clips on 360px.

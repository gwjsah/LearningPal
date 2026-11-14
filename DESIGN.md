---
name: LearningPal
description: Tactile study-notebook and educator gradebook design system built on warm cream paper, fountain-pen navy ink, red-pen annotations, and fluorescent highlighters.
colors:
  redpen: "#D93829"
  redpen-dark: "#B52B1E"
  redpen-soft: "#FDE8E6"
  redpen-margin: "#E88B84"
  ink: "#1B2534"
  ink-blue: "#1E3A5F"
  ink-muted: "#4A5568"
  ink-light: "#64748B"
  paper: "#FDFBF7"
  paper-warm: "#F6F1E6"
  paper-card: "#FFFDF9"
  paper-rule: "#D8E3EC"
  paper-grid: "#E3DEC8"
  paper-edge: "#E5DEC9"
  highlighter-yellow: "#FDE047"
  highlighter-yellow-soft: "#FEF9C3"
  highlighter-mint: "#86EFAC"
  highlighter-mint-soft: "#DCFCE7"
  highlighter-pink: "#F9A8D4"
  highlighter-pink-soft: "#FCE7F3"
  highlighter-sky: "#93C5FD"
  chalkboard: "#161C19"
  chalkboard-surface: "#1F2723"
  chalkboard-card: "#26302B"
  chalkboard-chalk: "#F3F4F0"
  chalkboard-muted: "#A7B5AE"
typography:
  display:
    fontFamily: "DM Sans, system-ui, -apple-system, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "DM Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "DM Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "DM Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
  hand:
    fontFamily: "Caveat, Patrick Hand, cursive"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.redpen}"
    textColor: "{colors.paper-card}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.redpen-dark}"
  button-secondary:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-warm}"
  card-notebook:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px 32px"
  input-notebook:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
---

# Design System: LearningPal

## Overview

**Creative North Star: "The Tactile Study Notebook"**

LearningPal's visual system transforms abstract academic diagnostics into the familiar, reassuring artifacts of a physical study desk: ruled composition pages, crisp index cards, vertical red margin lines, spiral binder hole punches, fluorescent highlighter sweeps, and encouraging teacher annotations. Instead of feeling like a cold corporate enterprise dashboard or a gamified cartoon app, every surface behaves like a well-organized notebook where complex assessment data is broken down into clear, human-scale study checklists and gradebook ledgers.

Across both persuasive storytelling (`/`) and operational workspaces (`/login`, `/signup`, `/student`, `/teacher`, `/admin`), the interface balances tactile stationery craft with high-contrast typographic precision. Pure CSS paper textures (`bg-ruled-paper`, `bg-graph-paper`, `bg-dot-paper`, `bg-index-card`) anchor the spatial hierarchy without relying on external raster images, while a dedicated Chalkboard Night Study mode (`dark` class) translates the warm cream paper palette into a calm slate chalkboard surface for late-night revision.

We explicitly reject generic SaaS glassmorphism, neon cyberpunk gradients, sterile `#FFFFFF` backgrounds, and ungrounded floating cards that lack physical borders.

**Key Characteristics:**
- **Pure-CSS Stationery Surfaces**: Ruled lines (`32px` vertical rhythm), engineering graph grids (`24px` / `96px`), dot grids (`22px`), and red-ruled index cards rendered entirely with CSS gradients.
- **Structural Ink Borders & Tactile Press Shadows**: Interactive controls and primary sheets use crisp `2px` fountain-pen navy borders paired with hard offset ink shadows (`3px 3px 0 #1B2534`) that physically depress on click.
- **Semantic Highlighter Coding**: Fluorescent yellow, mint green, pink, and sky markers encode learner status (`Strength`, `On Track`, `Gap Detected`, `Priority Gap`) at a glance.
- **Three-Voice Typography**: Geometric sans-serif (`DM Sans`) for effortless reading, monospace (`JetBrains Mono`) for syllabus codes and metrics, and handwritten script (`Caveat` / `Patrick Hand`) strictly reserved for margin encouragement and organic annotations.

## Colors

The palette draws directly from physical classroom stationery: unbleached cream paper stock, deep fountain-pen navy and ballpoint blue inks, teacher's grading red pen, translucent fluorescent highlighters, and dark slate chalkboard surfaces.

### Primary
- **Grading Red Pen** (`#D93829`): Primary action buttons (`Sign Up`, `Open Notebook`), critical priority-gap badges, active focus rings, and hand-drawn teacher correction accents.
- **Accessible Dark Red Ink** (`#B52B1E`): Hover state for primary red-pen buttons and high-contrast error/alert copy on soft red tints.
- **Soft Red Margin Tint** (`#FDE8E6`): Background fill for error banners (`role="alert"`), reject buttons, and priority-gap callout boxes.
- **Vertical Red Margin Line** (`#E88B84`): The signature vertical left margin guide rendered on notebook sheets and index cards.

### Secondary
- **Ballpoint Blue Ink** (`#1E3A5F`): Inline text links, secondary icons, role authority callouts, and interactive student/teacher badge accents.
- **Fluorescent Yellow Highlighter** (`#FDE047`) & **Soft Yellow Wash** (`#FEF9C3`): Active Student role toggles, inline headline marker sweeps (`.marker-highlight-yellow`), text selection highlights, and "On Track / Review Needed" badges.

### Tertiary
- **Fluorescent Mint Highlighter** (`#86EFAC`) & **Soft Mint Wash** (`#DCFCE7`): Active Teacher role toggles,Admin "Approve" buttons, inline mastery marker sweeps (`.marker-highlight-mint`), and "Strength / Mastered (≥80%)" topic indicators.
- **Fluorescent Pink Highlighter** (`#F9A8D4`) & **Soft Pink Wash** (`#FCE7F3`): Attention callouts, intervention tags, and inline marker sweeps (`.marker-highlight-pink`).
- **Sky Tab Marker** (`#93C5FD`): Notebook divider tab accents and secondary chart bars.

### Neutral
- **Warm Cream Paper** (`#FDFBF7`): Default page canvas (`bg-paper`), replacing sterile pure white to reduce eye strain during study sessions.
- **Aged Manila Paper** (`#F6F1E6`): Secondary section backgrounds, spiral-punch header strips, table headers, and segmented control tracks (`bg-paper-warm`).
- **Crisp Index Card** (`#FFFDF9`): Elevated card, form sheet, and input field background (`bg-paper-card`).
- **Cyan-Blue Ruling Line** (`#D8E3EC`) & **Deckle Paper Edge** (`#E5DEC9`): Horizontal notebook ruling lines and subtle structural dividers.
- **Fountain-Pen Navy** (`#1B2534`): Primary body copy, headings, `2px` structural card/button borders, and hard offset shadows (13.8:1 contrast on cream paper).
- **Pencil Graphite Muted** (`#4A5568`) & **Faint Caption Graphite** (`#64748B`): Supporting descriptions, timestamps, table metadata, and input placeholders.
- **Night Study Chalkboard** (`#161C19`), **Elevated Slate Surface** (`#1F2723`), **Dark Index Card** (`#26302B`), **Crisp Chalk White** (`#F3F4F0`), & **Dusted Chalk Muted** (`#A7B5AE`): Dark-mode equivalents preserving tactile contrast without harsh OLED black.

### Named Rules
**The Unbleached Canvas Rule.** Never use pure `#FFFFFF` as a page or card background in light mode; always ground surfaces in Warm Cream Paper (`#FDFBF7`), Aged Manila (`#F6F1E6`), or Crisp Index Card (`#FFFDF9`).

**The Semantic Marker Rule.** Highlighter colors encode diagnostic meaning: Mint (`#86EFAC`) signifies confirmed mastery or approval, Yellow (`#FDE047`) signifies active focus or developing concepts, and Red Pen (`#D93829`) signifies priority learning gaps or primary actions.

## Typography

**Display & Body Font:** `DM Sans` (with `system-ui, -apple-system, sans-serif` fallback)
**Label / Metric Font:** `JetBrains Mono` (with `monospace` fallback)
**Handwritten Accent Font:** `Caveat` and `Patrick Hand` (with `cursive` fallback)

**Character:** Clean, approachable geometric sans-serif headings and body copy keep dense diagnostic feedback effortless to scan, while crisp monospace metadata lends the authority of a laboratory ledger and warm handwritten notes inject human encouragement.

### Hierarchy
- **Display** (`800` weight, `2.5rem–3.5rem`, `1.1` line-height, `-0.025em` tracking): Hero headlines on the landing page, often paired with a `.marker-highlight-yellow` span.
- **Headline** (`800` weight, `1.5rem–2.25rem`, `1.2` line-height, `-0.02em` tracking): Section titles (`Why working harder often fails to raise grades`) and portal welcome headers (`Welcome back, Maya!`).
- **Title** (`700` weight, `1.125rem–1.25rem`, `1.35` line-height): Card headers, topic names, and modal/sheet titles.
- **Body** (`400–500` weight, `0.875rem–1rem`, `1.6` line-height, `60–72ch` max width): Diagnostic summaries, problem scenarios, and form instructions.
- **Label / Mono** (`600–700` weight, `0.6875rem–0.75rem`, `0.06em` letter-spacing, `uppercase`): Page index badges (`Page 01 • User Authentication`), syllabus codes (`BIO-204`), form field labels, and percentage mastery tags.
- **Handwritten Note** (`600–700` weight, `1.125rem–1.75rem`, `1.25` line-height): Brand suffix (`LearningPal`), margin callouts, and encouraging footer sign-offs.

### Named Rules
**The Margin-Only Script Rule.** Handwritten fonts (`Caveat`, `Patrick Hand`) are strictly limited to short margin callouts, decorative brand accents, and pull-quote tags — never use them for form labels, data tables, error messages, or multi-sentence body paragraphs.

**The Monospace Ledger Rule.** All syllabus codes, page numbers, timestamps, role authorities (`ROLE_STUDENT`), and uppercase field labels use `JetBrains Mono` to distinguish structural metadata from narrative content.

## Layout

LearningPal uses a responsive container system anchored by notebook page spreads:
- **Navigation Bar**: Full-bleed horizontal header (`w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16`) with `shrink-0` control groups so brand identity, notebook divider tabs, and action buttons never compress horizontally.
- **Portal & Marketing Containers**: Centered `max-w-6xl` (`1152px`) or `max-w-7xl` (`1280px`) workspaces with `px-4 sm:px-8` horizontal padding and `py-8` to `py-20` vertical section rhythm.
- **Auth Notebook Sheets**: Centered `max-w-md` (`448px`) single-sheet containers featuring a `notebook-margin-line` pseudo-element (`left: 2.25rem` on desktop, `left: 1rem` on mobile) and generous left padding (`pl-12 sm:pl-16`) so form controls sit cleanly to the right of the vertical red margin line.
- **Ruled Rhythm**: `.bg-ruled-paper` establishes a `32px` vertical background line repeat; `.bg-graph-paper` establishes `24px` minor and `96px` major grid subdivisions.

## Elevation & Depth

LearningPal uses a **Structural & Tactile Paper Stack** elevation model. Surfaces are defined by crisp `2px` fountain-pen ink borders (`#1B2534`) combined with physical paper shadows and hard offset press shadows on interactive controls. Depth feels like stacked index cards and pinned notebook sheets on a wooden desk rather than blurred floating glass.

### Shadow Vocabulary
- **Paper Rest Shadow** (`box-shadow: 0 2px 5px rgba(27, 37, 52, 0.06), 0 8px 20px -4px rgba(27, 37, 52, 0.08), 1px 1px 0 rgba(27, 37, 52, 0.08)`): Default elevation for secondary cards, metric boxes, and verification panels (`shadow-paper`).
- **Lifted Sheet Shadow** (`box-shadow: 0 14px 28px -6px rgba(27, 37, 52, 0.14), 0 4px 10px -2px rgba(27, 37, 52, 0.08), 2px 3px 0 rgba(27, 37, 52, 0.1)`): Primary notebook spreads, hero diagnostic cards, auth sheets, and the admin approval ledger (`shadow-lifted`).
- **Sticky Note Shadow** (`box-shadow: 2px 6px 14px rgba(27, 37, 52, 0.12), 0 1px 2px rgba(27, 37, 52, 0.08)`): Pinned problem scenario cards and tilted callout notes (`shadow-sticky`).
- **Tactile Button Offset Shadow** (`box-shadow: 3px 3px 0 #1B2534`, compact `2px 2px 0 #1B2534`): Applied to primary action buttons, segmented role switchers, and badge icons. Shifts to `4px 4px 0 #1B2534` with `-1px` vertical lift on hover, and collapses to `1px 1px 0 #1B2534` on active press.

### Named Rules
**The Ink-Bordered Surface Rule.** Every elevated card, sheet, or primary button must pair its shadow with a visible border (`border-2 border-ink` or `border border-ink/20`). Shadows never float without a physical paper edge.

## Shapes

- **Notebook Sheets & Primary Containers**: Generous `16px` rounded corners (`rounded-2xl`) with `overflow-hidden` so top spiral-punch header strips clip flush to the card border.
- **Buttons, Inputs & Inner Callouts**: `12px` rounded corners (`rounded-xl`) for primary form inputs and CTAs; `8px` (`rounded-lg`) for compact table action buttons (`Approve`, `Reject`) and segmented radio pills.
- **Folder Divider Tabs**: Top-only rounded corners (`rounded-t-lg`) anchored to the bottom border of the navigation bar (`items-end self-end`), rising `-2px` on hover like physical manila folder tabs.
- **Tactile Organic Clips**: `.washi-tape` and `.torn-edge-bottom` use multi-point CSS `polygon()` `clip-path` definitions to simulate hand-torn paper edges and translucent masking tape without SVG masks or raster assets.
- **Card Tilt**: Decorative story cards use subtle alternating rotations (`.tilt-card-left` at `-1.25deg`, `.tilt-card-right` at `1.25deg`) that straighten to `0deg` and lift `-4px` on `:hover` and `:focus-within`. Operational forms and data tables never tilt.

## Components

Every component feels like a tangible piece of study stationery — crisp, high-contrast, and immediately responsive to keyboard and pointer interaction.

### Buttons
- **Shape:** `12px` radius (`rounded-xl`) for form and hero actions; `8px` radius (`rounded-lg`) for compact header and table row actions, framed by a `2px` solid `#1B2534` border.
- **Primary:** Grading Red Pen background (`#D93829`), white bold text (`0.875rem`), `12px 20px` padding, and a `3px 3px 0 #1B2534` offset shadow.
- **Hover / Focus:** Background deepens to `#B52B1E`, button lifts `translateY(-1px)`, shadow expands to `4px 4px 0 #1B2534`. Focus-visible shows a `2px` `#D93829` ring with `2px` offset.
- **Secondary / Mint / Soft Variants:** Crisp Index Card (`#FFFDF9`) or Aged Manila (`#F6F1E6`) background for neutral actions; Fluorescent Mint (`#86EFAC`) with dark ink text for positive confirmations (`Approve`); Soft Red (`#FDE8E6`) with dark red text (`#B52B1E`) transitioning to solid `#D93829` on hover for destructive actions (`Reject`, `Log Out`).

### Chips & Status Badges
- **Style:** Monospace uppercase text (`0.75rem`, `700` weight), `4px 10px` padding, `6px–8px` radius, bordered by `1px solid rgba(27, 37, 52, 0.2)`.
- **State:** Color-coded by diagnostic threshold — Mint (`#DCFCE7` / `#86EFAC`) for `Strength / Mastered`, Yellow (`#FEF9C3` / `#FDE047`) for `On Track / Gap Detected`, and Red Pen (`#FDE8E6` / `#D93829`) for `Priority Gap`. Rubber-stamp badges (`.rubber-stamp`) add a `2.5px` currentColor border and radial-gradient ink distress mask.

### Cards / Containers (Notebook Sheets)
- **Corner Style:** `16px` radius (`rounded-2xl`) with a `2px` solid `#1B2534` border.
- **Background:** Crisp Index Card (`#FFFDF9`) or Ruled Paper (`.bg-ruled-paper`) with a top spiral-hole strip in Aged Manila (`#F6F1E6`) displaying three `12px` circular binder punches and a right-aligned monospace page reference (`Page 01 • User Authentication`).
- **Shadow Strategy:** `shadow-lifted` for focal sheets; `shadow-paper` for grid sub-cards.
- **Internal Padding:** `24px 32px` (`p-6 sm:p-8`), expanding left padding to `48px–64px` (`pl-12 sm:pl-16`) whenever `.notebook-margin-line` is active.

### Inputs / Fields
- **Style:** `12px` radius (`rounded-xl`), `2px` solid `rgba(27, 37, 52, 0.3)` border on Crisp Index Card (`#FFFDF9`) background, `10px 14px` padding, paired with an uppercase `JetBrains Mono` label (`0.75rem`, `700` weight) and red asterisk (`#D93829`) for required fields.
- **Focus:** Border darkens to solid `#1B2534` with a `2px` `#D93829` focus ring (`focus-visible:ring-2 focus-visible:ring-redpen`).
- **Error / Disabled:** Invalid fields switch border to `#D93829` with inline `0.75rem` `#D93829` helper text directly beneath; password fields permanently display their formatting rule in `11px` monospace (`Rule: 8+ characters, with at least one letter and one number`).

### Navigation
- **Style:** Two-tier sticky notebook header (`sticky top-0 z-50`). Top strip (`bg-paper-warm/90`) shows three binder holes, pilot badge, and subject reference (`BIO-204 / MTH-301`). Main bar (`h-16`) houses the `LearningPalLogo` wordmark on the left, folder-tab anchor links in the center (`hidden xl:flex`), and auth links (`Log In`, `Sign Up`), Chalkboard theme toggle, and Student/Teacher segmented demo switcher on the right.

### Segmented Role Switcher (Signature Component)
- **Description:** A tactile dual-button pill (`role="radiogroup"` on Signup, `role="group"` on Navbar) housed in an Aged Manila track (`#F6F1E6`) with a `2px` `#1B2534` border and `2px 2px 0 #1B2534` shadow. Selecting `Student` illuminates the pill in Fluorescent Yellow (`#FDE047`); selecting `Teacher` illuminates it in Fluorescent Mint (`#86EFAC`), giving instant visual confirmation of the active persona.

## Do's and Don'ts

### Do:
- **Do** pair `.notebook-margin-line` containers with left padding of at least `pl-12 sm:pl-16` so text and form inputs never collide with the vertical red margin line at `left: 2.25rem`.
- **Do** use `2px` solid `#1B2534` borders and hard offset shadows (`3px 3px 0 #1B2534`) on primary CTAs and notebook sheets to preserve the tactile stationery character.
- **Do** keep operational tables and forms (Login, Signup, Admin Approval Queue) at `0deg` rotation so data entry and scanning remain effortless.
- **Do** provide explicit `aria-label` context on row-level table actions (e.g., `Approve Maria Santos`, `Reject Maria Santos`) and `role="alert"` on error banners.

### Don't:
- **Don't** use pure `#FFFFFF` backgrounds or cold blue-gray SaaS shadows; always use Warm Cream Paper (`#FDFBF7`), Crisp Index Card (`#FFFDF9`), or Aged Manila (`#F6F1E6`).
- **Don't** apply `.tilt-card-left` or `.tilt-card-right` rotations to multi-field forms, data tables, or dense text blocks.
- **Don't** set body paragraphs, form labels, or table cells in `Caveat` or `Patrick Hand`; reserve handwritten fonts strictly for short annotations and brand accents.
- **Don't** compress navigation items into a narrow centered container; keep the top header full-width (`w-full`) with `shrink-0` action groups.


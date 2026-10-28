# LearningPal — Notebook-Inspired Learning Support Landing Page

A production-quality, single-page React + Vite + Tailwind CSS landing page and interactive showcase for **LearningPal**, a data-driven learning support system that analyzes student assessments to pinpoint strengths, uncover specific topic gaps, and deliver targeted learning resources and teacher insights.

## Quick Start & Setup Instructions

### Option A: Run Directly in This Project Directory
```bash
npm install
npm run dev
```

### Option B: Scaffold From Scratch with Vite
```bash
npm create vite@latest learningpal -- --template react
cd learningpal
npm install framer-motion lucide-react recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

## Project Structure

```text
learningpal-landing/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   └── content.js          # Single source of truth for all copy, demo data & targets
    └── components/
        ├── Doodles.jsx         # Hand-drawn SVG logo, squiggly lines, circles, pins, washi tape
        ├── Navbar.jsx          # Sticky notebook tab bar + Student/Teacher CTA + Chalkboard toggle
        ├── Hero.jsx            # Headline, CTAs & animated self-drawing notebook mastery chart
        ├── Problem.jsx         # Relatable scenarios on tilted sticky notes & torn notebook pages
        ├── HowItWorks.jsx      # 3-step Collect → Analyze → Support flow with dashed doodle arrows
        ├── InteractiveDemo.jsx # Flip-tab Student Notebook & Teacher Gradebook with Recharts & live state
        ├── FeaturesGrid.jsx    # 5 index cards with rubber-stamped "Coming Soon" roadmap items
        ├── GoalsImpact.jsx     # Red-pen graded animated counters honestly labeled as project targets
        ├── WhoItsFor.jsx       # Side-by-side Student Notebook vs. Teacher Gradebook spreads
        ├── FinalCTA.jsx        # Perforated torn notebook sheet closing prompt
        └── Footer.jsx          # Composition-notebook back cover with Mastery Reference Table
```


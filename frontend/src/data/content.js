/**
 * Central content & dataset store for LearningPal.
 * Edit copy, navigation, pilot subjects, demo data, features, and project goals here.
 */

export const siteMetadata = {
  appName: 'LearningPal',
  tagline: 'Stop studying everything. Study what actually needs your attention.',
  pilotBadge: '2026 Academic Pilot • Built for Students & Educators',
};

export const navLinks = [
  { label: 'The Problem', href: '#problem', tabColor: 'bg-highlighter-pinkSoft dark:bg-pink-950/60' },
  { label: 'How It Works', href: '#how-it-works', tabColor: 'bg-highlighter-yellowSoft dark:bg-yellow-950/60' },
  { label: 'Live Demo', href: '#demo', tabColor: 'bg-highlighter-mintSoft dark:bg-emerald-950/60' },
  { label: 'Features', href: '#features', tabColor: 'bg-blue-100/80 dark:bg-blue-950/60' },
  { label: 'Goals', href: '#goals', tabColor: 'bg-redpen-soft dark:bg-red-950/60' },
  { label: 'Who It’s For', href: '#who-its-for', tabColor: 'bg-amber-100/80 dark:bg-amber-950/60' },
];

export const heroContent = {
  eyebrow: 'Subject-Level Clarity • Notebook-Simple Experience',
  headlinePrefix: 'Find ',
  headlineHighlight: 'exactly what you need to study',
  headlineSuffix: ' — instead of re-reading the whole textbook.',
  subheadline:
    'LearningPal analyzes your quizzes, assessments, and topic activities to pinpoint hidden learning gaps and strengths. Students get targeted resources by topic; teachers get instant class-wide clarity to support every learner.',
  primaryCta: 'Try Student Notebook Demo',
  secondaryCta: 'Explore Teacher Gradebook View',
  marginNote: 'No more guessing which chapter tripped you up before the exam!',
  heroCard: {
    studentName: 'Maya Lin • Grade 10',
    subject: 'Honors Biology — Unit 4 Assessment',
    dateLabel: 'Oct 28 • Diagnostic Complete',
    overallScore: 76,
    previousScore: 64,
    scoreDelta: '+12% since Quiz 2',
    teacherRedPenNote: 'Strong in Cell Structure! Focus 25 mins on Meiosis Stage II before Friday.',
    topics: [
      { id: 'organelles', name: 'Cell Organelles & Membranes', score: 94, status: 'strength', note: 'Mastered' },
      { id: 'atp', name: 'Cellular Respiration & ATP', score: 82, status: 'solid', note: 'On Track' },
      { id: 'enzymes', name: 'Enzyme Kinetics & pH Curves', score: 61, status: 'gap', note: 'Review Needed' },
      { id: 'meiosis', name: 'Meiosis & Chromosome Crossing', score: 52, status: 'critical-gap', note: 'Priority Gap' },
    ],
    pinnedRecommendation: {
      topic: 'Meiosis & Chromosome Crossing',
      title: 'Interactive: Meiosis I vs. Meiosis II Spindle Sort (12 min)',
      matchReason: 'Matched to 3 missed questions on homologous chromosome separation',
    },
  },
};

export const problemContent = {
  sectionLabel: 'Page 01 • The Everyday Classroom Struggle',
  headline: 'Why working harder often fails to raise grades',
  subheadline:
    'Students have different strengths, weaknesses, and learning needs—but spotting them early and specifically is nearly impossible from a single raw test score.',
  scenarios: [
    {
      id: 'student-struggle',
      role: 'The Student’s Dilemma',
      persona: 'Maya, Year 10 Student',
      cardStyle: 'sticky-yellow',
      rotation: 'tilt-card-left',
      pinType: 'red-pin',
      quote: '“I got a 68% on my Biology midterm. I know I’m falling behind, so I spent four hours re-reading Chapters 1 to 4 from page one—and still blanked on the next quiz.”',
      painSummary:
        'Students know when they are struggling, but a single percentage score hides which specific concepts need attention. Without topic-level visibility, they spend hours reviewing material they already know.',
      doodleTag: 'Where do I even start?!',
    },
    {
      id: 'teacher-crunch',
      role: 'The Teacher’s Time Crunch',
      persona: 'Mr. Davis, High School Science Teacher',
      cardStyle: 'torn-notebook',
      rotation: 'tilt-card-right',
      pinType: 'paper-clip',
      quote: '“I teach 124 students across four sections. By the time I grade a quiz, I only see the final score—not that 14 students missed every single question on enzyme inhibition.”',
      painSummary:
        'Teachers care deeply about individualized instruction, but manually mapping every test question back to curriculum sub-topics for dozens of students takes hours nobody has.',
      doodleTag: '40 students × 25 questions = 1,000 data points',
    },
    {
      id: 'generic-fallback',
      role: 'The Result: Generic Study Loops',
      persona: 'What Happens Today',
      cardStyle: 'index-pink',
      rotation: 'tilt-card-left',
      pinType: 'washi-tape',
      quote: '“Everyone gets handed the same 10-page review packet—whether they aced cell membranes or struggled with mitosis.”',
      painSummary:
        'When learning gaps stay blurry, students fall back on passive, one-size-fits-all study habits and generic video playlists that never address their actual misconceptions.',
      doodleTag: 'One-size-fits-none',
    },
  ],
};

export const howItWorksContent = {
  sectionLabel: 'Page 02 • The 3-Step Workflow',
  headline: 'From scattered quiz scores to a clear study roadmap',
  subheadline:
    'LearningPal quietly connects the assessments you already do to topic-level diagnostics and ready-to-use learning activities.',
  steps: [
    {
      number: '01',
      verb: 'Collect',
      title: 'Gather Everyday Learning Signals',
      badge: 'Assessments • Quizzes • Topic Activities',
      description:
        'LearningPal ingests scores from unit tests, quick formative quizzes, and topic-tagged classroom activities—linking each question directly to its underlying subject skill or topic.',
      artifactTitle: 'Incoming Data Sources',
      artifactItems: [
        { label: 'Unit 4 Quiz (18 Qs tagged by topic)', meta: 'Synced', color: 'bg-highlighter-yellowSoft' },
        { label: 'Lab Exit Ticket: Enzyme Denaturation', meta: 'Synced', color: 'bg-highlighter-mintSoft' },
        { label: 'Practice Set: Mitosis vs. Meiosis', meta: 'Synced', color: 'bg-highlighter-pinkSoft' },
      ],
      handNote: 'No extra tests required!',
    },
    {
      number: '02',
      verb: 'Analyze',
      title: 'Pinpoint Strengths & Specific Gaps',
      badge: 'Automated Topic-Level Gap Engine',
      description:
        'Instead of flattening performance into a single letter grade, the gap engine breaks performance down by topic—separating confident strengths from emerging misconceptions.',
      artifactTitle: 'Automated Topic Breakdown',
      artifactItems: [
        { label: 'Cell Organelles & Transport', meta: '94% Strength ★', color: 'bg-highlighter-mintSoft' },
        { label: 'Enzyme Kinetics & Graphs', meta: '61% Gap Detected', color: 'bg-highlighter-yellowSoft' },
        { label: 'Meiosis Chromosome Crossing', meta: '52% Priority Gap !', color: 'bg-redpen-soft' },
      ],
      handNote: 'Spots patterns across multiple quizzes',
    },
    {
      number: '03',
      verb: 'Support',
      title: 'Deliver Targeted Resources & Track Growth',
      badge: 'Personalized Feedback • Teacher Insights',
      description:
        'Students receive bite-sized explanations, practice activities, and curated resources organized around their weak topics. Teachers see visual class summaries and log targeted interventions.',
      artifactTitle: 'Personalized Action Plan',
      artifactItems: [
        { label: '12-min Visual Lab: Crossing Over', meta: 'Assigned to Gap', color: 'bg-highlighter-yellowSoft' },
        { label: '5-Question Targeted Check: Enzymes', meta: 'Ready to Start', color: 'bg-blue-100/80' },
        { label: 'Teacher Small-Group Check-in Logged', meta: 'Mr. Davis • Thu', color: 'bg-highlighter-mintSoft' },
      ],
      handNote: 'Watch mastery bars climb!',
    },
  ],
};

export const demoContent = {
  sectionLabel: 'Page 03 • Interactive Notebook Showcase',
  headline: 'Flip between the Student Notebook and Teacher Gradebook',
  subheadline:
    'Interact with the live mock workspace below. Filter topics, check off recommended study activities to watch mastery scores update, or log a new classroom intervention as a teacher.',
  subjects: {
    biology: {
      id: 'biology',
      name: 'Honors Biology (Grade 10)',
      code: 'BIO-204',
      studentName: 'Maya Lin',
      studentId: 'STU-1048',
      lastUpdated: 'Updated after Unit 4 Quiz #3',
      overallMastery: 74,
      targetMastery: 85,
      summaryFeedback:
        'Maya shows strong command of cell structure and energy pathways (88%+ average), but consistently misses multi-step questions involving chromosome segregation in Meiosis II and enzyme rate saturation.',
      topics: [
        {
          id: 'bio-1',
          topic: 'Cell Organelles & Membranes',
          mastery: 94,
          classAvg: 81,
          quizzesCount: 4,
          status: 'Strength',
          lastScore: '19/20',
          feedback: 'Consistent mastery across both diagram identification and osmotic transport problems.',
          resources: [
            {
              id: 'res-b1',
              title: 'Challenge Extension: Osmolarity Case Study in Red Blood Cells',
              type: 'Enrichment Activity',
              duration: '10 min',
              completed: true,
              boost: 2,
            },
          ],
        },
        {
          id: 'bio-2',
          topic: 'Cellular Respiration & ATP',
          mastery: 84,
          classAvg: 76,
          quizzesCount: 3,
          status: 'Strength',
          lastScore: '16/19',
          feedback: 'Solid grasp of glycolysis and Krebs cycle inputs; minor slip on electron transport chain gradient.',
          resources: [
            {
              id: 'res-b2',
              title: 'Quick Diagram Drill: ATP Synthase Proton Gradient',
              type: 'Interactive Diagram',
              duration: '8 min',
              completed: true,
              boost: 3,
            },
          ],
        },
        {
          id: 'bio-3',
          topic: 'DNA Replication & Transcription',
          mastery: 76,
          classAvg: 74,
          quizzesCount: 3,
          status: 'On Track',
          lastScore: '13/17',
          feedback: 'Understands base-pairing rules well; review leading vs. lagging strand Okazaki fragments.',
          resources: [
            {
              id: 'res-b3',
              title: '3D Replication Fork Step-Through & 5-Question Check',
              type: 'Micro-Quiz',
              duration: '12 min',
              completed: false,
              boost: 6,
            },
          ],
        },
        {
          id: 'bio-4',
          topic: 'Enzyme Kinetics & pH Curves',
          mastery: 61,
          classAvg: 68,
          quizzesCount: 4,
          status: 'Gap Detected',
          lastScore: '9/15',
          feedback: 'Confuses competitive vs. non-competitive inhibition on Vmax reaction rate graphs.',
          resources: [
            {
              id: 'res-b4a',
              title: 'Visual Guide: Reading Enzyme Rate vs. Substrate Graphs',
              type: 'Concept Walkthrough',
              duration: '9 min',
              completed: false,
              boost: 8,
            },
            {
              id: 'res-b4b',
              title: 'Practice Pack: 6 Graph Interpretation Problems with Hints',
              type: 'Targeted Practice',
              duration: '14 min',
              completed: false,
              boost: 7,
            },
          ],
        },
        {
          id: 'bio-5',
          topic: 'Meiosis & Chromosome Crossing',
          mastery: 52,
          classAvg: 62,
          quizzesCount: 3,
          status: 'Priority Gap',
          lastScore: '8/16',
          feedback: 'Mixes up homologous chromosome separation (Anaphase I) with sister chromatid separation (Anaphase II).',
          resources: [
            {
              id: 'res-b5a',
              title: 'Interactive Simulation: Drag-and-Drop Chromosome Stages',
              type: 'Hands-On Lab',
              duration: '12 min',
              completed: false,
              boost: 10,
            },
            {
              id: 'res-b5b',
              title: 'Side-by-Side Comparison Sheet: Mitosis vs. Meiosis I & II',
              type: 'Annotated Cheat Sheet',
              duration: '7 min',
              completed: false,
              boost: 8,
            },
          ],
        },
      ],
    },
    algebra: {
      id: 'algebra',
      name: 'Algebra II — Quadratics & Functions',
      code: 'MTH-301',
      studentName: 'Maya Lin',
      studentId: 'STU-1048',
      lastUpdated: 'Updated after Midterm Checkpoint',
      overallMastery: 78,
      targetMastery: 85,
      summaryFeedback:
        'Maya excels at factoring trinomials and graphing standard parabolas, but needs targeted practice completing the square when the leading coefficient a > 1 and interpreting complex roots.',
      topics: [
        {
          id: 'alg-1',
          topic: 'Factoring Quadratic Trinomials',
          mastery: 92,
          classAvg: 83,
          quizzesCount: 5,
          status: 'Strength',
          lastScore: '14/15',
          feedback: 'Fast and accurate factoring across difference of squares and grouping methods.',
          resources: [
            {
              id: 'res-a1',
              title: 'Bonus Puzzle: Higher-Degree Polynomial Factoring',
              type: 'Challenge Set',
              duration: '10 min',
              completed: true,
              boost: 2,
            },
          ],
        },
        {
          id: 'alg-2',
          topic: 'Vertex Form & Parabola Shifts',
          mastery: 86,
          classAvg: 79,
          quizzesCount: 4,
          status: 'Strength',
          lastScore: '13/15',
          feedback: 'Accurately identifies vertex (h, k) and axis of symmetry from equations and graphs.',
          resources: [
            {
              id: 'res-a2',
              title: 'Quick Slider Activity: Vertical Stretch & Reflection',
              type: 'Interactive Graph',
              duration: '8 min',
              completed: true,
              boost: 3,
            },
          ],
        },
        {
          id: 'alg-3',
          topic: 'Quadratic Formula & Discriminant',
          mastery: 75,
          classAvg: 72,
          quizzesCount: 3,
          status: 'On Track',
          lastScore: '9/12',
          feedback: 'Sets up formula correctly; watch negative sign errors under the radical (b² - 4ac).',
          resources: [
            {
              id: 'res-a3',
              title: 'Error-Spotting Drill: 5 Discriminant Sign Traps',
              type: 'Micro-Quiz',
              duration: '10 min',
              completed: false,
              boost: 7,
            },
          ],
        },
        {
          id: 'alg-4',
          topic: 'Completing the Square (a > 1)',
          mastery: 58,
          classAvg: 64,
          quizzesCount: 3,
          status: 'Priority Gap',
          lastScore: '7/12',
          feedback: 'Forgets to factor out the leading coefficient before adding (b/2)² to both sides.',
          resources: [
            {
              id: 'res-a4a',
              title: 'Visual Area-Model Tile Guide: Completing the Square',
              type: 'Step-by-Step Guide',
              duration: '11 min',
              completed: false,
              boost: 10,
            },
            {
              id: 'res-a4b',
              title: 'Guided Practice: 5 Step-Checked Equations (a > 1)',
              type: 'Targeted Practice',
              duration: '15 min',
              completed: false,
              boost: 9,
            },
          ],
        },
      ],
    },
  },
  teacherView: {
    teacherName: 'Mr. Marcus Davis',
    className: 'Period 3 • Honors Biology (32 Students)',
    termLabel: 'Unit 4: Cell Division & Biochemistry',
    classMetrics: [
      { label: 'Class Topic Average', value: '74%', delta: '+6% vs Unit 3', tone: 'ink' },
      { label: 'Validated Weak Topics', value: '2 Topics', delta: 'Meiosis II & Enzymes', tone: 'red' },
      { label: 'Students w/ Critical Gap', value: '9 Students', delta: 'Clustered into 2 groups', tone: 'amber' },
      { label: 'Active Interventions', value: '14 Logged', delta: '86% showing progress', tone: 'mint' },
    ],
    classTopicData: [
      { topic: 'Cell Organelles', shortName: 'Organelles', avgMastery: 88, studentsBelow70: 2, status: 'Strong' },
      { topic: 'Cell Respiration', shortName: 'Respiration', avgMastery: 79, studentsBelow70: 5, status: 'Healthy' },
      { topic: 'DNA Replication', shortName: 'DNA Rep.', avgMastery: 74, studentsBelow70: 7, status: 'Watch' },
      { topic: 'Enzyme Kinetics', shortName: 'Enzymes', avgMastery: 63, studentsBelow70: 12, status: 'Class Gap' },
      { topic: 'Meiosis I & II', shortName: 'Meiosis', avgMastery: 56, studentsBelow70: 15, status: 'Priority Gap' },
    ],
    studentRoster: [
      {
        id: 'stu-1',
        name: 'Maya Lin',
        overall: 74,
        weakestTopic: 'Meiosis & Chromosome Crossing (52%)',
        secondaryGap: 'Enzyme Kinetics (61%)',
        strength: 'Cell Organelles (94%)',
        trend: '+12%',
        status: 'Intervention Active',
      },
      {
        id: 'stu-2',
        name: 'Liam O’Connor',
        overall: 66,
        weakestTopic: 'Meiosis & Chromosome Crossing (48%)',
        secondaryGap: 'DNA Replication (62%)',
        strength: 'Cell Organelles (85%)',
        trend: '+8%',
        status: 'Needs Check-in',
      },
      {
        id: 'stu-3',
        name: 'Aisha Patel',
        overall: 69,
        weakestTopic: 'Enzyme Kinetics & pH Curves (54%)',
        secondaryGap: 'Cell Respiration (65%)',
        strength: 'DNA Replication (89%)',
        trend: '+15%',
        status: 'Intervention Active',
      },
      {
        id: 'stu-4',
        name: 'Noah Takahashi',
        overall: 61,
        weakestTopic: 'Meiosis & Chromosome Crossing (45%)',
        secondaryGap: 'Enzyme Kinetics (57%)',
        strength: 'Cell Organelles (80%)',
        trend: '+5%',
        status: 'Needs Check-in',
      },
    ],
    initialInterventions: [
      {
        id: 'int-1',
        date: 'Oct 27',
        student: 'Maya Lin & Liam O’Connor',
        topic: 'Meiosis & Chromosome Crossing',
        type: 'Small-Group Mini-Lesson (15m)',
        outcome: 'In Progress • Assigned Spindle Sort Lab',
        note: 'Reviewed homologous vs. sister chromatid separation using color-coded pipe cleaners.',
      },
      {
        id: 'int-2',
        date: 'Oct 24',
        student: 'Aisha Patel',
        topic: 'Enzyme Kinetics & pH Curves',
        type: 'Targeted Practice Pack',
        outcome: '+14% on Exit Ticket Retake',
        note: 'Completed visual Vmax graph walkthrough; correctly distinguished competitive inhibitors.',
      },
      {
        id: 'int-3',
        date: 'Oct 21',
        student: 'Whole Class (15 Students)',
        topic: 'Cellular Respiration & ATP',
        type: 'Warm-up Concept Check',
        outcome: 'Class Avg rose from 71% → 79%',
        note: 'Used 8-minute ATP proton gradient diagram drill at start of Tuesday lab.',
      },
    ],
  },
};

export const featuresContent = {
  sectionLabel: 'Page 04 • Core Capabilities & Roadmap',
  headline: 'Built like a thoughtful tutor, organized like your best notebook',
  subheadline:
    'Every feature is designed to reduce cognitive overload and turn assessment data into immediate, practical next steps.',
  features: [
    {
      id: 'feat-dashboard',
      number: 'Card 01',
      title: 'Topic-Level Student Dashboard',
      status: 'Core Feature',
      isComingSoon: false,
      accent: 'yellow',
      rotation: 'tilt-card-left',
      description:
        'View assessment results and granular topic-by-topic progress for each subject in one calm, readable page—so students always know where they stand.',
      highlights: [
        'Visual mastery bars broken down by syllabus topic',
        'Clear history of quiz scores and recent improvement',
        'Zero clutter—designed to be understood in under 30 seconds',
      ],
    },
    {
      id: 'feat-gap-analysis',
      number: 'Card 02',
      title: 'Automated Gap Analysis Engine',
      status: 'Core Feature',
      isComingSoon: false,
      accent: 'mint',
      rotation: 'tilt-card-right',
      description:
        'Automatically detects both subject strengths and fragile weak topics across quizzes, unit tests, and classroom activities—eliminating manual guesswork.',
      highlights: [
        'Flags recurring topic misconceptions across multiple assessments',
        'Celebrates high-mastery strengths to build learner confidence',
        'Prioritizes the 1–2 highest-impact gaps to tackle first',
      ],
    },
    {
      id: 'feat-recommendations',
      number: 'Card 03',
      title: 'Personalized Feedback & Resources',
      status: 'Core Feature',
      isComingSoon: false,
      accent: 'pink',
      rotation: 'tilt-card-left',
      description:
        'Delivers plain-language diagnostic feedback paired with hand-picked learning resources and micro-activities for every identified gap, organized neatly by topic.',
      highlights: [
        'Bite-sized explanations, interactive drills, and visual guides',
        'Real-time progress tracking per topic as activities are completed',
        'Directly connected to the exact concepts missed on assessments',
      ],
    },
    {
      id: 'feat-teacher-view',
      number: 'Card 04',
      title: 'Teacher Diagnostic & Intervention Log',
      status: 'Core Feature',
      isComingSoon: false,
      accent: 'sky',
      rotation: 'tilt-card-right',
      description:
        'Gives educators instant visual summaries of individual and class-wide learning gaps, plus a built-in log to record, monitor, and evaluate targeted interventions.',
      highlights: [
        'Class gap bar charts & student grouping by shared weak topic',
        '1-click intervention logging (1-on-1, small group, practice pack)',
        'Before-and-after mastery tracking to see which supports work',
      ],
    },
    {
      id: 'feat-coming-soon',
      number: 'Card 05',
      title: 'Study Plans, Smart Reminders & Resource Ratings',
      status: 'Coming Soon',
      isComingSoon: true,
      accent: 'red',
      rotation: 'tilt-card-left',
      description:
        'Our next notebook chapter empowers students to schedule their gap reviews automatically and help curate the most effective study materials.',
      comingSoonItems: [
        {
          badge: 'Coming Soon',
          name: 'Personalized Weekly Study Plans',
          detail: 'Auto-generated 20-minute study blocks tailored to upcoming test dates and open topic gaps.',
        },
        {
          badge: 'Coming Soon',
          name: 'Gentle Study Reminders',
          detail: 'Low-stress nudges before quizzes so students review weak topics early instead of cramming.',
        },
        {
          badge: 'Coming Soon',
          name: 'Student Resource Helpfulness Ratings',
          detail: 'Rate recommended videos, guides, and activities so the best explanations rise to the top.',
        },
      ],
    },
  ],
};

export const goalsContent = {
  sectionLabel: 'Page 05 • Project Evaluation Targets',
  honestyBadge: 'Transparent Project Benchmarks — Evaluated in Student & Teacher Usability Testing',
  headline: 'Designed around measurable human outcomes, not vanity metrics',
  subheadline:
    'LearningPal is guided by five strict usability and educational accuracy targets. We state these openly as our project evaluation goals—the standards our system is engineered and tested against.',
  metrics: [
    {
      id: 'goal-findability',
      value: 90,
      suffix: '%',
      gradeStamp: 'Target: A',
      label: 'Unassisted Student Navigation',
      detail: 'Goal: 90% of students can locate their assessment results and weak topics without external assistance.',
      category: 'Student Autonomy Target',
    },
    {
      id: 'goal-accuracy',
      value: 85,
      suffix: '%',
      gradeStamp: 'Target: A',
      label: 'Teacher-Validated Gap Match',
      detail: 'Goal: 85% alignment between automated gap detection and topics independently flagged by subject teachers.',
      category: 'Diagnostic Accuracy Target',
    },
    {
      id: 'goal-helpful',
      value: 80,
      suffix: '%',
      gradeStamp: 'Target: B+',
      label: 'Helpful Resource Rating',
      detail: 'Goal: At least 80% of students rate their personalized topic recommendations and activities as genuinely helpful.',
      category: 'Recommendation Quality Target',
    },
    {
      id: 'goal-teacher-task',
      value: 90,
      suffix: '%',
      gradeStamp: 'Target: A',
      label: 'Teacher Task Completion',
      detail: 'Goal: 90% task success rate for teachers identifying class gaps and logging a targeted student intervention.',
      category: 'Educator Workflow Target',
    },
    {
      id: 'goal-usability',
      value: 4,
      suffix: '/5',
      decimals: 1,
      gradeStamp: '4.0+ ★',
      label: 'Overall System Usability Goal',
      detail: 'Goal: Achieve a minimum 4.0 out of 5 average usability score across both student and teacher evaluation cohorts.',
      category: 'UX Benchmark Target',
    },
  ],
};

export const whoItsForContent = {
  sectionLabel: 'Page 06 • Two Sides of the Same Notebook',
  headline: 'Clarity for learners. Superpowers for educators.',
  subheadline:
    'Whether you are studying for Friday’s unit test or preparing a differentiated review session for 35 students, LearningPal meets you on the page.',
  personas: [
    {
      id: 'students-card',
      role: 'For Students',
      pageStyle: 'Student’s Study Notebook Page',
      tabLabel: 'Tab A • Learner View',
      headline: 'Know your strengths, fix your weak spots, and study in half the time.',
      description:
        'Stop staring at a disappointing test score wondering what went wrong. LearningPal turns every quiz into a personal roadmap showing which topics you’ve already mastered and which ones need a 15-minute tune-up.',
      benefits: [
        'See all your subject assessments and topic mastery scores in one place',
        'Skip re-reading chapters you already know at 90%+ mastery',
        'Get bite-sized explanations and practice activities matched to your exact gaps',
        'Watch your topic bars fill up as you complete recommended activities',
      ],
      previewHeader: 'Maya’s Thursday Study Checklist (22 mins total)',
      previewItems: [
        { text: 'Skip Cell Organelles review (94% Mastered!)', done: true, tag: 'Saved 45m' },
        { text: 'Complete Meiosis II Spindle Sort Simulation (12m)', done: true, tag: '+10% Mastery' },
        { text: 'Try 5 Enzyme Rate Graph Problems with Hints (10m)', done: false, tag: 'Up Next' },
      ],
      ctaText: 'Open Student Demo Above',
      targetMode: 'student',
    },
    {
      id: 'teachers-card',
      role: 'For Teachers',
      pageStyle: 'Teacher’s Gradebook & Planner Page',
      tabLabel: 'Tab B • Educator View',
      headline: 'Spot class-wide misconceptions in seconds and give targeted support.',
      description:
        'You don’t need another complex spreadsheet. LearningPal translates quiz results into clean visual topic summaries so you can pull the right 5 students for a quick mini-lesson and track their rebound.',
      benefits: [
        'Instant visual charts of individual and whole-class learning gaps by topic',
        'Automatically group students who share the same misconception',
        'Log 1-on-1 check-ins, small-group reviews, or assigned resources in seconds',
        'Monitor post-intervention mastery growth across the semester',
      ],
      previewHeader: 'Mr. Davis’s Friday Lab Grouping Plan',
      previewItems: [
        { text: 'Table 1 (5 students): 12-min Meiosis II pipe-cleaner walkthrough', done: true, tag: 'Logged' },
        { text: 'Table 2 (4 students): Guided Enzyme Vmax graph interpretation', done: true, tag: 'Logged' },
        { text: 'Tables 3–6 (23 students): Self-paced topic enrichment lab', done: true, tag: 'Ready' },
      ],
      ctaText: 'Open Teacher Demo Above',
      targetMode: 'teacher',
    },
  ],
};

export const finalCtaContent = {
  eyebrow: 'Ready to Turn the Page?',
  headline: 'Start your first page toward smarter, targeted learning.',
  subheadline:
    'No more generic study packets or mystery test scores. Explore the interactive Student and Teacher notebooks right now and see how LearningPal makes every study session count.',
  primaryCta: 'Launch Interactive Student Demo',
  secondaryCta: 'Launch Teacher Gradebook Demo',
  footnote: 'Free academic pilot preview • Works across desktop, tablet, and mobile browsers',
};

export const footerContent = {
  copyright: '© 2026 LearningPal Project. Crafted with care for students and teachers.',
  backCoverNote: 'Composition Book • Wide Ruled • 100 Pages • Learning Diagnostics & Support Edition',
  links: [
    {
      group: 'Notebook Sections',
      items: [
        { label: 'The Problem', href: '#problem' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Interactive Demo', href: '#demo' },
        { label: 'Features & Roadmap', href: '#features' },
      ],
    },
    {
      group: 'Evaluation & Audience',
      items: [
        { label: 'Project Target Goals', href: '#goals' },
        { label: 'For Students', href: '#who-its-for' },
        { label: 'For Teachers', href: '#who-its-for' },
        { label: 'Back to Top ↑', href: '#top' },
      ],
    },
  ],
  referenceTable: [
    { metric: 'Strength Threshold', formula: '≥ 80% Topic Mastery', action: 'Enrichment & Spaced Review' },
    { metric: 'Developing Zone', formula: '70% – 79% Mastery', action: 'Quick Concept Check' },
    { metric: 'Targeted Learning Gap', formula: '< 70% Topic Mastery', action: 'Guided Resource + Practice' },
    { metric: 'Priority Intervention', formula: '< 60% across 2+ Quizzes', action: 'Teacher Check-in + Lab' },
  ],
};


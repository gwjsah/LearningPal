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
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Interactive Demo', href: '#demo' },
];

export const heroContent = {
  eyebrow: 'Topic-Level Clarity • Notebook Simplicity',
  headlinePrefix: 'Find ',
  headlineHighlight: 'what to study',
  headlineSuffix: ' — skip what you already know.',
  subheadline:
    'LearningPal turns everyday quiz results into topic-level gap diagnostics and short practice activities for students and teachers.',
  primaryCta: 'Create Free Notebook',
  secondaryCta: 'See Interactive Demo',
  marginNote: 'Study the gap, master the topic!',
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

export const howItWorksContent = {
  sectionLabel: 'Page 01 • The Workflow',
  headline: 'From quiz scores to a clear study plan',
  subheadline:
    'Three simple steps connect test results to targeted practice and measurable progress.',
  steps: [
    {
      number: '01',
      verb: 'Ingest',
      title: 'Connect Quiz Results',
      badge: 'Quizzes & Unit Tests',
      description:
        'Import everyday classroom quizzes and unit tests tagged by curriculum topic—no extra testing required.',
      handNote: 'No extra tests required',
    },
    {
      number: '02',
      verb: 'Pinpoint',
      title: 'Uncover Specific Gaps',
      badge: 'Topic Gap Engine',
      description:
        'Break raw percentages down by topic to separate confident strengths from critical misconceptions.',
      handNote: 'Spots recurring misconceptions',
    },
    {
      number: '03',
      verb: 'Practice',
      title: 'Targeted Study & Growth',
      badge: '10-Minute Activities',
      description:
        'Receive bite-sized practice activities matched to weak topics and watch your mastery scores climb.',
      handNote: 'Watch mastery bars climb',
    },
  ],
};

export const demoContent = {
  sectionLabel: 'Page 02 • Interactive Notebook',
  headline: 'Try the interactive notebook',
  subheadline:
    'Flip between the Student Notebook and Teacher Gradebook to see live gap diagnostics and targeted practice in action.',
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

export const finalCtaContent = {
  eyebrow: 'Ready to Turn the Page?',
  headline: 'Study what actually needs your attention.',
  subheadline:
    'Join students and teachers using topic-level diagnostics to focus their time and study smarter.',
  primaryCta: 'Create Free Notebook',
  secondaryCta: 'Log In to Existing Account',
  footnote: 'Free for students and teachers • Works on phone, tablet, and desktop',
};

export const footerContent = {
  copyright: '© 2026 LearningPal. Built with care for students and educators.',
  backCoverNote: 'Composition Book • Wide Ruled • Learning Diagnostics & Support Edition',
  links: [
    {
      group: 'Notebook Sections',
      items: [
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Interactive Demo', href: '#demo' },
        { label: 'Back to Top ↑', href: '#top' },
      ],
    },
    {
      group: 'Account',
      items: [
        { label: 'Create Account', href: '/signup' },
        { label: 'Log In', href: '/login' },
      ],
    },
  ],
};


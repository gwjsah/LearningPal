const fs = require('fs');
const path = require('path');

// 1. Lists definition
const lists = [
  { id: 'list_info', name: 'Info', pos: 1000 },
  { id: 'list_backlog', name: 'Backlog', pos: 2000 },
  { id: '6ae1721c567255c8a4d6d988', name: 'To Do', pos: 3000 }, // existing list
  { id: '6ae1721c567255c8a4d6d989', name: 'Doing', pos: 3500 }, // existing list preserved
  { id: 'list_in_progress', name: 'In Progress', pos: 4000 },
  { id: 'list_in_review', name: 'In Review / Testing', pos: 5000 },
  { id: '6ae1721c567255c8a4d6d98a', name: 'Done', pos: 6000 } // existing list
];

// 2. Labels definition
const labels = [
  // Priority
  { id: 'lbl_prio_must', name: 'Must-have', color: 'red' },
  { id: 'lbl_prio_should', name: 'Should-have', color: 'orange' },
  { id: 'lbl_prio_nice', name: 'Nice-to-have', color: 'green' },

  // Area
  { id: 'lbl_area_fe', name: 'Frontend', color: 'sky' },
  { id: 'lbl_area_be', name: 'Backend', color: 'purple' },
  { id: 'lbl_area_db', name: 'Database', color: 'lime' },
  { id: 'lbl_area_des', name: 'Design', color: 'pink' },
  { id: 'lbl_area_test', name: 'Testing', color: 'yellow' },
  { id: 'lbl_area_docs', name: 'Docs', color: 'black' },

  // Phase (shades of blue/purple)
  { id: 'lbl_phase_0', name: 'Phase 0', color: 'blue' },
  { id: 'lbl_phase_1', name: 'Phase 1', color: 'sky' },
  { id: 'lbl_phase_2', name: 'Phase 2', color: 'blue' },
  { id: 'lbl_phase_3', name: 'Phase 3', color: 'purple' },
  { id: 'lbl_phase_4', name: 'Phase 4', color: 'purple' },
  { id: 'lbl_phase_5', name: 'Phase 5', color: 'blue' },
  { id: 'lbl_phase_6', name: 'Phase 6', color: 'purple' },
  { id: 'lbl_phase_7', name: 'Phase 7', color: 'sky' }
];

// Helper to find label IDs
function getLabelIds(prio, area, phase) {
  const result = [];
  if (prio) {
    const l = labels.find(x => x.name === prio);
    if (l) result.push(l.id);
  }
  if (area) {
    const l = labels.find(x => x.name === area);
    if (l) result.push(l.id);
  }
  if (phase) {
    const l = labels.find(x => x.name === phase);
    if (l) result.push(l.id);
  }
  return result;
}

// 3. Info cards
const infoCards = [
  {
    title: 'Project Overview',
    listId: 'list_info',
    desc: `**Pain Point:** Students struggle to identify specific learning gaps across topics, while teachers lack aggregated diagnostic data to deliver timely, targeted interventions.\n\n**Solution:** LearningPal is a data-driven learning support platform analyzing quiz performance by topic, pinpointing strengths and weaknesses, delivering personalized feedback and resource recommendations, and enabling teacher intervention logging.\n\n**Roles:**\n- **Student:** Takes assessments, reviews topic-level mastery, reads feedback, and accesses recommended materials.\n- **Teacher:** Inspects class/student gap analytics, overrides automated grades, manages assessments/resources, and records interventions.\n- **Admin:** Approves teacher registrations and oversees system accounts.`,
    checklists: [
      {
        name: 'Key Pillars',
        items: [
          'Review project scope and target stakeholder needs',
          'Align feature deliveries across agile sprints',
          'Validate privacy and data compliance for academic records'
        ]
      }
    ]
  },
  {
    title: 'Tech Stack and Architecture',
    listId: 'list_info',
    desc: `**Frontend:** React (SPA), Tailwind CSS for styling, Recharts for analytics data visualization, React Router, Context API for state management.\n\n**Backend:** Java Spring Boot following Controller → Service → Repository layered architecture, Spring Security with stateless JWT.\n\n**Database:** MySQL relational database with JPA/Hibernate ORM and foreign-key constraints.\n\n**Security:** Stateless JWT authentication, BCrypt password hashing, and role-based endpoint authorization.`,
    checklists: [
      {
        name: 'Architecture Layers',
        items: [
          'Verify Controller layer handles HTTP routing and DTO validation',
          'Enforce business logic isolation within the Service layer',
          'Ensure Repository layer encapsulates JPA / database queries',
          'Maintain modular and reusable React UI components'
        ]
      }
    ]
  },
  {
    title: 'SMART Objectives',
    listId: 'list_info',
    desc: `**Core Measurable Targets:**\n1. **Student Module:** Students view assessment results and topic progress for 1 pilot subject; ≥90% of student testers find them unassisted.\n2. **Gap Analysis Engine:** Automated topic-level analysis weak-topic detection matches teacher-validated results in ≥85% of cases on 30+ student records.\n3. **Feedback & Recommendations:** Personalized feedback/resources per gap; ≥80% of student testers rate them helpful, with gap progress tracking.\n4. **Teacher Module:** Dashboard with charts and intervention log; ≥90% of teacher testers complete key tasks.\n5. **Stretch Usability:** Usability rating ≥4.0/5.0 across study plans, reminders, and ratings.`,
    checklists: [
      {
        name: 'Evaluation Metrics',
        items: [
          'Track 90% unassisted navigation rate on student results',
          'Achieve 85% algorithmic gap match on 30+ validation records',
          'Gather 80% helpfulness rating on personalized feedback',
          'Verify 90% teacher task completion rate during usability tests',
          'Reach 4.0/5.0 overall usability score on stretch modules'
        ]
      }
    ]
  },
  {
    title: 'Rules and Decisions',
    listId: 'list_info',
    desc: `**Core System Rules:**\n- **Grading & Gaps:** In-app quizzes are auto-graded. Teachers can override any grade. Gap analysis always uses the final score (teacher score if present, otherwise auto score).\n- **Teacher Signups:** Teacher accounts require explicit Admin approval before they can authenticate.\n- **Password Policy:** Passwords require 8 to 72 characters, containing at least one letter and one number.\n- **AI Grading Fallback:** Essay AI grading is nice-to-have. Core system functions independently. AI scores remain "pending teacher review"; failures route to a manual grading queue.`,
    checklists: [
      {
        name: 'Rule Enforcement',
        items: [
          'Ensure gap calculations read effective final scores',
          'Prevent unapproved teacher logins at auth filter',
          'Validate password constraints on client and server',
          'Queue failed LLM calls for manual grading review'
        ]
      }
    ]
  },
  {
    title: 'Git Workflow',
    listId: 'list_info',
    desc: `**Branching & Code Quality:**\n- **Main Branch:** Protected; contains reviewed, stable, working code only.\n- **Feature Branches:** Each member creates a personal branch (e.g., \`feature/name-task\` or \`name/dev\`).\n- **Pull Requests:** Open a PR to merge into \`main\` with at least one peer code review.\n- **Secrets Management:** NEVER commit secrets or local build outputs. Keep \`application.properties\`, \`.env\`, \`node_modules/\`, and \`target/\` in \`.gitignore\`.`,
    checklists: [
      {
        name: 'Workflow Steps',
        items: [
          'Branch out from latest main',
          'Verify gitignore ignores secrets and environment files',
          'Test code locally before pushing',
          'Create Pull Request with descriptive summary',
          'Obtain peer approval before merging into main'
        ]
      }
    ]
  },
  {
    title: 'Definition of Done',
    listId: 'list_info',
    desc: `**Standard for Completion:**\nA user story or task is marked Done when:\n1. It functions end-to-end according to acceptance criteria.\n2. It is manually verified and unit-tested where applicable.\n3. Zero secrets, API keys, or credentials are committed.\n4. Code complies with formatting and architectural guidelines.\n5. Peer code review is completed and approved on GitHub.\n6. Branch is cleanly merged into \`main\`.`,
    checklists: [
      {
        name: 'DoD Checklist',
        items: [
          'Implement end-to-end functionality per acceptance criteria',
          'Execute manual verification and automated test suite',
          'Confirm no sensitive secrets or keys are committed',
          'Obtain peer code review approval on pull request',
          'Merge pull request successfully into main branch'
        ]
      }
    ]
  }
];

// 4. Task Cards
const taskCards = [
  // --- DONE ---
  {
    title: '[P0] Notebook-themed landing page (React + Tailwind)',
    listId: '6ae1721c567255c8a4d6d98a', // Done
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 0',
    desc: `**Goal:** Build a clean, welcoming landing page styled with a notebook aesthetic using React and Tailwind CSS.\n\n**Acceptance Criteria:** The page displays product highlights, role overviews, and navigation buttons to login/signup. Responsive on mobile and desktop viewports.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Design notebook-style paper lines and binder UI accents in Tailwind',
          'Build responsive hero section with call-to-action buttons',
          'Add feature highlight cards explaining student and teacher benefits',
          'Link navigation CTAs to Login and Signup routes',
          'Verify responsiveness across tablet and mobile viewports'
        ]
      }
    ]
  },

  // --- IN PROGRESS (Auth cards) ---
  {
    title: '[P0] Signup/login backend (JWT, BCrypt, role-based security, CORS)',
    listId: 'list_in_progress',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 0',
    desc: `**Goal:** Implement secure authentication in Spring Boot using JWT, BCrypt, and Spring Security.\n\n**Acceptance Criteria:** Issues signed JWT tokens upon valid credentials. Enforces role-based endpoint permissions (Student, Teacher, Admin) and configures CORS headers.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Configure Spring Security filter chain and CORS policy',
          'Implement JWT utility service for token generation and validation',
          'Create authentication controller for signup and login endpoints',
          'Hash user passwords using BCryptPasswordEncoder',
          'Enforce role-based access checks for Student, Teacher, and Admin'
        ]
      }
    ]
  },
  {
    title: '[P0] Signup/login frontend (Login, Signup, AuthContext, ProtectedRoute)',
    listId: 'list_in_progress',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 0',
    desc: `**Goal:** Build client-side authentication screens, state management, and route protection.\n\n**Acceptance Criteria:** Users can sign up and log in. Tokens are stored securely. Protected routes redirect unauthorized users to the login screen.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create AuthContext to store session token and user role state',
          'Build responsive Login form with client-side validation',
          'Build Signup form with role selector (Student/Teacher)',
          'Implement ProtectedRoute wrapper checking authentication status',
          'Handle logout and token expiration smoothly'
        ]
      }
    ]
  },
  {
    title: '[P0] Password rule: at least one letter and one number (backend and frontend)',
    listId: 'list_in_progress',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 0',
    desc: `**Goal:** Enforce password complexity rules across both client and server.\n\n**Acceptance Criteria:** Passwords must be 8–72 characters and contain at least one letter and one number. Invalid attempts return clear, actionable feedback.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Define regex validation rule: 8 to 72 chars, >= 1 letter, >= 1 digit',
          'Implement backend Bean Validation annotation on user DTOs',
          'Add real-time client validation feedback in Signup form',
          'Write unit tests verifying valid and edge-case invalid passwords'
        ]
      }
    ]
  },
  {
    title: '[P0] Admin approval for teacher signups (admin seed account, pending list, approve/reject, admin page)',
    listId: 'list_in_progress',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 0',
    desc: `**Goal:** Restrict teacher logins until approved by an administrator.\n\n**Acceptance Criteria:** Teachers sign up with status PENDING and cannot log in. Admins can view pending teachers, approve or reject them, and see an updated roster. Seed initial admin account.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Seed default admin account on database startup',
          'Set teacher account status to PENDING upon registration',
          'Block login attempts for unapproved teacher accounts',
          'Build admin endpoints to list, approve, and reject teacher accounts',
          'Create Admin dashboard page to manage pending approvals'
        ]
      }
    ]
  },

  // --- TO DO (Remaining Phase 0 Foundation cards) ---
  {
    title: '[P0] Set up repo, branches, and .gitignore (no secrets)',
    listId: '6ae1721c567255c8a4d6d988', // To Do
    prio: 'Must-have',
    area: 'Docs',
    phase: 'Phase 0',
    desc: `**Goal:** Initialize project repositories, git branches, and ignore rules.\n\n**Acceptance Criteria:** Repo is structured for frontend and backend. Secrets, build folders, and environments are ignored. Branching policy documented in README.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Configure .gitignore for node_modules, target, .env, and properties',
          'Create initial frontend and backend directory scaffold',
          'Set up main and development branch protection rules',
          'Document branch conventions and setup steps in README'
        ]
      }
    ]
  },
  {
    title: '[P0] React Router and frontend folder structure',
    listId: '6ae1721c567255c8a4d6d988', // To Do
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 0',
    desc: `**Goal:** Structure the React application with clean folder hierarchy and declarative client routing.\n\n**Acceptance Criteria:** React Router v6 configured with modular paths for landing, auth, student, teacher, and admin layouts.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Organize folders into components, pages, services, context, and assets',
          'Install and configure React Router v6',
          'Define route paths for Student, Teacher, and Admin modules',
          'Create 404 Not Found error page layout'
        ]
      }
    ]
  },
  {
    title: '[P0] Mock data (JSON shaped like the future API responses) and service layer',
    listId: '6ae1721c567255c8a4d6d988', // To Do
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 0',
    desc: `**Goal:** Provide mock JSON services enabling frontend development ahead of backend integration.\n\n**Acceptance Criteria:** Frontend service modules return realistic JSON mock responses mirroring final API schema for assessments, results, gaps, and resources.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create mock JSON datasets for assessments, gaps, and resources',
          'Build mock service layer mimicking asynchronous API latency',
          'Provide toggle to switch between mock service and live Axios client',
          'Verify mock data adheres to backend contract specifications'
        ]
      }
    ]
  },
  {
    title: '[P0] Spring Boot project setup and MySQL connection',
    listId: '6ae1721c567255c8a4d6d988', // To Do
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 0',
    desc: `**Goal:** Initialize Spring Boot application with MySQL connectivity and JPA configuration.\n\n**Acceptance Criteria:** Spring Boot starts cleanly, connects to local/Docker MySQL, and executes database health checks without errors.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Initialize Spring Boot project with Web, Security, JPA, and MySQL dependencies',
          'Configure application.properties datasource and Hibernate dialect',
          'Set up Docker Compose file for local MySQL instance',
          'Verify clean startup and connection pool initialization'
        ]
      }
    ]
  },
  {
    title: '[P0] Database schema design (users, subjects, topics, assessments, questions, results, resources, interventions)',
    listId: '6ae1721c567255c8a4d6d988', // To Do
    prio: 'Must-have',
    area: 'Database',
    phase: 'Phase 0',
    desc: `**Goal:** Design relational database schema supporting users, topic hierarchy, testing, analysis, and interventions.\n\n**Acceptance Criteria:** Entity models and SQL migration scripts define all core tables with proper primary keys, foreign keys, and indexes.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Design ER diagram covering all 8 core entities',
          'Create JPA Entity classes with proper relationships and cascade rules',
          'Add database indexes on student_id, topic_id, and assessment_id',
          'Validate schema creation and foreign key constraints on MySQL'
        ]
      }
    ]
  },
  {
    title: '[P0] API contract: list of endpoints and JSON shapes shared by frontend and backend',
    listId: '6ae1721c567255c8a4d6d988', // To Do
    prio: 'Must-have',
    area: 'Docs',
    phase: 'Phase 0',
    desc: `**Goal:** Standardize API contracts and DTO shapes between frontend and backend teams.\n\n**Acceptance Criteria:** Comprehensive API documentation detailing HTTP methods, URL routes, request payloads, response schemas, and status codes.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Draft OpenAPI / Swagger specification or Markdown API guide',
          'Define shared request and response DTO schemas for all roles',
          'Specify standard error response format and HTTP status codes',
          'Review contract with frontend and backend developers'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 1: Student Module (Objective 1) ---
  {
    title: '[P1] Student dashboard',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 1',
    desc: `**Goal:** Build the primary student landing view summarizing progress and recent assessments.\n\n**Acceptance Criteria:** Displays quick stats, recent quiz scores, active topic alerts, and navigation links. Meets Objective 1 navigation clarity.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create student layout with persistent sidebar and top navigation',
          'Display overview cards for overall mastery and completed quizzes',
          'Render quick-action cards for pending assessments and gap reviews',
          'Ensure responsive layout across mobile and desktop devices'
        ]
      }
    ]
  },
  {
    title: '[P1] Assessments list',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 1',
    desc: `**Goal:** Display available, in-progress, and completed assessments for the pilot subject.\n\n**Acceptance Criteria:** Students can filter by status and view topic tags, duration, question count, and past score badges.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build assessment card grid with status badges (Available, Completed)',
          'Implement subject and topic filtering controls',
          'Display assessment metadata including estimated duration and question count',
          'Provide clear "Start Quiz" and "Review Results" call-to-action buttons'
        ]
      }
    ]
  },
  {
    title: '[P1] Take assessment (multiple-choice)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 1',
    desc: `**Goal:** Provide an intuitive quiz-taking interface for multiple-choice questions.\n\n**Acceptance Criteria:** Question pagination/navigation, option selection, answer persistence, auto-grading submission, and confirmation dialog.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build interactive question viewer with radio button option selectors',
          'Implement question tracker sidebar allowing jumping between questions',
          'Add submission modal confirming all questions are answered',
          'Send answers to auto-grading endpoint upon submission'
        ]
      }
    ]
  },
  {
    title: '[P1] Results and explanations page',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 1',
    desc: `**Goal:** Show post-assessment score breakdown with detailed answer explanations.\n\n**Acceptance Criteria:** Displays overall score, topic-by-topic breakdown, correct answers, and feedback. Directly supports Objective 1.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Render score banner with percentage and mastery level',
          'Display topic-level performance score breakdown',
          'Show question-by-question review highlighting correct and chosen answers',
          'Add clear button navigating directly to topic recommendations'
        ]
      }
    ]
  },
  {
    title: '[P1] Topic progress page',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 1',
    desc: `**Goal:** Render cumulative student mastery across all topics in the pilot subject.\n\n**Acceptance Criteria:** Visual progress bars, mastery level indicators (Strong/Developing/Gap), and links to drill into specific topic details. Ties to Objective 1.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build topic list view with color-coded mastery progress bars',
          'Categorize topics into Strengths, Developing, and Learning Gaps',
          'Provide interactive drill-down button to view detailed topic feedback',
          'Add summary indicators showing percentage of syllabus mastered'
        ]
      }
    ]
  },
  {
    title: '[P1] Usability check: students find results without help (90% target)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Testing',
    phase: 'Phase 1',
    desc: `**Goal:** Conduct usability testing verifying students locate results and progress unassisted.\n\n**Acceptance Criteria:** Objective 1 validation: at least 90% of student testers find assessment results and topic progress without staff intervention.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Formulate unassisted test scenario and task instruction sheet',
          'Recruit student participants representing diverse technical familiarity',
          'Observe and record navigation completion rate without prompting',
          'Compile pass/fail metrics and confirm meeting the >=90% target'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 2: Gap Analysis Engine (Objective 2) ---
  {
    title: '[P2] Define mastery score formula and strength/gap thresholds',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 2',
    desc: `**Goal:** Establish mathematical formulas and threshold constants for gap detection.\n\n**Acceptance Criteria:** Formulate weighted topic scoring and clear threshold boundaries (e.g., <70% = Gap, 70-84% = Developing, >=85% = Strength). Documented for implementation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Consult pedagogical rules to establish gap threshold percentage',
          'Define formula incorporating question difficulty weights if applicable',
          'Document boundary rules for Strengths, Moderate, and Gaps',
          'Obtain team consensus and finalize formula specification'
        ]
      }
    ]
  },
  {
    title: '[P2] Implement gap analysis in the Spring service layer',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 2',
    desc: `**Goal:** Code the algorithmic gap analysis engine in Spring service layer.\n\n**Acceptance Criteria:** Aggregates topic scores per student using effective final scores (teacher override if present, else auto score) and categorizes gaps accurately.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Implement GapAnalysisService with topic aggregation logic',
          'Enforce rule: use teacher override score when present, else auto score',
          'Map calculated scores to mastery tiers (Strength / Moderate / Gap)',
          'Persist and return analyzed gap records per student'
        ]
      }
    ]
  },
  {
    title: '[P2] Unit tests (JUnit) for the analysis logic',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Testing',
    phase: 'Phase 2',
    desc: `**Goal:** Ensure comprehensive JUnit test coverage for the gap calculation engine.\n\n**Acceptance Criteria:** Unit tests verify correct categorization across boundary conditions, missing scores, multiple attempts, and teacher override precedence.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Write JUnit tests for edge case scores (exact threshold boundaries)',
          'Test teacher override score precedence over automatic quiz scores',
          'Test empty and incomplete assessment scenarios',
          'Verify mock repository isolation with Mockito'
        ]
      }
    ]
  },
  {
    title: '[P2] Build a validation set of 30+ student records with teacher-labeled weak topics',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Testing',
    phase: 'Phase 2',
    desc: `**Goal:** Create benchmark ground-truth dataset of 30+ student records with teacher-verified gaps.\n\n**Acceptance Criteria:** Objective 2 dataset: 30+ realistic student performance records with educator-annotated weak topics ready for automated validation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Synthesize or curate 30+ diverse student assessment attempt histories',
          'Engage domain educator to review and label ground-truth weak topics',
          'Format validation records into structured JSON/SQL test dataset',
          'Validate dataset integrity and ensure complete topic coverage'
        ]
      }
    ]
  },
  {
    title: '[P2] Measure match rate against teacher labels (85% target)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Testing',
    phase: 'Phase 2',
    desc: `**Goal:** Run algorithmic gap analysis on validation dataset and compute match accuracy.\n\n**Acceptance Criteria:** Objective 2 validation: automated engine achieves >=85% match rate compared against teacher-labeled ground-truth records.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Execute gap analysis algorithm against all 30+ validation records',
          'Compare algorithmic gap output against teacher benchmark labels',
          'Calculate precision, recall, and overall percentage agreement',
          'Verify result meets or exceeds the 85% success benchmark'
        ]
      }
    ]
  },
  {
    title: '[P2] Re-run analysis automatically after a teacher grade override',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 2',
    desc: `**Goal:** Trigger real-time gap recalculation whenever a teacher modifies an assessment grade.\n\n**Acceptance Criteria:** Overriding a score immediately re-evaluates the student's topic mastery and updates gap records using the updated teacher score.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Attach post-update event listener or service hook on grade override',
          'Recalculate affected topic scores using the new teacher grade',
          'Update student gap records in database within transactional boundary',
          'Verify topic mastery badges immediately reflect overridden scores'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 3: Feedback and Recommendations (Objective 3) ---
  {
    title: '[P3] Personalized feedback generation per weak topic',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 3',
    desc: `**Goal:** Generate targeted explanatory feedback tailored to each student's specific gap.\n\n**Acceptance Criteria:** Produces clear diagnostic explanations identifying misconception patterns per weak topic, fulfilling Objective 3 prerequisites.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Draft template-based feedback catalog mapped to common mistake patterns',
          'Implement FeedbackService to assemble personalized advice per weak topic',
          'Associate feedback with student gap records',
          'Expose feedback payload through REST API endpoint'
        ]
      }
    ]
  },
  {
    title: '[P3] Resource model, tagged by topic and type',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Database',
    phase: 'Phase 3',
    desc: `**Goal:** Define and seed the learning resource database entities.\n\n**Acceptance Criteria:** Resource entity stores title, URL, description, topic tag, difficulty, and type (article, video, quiz, practice exercise). Seeded with pilot topic data.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Define Resource JPA entity and repository interface',
          'Add topic foreign key and resource type enum tags',
          'Create database migration with initial catalog of learning materials',
          'Verify resource retrieval queries filtered by topic and difficulty'
        ]
      }
    ]
  },
  {
    title: '[P3] Recommendation matching (gap topic to resources and activities)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 3',
    desc: `**Goal:** Implement matching engine linking identified student gaps to optimal remedial materials.\n\n**Acceptance Criteria:** Automatically pairs each student gap with relevant, prioritized resources and practice exercises ordered by effectiveness.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Implement RecommendationService matching weak topics to resources',
          'Prioritize remedial items based on student deficiency severity',
          'Limit recommendations to top curated resources per gap',
          'Write unit tests confirming correct resources returned per topic'
        ]
      }
    ]
  },
  {
    title: '[P3] Topic detail page: feedback, resources, mark as completed',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 3',
    desc: `**Goal:** Build student UI displaying topic-specific diagnostic feedback and recommended materials.\n\n**Acceptance Criteria:** Displays personalized advice, clickable resources, and a toggle enabling students to mark study items as completed. Ties to Objective 3.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build topic detail layout displaying personalized diagnostic advice',
          'Render list of recommended resources with external link badges',
          'Implement "Mark as Completed" checkbox for each resource',
          'Update student topic progress indicator dynamically on completion'
        ]
      }
    ]
  },
  {
    title: '[P3] Progress tracking per identified gap',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 3',
    desc: `**Goal:** Provide visual progress tracking showing student improvement over time on gap topics.\n\n**Acceptance Criteria:** Objective 3 fulfillment: students can view chronological mastery progression and resolved gap indicators following remediation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create gap progress timeline component showing initial vs current score',
          'Display "Gap Resolved" milestone badge when retake score exceeds threshold',
          'Show completion percentage of assigned remedial resources',
          'Verify updates persist across user login sessions'
        ]
      }
    ]
  },
  {
    title: '[P3] Helpfulness survey for student testers (80% target)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Testing',
    phase: 'Phase 3',
    desc: `**Goal:** Administer feedback helpfulness survey to student pilot group.\n\n**Acceptance Criteria:** Objective 3 validation: at least 80% of student testers rate personalized feedback and recommended resources as helpful.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Design 5-point Likert scale survey on resource relevance and clarity',
          'Deploy survey to student cohort following study session',
          'Aggregate responses and calculate helpfulness satisfaction percentage',
          'Verify satisfaction equals or exceeds the 80% benchmark target'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 4: Teacher Module (Objective 4) ---
  {
    title: '[P4] Teacher dashboard with class gap chart (Recharts)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Build teacher dashboard featuring class-wide visual gap analytics using Recharts.\n\n**Acceptance Criteria:** Interactive bar/pie charts display topic mastery distribution, highlighting class-wide weak areas. Meets Objective 4 requirement.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Integrate Recharts library into teacher analytics dashboard',
          'Build class-level topic mastery distribution bar chart',
          'Display alert badges for topics where >30% of class has a gap',
          'Add summary metric tiles (Total Students, Flagged Gaps, Interventions)'
        ]
      }
    ]
  },
  {
    title: '[P4] Student list with filters and gap flags',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Provide searchable student roster highlighting individuals with critical learning gaps.\n\n**Acceptance Criteria:** Teachers can filter students by name, topic gap, or performance tier and view immediate visual gap warning flags.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build searchable and sortable student table view',
          'Add filter dropdowns for topic, mastery status, and intervention status',
          'Render color-coded warning chips for active learning gaps',
          'Add navigation link to individual student detail profiles'
        ]
      }
    ]
  },
  {
    title: '[P4] Student detail: gaps, progress, intervention history',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Detailed individual student view showing gaps, score trajectories, and logged interventions.\n\n**Acceptance Criteria:** Displays comprehensive student diagnostic profile, topic mastery trends, past quiz attempts, and chronological intervention records.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build student profile header with key academic indicators',
          'Display topic mastery breakdown and historical quiz attempt scores',
          'Render timeline feed of past teacher interventions and student notes',
          'Include quick-action button to log a new intervention'
        ]
      }
    ]
  },
  {
    title: '[P4] Grade Review: view auto grades, override with comment',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Create interface for teachers to inspect auto-grades and submit overrides with explanatory notes.\n\n**Acceptance Criteria:** Displays student submission, system auto-grade, editable score input, and required comment field. Overrides update final score.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build grading review screen displaying student answers and system scores',
          'Add score override input with numerical validation bounds',
          'Include mandatory teacher comment / justification text box',
          'Submit override to backend and confirm gap recalculation trigger'
        ]
      }
    ]
  },
  {
    title: '[P4] Interventions: log and monitor',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Enable teachers to record, schedule, and track educational interventions.\n\n**Acceptance Criteria:** Objective 4 core feature: teachers log intervention type (e.g., 1-on-1, remedial group), notes, date, and monitor student post-intervention status.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create modal form to log interventions with type, date, and description',
          'Display active intervention list with status badges (Planned, Completed)',
          'Link logged interventions to specific student gap topics',
          'Provide toggle to mark intervention as completed with outcome notes'
        ]
      }
    ]
  },
  {
    title: '[P4] Assessment manager: question bank with topic tagging, create assessments, record scores per topic',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Teacher tool to manage question bank, author quizzes with topic tags, and review scores.\n\n**Acceptance Criteria:** Teachers create assessments, assign questions tagged by topic, set duration, and view topic-level score distributions.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build question authoring form with options, correct answer, and topic tag',
          'Create assessment builder selecting questions from bank',
          'Set assessment title, instructions, time limit, and active status',
          'Display assessment submission summary with topic score statistics'
        ]
      }
    ]
  },
  {
    title: '[P4] Resource manager',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 4',
    desc: `**Goal:** Teacher portal to curate, edit, and categorize remedial learning resources.\n\n**Acceptance Criteria:** Teachers can add new learning materials, assign topic tags, designate media types, edit existing entries, or delete outdated links.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build resource management table with search and topic filters',
          'Create form to add new resource with URL, topic tag, and resource type',
          'Implement edit modal to update titles, links, and descriptions',
          'Add delete confirmation dialog for removing obsolete resources'
        ]
      }
    ]
  },
  {
    title: '[P4] Teacher task testing (90% target)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Testing',
    phase: 'Phase 4',
    desc: `**Goal:** Conduct structured task-based usability testing with educator participants.\n\n**Acceptance Criteria:** Objective 4 validation: at least 90% of teacher testers successfully complete key workflows (viewing charts, overriding grades, logging interventions).`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Prepare teacher test protocol covering charts, overrides, and interventions',
          'Facilitate testing sessions with educator participants',
          'Record completion success rates for each core teacher task',
          'Verify overall task completion rate meets or exceeds 90% target'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 5: Backend Integration ---
  {
    title: '[P5] Student endpoints (results, progress, feedback)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 5',
    desc: `**Goal:** Implement Spring Boot REST controllers serving student-facing data.\n\n**Acceptance Criteria:** Endpoints deliver assessment results, aggregated topic mastery scores, and personalized feedback/recommendation payloads for authenticated students.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Implement GET /api/student/assessments and submission endpoints',
          'Implement GET /api/student/results/{id} with topic score breakdown',
          'Implement GET /api/student/topics/progress endpoint',
          'Implement GET /api/student/recommendations endpoint',
          'Write integration tests for student REST controllers'
        ]
      }
    ]
  },
  {
    title: '[P5] Teacher endpoints (students, interventions, grading, assessments)',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 5',
    desc: `**Goal:** Implement REST endpoints powering teacher analytics, grading, and management.\n\n**Acceptance Criteria:** Endpoints support class analytics, student roster, grade overrides, intervention CRUD, and assessment authoring operations.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Implement GET /api/teacher/class-summary gap analytics endpoint',
          'Implement GET and PUT /api/teacher/grades/{id}/override with audit notes',
          'Implement CRUD endpoints for /api/teacher/interventions',
          'Implement assessment and question bank management endpoints',
          'Verify teacher endpoints enforce TEACHER or ADMIN authority'
        ]
      }
    ]
  },
  {
    title: '[P5] Replace mock services with real API calls',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Frontend',
    phase: 'Phase 5',
    desc: `**Goal:** Transition frontend data layers from mock JSON to live Spring Boot REST endpoints.\n\n**Acceptance Criteria:** Axios client configured with JWT interceptors; all UI components consume real backend endpoints cleanly without regressions.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Configure Axios client with baseURL and JWT bearer token interceptor',
          'Replace mock student service calls with live HTTP requests',
          'Replace mock teacher and admin calls with live API clients',
          'Verify smooth loading states and error handling during live requests'
        ]
      }
    ]
  },
  {
    title: '[P5] Role-based access rules on all endpoints',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 5',
    desc: `**Goal:** Secure all REST endpoints with explicit role-based authorization guards.\n\n**Acceptance Criteria:** Enforces @PreAuthorize checks. Students cannot access teacher endpoints, unapproved teachers cannot access data, and admin endpoints are isolated.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Apply @PreAuthorize("hasRole(\'STUDENT\')") on student endpoints',
          'Apply @PreAuthorize("hasRole(\'TEACHER\')") on teacher management APIs',
          'Apply @PreAuthorize("hasRole(\'ADMIN\')") on teacher approval routes',
          'Add automated security tests verifying 403 Forbidden on unauthorized roles'
        ]
      }
    ]
  },
  {
    title: '[P5] Error handling and input validation across the API',
    listId: 'list_backlog',
    prio: 'Must-have',
    area: 'Backend',
    phase: 'Phase 5',
    desc: `**Goal:** Implement global exception handling and robust request DTO validation.\n\n**Acceptance Criteria:** @ControllerAdvice intercepts errors, returning consistent JSON schemas with helpful error messages and accurate HTTP status codes (400, 401, 403, 404, 500).`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create GlobalExceptionHandler with @ExceptionHandler methods',
          'Add Bean Validation annotations (@NotNull, @Size, @Min) on all DTOs',
          'Format validation failures into user-friendly error response maps',
          'Write tests verifying proper error responses for malformed payloads'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 6: Essays and AI Grading (Nice-to-have) ---
  {
    title: '[P6] Rubric manager',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Frontend',
    phase: 'Phase 6',
    desc: `**Goal:** Build teacher interface to create and configure multi-criterion grading rubrics.\n\n**Acceptance Criteria:** Teachers define criteria, descriptions, score ranges, and performance levels used for essay assessment evaluation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create rubric builder form with dynamic criteria rows',
          'Allow assigning point weightings and performance tier descriptions',
          'Link created rubrics to specific essay assessment questions',
          'Verify rubric serialization and persistence via backend'
        ]
      }
    ]
  },
  {
    title: '[P6] Essay question type and student answer box',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Frontend',
    phase: 'Phase 6',
    desc: `**Goal:** Support free-form essay questions in the assessment engine.\n\n**Acceptance Criteria:** Students can view essay prompts and input long-form answers with word counters, autosave drafts, and submission confirmation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Extend question component to support essay prompt display',
          'Implement textarea answer input with live word counter',
          'Add local storage autosave to protect against lost input',
          'Submit essay response payload to backend assessment submission API'
        ]
      }
    ]
  },
  {
    title: '[P6] LLM grading service in Spring (API key kept on the backend, structured JSON output)',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Backend',
    phase: 'Phase 6',
    desc: `**Goal:** Implement backend LLM integration to grade student essays against teacher rubrics.\n\n**Acceptance Criteria:** API keys secured strictly on backend. Service sends prompt and rubric, parsing structured JSON with criterion scores and explanatory critique.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Store LLM API credentials securely in environment variables',
          'Construct structured prompt incorporating rubric criteria and student text',
          'Parse LLM response into validated score and feedback DTOs',
          'Ensure system operates seamlessly if LLM features are disabled'
        ]
      }
    ]
  },
  {
    title: '[P6] “AI-graded, pending review” status with teacher approve/edit in Grade Review',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Backend',
    phase: 'Phase 6',
    desc: `**Goal:** Enforce mandatory teacher oversight for all AI-generated essay evaluations.\n\n**Acceptance Criteria:** AI scores receive "AI-graded, pending review" status. Teachers can accept, edit, or reject the AI score before it becomes final.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Assign status PENDING_REVIEW to all AI-graded essay submissions',
          'Display AI-suggested marks and critique notes in Teacher Grade Review',
          'Allow teacher to approve or modify score with single click',
          'Update score status to FINAL once confirmed by educator'
        ]
      }
    ]
  },
  {
    title: '[P6] Fallback manual grading queue when the AI call fails',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Backend',
    phase: 'Phase 6',
    desc: `**Goal:** Implement resilient error handling routing failed AI evaluations to manual teacher queue.\n\n**Acceptance Criteria:** If LLM request times out, fails, or returns invalid JSON, system routes submission to manual grading queue without breaking student flow.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Wrap LLM API calls with try-catch and timeout circuit breakers',
          'Catch exceptions and flag submission as MANUAL_GRADING_REQUIRED',
          'Add visual alert in teacher dashboard for submissions in manual queue',
          'Verify core quiz submission succeeds even when LLM service is offline'
        ]
      }
    ]
  },
  {
    title: '[P6] Open decision: do provisional AI essay scores count toward gap analysis immediately, or only after teacher confirmation?',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Docs',
    phase: 'Phase 6',
    desc: `**Goal:** Document and resolve policy regarding provisional AI scores in gap calculations.\n\n**Acceptance Criteria:** Team decision documented. Default recommendation: provisional scores are excluded from gap analysis until teacher confirmation to prevent unverified flags.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Document pros and cons of immediate vs confirmed gap inclusion',
          'Align with stakeholders on recommended default (require confirmation)',
          'Update gap calculation service logic based on decision',
          'Record final architectural decision in project documentation'
        ]
      }
    ]
  },

  // --- BACKLOG: Phase 7: Testing, Stretch Features, and Wrap-up (Objective 5) ---
  {
    title: '[P7] User testing plan and test scripts',
    listId: 'list_backlog',
    prio: 'Should-have',
    area: 'Testing',
    phase: 'Phase 7',
    desc: `**Goal:** Prepare comprehensive testing protocol and scripted user scenarios.\n\n**Acceptance Criteria:** Detailed test scripts covering student and teacher journeys, objective verification benchmarks, and observer scoring rubrics.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Draft end-to-end user testing plan covering all 5 objectives',
          'Write step-by-step test scripts for student participant cohorts',
          'Write step-by-step test scripts for teacher participant cohorts',
          'Prepare data collection sheets for usability metrics'
        ]
      }
    ]
  },
  {
    title: '[P7] Usability survey (target average of 4 out of 5)',
    listId: 'list_backlog',
    prio: 'Should-have',
    area: 'Testing',
    phase: 'Phase 7',
    desc: `**Goal:** Deploy comprehensive usability survey to evaluate student and teacher satisfaction.\n\n**Acceptance Criteria:** Objective 5 validation: system achieves an average usability score of >=4.0 out of 5.0 across student and teacher cohorts.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create standard System Usability Scale (SUS) / 5-point Likert questionnaire',
          'Distribute survey to all pilot testing participants',
          'Analyze quantitative scores and compute aggregate mean rating',
          'Confirm system attains the >=4.0/5.0 target benchmark'
        ]
      }
    ]
  },
  {
    title: '[P7] Fix issues from testing',
    listId: 'list_backlog',
    prio: 'Should-have',
    area: 'Testing',
    phase: 'Phase 7',
    desc: `**Goal:** Prioritize and resolve defects discovered during pilot testing.\n\n**Acceptance Criteria:** All high-severity usability and functional bugs resolved and regression tested prior to final presentation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Triage user testing feedback into bug and enhancement backlog',
          'Fix high-priority navigation bottlenecks and layout flaws',
          'Resolve backend validation edge cases identified by testers',
          'Perform regression testing on all modified workflows'
        ]
      }
    ]
  },
  {
    title: '[P7] Stretch: personalized study plans',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Frontend',
    phase: 'Phase 7',
    desc: `**Goal:** Generate automated weekly study schedules targeted at identified learning gaps.\n\n**Acceptance Criteria:** Students can generate and view a personalized multi-day calendar allocating daily study sessions for their weakest topics.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Design study plan calendar UI component',
          'Implement scheduling logic allocating study intervals per weak topic',
          'Allow students to adjust target hours and days of week',
          'Save study plan preferences in local storage or user profile'
        ]
      }
    ]
  },
  {
    title: '[P7] Stretch: reminders',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Backend',
    phase: 'Phase 7',
    desc: `**Goal:** Send notification prompts to encourage timely assessment completion and gap review.\n\n**Acceptance Criteria:** In-app notification center alerts students of upcoming quiz deadlines and unfinished remedial recommendations.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Build in-app notification dropdown component with badge counter',
          'Create backend scheduled task checking pending gap tasks',
          'Trigger notification alerts for unread recommendations',
          'Allow students to dismiss or mark notifications as read'
        ]
      }
    ]
  },
  {
    title: '[P7] Stretch: students rate recommended resources',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Frontend',
    phase: 'Phase 7',
    desc: `**Goal:** Allow students to rate resource usefulness with a 1-5 star rating.\n\n**Acceptance Criteria:** Students can submit 1–5 star ratings on recommended materials; average rating displays to help guide peer remediation.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Add interactive 5-star rating widget to resource cards',
          'Implement backend endpoint to record and average student ratings',
          'Display cumulative rating score and voter count on resources',
          'Sort recommendations by rating quality when applicable'
        ]
      }
    ]
  },
  {
    title: '[P7] Stretch: more resource types (videos, notes, practice exercises)',
    listId: 'list_backlog',
    prio: 'Nice-to-have',
    area: 'Frontend',
    phase: 'Phase 7',
    desc: `**Goal:** Broaden resource catalog with rich media types including embedded video and notes.\n\n**Acceptance Criteria:** UI supports embedded YouTube/Vimeo players, PDF/notes viewer modal, and interactive practice drill questions.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Implement responsive video embed modal for YouTube / video URLs',
          'Add PDF and rich markdown viewer for lecture notes and study guides',
          'Create quick practice drill mini-module for instant feedback',
          'Add media-type filter badges in the recommendation library'
        ]
      }
    ]
  },
  {
    title: '[P7] Deployment preparation',
    listId: 'list_backlog',
    prio: 'Should-have',
    area: 'Backend',
    phase: 'Phase 7',
    desc: `**Goal:** Configure production deployment pipelines and environment configurations.\n\n**Acceptance Criteria:** Docker containers created for Spring Boot and React; cloud/production environment properties configured securely without secrets in source control.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Create multi-stage Dockerfile for React production Nginx build',
          'Create Dockerfile for Spring Boot production jar build',
          'Configure docker-compose.prod.yml orchestrating app and MySQL',
          'Document deployment checklist and environment variable provisioning'
        ]
      }
    ]
  },
  {
    title: '[P7] Documentation and final presentation',
    listId: 'list_backlog',
    prio: 'Should-have',
    area: 'Docs',
    phase: 'Phase 7',
    desc: `**Goal:** Finalize academic project report, user guide, and presentation slide deck.\n\n**Acceptance Criteria:** Complete project README, architecture diagrams, objective verification metrics report, and final presentation slide deck.`,
    checklists: [
      {
        name: 'Subtasks',
        items: [
          'Compile final technical architecture documentation and ER diagrams',
          'Document SMART objective outcomes and test results',
          'Produce student and teacher quick-start user guides',
          'Prepare slide deck and live demonstration script for evaluation'
        ]
      }
    ]
  }
];

console.log('Total Info cards:', infoCards.length);
console.log('Total Task cards:', taskCards.length);
console.log('Total Cards:', infoCards.length + taskCards.length);

// Generate Trello Importable JSON
// Trello JSON format matches native board export
const allCards = [];
const allChecklists = [];
let cardPos = 1000;
let checkIdCounter = 1;

function makeId(prefix, num) {
  return prefix + '_' + String(num).padStart(6, '0');
}

// Process Info cards
infoCards.forEach((c, idx) => {
  const cardId = makeId('card_info', idx + 1);
  const cardChecklistIds = [];
  
  if (c.checklists) {
    c.checklists.forEach((chk, cIdx) => {
      const chkId = makeId('chk', checkIdCounter++);
      cardChecklistIds.push(chkId);
      allChecklists.push({
        id: chkId,
        idBoard: '6ae1721c567255c8a4d6d97f',
        idCard: cardId,
        name: chk.name,
        pos: (cIdx + 1) * 1000,
        checkItems: chk.items.map((item, iIdx) => ({
          id: makeId('item', checkIdCounter * 100 + iIdx),
          idChecklist: chkId,
          name: item,
          state: 'incomplete',
          pos: (iIdx + 1) * 1000
        }))
      });
    });
  }

  allCards.push({
    id: cardId,
    idBoard: '6ae1721c567255c8a4d6d97f',
    idList: c.listId,
    name: c.title,
    desc: c.desc,
    pos: (idx + 1) * 1000,
    closed: false,
    idLabels: [],
    idChecklists: cardChecklistIds
  });
});

// Process Task cards
taskCards.forEach((c, idx) => {
  const cardId = makeId('card_task', idx + 1);
  const cardChecklistIds = [];
  
  if (c.checklists) {
    c.checklists.forEach((chk, cIdx) => {
      const chkId = makeId('chk', checkIdCounter++);
      cardChecklistIds.push(chkId);
      allChecklists.push({
        id: chkId,
        idBoard: '6ae1721c567255c8a4d6d97f',
        idCard: cardId,
        name: chk.name,
        pos: (cIdx + 1) * 1000,
        checkItems: chk.items.map((item, iIdx) => ({
          id: makeId('item', checkIdCounter * 100 + iIdx),
          idChecklist: chkId,
          name: item,
          state: c.listId === '6ae1721c567255c8a4d6d98a' ? 'complete' : 'incomplete', // Done card items marked complete
          pos: (iIdx + 1) * 1000
        }))
      });
    });
  }

  const labelIds = getLabelIds(c.prio, c.area, c.phase);

  allCards.push({
    id: cardId,
    idBoard: '6ae1721c567255c8a4d6d97f',
    idList: c.listId,
    name: c.title,
    desc: c.desc,
    pos: (idx + 1) * 1000,
    closed: false,
    idLabels: labelIds,
    idChecklists: cardChecklistIds
  });
});

// Construct full Trello board export JSON
const trelloExport = {
  id: '6ae1721c567255c8a4d6d97f',
  name: 'LearningPal',
  desc: 'A data-driven learning support system for students and teachers.',
  closed: false,
  url: 'https://trello.com/b/XioxhbrI/learningpal',
  lists: lists,
  labels: labels,
  cards: allCards,
  checklists: allChecklists
};

fs.writeFileSync('learningpal-trello-import.json', JSON.stringify(trelloExport, null, 2), 'utf8');
console.log('Saved learningpal-trello-import.json successfully!');

// Generate CSV export for easy import via Trello CSV / Excel / Power-Up
// CSV columns: List Name, Card Name, Description, Labels, Checklist Name, Checklist Items
const csvRows = [
  ['List Name', 'Card Title', 'Description', 'Labels', 'Checklist Items']
];

function escapeCsv(str) {
  if (str === null || str === undefined) return '""';
  const s = String(str).replace(/"/g, '""');
  return `"${s}"`;
}

allCards.forEach(card => {
  const listObj = lists.find(l => l.id === card.idList);
  const listName = listObj ? listObj.name : 'Unknown';
  const cardLabels = card.idLabels.map(lId => {
    const lObj = labels.find(l => l.id === lId);
    return lObj ? lObj.name : '';
  }).filter(Boolean).join(', ');

  const cardChecklists = allChecklists.filter(chk => chk.idCard === card.id);
  const checklistItems = cardChecklists.map(chk => {
    return chk.checkItems.map(item => `[ ] ${item.name}`).join(' | ');
  }).join(' || ');

  csvRows.push([
    escapeCsv(listName),
    escapeCsv(card.name),
    escapeCsv(card.desc),
    escapeCsv(cardLabels),
    escapeCsv(checklistItems)
  ]);
});

const csvContent = csvRows.map(r => r.join(',')).join('\r\n');
fs.writeFileSync('learningpal-trello-import.csv', csvContent, 'utf8');
console.log('Saved learningpal-trello-import.csv successfully!');

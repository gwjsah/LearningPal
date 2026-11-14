# LearningPal — Full-Stack Learning Support System

LearningPal is a data-driven educational support platform that diagnoses student topic weaknesses through quizzes, provides targeted remedial resources, and empowers teachers with automated gap analysis, class rosters, grade adjustments, and custom curriculum tools.

---

## Tech Stack & Requirements

- **Backend**: Java 17+, Spring Boot 3.3.4, Spring Security 6 (JWT HS256), Spring Data JPA, Hibernate, JJWT 0.12.x, Apache POI 5.4.0, Apache PDFBox 3.0.4
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router 6
- **Database**: MySQL 8.x
- **Build Tool**: **Maven Wrapper included (`mvnw` / `mvnw.cmd`)** — you do **not** need Maven installed on your machine!
- **Local LLM (Optional for AI Question Drafting)**: LM Studio (or any OpenAI-compatible server) running on `http://localhost:1234` (see [docs/AI_SETUP.md](docs/AI_SETUP.md))

### Prerequisites Checklist
- [x] **Java Development Kit (JDK) 17 or higher** (`java -version`)
- [x] **Node.js 18 or higher and npm** (`node -v` and `npm -v`)
- [x] **MySQL Server 8.x** running locally on port 3306

---

## Quick Start Guide (4 Simple Steps)

### Step 1: Environment Setup

1. Copy the root environment template to `.env` and fill in your local values (never commit `.env`):
   ```bash
   cp .env.example .env
   ```
   Key variables to set in `.env`:
   - `DB_USERNAME` / `DB_PASSWORD`: Your local MySQL credentials
   - `APP_JWT_SECRET`: A 256-bit base64 secret (`openssl rand -base64 32`)
   - `GEMINI_API_KEY` *(optional)*: Required only if using Gemini AI question drafting / essay grading suggestions

2. Copy the backend Spring Boot properties template:
   ```bash
   cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
   ```
   Update `spring.datasource.username` and `spring.datasource.password` (or let them resolve from your environment).

---

### Step 2: Database Setup & Import (Testing Seed)

1. Start your local MySQL 8.x service.
2. Create the `learningpal` database and (for testing with pre-seeded data) import `database_backup.sql` from the `testing` branch:

```bash
# Option A: From terminal / command prompt
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS learningpal;"
mysql -u root -p learningpal < database_backup.sql

# Option B: In MySQL Workbench / HeidiSQL / DBeaver
# 1. Execute: CREATE DATABASE learningpal;
# 2. Open `database_backup.sql` and run the script into the `learningpal` schema.
```

---

### Step 3: Backend Setup & Run

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. *(Optional)* If testing Local AI Question Drafting with LM Studio, configure:
   ```properties
   app.llm.enabled=true
   app.llm.base-url=http://localhost:1234
   app.llm.model=qwen/qwen3-14b
   ```

3. Run the backend using the **Maven Wrapper** (no local Maven install needed):
   - **On Windows (PowerShell / CMD)**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   - **On macOS / Linux**:
     ```bash
     ./mvnw spring-boot:run
     ```

4. The backend will start on **`http://localhost:8080`**.

---

### Step 4: Frontend Setup & Run

1. In a **new terminal window**, navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at **`http://localhost:5173`**.

---

## Login Accounts & Credentials

The imported database includes pre-seeded accounts across all roles so you can test immediately:

### 1. Teacher Portal (Recommended for testing)
- **Email**: `teacher.pilot1@demo.learningpal.local` (Dr. Alan Turing)
- **Password**: `DemoPassword123!`
- **Role**: `TEACHER` (Pilot University)
- **What to test**: Classes roster, student detail, My Subjects workspace, Question Bank versioning, Quiz builder, Validation Lab.

### 2. Student Portal
- **Email**: `showcase@demo.learningpal.local` (Alex Rivera)
- **Password**: `DemoPassword123!`
- **Role**: `STUDENT`
- **What to test**: Enrolled classes, taking quizzes, instant diagnostic results, topic mastery dashboard, targeted study links, and usability survey.

### 3. Institution Admin Portal
- **Email**: `admin.pilot@demo.learningpal.local` (Pilot Admin)
- **Password**: `DemoPassword123!`
- **Role**: `ADMIN`
- **What to test**: Teacher approval queue, institution evaluation metrics, validation agreement reports, usability survey summary.

### 4. Platform Super Admin
- **Email**: `superadmin@learningpal.edu`
- **Password**: `SuperSecretPassword123!`
- **Role**: `SUPER_ADMIN`
- **What to test**: Multi-institution provisioning, creating tenant institutions and institution admins.

### 5. Alternative Accounts
- Teacher: `carlos.mendoza@school.edu` / `DemoPassword123!`
- Student: `allen.kalbo@school.edu` / `DemoPassword123!`

---

## Key Features to Test & Explore

### 1. Teacher Content Tools & Resource Management (Phases A & B)
- **"My Subjects" Hub** (`/teacher/subjects`):
  - View all teacher-owned subjects with statistics (classes, topics, questions, quizzes).
  - Create new subjects, edit metadata, archive unused subjects, and manage subject workspaces.
- **Subject Workspace** (`/teacher/subjects/:id`):
  - **Topics**: Add new topics, rename existing ones, or reorder topics with up/down arrows.
  - **Question Bank**: Create **Multiple Choice**, **Enumeration** (with accepted answer variants), and **Essay** (with multi-criterion grading rubrics) questions. Notice the version badges (e.g. `v1`). If a question has submitted answers, editing it will automatically increment the version (`v2`) and retire the previous one to keep historical student attempts intact! Provenance tags indicate whether questions are original (`MANUAL`) or drafted by AI (`AI_DRAFT`).
  - **Quizzes**: Build quizzes from question bank items. Toggle Draft vs. Published status.
  - **Link Resources & File Uploads (Phase B)**:
    - Add external web links or click **"Upload Document"** to attach course files (PDF or DOCX, up to 10 MB).
    - Hardened background text extraction with defenses against Zip slip and duplicate zip entries (CVE-2025-31672).
    - Status indicators (`READY`, `PENDING`, `COMPLETED`, `FAILED`), text preview modal, and secure teacher-scoped downloads.
    - Linked files are automatically accessible as remedial study materials to enrolled students.
- **Class Creation** (`/teacher`):
  - Create a new class with an intuitive **Subject dropdown** (populated from your active owned subjects) and **Class Name**.

### 2. Local AI Question Drafting with LM Studio (Phase C)
- **Local LLM Integration** (`/teacher/subjects/:id` -> Link Resources):
  - Click **"Draft with AI"** next to any uploaded document with extracted text.
  - Configure target topic, number of questions to draft (1–10), and desired Bloom's taxonomy difficulty level.
  - Background asynchronous job polling communicates directly with local LM Studio (`http://localhost:1234/v1`). 100% private: zero data leaves your local machine.
  - **Evidence Verification**: Every draft includes grounded evidence extracted verbatim from the source document.
  - **Teacher Review & Approval Queue**: Inspect questions, edit prompts/choices/explanations, discard unwanted drafts, or approve selected questions into the subject Question Bank with one click.
  - Full setup guide: [docs/AI_SETUP.md](docs/AI_SETUP.md).

### 3. Accessible In-App Confirmation Modals
- All critical actions (publishing/unpublishing quizzes, archiving topics, deleting resources, discarding draft questions) use an accessible in-app confirmation modal (`ConfirmModal`).
- Features notebook design system tokens, WCAG AA color contrast, full keyboard navigation (`Escape` to cancel, `Enter` to confirm), and focus trapping without raw browser `window.alert` / `window.confirm` pop-ups.

### 4. Class-Scoped Mastery & Student Loop
- **Student Dashboard** (`/student`): View enrolled classes and join a new class using a 6-character code (e.g., `PILOT1`).
- **Take Quiz** (`/student/classes/:id`): Live timer, question palette navigation, and instant auto-scoring.
- **Quiz Results**: Misconception explanations for incorrect choices, personalized feedback cards, and recommended remedial links.
- **Topic Mastery Breakdown**: Visual progress bars showing `STRENGTH` ($\ge 80\%$), `DEVELOPING` ($60\%\text{--}79\%$), and `GAP` ($< 60\%$).

### 5. Teacher Interventions & Validation Lab
- **Class Detail & Roster** (`/teacher/classes/:id`): View student scores, diagnostic percentages, topic breakdown bars, and attendance.
- **Student Detail & Overrides**: Adjust question scores with teacher comments, and log 1-on-1 intervention notes (e.g., Office Hours, Peer Tutoring).
- **Validation Lab** (`/teacher/classes/:id/validation`): Blind teacher topic labeling workflow and accuracy report measuring agreement with the automated classifier.

### 6. Dark Mode / Theme
- Click the moon/sun toggle in the navigation bar to test the dark mode palette across all views.

---

## Repository Structure

```text
LearningPal/
├── backend/                       # Spring Boot 3 Java Application
│   ├── mvnw                       # Linux/macOS Maven Wrapper script
│   ├── mvnw.cmd                   # Windows Maven Wrapper script
│   ├── .mvn/wrapper/              # Maven Wrapper properties & config
│   ├── pom.xml                    # Maven dependencies & build configuration
│   └── src/                       # Application source code & integration tests
├── frontend/                      # React 18 + Vite SPA
│   ├── package.json               # Frontend dependencies & scripts
│   ├── src/                       # React components, pages, context, and API clients
│   └── tailwind.config.js         # Tailwind configuration & custom design tokens
├── database_backup.sql            # MySQL dump with pre-seeded data, classes & accounts
├── docs/                          # Architecture, Data Model, and Evaluation docs
│   ├── AI_SETUP.md                # LM Studio local LLM setup & model guidelines
│   ├── FILES.md                   # Document upload and extraction architecture
│   ├── DATA_MODEL.md              # Comprehensive entity relationship documentation
│   ├── ISOLATION_MATRIX.md        # Multi-tenant security rules and test mappings
│   ├── DEMO_GUIDE.md              # Realistic cohort walkthrough guide
│   └── USER_TESTING_PLAN.md       # User testing script & observer templates
├── PRODUCT.md                     # High-level product vision & feature scope
├── DESIGN.md                      # UI/UX design language & token documentation
└── README.md                      # Setup & testing guide (this file)
```

---

## Troubleshooting & FAQs

- **Backend fails to start with `Access denied for user 'root'@'localhost'`**:
  Double check `spring.datasource.password` in `backend/src/main/resources/application.properties` matches your local MySQL root password.
- **Backend fails to start with `Unknown database 'learningpal'`**:
  Make sure you ran `CREATE DATABASE learningpal;` before starting the backend or importing the SQL dump.
- **Permission denied on `./mvnw` (macOS/Linux)**:
  Run `chmod +x ./mvnw` in the `backend/` directory once.
- **Frontend port 5173 or Backend port 8080 in use**:
  Kill any lingering background processes or specify an alternative port in `application.properties` (`server.port=8081`) or Vite (`npm run dev -- --port 5174`).

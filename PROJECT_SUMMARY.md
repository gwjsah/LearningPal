# LearningPal — Project Implementation Summary & Living Changelog

> **Note**: This document tracks the architecture, completed modules, API contracts, frontend views, and verification suites for **LearningPal**. Update this file whenever new features or modules are introduced.

---

## 1. System Architecture Overview

LearningPal is organized as a decoupled full-stack application structured into independent `frontend` and `backend` packages under the root `LearningPal/` workspace:

```text
LearningPal/
├── PROJECT_SUMMARY.md      # Living record of implemented features and contracts
├── README.md               # Quickstart and run instructions
├── package.json            # Root workspace scripts (run frontend & backend)
├── .gitignore              # Ignored build artifacts, dependencies, and environments
│
├── backend/                # Java 17 + Spring Boot 3.3.4 REST API (Maven)
│   ├── pom.xml             # Spring Boot, Security, JPA, Validation, MySQL, JJWT 0.12.6, H2
│   └── src/
│       ├── main/
│       │   ├── java/com/learningpal/
│       │   │   ├── LearningPalApplication.java
│       │   │   ├── config/       # SecurityConfig, JwtService, JwtAuthFilter, Rest handlers, Seeder
│       │   │   ├── controller/   # AuthController, AdminController, TestPingController
│       │   │   ├── dto/          # SignupRequest, LoginRequest, AuthResponse, UserDto, etc.
│       │   │   ├── entity/       # User entity, Role enum, UserStatus enum
│       │   │   ├── exception/    # GlobalExceptionHandler, Custom domain exceptions
│       │   │   ├── repository/   # UserRepository (Spring Data JPA)
│       │   │   └── service/      # AuthService, AdminService
│       │   └── resources/
│       │       └── application.properties # MySQL configuration, JWT secret, seed admin
│       └── test/
│           ├── java/com/learningpal/
│           │   └── LearningPalApplicationTests.java # 7-scenario integration test suite
│           └── resources/
│               └── application-test.properties     # In-memory H2 MySQL-mode test settings
│
└── frontend/               # React 18 + Vite 5 + Tailwind CSS + React Router 6
    ├── index.html
    ├── package.json        # Dependencies: framer-motion, lucide-react, recharts, react-router-dom
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx         # App routing & role-based route guard wiring
        ├── main.jsx
        ├── index.css       # Pure CSS notebook textures (ruled paper, red margins, washi tape)
        ├── components/     # Navbar (full-width), Hero, ProtectedRoute, Doodles, Landing sections
        ├── context/        # AuthContext.jsx (session restore, localStorage persistence)
        ├── pages/          # LandingPage, Login, Signup, StudentHome, TeacherHome, AdminHome
        └── services/       # api.js (fetch wrapper), authService.js, adminService.js
```

---

## 2. Implemented Features & Modules

### A. Authentication & User Management (Backend)
- **Layered Architecture**: Strict `Controller → Service → Repository` decoupling. DTOs are used for all inputs and outputs; entities and password hashes are never exposed over the wire.
- **User Data Model (`users` table)**:
  - `id`: Auto-incrementing primary key.
  - `fullName`: Student / Teacher / Administrator name.
  - `email`: Normalized to lowercase, unique index.
  - `passwordHash`: Salted hash via Spring Security's `BCryptPasswordEncoder`.
  - `role`: Enum (`STUDENT`, `TEACHER`, `ADMIN`).
  - `status`: Enum (`ACTIVE`, `PENDING`, `REJECTED`).
  - `createdAt`: Auto-generated timestamp.
- **Business & Security Rules**:
  - **Student Signups**: Created with `ACTIVE` status immediately and issued a signed JWT right away.
  - **Teacher Signups**: Created with `PENDING` status. No token is returned; account cannot log in until approved by an administrator.
  - **Public Admin Block**: Signups specifying `ADMIN` or any role other than `STUDENT` or `TEACHER` are rejected with HTTP 400.
  - **Unified Login Security**: Invalid email or invalid password returns the identical error: `"Incorrect email or password"` (HTTP 401) to eliminate user enumeration.
  - **Status Checks After Authentication**: Only evaluated once the password is confirmed valid:
    - `PENDING` returns HTTP 403: `"Your teacher account is awaiting admin approval"`.
    - `REJECTED` returns HTTP 403: `"Your teacher account request was declined"`.
  - **Password Regex Validation**: Enforced at signup only (`^(?=.*[A-Za-z])(?=.*\d).{8,72}$`), requiring 8 to 72 characters, at least one letter, and at least one number.
  - **Stateless JWT with JJWT 0.12.x**: HS256-signed stateless token carrying `subject` (email), `role`, `userId`, `fullName`, and 24-hour expiration.
  - **Role-Based Security Filter**: `JwtAuthFilter` intercepts `Authorization: Bearer <token>`, establishes `ROLE_STUDENT`, `ROLE_TEACHER`, or `ROLE_ADMIN` in Spring's `SecurityContext`.
  - **Unified Error Envelope**: `GlobalExceptionHandler` guarantees all errors (validation, 400, 401, 403, 404, 409, 500) conform to `{ "message": "..." }`.
  - **Database Seeder**: `AdminUserSeeder` creates the initial administrator on startup (`admin@learningpal.edu` / `AdminPass123`) if no admin exists.

### B. Teacher Approval Workflow (Admin Backend)
- `GET /api/admin/teachers/pending`: Lists all teachers awaiting review (`id`, `fullName`, `email`, `createdAt`).
- `POST /api/admin/teachers/{id}/approve`: Transitions status to `ACTIVE`.
- `POST /api/admin/teachers/{id}/reject`: Transitions status to `REJECTED`.
- Validates that target ID belongs to a user with `TEACHER` role (returns 400/404 otherwise).

### C. Frontend Architecture & Pages (React)
- **Notebook-Themed Styling**: Pure CSS styling utilizing ruled paper textures (`bg-ruled-paper`), red margin guides (`notebook-margin-line`), binder punches, ink navy typography, and red-pen grading highlights.
- **Pages**:
  1. **Landing Page (`/`)**:
     - Full-width horizontal navigation bar (`w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16`) preventing button compression.
     - Direct CTA links to `/login` and `/signup`.
     - Hero notebook mockup, live interactive demo, curriculum gap analyzers, and dark/light chalkboard toggle.
  2. **Login Page (`/login`)**:
     - Notebook sheet with red margin and hole punches.
     - Role-based automatic redirect on successful login (`STUDENT` → `/student`, `TEACHER` → `/teacher`, `ADMIN` → `/admin`).
     - Error banner with `role="alert"` displaying specific server responses (e.g. pending approval message).
  3. **Signup Page (`/signup`)**:
     - Student / Teacher interactive segmented toggle.
     - Client-side validation: password regex rule, matching passwords check, valid email format.
     - Password hint displayed directly under field: `"8+ characters, with at least one letter and one number"`.
     - **Teacher Pending Confirmation View**: On teacher registration, hides form and shows: `"Request sent. An admin needs to approve your teacher account before you can log in."`
  4. **Student Portal (`/student`)**:
     - Protected by `ProtectedRoute` (`ROLE_STUDENT`).
     - Displays logged-in student name and role badge.
     - Live handshake test calling `/api/student/ping` and displaying the server response.
     - Preview widgets for mastered topics and targeted learning gaps.
  5. **Teacher Portal (`/teacher`)**:
     - Protected by `ProtectedRoute` (`ROLE_TEACHER`).
     - Displays verified teacher name and role badge.
     - Live handshake test calling `/api/teacher/ping` and displaying the server response.
     - Classroom metrics preview (enrolled students, concept gaps, assigned interventions).
  6. **Admin Control Ledger (`/admin`)**:
     - Protected by `ProtectedRoute` (`ROLE_ADMIN`).
     - Styled as a gradebook checklist table of pending teacher requests.
     - Accessible action buttons per applicant (`aria-label="Approve Maria Santos"` / `aria-label="Reject Maria Santos"`).
     - Instant row removal upon action with confirmation feedback alert.
     - Dedicated empty state (`"No teacher requests waiting"`) and retryable error state.
- **Client Services & State**:
  - `src/services/api.js`: Unified fetch wrapper attaching `Bearer` tokens and parsing `{ message }` payloads with network error handling.
  - `src/services/authService.js`: `signup`, `login`, `me`.
  - `src/services/adminService.js`: `getPendingTeachers`, `approveTeacher`, `rejectTeacher`.
  - `src/context/AuthContext.jsx`: Manages reactive user & token state, persists to `localStorage`, and restores session on page reload via `/api/auth/me`.
  - `src/components/ProtectedRoute.jsx`: Enforces role checks, redirects unauthenticated users to `/login`, and redirects authenticated users accessing the wrong portal to their own home.

---

## 3. API Endpoints Matrix

| HTTP Method | Endpoint | Authorization | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/signup` | Public | Registers a new Student or Teacher account |
| `POST` | `/api/auth/login` | Public | Authenticates user; enforces active status check |
| `GET` | `/api/auth/me` | Authenticated | Fetches profile of current user for session restore |
| `GET` | `/api/admin/teachers/pending` | `ADMIN` only | Lists teacher applications with `PENDING` status |
| `POST` | `/api/admin/teachers/{id}/approve` | `ADMIN` only | Approves teacher account (`ACTIVE`) |
| `POST` | `/api/admin/teachers/{id}/reject` | `ADMIN` only | Declines teacher account (`REJECTED`) |
| `GET` | `/api/student/ping` | `STUDENT` only | *[Deletable test]* Verifies student role access |
| `GET` | `/api/teacher/ping` | `TEACHER` only | *[Deletable test]* Verifies teacher role access |

---

## 4. Test Verification Matrix

All 7 core authentication and role security scenarios are verified by automated integration tests in [`LearningPalApplicationTests.java`](file:///c:/Users/Marion%20Alfeche/LearningPal/backend/src/test/java/com/learningpal/LearningPalApplicationTests.java):

1. **Scenario 1**: Student signup returns HTTP 201 with a valid JWT token and `ACTIVE` status.
2. **Scenario 2**: Weak password (letters only) rejected with HTTP 400 and message `"Password needs at least one letter and one number"`.
3. **Scenario 3**: Teacher signup returns HTTP 201 with `token: null`, `PENDING` status, and pending approval message.
4. **Scenario 4**: Teacher login attempt before approval rejected with HTTP 403 and message `"Your teacher account is awaiting admin approval"`.
5. **Scenario 5**: Admin logs in using seed credentials, lists pending teacher queue, and approves teacher with HTTP 200.
6. **Scenario 6**: Teacher login after approval succeeds with HTTP 200 and can access `/api/teacher/ping`.
7. **Scenario 7**: Student token accessing `/api/admin/teachers/pending` is rejected with HTTP 403.

---

## 5. Development Log & Changelog

### Version 1.0.0 — Initial Monorepo Reorganization & Auth Implementation
- **Architecture**: Separated single landing repository into `frontend/` and `backend/` monorepo structure.
- **Backend**: Built Spring Boot 3.3.4 backend with Java 17, JPA, MySQL, Spring Security, BCrypt, and JJWT 0.12.x.
- **Auth Flow**: Completed Student instant access and Teacher approval workflow via Admin portal.
- **Frontend**: Integrated React Router 6, `AuthContext`, `ProtectedRoute`, Login, Signup, StudentHome, TeacherHome, and AdminHome pages.
- **UI Optimization**: Widened the landing page navigation bar to full horizontal width (`w-full`), preventing compressed buttons and icons.
- **Testing**: Added and verified automated 7-scenario integration test suite (`mvn test` passed 100%).


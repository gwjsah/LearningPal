# LearningPal — Full-Stack Learning Support System

A data-driven learning support platform where students identify strengths and topic gaps, and teachers review assessments to provide targeted interventions.

---

## 1. Project File Structure

```text
LearningPal/
├── backend/                                   # Java 17 + Spring Boot 3.3.4 REST API
│   ├── pom.xml                                # Maven project definition (Spring Boot, Security, JPA, JJWT 0.12.x)
│   └── src/
│       ├── main/
│       │   ├── java/com/learningpal/
│       │   │   ├── LearningPalApplication.java# Spring Boot application entry point
│       │   │   ├── config/
│       │   │   │   ├── AdminUserSeeder.java   # CommandLineRunner: Seeds initial admin if none exists
│       │   │   │   ├── JwtAuthFilter.java     # OncePerRequestFilter extracting Bearer JWT & populating SecurityContext
│       │   │   │   ├── JwtService.java        # JJWT 0.12.x HS256 token generation, claims & validation
│       │   │   │   ├── RestAccessDeniedHandler.java # Returns 403 { "message": "..." } on forbidden access
│       │   │   │   ├── RestAuthenticationEntryPoint.java # Returns 401 { "message": "..." } on unauthorized access
│       │   │   │   └── SecurityConfig.java    # Stateless filter chain, CORS, password encoder & route rules
│       │   │   ├── controller/
│       │   │   │   ├── AdminController.java   # /api/admin/teachers/pending, /approve, /reject
│       │   │   │   ├── AuthController.java    # /api/auth/signup, /api/auth/login, /api/auth/me
│       │   │   │   └── TestPingController.java# [DELETABLE] /api/student/ping and /api/teacher/ping role verifiers
│       │   │   ├── dto/
│       │   │   │   ├── AuthResponse.java      # { token, user, message }
│       │   │   │   ├── ErrorResponse.java     # { message } standard error envelope
│       │   │   │   ├── LoginRequest.java      # { email, password }
│       │   │   │   ├── MessageResponse.java   # { message }
│       │   │   │   ├── PendingTeacherDto.java # { id, fullName, email, createdAt }
│       │   │   │   ├── SignupRequest.java     # { fullName, email, password, role } with validation
│       │   │   │   └── UserDto.java           # Sanitized user entity representation (no hashes)
│       │   │   ├── entity/
│       │   │   │   ├── Role.java              # STUDENT, TEACHER, ADMIN
│       │   │   │   ├── User.java              # JPA entity mapped to 'users' table
│       │   │   │   └── UserStatus.java        # ACTIVE, PENDING, REJECTED
│       │   │   ├── exception/
│       │   │   │   ├── AccountStatusException.java      # HTTP 403 for PENDING or REJECTED accounts
│       │   │   │   ├── BadRequestException.java         # HTTP 400
│       │   │   │   ├── DuplicateEmailException.java     # HTTP 409
│       │   │   │   ├── GlobalExceptionHandler.java      # Standardizes ALL errors into { "message": "..." }
│       │   │   │   ├── InvalidCredentialsException.java # HTTP 401
│       │   │   │   └── ResourceNotFoundException.java   # HTTP 404
│       │   │   ├── repository/
│       │   │   │   └── UserRepository.java    # Spring Data JPA repository for User
│       │   │   └── service/
│       │   │       ├── AdminService.java      # Teacher verification and approval workflows
│       │   │       └── AuthService.java       # User registration, authentication and session retrieval
│       │   └── resources/
│       │       └── application.properties     # MySQL DB config, JWT secret/expiry, admin seed properties
│       └── test/
│           ├── java/com/learningpal/
│           │   └── LearningPalApplicationTests.java # Full 7-scenario integration test suite
│           └── resources/
│               └── application-test.properties# In-memory H2 MySQL-mode test configuration
│
├── frontend/                                  # React (Vite) + Tailwind CSS + React Router
│   ├── index.html                             # Single page container
│   ├── package.json                           # Frontend scripts & dependencies (framer-motion, lucide-react, react-router-dom)
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                           # React DOM mount point
│       ├── App.jsx                            # Router configuration & protected routes
│       ├── index.css                          # Pure CSS notebook textures, ruled lines, red margins
│       ├── components/
│       │   ├── Doodles.jsx                    # Hand-drawn SVGs, pins, binder holes, logos
│       │   ├── Navbar.jsx                     # Sticky navigation bar with direct Login / Signup links
│       │   ├── Hero.jsx                       # Notebook hero section with CTAs linked to auth
│       │   ├── FinalCTA.jsx                   # Bottom perforated notebook sheet linked to auth
│       │   ├── ProtectedRoute.jsx             # Role-based route guard & redirector
│       │   └── ...                            # Existing landing page components
│       ├── context/
│       │   └── AuthContext.jsx                # Global authentication provider with localStorage & /auth/me restore
│       ├── pages/
│       │   ├── AdminHome.jsx                  # /admin: Gradebook-style table for approving pending teachers
│       │   ├── LandingPage.jsx                # /: Notebook-inspired landing page
│       │   ├── Login.jsx                      # /login: Notebook page form with red margin & error alerts
│       │   ├── Signup.jsx                     # /signup: Student/Teacher toggle, password rule UX, approval screen
│       │   ├── StudentHome.jsx                # /student: Student portal with /api/student/ping verification
│       │   └── TeacherHome.jsx                # /teacher: Teacher portal with /api/teacher/ping verification
│       └── services/
│           ├── adminService.js                # getPendingTeachers, approveTeacher, rejectTeacher
│           ├── api.js                         # Fetch wrapper with Bearer token & { message } parsing
│           └── authService.js                 # signup, login, me
│
├── .gitignore
├── package.json                               # Root workspace scripts
└── README.md
```

---

## 2. Setup and Run Instructions

### Prerequisites
- **Java 17+** (JDK 17 or higher)
- **Apache Maven 3.8+**
- **Node.js 18+** & **npm 9+**
- **MySQL 8.x** running locally on port 3306

### Step A: Configure MySQL Database
Make sure MySQL is running on `localhost:3306`. The application automatically creates the `learningpal` database on startup:
```sql
CREATE DATABASE IF NOT EXISTS learningpal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
If your MySQL credentials differ from `root` / `root`, edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.username=YOUR_MYSQL_USER
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### Step B: Run the Backend
```bash
cd backend
mvn spring-boot:run
```
The Spring Boot backend will start on **http://localhost:8080**.
On initial launch, `AdminUserSeeder` automatically provisions the seed administrator:
- **Email:** `admin@learningpal.edu`
- **Password:** `AdminPass123`
- *Note:* Change these credentials in `application.properties` before deploying to production.

To run the automated 7-scenario integration test suite independently:
```bash
cd backend
mvn test
```

### Step C: Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The React + Vite frontend will start on **http://localhost:5173**.

---

## 3. Direct cURL Commands (Backend Verification Without React)

### Scenario 1: Student signup returns a token (HTTP 201)
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alex Rivera",
    "email": "alex.student@learningpal.edu",
    "password": "Password123",
    "role": "STUDENT"
  }'
```
**Expected Response:** HTTP `201 Created` with a populated `"token"`, `user.status: "ACTIVE"`, and `user.role: "STUDENT"`.

---

### Scenario 2: Weak password (letters only) is rejected with 400
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Weak Password User",
    "email": "weak@learningpal.edu",
    "password": "passwordonly",
    "role": "STUDENT"
  }'
```
**Expected Response:** HTTP `400 Bad Request`
```json
{
  "message": "Password needs at least one letter and one number"
}
```

---

### Scenario 3: Teacher signup returns NO token (HTTP 201, PENDING status)
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Maria Santos",
    "email": "maria.teacher@learningpal.edu",
    "password": "TeacherPass123",
    "role": "TEACHER"
  }'
```
**Expected Response:** HTTP `201 Created` with `user.status: "PENDING"` and no token:
```json
{
  "user": {
    "fullName": "Maria Santos",
    "email": "maria.teacher@learningpal.edu",
    "role": "TEACHER",
    "status": "PENDING"
  },
  "message": "Request sent. An admin needs to approve your teacher account before you can log in."
}
```

---

### Scenario 4: Teacher login before approval returns 403
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.teacher@learningpal.edu",
    "password": "TeacherPass123"
  }'
```
**Expected Response:** HTTP `403 Forbidden`
```json
{
  "message": "Your teacher account is awaiting admin approval"
}
```

---

### Scenario 5: Admin login, list pending teachers, and approve teacher

#### Step 5A: Admin logs in using seed credentials
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@learningpal.edu",
    "password": "AdminPass123"
  }'
```
*(Copy the `token` from this response as `ADMIN_TOKEN`)*

#### Step 5B: List pending teachers
```bash
curl -X GET http://localhost:8080/api/admin/teachers/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
**Expected Response:** HTTP `200 OK` returning an array containing `Maria Santos` with ID (e.g. `2`).

#### Step 5C: Approve teacher with ID 2
```bash
curl -X POST http://localhost:8080/api/admin/teachers/2/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
**Expected Response:** HTTP `200 OK`
```json
{
  "message": "Teacher account approved successfully"
}
```

---

### Scenario 6: Teacher login after approval succeeds (HTTP 200)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.teacher@learningpal.edu",
    "password": "TeacherPass123"
  }'
```
**Expected Response:** HTTP `200 OK` returning `{ "token": "<TEACHER_TOKEN>", "user": { "status": "ACTIVE", ... } }`.

Verify role endpoint access:
```bash
curl -X GET http://localhost:8080/api/teacher/ping \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```
**Expected Response:** HTTP `200 OK`
```json
{
  "message": "Teacher role authorization confirmed. Active session email: maria.teacher@learningpal.edu"
}
```

---

### Scenario 7: Student token calling an admin endpoint returns 403
```bash
curl -X GET http://localhost:8080/api/admin/teachers/pending \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```
**Expected Response:** HTTP `403 Forbidden`
```json
{
  "message": "You do not have permission to access this resource"
}
```

---

## 4. Key Engineering Assumptions

1. **Database dialect & local defaults**: Configured standard MySQL 8.x with `createDatabaseIfNotExist=true` and credentials `root`/`root`. For automated Maven tests (`mvn test`), an in-memory H2 database running in MySQL compatibility mode is configured under `@ActiveProfiles("test")` so test suites can run hermetically without requiring a local MySQL daemon.
2. **Password length upper bound**: Validated as 8 to 72 characters (72 characters matches the BCrypt password truncation limit standard). The regex `^(?=.*[A-Za-z])(?=.*\d).{8,72}$` ensures at least one alphabetical letter and one numeral.
3. **Admin account registration**: Rejects any signup attempt with `role: "ADMIN"` or invalid values, protecting administrative privileges from public endpoints. The admin account is initialized via `AdminUserSeeder` only when no admin exists in the database.
4. **Session restoration**: The frontend stores the token in `localStorage` under `learningpal_token` and restores session state asynchronously on load through `GET /api/auth/me`. If the token is invalid or expired, it is automatically cleared and the user is kept in anonymous state.
5. **Notebook aesthetic consistency**: Auth forms, dashboards, and admin screens use CSS-only styling (`bg-ruled-paper`, `notebook-margin-line`, hole-punch indicators, red margin dividers, and index-card tables) to maintain continuous brand consistency with the existing landing page without rebuilding it.

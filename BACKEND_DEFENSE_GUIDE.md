# LearningPal Backend Architecture & Oral Defense Guide

> **Review Context**: Senior Backend Architecture Review for Oral/Q&A Assessment  
> **Target Group**: `com.csit321g2.codebuds`  
> **Artifact**: `learningpal` (Increment 1 - Core CRUD)  
> **Tooling Note**: The `graphify` CLI module is not installed in the local environment (`ModuleNotFoundError: No module named 'graphify'`). All analysis in this document is derived from direct static analysis and source code inspection of `backend/src/`. Every claim reflects verified code.

---

## The Restaurant Analogy (Mental Model)

Before answering technical questions, keep this analogy in mind:
* **Client (Frontend/Postman)**: The diner who places orders and eats the meal.
* **Controller (The Waiter)**: Greets the diner, receives the order (HTTP Request), checks that the order slip is readable (format validation), passes the order to the kitchen, and serves the finished dish with the check (HTTP Response & Status Code).
* **DTO (The Order Slip / Takeout Box)**: The sanitized document that passes between the diner and the waiter. It leaves out secret kitchen recipes (such as password hashes) and packages only what the customer needs to see.
* **Service (The Chef / Kitchen Manager)**: Applies recipes and business rules (e.g., "Teachers must wait for manager approval before being seated", "Salt and hash passwords before cooking").
* **Repository (The Pantry Clerk)**: Knows exactly where ingredients are stored on shelves and speaks the storage dialect (SQL). Fetches and stores raw ingredients without troubling the chef about storage details.
* **Entity (The Raw Ingredient / Stock Card)**: The exact blueprint and shape of how data is stored in the pantry.
* **Database (Cold Storage / Pantry)**: The physical persistent storage on disk (MySQL).

---

## 1. Stack and Structure

### Technology Stack
* **Language**: Java 17 (`<java.version>17</java.version>` in `pom.xml`, runtime verified on OpenJDK 25).
* **Framework**: Spring Boot 3.3.4 (`spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `spring-boot-starter-data-jpa`).
* **Build Tool**: Apache Maven (via `mvnw.cmd` / Maven 3.9.9 wrapper).
* **Database**: MySQL (`mysql-connector-j` runtime driver, target database `learningpal_increment1` on port 3306).
* **ORM & Persistence**: Spring Data JPA / Hibernate ORM 6.5.3.Final (`spring.jpa.hibernate.ddl-auto=update`).
* **Authentication**: JJWT 0.12.6 (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`) using HMAC-SHA256 (`HS256`).

### Package & Folder Organization
Root package: `com.csit321g2.codebuds.learningpal`
```text
backend/src/main/java/com/csit321g2/codebuds/learningpal/
├── config/         # Security filter chain, JWT provider, CORS, and admin seeder
├── controller/     # REST API endpoint handlers (HTTP mappings, status codes)
├── dto/            # Request/Response payloads decoupled from database entities
├── entity/         # JPA Domain models mapping directly to MySQL tables and enums
├── exception/      # Centralized error handling (@RestControllerAdvice)
├── repository/     # Spring Data JPA data-access interfaces (CRUD & derived queries)
└── service/        # Core business rules, transactions, and credential verification
```

### Why Layered (Horizontal) Architecture?
* **What Was Chosen**: A layered architecture dividing the codebase by technical responsibility (`controller`, `service`, `repository`, `entity`, `dto`).
* **Why**: It enforces the Single Responsibility Principle for an academic/early-increment project. Each class has a single, well-defined technical job.
* **Alternative & Tradeoff**: A **feature-based (vertical slice)** architecture (e.g., grouping `TopicController`, `TopicService`, and `TopicRepository` inside a single `topic` package). Feature-based scales better for large engineering teams with dozens of micro-domains, but layered architecture is easier to navigate, inspect, and defend in a core CRUD project.

---

## 2. Core Entities & Database Mapping

The system defines **5 Core Domain Entities** and 1 Dependent Child Entity (`Choice`):

| Core Entity | Database Table | Purpose | Primary Key | Key Relationships |
| :--- | :--- | :--- | :--- | :--- |
| **User** | `users` | Manages credentials, roles, and approval states | `id` (AUTO_INCREMENT) | Referenced by `Attempt` (`student_id`) |
| **Topic** | `topics` | Subject categories for organizing quiz questions | `id` (AUTO_INCREMENT) | Referenced by `Question` (`topic_id`) |
| **Question** | `questions` | Individual assessment questions and points | `id` (AUTO_INCREMENT) | `@ManyToOne` Topic; `@OneToMany` Choices; `@ManyToMany` Assessments |
| **Assessment**| `assessments`| Quizzes/exams containing a set of questions | `id` (AUTO_INCREMENT) | `@ManyToMany` Questions via join table `assessment_questions` |
| **Attempt** | `attempts` | A student's test session and calculated scores | `id` (AUTO_INCREMENT) | `@ManyToOne` User (student); `@ManyToOne` Assessment |

### Auxiliary / Child Entity:
* **Choice** (`choices` table): Dependent child table representing multiple-choice options (`id`, `text`, `is_correct`, `display_order`). Mapped via unidirectional `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` inside `Question.java` with foreign key `question_id`.

### Entity Details & Annotations:
1. **User** (`entity/User.java`):
   * `@Entity`, `@Table(name = "users")`
   * Fields: `id` (`Long`), `fullName` (`String`), `email` (`unique = true, length = 180`), `passwordHash` (`String`), `role` (`Role`: `ADMIN`, `TEACHER`, `STUDENT`), `status` (`UserStatus`: `ACTIVE`, `PENDING`, `REJECTED`), `createdAt` (`Instant`).
   * `@PrePersist` sets `createdAt = Instant.now()`.

2. **Topic** (`entity/Topic.java`):
   * `@Entity`, `@Table(name = "topics")`
   * Fields: `id` (`Long`), `name` (`VARCHAR(150)`), `description` (`TEXT`), `displayOrder` (`Integer`), `status` (`TopicStatus`: `ACTIVE`, `ARCHIVED`), `createdAt` (`Instant`).
   * `@PrePersist` defaults `status = ACTIVE` and `displayOrder = 1`.

3. **Question** (`entity/Question.java`):
   * `@Entity`, `@Table(name = "questions")`
   * Fields: `id` (`Long`), `type` (`QuestionType`: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `ESSAY`), `text` (`TEXT`), `explanation` (`TEXT`), `difficulty` (`DifficultyLevel`: `EASY`, `MEDIUM`, `HARD`), `points` (`Double`), `createdAt` (`Instant`).
   * `@ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "topic_id")` references `Topic`.
   * `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER) @JoinColumn(name = "question_id")` owns `List<Choice>`.

4. **Assessment** (`entity/Assessment.java`):
   * `@Entity`, `@Table(name = "assessments")`
   * Fields: `id` (`Long`), `title` (`VARCHAR(200)`), `description` (`TEXT`), `status` (`AssessmentStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`), `timeLimitMinutes` (`Integer`), `createdAt` (`Instant`).
   * `@ManyToMany(fetch = FetchType.EAGER) @JoinTable(name = "assessment_questions", joinColumns = @JoinColumn(name = "assessment_id"), inverseJoinColumns = @JoinColumn(name = "question_id"))` links multiple questions.

5. **Attempt** (`entity/Attempt.java`):
   * `@Entity`, `@Table(name = "attempts")`
   * Fields: `id` (`Long`), `status` (`AttemptStatus`: `IN_PROGRESS`, `SUBMITTED`, `GRADED`, `ABANDONED`), `attemptNumber` (`Integer`), `startedAt` (`Instant`), `submittedAt` (`Instant`), `totalScore` (`Double`), `maxScore` (`Double`).
   * `@ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "student_id", nullable = false)` links to `User`.
   * `@ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "assessment_id", nullable = false)` links to `Assessment`.

---

## 3. Layer-by-Layer Breakdown (For Each Core Entity)

### 3.1 User Entity
* **Entity**: `entity/User.java`
* **Repository**: `repository/UserRepository.java` extends `JpaRepository<User, Long>`. Contains custom derived queries:
  - `Optional<User> findByEmail(String email)`
  - `boolean existsByEmail(String email)`
  - `boolean existsByRole(Role role)`
  - `List<User> findByRoleAndStatusOrderByCreatedAtDesc(Role role, UserStatus status)`
* **Service**:
  - `service/AuthService.java`: Handles signup password hashing via BCrypt, email normalization (`toLowerCase`), immediate token generation for `STUDENT`, pending status for `TEACHER`, and login credential validation.
  - `service/AdminService.java`: Approves/rejects pending teachers, altering user status inside transactions.
* **Controllers**:
  - `controller/AuthController.java`: `POST /api/auth/signup` (201), `POST /api/auth/login` (200), `GET /api/auth/me` (200).
  - `controller/AdminController.java`: `GET /api/admin/teachers/pending` (200), `POST /api/admin/teachers/{id}/approve` (200), `POST /api/admin/teachers/{id}/reject` (200).
  - `controller/UserController.java`: Core CRUD for users:
    - `GET /api/users` -> Returns `200 OK`, `List<UserDto>`
    - `GET /api/users/{id}` -> Returns `200 OK`, `UserDto`
    - `PUT /api/users/{id}` -> Body `UserDto`, returns `200 OK`, updated `UserDto`
    - `DELETE /api/users/{id}` -> Returns `204 No Content`
* **DTOs**: `UserDto.java`, `SignupRequest.java`, `LoginRequest.java`, `PendingTeacherDto.java`, `AuthResponse.java`.
  - *Tradeoff*: Hides `passwordHash` from ever reaching JSON clients via `UserDto.fromEntity(user)`.

### 3.2 Topic Entity
* **Entity**: `entity/Topic.java`
* **Repository**: `repository/TopicRepository.java` extends `JpaRepository<Topic, Long>`. Custom method: `findAllByOrderByDisplayOrderAsc()`.
* **Service**: *None* (Controller communicates directly with Repository).
* **Controller**: `controller/TopicController.java`:
  - `GET /api/topics` -> Returns `200 OK`, `List<Topic>`
  - `GET /api/topics/{id}` -> Returns `200 OK`, `Topic`
  - `POST /api/topics` -> Body `Topic`, returns `201 Created`, `Topic`
  - `PUT /api/topics/{id}` -> Body `Topic`, returns `200 OK`, `Topic`
  - `DELETE /api/topics/{id}` -> Returns `204 No Content`
* **DTOs**: *None* (Topic entity is accepted and returned directly).

### 3.3 Question Entity
* **Entity**: `entity/Question.java`
* **Repository**: `repository/QuestionRepository.java` extends `JpaRepository<Question, Long>`. Custom query: `List<Question> findByTopicId(Long topicId)`.
* **Service**: *None* (Controller communicates directly with `QuestionRepository` and `TopicRepository`).
* **Controller**: `controller/QuestionController.java`:
  - `GET /api/questions?topicId={id}` -> Returns `200 OK`, `List<Question>`
  - `GET /api/questions/{id}` -> Returns `200 OK`, `Question`
  - `POST /api/questions` -> Body `QuestionRequest`, returns `201 Created`, `Question`
  - `PUT /api/questions/{id}` -> Body `QuestionRequest`, returns `200 OK`, `Question`
  - `DELETE /api/questions/{id}` -> Returns `204 No Content`
* **DTOs**: `dto/QuestionRequest.java` allows client to pass `topicId` (as a foreign key ID) and nested `choices` instead of needing a full nested Topic entity.

### 3.4 Assessment Entity
* **Entity**: `entity/Assessment.java`
* **Repository**: `repository/AssessmentRepository.java` extends `JpaRepository<Assessment, Long>`.
* **Service**: *None* (Controller communicates directly with `AssessmentRepository` and `QuestionRepository`).
* **Controller**: `controller/AssessmentController.java`:
  - `GET /api/assessments` -> Returns `200 OK`, `List<Assessment>`
  - `GET /api/assessments/{id}` -> Returns `200 OK`, `Assessment`
  - `POST /api/assessments` -> Body `AssessmentRequest`, returns `201 Created`, `Assessment`
  - `PUT /api/assessments/{id}` -> Body `AssessmentRequest`, returns `200 OK`, `Assessment`
  - `DELETE /api/assessments/{id}` -> Returns `204 No Content`
* **DTOs**: `dto/AssessmentRequest.java` accepts `questionIds: List<Long>` so clients submit a list of IDs rather than full Question entities.

### 3.5 Attempt Entity
* **Entity**: `entity/Attempt.java`
* **Repository**: `repository/AttemptRepository.java` extends `JpaRepository<Attempt, Long>`. Custom queries:
  - `List<Attempt> findByStudentId(Long studentId)`
  - `List<Attempt> findByAssessmentId(Long assessmentId)`
* **Service**: *None* (Controller communicates directly with `AttemptRepository`, `UserRepository`, and `AssessmentRepository`).
* **Controller**: `controller/AttemptController.java`:
  - `GET /api/attempts?studentId={id}&assessmentId={id}` -> Returns `200 OK`, `List<Attempt>`
  - `GET /api/attempts/{id}` -> Returns `200 OK`, `Attempt`
  - `POST /api/attempts` -> Body `AttemptRequest`, returns `201 Created`, `Attempt`
  - `PUT /api/attempts/{id}` -> Body `AttemptRequest`, returns `200 OK`, `Attempt` (auto-stamps `submittedAt = Instant.now()` when status changes to `SUBMITTED` or `GRADED`)
  - `DELETE /api/attempts/{id}` -> Returns `204 No Content`
* **DTOs**: `dto/AttemptRequest.java` passes `studentId` and `assessmentId` as foreign key IDs.

---

## 4. Communication Flow & Dependency Injection

### Dependency Injection (How Layers Wire Together)
* **Mechanism**: Spring Inversion of Control (IoC) Container wires dependencies at application startup via **Constructor Injection**.
* **Immutability**: All dependencies are declared as `private final` fields.
* **Why Constructor Injection over `@Autowired` field injection?**
  1. Guarantees instances are fully initialized with required dependencies upon creation (cannot be instantiated in an invalid state).
  2. Makes unit testing straightforward (mocks can be passed directly to `new Controller(mockRepo)` without Spring reflection).
  3. Enforces immutability via `final`.

### Step-by-Step Request Tracing (CRUD on Core Entity: Topic)

```text
Client (HTTP Request)
       │
       ▼
 [DispatcherServlet] ─── (Intercepted by JwtAuthFilter)
       │
       ▼
 [TopicController]   ─── (Calls TopicRepository)
       │
       ▼
 [TopicRepository]   ─── (Invokes Hibernate EntityManager)
       │
       ▼
 [MySQL Database]
```

#### 1. CREATE: `POST /api/topics`
1. **Client -> Controller**: Client sends HTTP `POST /api/topics` with JSON body `{"name":"Java Basics","description":"Core OOP","displayOrder":1}` and `Authorization: Bearer <jwt>`.
2. **Filter & Dispatcher**: `JwtAuthFilter` validates the token and loads the user into `SecurityContextHolder`. `DispatcherServlet` routes the request to `TopicController.createTopic(@RequestBody Topic topic)`. Jackson deserializes the JSON into a `Topic` entity instance.
3. **Controller -> Repository**: `TopicController` executes `topicRepository.save(topic)`. Data type passed: `Topic`.
4. **Repository -> Database**: Spring Data JPA delegates to Hibernate `EntityManager.persist()`. `@PrePersist` populates `createdAt = Instant.now()`. An `INSERT INTO topics (...) VALUES (...)` SQL statement is executed. MySQL generates `id = 1`.
5. **Database -> Client**: Saved `Topic` with generated ID is returned to the controller. Controller wraps it in `ResponseEntity.status(HttpStatus.CREATED).body(saved)`. Client receives HTTP `201 Created` with the JSON payload.

#### 2. READ: `GET /api/topics/1`
1. **Client -> Controller**: Client sends `GET /api/topics/1`. Spring extracts `Long id = 1` from `@PathVariable`.
2. **Controller -> Repository**: Controller invokes `topicRepository.findById(1L)`. Data type passed: `Long`.
3. **Repository -> Database**: Hibernate runs `SELECT ... FROM topics WHERE id = 1`.
4. **Return Path**: Returns `Optional<Topic>`. If empty, `.orElseThrow()` triggers `ResourceNotFoundException`. If present, controller wraps it in `ResponseEntity.ok(topic)`. Client receives HTTP `200 OK`.

#### 3. UPDATE: `PUT /api/topics/1`
1. **Client -> Controller**: Client sends `PUT /api/topics/1` with updated fields.
2. **Controller -> Repository (Read first)**: Controller calls `topicRepository.findById(1L)` to retrieve the managed entity.
3. **State Mutation**: Controller updates only non-null fields on the existing object (`setName()`, etc.).
4. **Controller -> Repository (Save)**: Controller calls `topicRepository.save(existing)`. Hibernate detects dirty state and executes `UPDATE topics SET name = ?, ... WHERE id = 1`.
5. **Return Path**: Returns updated `Topic`. Controller returns `ResponseEntity.ok(saved)` (HTTP `200 OK`).

#### 4. DELETE: `DELETE /api/topics/1`
1. **Client -> Controller**: Client sends `DELETE /api/topics/1`.
2. **Controller -> Repository (Existence check)**: Controller calls `topicRepository.existsById(1L)`. Hibernate runs `SELECT count(*) FROM topics WHERE id = 1`.
3. **Execution**: If false, throws `ResourceNotFoundException` (HTTP 404). If true, executes `topicRepository.deleteById(1L)`. Hibernate issues `DELETE FROM topics WHERE id = 1`.
4. **Return Path**: Controller returns `ResponseEntity.noContent().build()` (HTTP `204 No Content`).

---

## 5. Cross-Cutting Concerns (Verified in Code)

1. **Centralized Exception Handling** (`exception/GlobalExceptionHandler.java`):
   * Annotated with `@RestControllerAdvice`.
   * Standardizes error responses into a single JSON envelope: `{ "message": "..." }` via `ErrorResponse`.
   * Maps specific exceptions to HTTP status codes:
     - `MethodArgumentNotValidException` -> **400 Bad Request**
     - `HttpMessageNotReadableException` -> **400 Bad Request**
     - `BadRequestException` -> **400 Bad Request**
     - `InvalidCredentialsException` -> **401 Unauthorized**
     - `AccountStatusException` -> **403 Forbidden**
     - `AccessDeniedException` -> **403 Forbidden**
     - `ResourceNotFoundException` -> **404 Not Found**
     - `DuplicateEmailException` -> **409 Conflict**
     - `Exception.class` (fallback) -> **500 Internal Server Error**

2. **Payload Validation**:
   * Uses Jakarta Bean Validation (`@Valid` on controller methods).
   * Verified in `dto/SignupRequest.java`: `@NotBlank`, `@Email`, `@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$")` enforcing 8+ characters with at least one letter and one number.

3. **Security & Authentication** (`config/SecurityConfig.java`):
   * **Stateless Session**: `SessionCreationPolicy.STATELESS` (no HTTP session cookies created or stored in server memory).
   * **CSRF Disabled**: Safe because authentication is stateless via `Authorization: Bearer <jwt>` headers, not browser-managed session cookies.
   * **Filter Pipeline**: `JwtAuthFilter` runs once per request before `UsernamePasswordAuthenticationFilter`.
   * **Password Hashing**: `BCryptPasswordEncoder` with salted hashes.
   * **Role Prefixing**: Roles in tokens (`STUDENT`, `TEACHER`, `ADMIN`) are prepended with `ROLE_` to satisfy Spring Security's `hasRole()` / `hasAnyRole()`.

4. **CORS Configuration**:
   * Configured via `CorsConfigurationSource` in `SecurityConfig.java` using `app.cors.allowed-origins` (`http://localhost:5173,http://localhost:3000`).
   * Allows `GET, POST, PUT, DELETE, PATCH, OPTIONS` with credentials and 1-hour pre-flight caching (`maxAge = 3600L`).

5. **Application Seeding** (`config/AdminUserSeeder.java`):
   * Implements `CommandLineRunner`. Runs immediately after Spring ApplicationContext loads.
   * Checks `userRepository.existsByRole(Role.ADMIN)`. If no admin exists, creates `admin@learningpal.edu` using credentials from `application.properties`.

6. **Transaction Management**:
   * Annotated with `@Transactional` on mutation methods in `AuthService` and `AdminService` ensuring atomicity (all-or-nothing rollback on failure).
   * Annotated with `@Transactional(readOnly = true)` on read operations (`login`, `getCurrentUser`, `getPendingTeachers`) to optimize Hibernate dirty-checking overhead.

---

## 6. Architecture Decisions & Tradeoffs (Crucial for Defense)

### Decision 1: Layered Architecture / Separation of Concerns
* **What**: Splitting code horizontally into Controllers, Services, Repositories, and Entities.
* **Why**: Single Responsibility Principle. HTTP protocol logic stays in Controllers, database queries stay in Repositories, business logic stays in Services.
* **Alternative**: Smart UI / Transaction Script (fat controllers with SQL).
* **Tradeoff**: Increases the number of files and boilerplate, but dramatically improves testability and maintainability.

### Decision 2: Service Layer vs Direct Controller-to-Repository Calls
* **What**: In this project, `AuthService` and `AdminService` handle complex user logic, while `TopicController`, `QuestionController`, `AssessmentController`, and `AttemptController` call Repositories directly.
* **Why**: For pure CRUD operations with no additional business logic in Increment 1, skipping the service layer reduced boilerplate and accelerated prototyping.
* **Alternative**: Mandatory Service interface + implementation for every entity (`TopicService`, `QuestionService`, etc.).
* **Tradeoff / Inconsistency**: Direct repository access in controllers creates architectural inconsistency. If business logic needs to be added later (e.g., verifying user permissions, auditing edits, computing attempt scores), it will pollute the controller unless refactored into a service.

### Decision 3: Spring Data JPA / Repository Pattern
* **What**: Extending `JpaRepository<T, ID>` instead of writing raw JDBC or DAO classes.
* **Why**: Spring automatically generates SQL implementations for standard CRUD and derived query methods (`findByTopicId`) at runtime, eliminating boilerplate SQL.
* **Alternative**: Raw JDBC (`JdbcTemplate`), MyBatis, or manual DAO implementations.
* **Tradeoff**: Abstracting SQL makes development faster, but complex queries can suffer from hidden performance issues (e.g., N+1 query problem) if lazy/eager loading is not carefully configured.

### Decision 4: DTOs vs Returning Entities Directly
* **What**: DTOs are used for Users (`UserDto`), Auth, and write requests (`QuestionRequest`, `AssessmentRequest`, `AttemptRequest`), but omitted for `Topic` (where the `Topic` entity is returned and accepted directly).
* **Why**: DTOs protect sensitive fields (preventing `passwordHash` from leaking in `UserDto`) and allow passing foreign key IDs (`topicId`, `questionIds`) instead of requiring full nested JSON entity objects. For `Topic`, the entity has no sensitive fields and matches the request format 1:1, so a DTO was omitted.
* **Alternative**: Strict DTOs for every single entity and operation.
* **Tradeoff**: Skipping DTOs on `Topic` creates tight coupling between the database schema and public API contract. Any schema rename on `Topic` immediately breaks the frontend API.

### Decision 5: Entity Relationships & FetchType
* **What**: `FetchType.EAGER` is placed on `@ManyToOne` (Question->Topic, Attempt->Student, Attempt->Assessment) and `@OneToMany` (Question->Choices), as well as `@ManyToMany` (Assessment->Questions).
* **Why**: Ensures that when an entity is retrieved, its related data is immediately loaded into memory, avoiding `LazyInitializationException` outside active transactions.
* **Alternative**: `FetchType.LAZY` with explicit `@EntityGraph` or `JOIN FETCH` queries.
* **Tradeoff / Weakness**: While convenient for small datasets, eager fetching on collections causes unnecessary database joins and risk of N+1 query overhead as the database scales.

### Decision 6: REST Conventions for Endpoints
* **What**: Standard HTTP verbs (`GET` for reading, `POST` for creation, `PUT` for updates, `DELETE` for removal) and status codes (`200`, `201`, `204`, `400`, `401`, `403`, `404`).
* **Why**: Follows industry-standard HTTP semantics, allowing standard HTTP clients (browsers, Axios, Postman) to handle caching and error handling predictably.
* **Alternative**: RPC-style endpoints (e.g., `POST /api/getTopic`, `POST /api/deleteTopic`).
* **Tradeoff**: REST requires disciplined URL structuring and multiple round-trips for nested relations compared to GraphQL.

### Decision 7: MySQL (Relational Database)
* **What**: Relational database with foreign key constraints.
* **Why**: The domain model is inherently relational (Topics have Questions, Questions have Choices, Assessments aggregate Questions, Attempts belong to Users and Assessments). ACID guarantees ensure score records and transactions are reliable.
* **Alternative**: NoSQL document store (e.g., MongoDB).
* **Tradeoff**: Requires schema migrations when adding new fields, whereas NoSQL is schema-less.

### Honest Codebase Weaknesses & Inconsistencies to Acknowledge
1. **Architectural Inconsistency in Service Usage**: `Topic`, `Question`, `Assessment`, and `Attempt` controllers bypass a service layer, whereas `User` operations go through `AuthService` and `AdminService`.
2. **Missing Topic DTO**: `TopicController` exposes the internal JPA entity directly.
3. **Overuse of `FetchType.EAGER`**: Question choices and assessment questions are fetched eagerly, which can hurt performance on large assessments.
4. **Hardcoded / Committed Secrets**: Default JWT secret and admin credentials reside in plain text in `application.properties`.
5. **Lack of Pagination**: `findAll()` is used across all controllers without `Pageable`, meaning retrieving topics, questions, or attempts will load the entire table into memory.
6. **Hard Deletes**: Entities are permanently deleted using `deleteById()` instead of soft deletion (`deleted_at` / `is_active = false`).

---

## 7. Likely Q&A for Oral Assessment Defense

#### Q1: "Walk me through how your backend is structured."
* **Answer**: "The backend follows a layered architecture divided by technical responsibility: the **Controller** layer handles HTTP requests and status codes; the **Service** layer encapsulates business rules and transactions (such as credential hashing and teacher approval); the **Repository** layer uses Spring Data JPA for database access; the **Entity** layer maps to our MySQL relational tables; and **DTOs** decouple internal database representations from external API contracts."

#### Q2: "Why do some controllers (like TopicController) call the Repository directly while AuthController uses a Service?"
* **Answer**: "In Increment 1, `Topic`, `Question`, `Assessment`, and `Attempt` only perform direct CRUD operations without intermediate business calculations or multi-step transactions, so calling the repository directly reduced boilerplate. Conversely, `User` requires BCrypt hashing, JWT issuance, email normalization, and multi-state approval workflows, which strictly require a dedicated `Service` layer. In a future refactoring, we plan to introduce service classes for all entities for consistency."

#### Q3: "What happens if you skip the Service layer in a production system?"
* **Answer**: "Skipping the Service layer forces business logic and transaction boundaries into either the Controller or the Repository. This violates the Single Responsibility Principle, makes unit testing harder because controllers become tightly coupled to database concerns, and prevents code reuse if multiple controllers or scheduled jobs need the same business logic."

#### Q4: "Where does input validation belong, and how is it implemented here?"
* **Answer**: "Format and presence validation belongs in the Controller/DTO layer, implemented via Jakarta Bean Validation annotations like `@NotBlank`, `@Email`, and `@Pattern` on `SignupRequest`, triggered by `@Valid` in the controller. Business rule validation belongs in the Service layer, such as checking for duplicate emails or verifying that an account is approved before login."

#### Q5: "Why do you use DTOs instead of returning entities directly?"
* **Answer**: "DTOs provide two major benefits: **security** and **decoupling**. In `UserDto`, we strictly omit `passwordHash` so sensitive credentials never leak over HTTP. In `QuestionRequest` and `AssessmentRequest`, DTOs allow the frontend to send clean foreign key IDs (like `topicId` or `questionIds`) instead of sending heavy nested database entities."

#### Q6: "How do your layers communicate with each other?"
* **Answer**: "Layers communicate downward through method calls on injected dependencies. The Controller calls the Service (or Repository), which calls the Repository, which calls the EntityManager. They are wired together via **Constructor Injection**, where Spring's IoC container passes singleton bean instances into `private final` fields."

#### Q7: "Why constructor injection instead of `@Autowired` on private fields?"
* **Answer**: "Constructor injection guarantees that a class cannot be instantiated in an incomplete or broken state without its dependencies. It also keeps fields `final` for immutability and makes unit testing simple because you can pass mock objects into the constructor without needing Spring reflection."

#### Q8: "How does your system know who is logged in on each request?"
* **Answer**: "Authentication is stateless using JWT. On protected requests, the frontend sends `Authorization: Bearer <token>`. Our `JwtAuthFilter` intercepts the request before it reaches the controller, validates the token signature and expiration via `JwtService`, extracts the email and role, and populates Spring's `SecurityContextHolder`. Controllers can then access the logged-in user via the `Authentication` object."

#### Q9: "Why is CSRF disabled in your SecurityConfig?"
* **Answer**: "CSRF attacks exploit browsers automatically attaching session cookies to cross-origin requests. Because our API is completely stateless and uses Bearer JWT tokens stored in request headers (which browsers never attach automatically), CSRF is not a vulnerability, so disabling it removes unnecessary overhead."

#### Q10: "What happens if a database operation fails halfway through teacher approval?"
* **Answer**: "Because `approveTeacher` in `AdminService` is annotated with `@Transactional`, Spring manages the transaction. If an exception occurs, the transaction rolls back completely to prevent inconsistent states in the database."

#### Q11: "Explain the relationship between Question and Choice."
* **Answer**: "It is a unidirectional composition using `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)`. A `Choice` cannot exist without a `Question`. When a Question is deleted or updated with a new list of choices, Hibernate automatically deletes orphaned choices from the `choices` table."

#### Q12: "Explain the relationship between Assessment and Question."
* **Answer**: "It is a `@ManyToMany` relationship mapped through a join table named `assessment_questions`. This allows a question to appear in multiple assessments, and an assessment to contain many questions, without duplicating question records."

#### Q13: "How does GlobalExceptionHandler work?"
* **Answer**: "It is annotated with `@RestControllerAdvice`. When any controller throws an uncaught exception, Spring intercepts it and routes it to the matching `@ExceptionHandler` method. For example, `ResourceNotFoundException` is caught and converted to an HTTP 404 response with a standardized JSON body `{'message': '...'}`."

#### Q14: "Why did you choose MySQL over MongoDB (NoSQL)?"
* **Answer**: "Our domain model is relational: students take assessments, assessments link to questions, questions belong to topics. MySQL enforces referential integrity through foreign keys and ensures ACID compliance, preventing orphaned records and ensuring score calculations are reliable."

#### Q15: "How would you scale this backend if traffic increased 100x?"
* **Answer**: "Three primary steps:
  1. **Stateless App Scaling**: Because our backend uses stateless JWTs and stores no session state in server memory, we can run multiple instances behind a load balancer (e.g., NGINX).
  2. **Database Optimization & Caching**: Introduce Redis to cache frequent read operations (like `GET /api/topics` and published assessments), and add read replicas for MySQL.
  3. **Pagination & Query Tuning**: Replace unbounded `findAll()` calls with `Pageable` and convert eager fetches to lazy loading with join-fetch queries."

#### Q16: "How would you handle database migrations in a production environment?"
* **Answer**: "Currently, we rely on `spring.jpa.hibernate.ddl-auto=update`, which is suitable for early development but dangerous for production because it cannot handle column renames, data migrations, or rollbacks. In production, we would set `ddl-auto=validate` and use a dedicated migration tool like **Flyway** or **Liquibase** to manage version-controlled, repeatable SQL migration scripts."

#### Q17: "What happens if an unauthenticated user calls `POST /api/topics`?"
* **Answer**: "`SecurityConfig` defines `.requestMatchers('/api/topics/**').authenticated()`. Spring Security intercepts the request before it reaches `TopicController`. Because there is no valid JWT, `RestAuthenticationEntryPoint` is invoked and returns an HTTP `401 Unauthorized` response with `{'message': 'Authentication is required to access this resource'}`."

#### Q18: "What is the difference between 401 Unauthorized and 403 Forbidden in your app?"
* **Answer**: "**401 Unauthorized** means the user is not authenticated (missing or invalid JWT token). **403 Forbidden** means the user is authenticated, but their role lacks permission (e.g., a `STUDENT` token trying to call an endpoint protected with `.hasRole('ADMIN')`), or their account status is `PENDING`."

#### Q19: "Why is `readOnly = true` used on `@Transactional` for read operations?"
* **Answer**: "In `AuthService.login` and `AdminService.getPendingTeachers`, `@Transactional(readOnly = true)` informs Hibernate that the entities will not be modified. Hibernate can skip dirty checking on those entities, which reduces memory consumption and improves query performance."

#### Q20: "If you had another sprint, what is the single biggest architectural improvement you would make?"
* **Answer**: "I would introduce dedicated service classes for `Topic`, `Question`, `Assessment`, and `Attempt` to eliminate direct repository access from controllers, add DTOs for `Topic`, and implement pagination with `Pageable` across all collection endpoints."

---

## 8. One-Page Defense Cheat Sheet

### Core Entities (5)
1. **User** (`users`): System actors with roles (`ADMIN`, `TEACHER`, `STUDENT`) and statuses (`ACTIVE`, `PENDING`, `REJECTED`).
2. **Topic** (`topics`): Learning categories grouping questions (`display_order`, `status`).
3. **Question** (`questions`): Assessment items with points, types, and cascaded child `choices`.
4. **Assessment** (`assessments`): Quizzes linked to questions via `assessment_questions` join table.
5. **Attempt** (`attempts`): Test sessions tracking student score, status, and submission timestamp.

### The Flow in One Line
`HTTP Request` $\rightarrow$ `JwtAuthFilter` $\rightarrow$ `Controller` $\rightarrow$ `Service (Business/Validation)` $\rightarrow$ `Repository (Spring Data JPA)` $\rightarrow$ `MySQL Database` $\rightarrow$ `DTO/Entity Response`

### Top 5 Architecture Decisions & 1-Sentence Justifications
1. **Layered Architecture**: Isolates HTTP handling, business logic, and database access into dedicated layers for testability and separation of concerns.
2. **Stateless JWT Security**: Stores session state in client-side cryptographically signed tokens, allowing seamless horizontal scaling without server-side session clustering.
3. **Spring Data JPA Repositories**: Eliminates SQL boilerplate by automatically generating CRUD and derived queries at runtime while maintaining type safety.
4. **DTO Layer for Sensitive Data**: Prevents security leaks (such as `passwordHash`) and shields public API contracts from internal database schema refactoring.
5. **Centralized `@RestControllerAdvice` Exception Handling**: Catches exceptions globally to ensure all error responses follow a uniform, client-friendly `{ "message": "..." }` envelope.

# LearningPal - Software Increment 1 (Core CRUD)

## Instructor Metadata
* **Group Name**: `com.csit321g2.codebuds`
* **Artifact**: `learningpal`
* **Base Commit**: `9c5a4ecc1534fddc04356d5a5d0c13dde60de5c0`

---

## Core Entities Included for Increment 1
1. **User** (`/api/users` & `/api/auth`)
   * Fields: `id`, `fullName`, `email`, `role`, `status`, `createdAt`
2. **Topic** (`/api/topics`)
   * Fields: `id`, `name`, `description`, `displayOrder`, `status`, `createdAt`
3. **Question** (`/api/questions`)
   * Fields: `id`, `topic`, `type`, `text`, `explanation`, `difficulty`, `points`, `choices`, `createdAt`
4. **Assessment** (`/api/assessments`)
   * Fields: `id`, `title`, `description`, `status`, `timeLimitMinutes`, `questions`, `createdAt`
5. **Attempt** (`/api/attempts`)
   * Fields: `id`, `student`, `assessment`, `status`, `attemptNumber`, `startedAt`, `submittedAt`, `totalScore`, `maxScore`

---

## Quick Start (Backend)

### 1. Database Setup
Create MySQL database (or let Spring Boot create it automatically):
```sql
CREATE DATABASE IF NOT EXISTS learningpal_increment1;
```
Check/update `backend/src/main/resources/application.properties`:
* `spring.datasource.username=root`
* `spring.datasource.password=root`

### 2. Run Backend
From the `backend` folder:
```bash
./mvnw clean spring-boot:run
```
*(On Windows Command Prompt or PowerShell: `.\mvnw.cmd spring-boot:run`)*

Default seeded Administrator account:
* **Email**: `admin@learningpal.edu`
* **Password**: `AdminPass123`

---

## Testing Endpoints with Postman

1. Open Postman.
2. Click **Import** and select `learningpal_increment1_postman_collection.json` located in the root of this project.
3. Run the **1. Authentication > Login (Admin)** request.
   * *Note*: The collection script automatically stores your Bearer token in the `{{token}}` variable.
4. Execute any of the CRUD operations for **Users**, **Topics**, **Questions**, **Assessments**, and **Attempts**.

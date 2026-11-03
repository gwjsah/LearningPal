# Super Administrator API: cURL Examples

Platform-level operations are guarded under `/api/super/**` and require a valid JWT bearer token belonging to a user with `ROLE_SUPER_ADMIN`.

---

## 1. Authentication

Log in as the platform Super Administrator to obtain a bearer token:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@learningpal.edu",
    "password": "YourSuperPassword123!"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "LearningPal Super Admin",
    "email": "superadmin@learningpal.edu",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "institutionId": null,
    "institutionName": null,
    "institutionCode": null
  }
}
```

Set the token in your shell:
```bash
TOKEN="<your_jwt_token_here>"
```

---

## 2. Provision a New Institution & Initial Administrator

Creates the institution and its initial school administrator atomically in one transaction:

```bash
curl -X POST http://localhost:8080/api/super/institutions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oakridge High School",
    "code": "OAKRIDGE-2026",
    "adminFullName": "Principal Sarah Jenkins",
    "adminEmail": "s.jenkins@oakridge.edu",
    "adminPassword": "SchoolAdmin2026!"
  }'
```

*Note: The `code` field is optional. If omitted, the server automatically generates a unique readable code (e.g., `INST-A92B1C`).*

Response (`201 Created`):
```json
{
  "id": 2,
  "name": "Oakridge High School",
  "code": "OAKRIDGE-2026",
  "status": "ACTIVE",
  "createdAt": "2026-11-03T06:30:00Z",
  "admin": {
    "id": 15,
    "fullName": "Principal Sarah Jenkins",
    "email": "s.jenkins@oakridge.edu",
    "role": "ADMIN",
    "status": "ACTIVE",
    "institutionId": 2,
    "institutionName": "Oakridge High School",
    "institutionCode": "OAKRIDGE-2026",
    "createdAt": "2026-11-03T06:30:00Z"
  }
}
```

---

## 3. List All Institutions with Metrics

Lists all institutions on the platform along with real-time registered user and class counts:

```bash
curl -X GET http://localhost:8080/api/super/institutions \
  -H "Authorization: Bearer $TOKEN"
```

Response (`200 OK`):
```json
[
  {
    "id": 1,
    "name": "Pilot University",
    "code": "PILOT-2026",
    "status": "ACTIVE",
    "createdAt": "2026-11-03T00:00:00Z",
    "userCount": 24,
    "classCount": 3
  },
  {
    "id": 2,
    "name": "Oakridge High School",
    "code": "OAKRIDGE-2026",
    "status": "ACTIVE",
    "createdAt": "2026-11-03T06:30:00Z",
    "userCount": 1,
    "classCount": 0
  }
]
```


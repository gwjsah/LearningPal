# Security Audit Report — LearningPal "Study Pal" Feature

**Date:** 2026-11-19  
**Scope:** Targeted security audit of the Study Pal backend endpoints, persistence layer, and frontend integration (`StudentPalController`, `AuthService`, `User`, `UserDto`, `SignupRequest`, `PalUpdateRequest`, `SecurityConfig`, `palEngine.js`, `PalAvatar.jsx`, `PalCompanionCard.jsx`, `FloatingPal.jsx`, `PalShowcase.jsx`, `InteractiveDemo.jsx`, `Signup.jsx`, `Settings.jsx`).  
**Verdict:** **CLEAN (0 Critical / High / Medium vulnerabilities; 1 Low defense-in-depth hardening applied and verified).**

---

## 1. Attack Surface & Trust Boundaries

| Surface | Principal | Control | Result |
| :--- | :--- | :--- | :--- |
| `PATCH /api/student/pal` | Authenticated `ROLE_STUDENT` (`ACTIVE`) | `SecurityConfig` `.requestMatchers("/api/student/**").hasRole("STUDENT")`; identity taken strictly from JWT `Authentication.getName()` | **Pass** — unauthenticated requests return `401`; non-student roles return `403`; zero IDOR surface (no client-supplied `userId`). |
| `POST /api/auth/signup` (Pal fields) | Public anonymous caller | `AuthService.signup()` applies Pal fields only for `Role.STUDENT` through `applyPalPreferences()` | **Pass** — teacher signups ignore Pal fields; invalid styles/colors/names return `400`. |
| `GET /api/auth/me` & `POST /api/auth/login` | Authenticated user | `UserDto.fromEntity()` returns only non-sensitive profile + Pal fields | **Pass** — `passwordHash` and internal tokens are never serialized. |
| Frontend Pal rendering (`FloatingPal`, `PalShowcase`, `InteractiveDemo`, `PalCompanionCard`) | Browser client | Pure React JSX text rendering; zero `dangerouslySetInnerHTML` | **Pass** — `palName` and diagnostic copy are auto-escaped by React. |
| LLM / Prompt Injection | N/A | `palEngine.js` is 100% deterministic rule-based logic | **Pass** — Study Pal never calls local LM Studio or Gemini APIs; zero prompt-injection surface. |

---

## 2. Detailed Checks

### A. Multi-Tenant & Cross-Student Isolation
- `PATCH /api/student/pal` accepts no user ID, class ID, or institution ID in the path or body. The backend resolves the target `User` strictly from the verified JWT subject (`authentication.getName()`), preventing horizontal privilege escalation or cross-tenant modification.
- `AuthService.updateStudentPal()` explicitly checks `user.getStatus() == UserStatus.ACTIVE`, blocking deactivated accounts from modifying preferences.
- On the frontend, `FloatingPal` only renders for `isAuthenticated && user?.role === 'STUDENT'`, and `usePalMoment()` consumes already-scoped per-class/per-student diagnostic data from existing authorized endpoints.

### B. Input Validation & Bounds
- `palStyle`: trimmed, lowercased, and allowlisted against `{"sticky", "owl", "cat", "shiba"}` (`400 Bad Request` otherwise).
- `palColor`: trimmed, lowercased, and allowlisted against `{"yellow", "mint", "pink", "sky"}` (`400 Bad Request` otherwise).
- `palName`: trimmed, defaulted to `"Pip"` when blank, hard-capped at `30` characters (matching `@Column(length = 30)`).
- `palEnabled` / `palQuietInQuiz`: strongly typed `Boolean` fields on `PalUpdateRequest`.

### C. Finding & Hardening Applied (Low / Defense-in-Depth)
- **Observation:** `AuthService.applyPalPreferences()` initially checked length (`<= 30`) but did not reject ISO control characters (`\r`, `\n`, `\0`, ANSI escapes) in `palName`, which could cause log-line injection or malformed accessibility labels.
- **Fix Applied:** Added `name.chars().anyMatch(Character::isISOControl)` guard in `AuthService.applyPalPreferences()`, returning `400 Bad Request` (`"Pal name cannot contain control characters"`).
- **Verification:** Added automated test assertions in `StudentPalTests.java` verifying `400` on control characters, `400` on invalid styles, and `401` on unauthenticated `PATCH /api/student/pal`.

### D. Secret & Token Hygiene
- Audited `authService.js`, `studentService.js`, `AuthContext.jsx`, `FloatingPal.jsx`, `PalShowcase.jsx`, `InteractiveDemo.jsx`, `Signup.jsx`, and `Settings.jsx`:
  - Zero `dangerouslySetInnerHTML` usage.
  - Zero API keys, `.env` values, or raw JWTs logged or embedded in Pal payloads.
  - `FloatingPal.jsx` stores only a `'1'` seen flag in `sessionStorage` (`learningpal_pal_seen_<onceKey>`).

---

## 3. Out-of-Scope Note
This audit is scoped exclusively to the Study Pal feature and its landing-page/demo integration; unrelated subsystems (e.g., teacher file uploads, AI question drafting) were not re-audited in this pass.

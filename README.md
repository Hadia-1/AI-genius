# AI-Genius – Secure JWT Authentication & RBAC API

A production-ready authentication and authorization subsystem built with **Node.js / Express** and **JSON Web Tokens (JWT)** implementing Role-Based Access Control (RBAC), token lifecycle management, and a secured mock AI backend.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Setup & Run](#setup--run)
- [Test Credentials](#test-credentials)
- [API Reference](#api-reference)
- [Security Design Decisions](#security-design-decisions)
- [Token Lifecycle Diagram](#token-lifecycle-diagram)

---

## Architecture Overview

```
Client
  │
  ├─ POST /api/auth/login  ──────────►  Verify bcrypt password
  │                                     Issue Access Token (15m) → JSON body
  │                                     Issue Refresh Token (7d) → httpOnly cookie
  │
  ├─ GET|POST|DELETE /api/ai/*  ──►  protect middleware (Bearer token)
  │                                     restrictTo middleware (RBAC)
  │                                     Controller handler
  │
  └─ POST /api/auth/refresh  ──────►  Read httpOnly cookie
                                       Verify + whitelist check
                                       Token rotation → new pair issued
```

---

## Project Structure

```
ai-genius/
├── src/
│   ├── server.js                   # Entry point
│   ├── app.js                      # Express app setup
│   ├── config/
│   │   └── jwt.js                  # Token generation & verification helpers
│   ├── controllers/
│   │   ├── authController.js       # login / refresh / logout
│   │   └── aiController.js         # Mock AI endpoint handlers
│   ├── middleware/
│   │   ├── authMiddleware.js       # protect + restrictTo (RBAC)
│   │   └── errorMiddleware.js      # Centralized error handler
│   ├── models/
│   │   └── db.js                   # Mock in-memory DB + refresh token whitelist
│   └── routes/
│       ├── authRoutes.js
│       └── aiRoutes.js
├── .env                            # Secrets (DO NOT commit)
├── .env.example                    # Template for environment variables
├── AI-Genius.postman_collection.json
└── package.json
```

---

## Setup & Run

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ai-genius
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and fill in your own secrets
```

### 3. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts at: **http://localhost:3000**

---

## Test Credentials

| Role         | Email                    | Password       |
|--------------|--------------------------|----------------|
| Admin        | admin@aigenius.com       | Admin@1234     |
| Premium_User | premium@aigenius.com     | Premium@1234   |
| Free_User    | free@aigenius.com        | Free@1234      |

---

## API Reference

### Auth Endpoints

| Method | Endpoint              | Description                              | Auth |
|--------|-----------------------|------------------------------------------|------|
| POST   | `/api/auth/login`     | Authenticate and receive tokens          | ❌   |
| POST   | `/api/auth/refresh`   | Silent refresh using httpOnly cookie     | ❌   |
| POST   | `/api/auth/logout`    | Revoke refresh token and clear cookie    | ❌   |

#### POST `/api/auth/login`

**Request body:**
```json
{
  "email": "admin@aigenius.com",
  "password": "Admin@1234"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "admin@aigenius.com", "role": "Admin" }
}
```
A `refreshToken` is also set as an `httpOnly` cookie.

---

### AI Endpoints

| Method | Endpoint                  | Allowed Roles                    |
|--------|---------------------------|----------------------------------|
| GET    | `/api/ai/free-model`      | Admin, Premium_User, Free_User   |
| POST   | `/api/ai/premium-model`   | Admin, Premium_User              |
| DELETE | `/api/ai/purge-cache`     | Admin only                       |

All AI endpoints require `Authorization: Bearer <accessToken>` header.

---

## Security Design Decisions

| Concern                  | Implementation                                                    |
|--------------------------|-------------------------------------------------------------------|
| Password storage         | `bcrypt` with salt rounds = 12 (no plaintext ever)               |
| Access token lifetime    | 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)             |
| Refresh token lifetime   | 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)                |
| Refresh token storage    | `httpOnly`, `secure`, `sameSite=strict` cookie                   |
| Token whitelist          | In-memory store (swap for Redis/DB in production)                |
| Token rotation           | On each refresh, old token is revoked and a new pair is issued   |
| RBAC                     | Middleware factory `restrictTo(...roles)` applied per route       |
| Error leakage            | Generic "Invalid credentials" for login; stack traces only in dev |
| Payload safety           | JWT payload contains only `id`, `email`, `role` – never password |
| Secret management        | All secrets in `.env` via `dotenv`; never hardcoded               |

---

## Token Lifecycle Diagram

```
  Login
    │
    ├──► Access Token (15m)  ──►  Sent in JSON response body
    │                              Client stores in memory only
    │
    └──► Refresh Token (7d)  ──►  Set in httpOnly cookie
                                   Stored in server whitelist

  API Call
    │
    └──► Authorization: Bearer <accessToken>
              │
              ├─ Valid    ──► 200 + Data
              └─ Expired  ──► 401 TOKEN_EXPIRED  ──► Client calls /refresh
                                                          │
                                                          ├─ Cookie valid  ──► New access token
                                                          └─ Cookie invalid/expired ──► Force re-login
```

---

## Postman Collection

Import `AI-Genius.postman_collection.json` into Postman to test the entire workflow:

1. Login as Admin → token auto-saved
2. Hit all three AI endpoints
3. Login as Free User → try premium endpoint → 403
4. Call refresh endpoint → new access token
5. Call with invalid token → 401

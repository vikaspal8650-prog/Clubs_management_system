# User Login and Authentication Flow

## Purpose

Shows login, cookie session restoration, refresh, logout and backend checks.

## Mermaid diagram

```mermaid
sequenceDiagram
  actor User
  participant UI as Login and AuthContext
  participant API as Express auth routes
  participant Auth as auth controller and middleware
  participant DB as PostgreSQL
  User->>UI: Submit credentials
  UI->>API: POST /api/auth/login
  API->>Auth: Rate limit and verify bcrypt password
  Auth->>DB: Read User
  alt Invalid credentials or inactive account
    Auth-->>UI: 401
  else Valid
    Auth->>DB: Store hashed RefreshSession token
    Auth-->>UI: User JSON and HttpOnly cookies
  end
  UI->>API: GET /api/auth/me
  API->>Auth: Verify JWT, status, tokenVersion and session
  Auth->>DB: Read User and RefreshSession
  opt Access token expires
    UI->>API: POST /api/auth/refresh
    Auth->>DB: Rotate hashed refresh token
  end
  User->>API: POST /api/auth/logout
  Auth->>DB: Revoke session and clear cookies
```

## Brief explanation

Implemented. Password reset/change endpoint not found.

## Actors involved

User; frontend API client; backend auth controller/middleware.

## Relevant APIs

POST /api/auth/login; GET /api/auth/me; POST /api/auth/refresh; POST /api/auth/logout.

## Relevant database models

User, RefreshSession.

## Implementation status

Implemented. Password reset/change endpoint not found.

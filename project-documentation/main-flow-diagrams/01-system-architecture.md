# Overall System Architecture

## Purpose

Shows implemented application boundaries.

## Mermaid diagram

```mermaid
flowchart LR
  subgraph FE[Frontend: React and Vite]
    UI[Role dashboards and shared components]
    ROUTER[React Router and ProtectedRoute]
    AUTH[AuthContext]
    SVC[API service modules]
    UI --> ROUTER --> AUTH --> SVC
  end
  subgraph BE[Backend: Express]
    MW[Helmet, CORS, parsing]
    ROUTES[REST routes and auth middleware]
    CTRL[Controllers]
    PRISMA[Prisma Client]
    MW --> ROUTES --> CTRL --> PRISMA
  end
  DB[(PostgreSQL models)]
  FILES[(UPLOAD_DIR local files)]
  SVC -->|/api HTTP, cookies| MW
  PRISMA --> DB
  CTRL -->|event file upload and retrieval| FILES
  DB -. fileUrl reference .-> FILES
```

## Brief explanation

Implemented architecture. File persistence depends on deployment configuration.

## Actors involved

Frontend: all roles. Backend: Express, Prisma. Storage: PostgreSQL and local files.

## Relevant APIs

All API routes are mounted under /api; GET /api/health.

## Relevant database models

User, Department, Club, Event, Attendance, Document, CertificateRecord, RefreshSession.

## Implementation status

Implemented architecture. File persistence depends on deployment configuration.

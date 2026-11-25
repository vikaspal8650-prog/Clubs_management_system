# Student Coordinator Appointment Flow

## Purpose

Shows coordinator as a Student with club-specific assignment privileges.

## Mermaid diagram

```mermaid
sequenceDiagram
  actor Appointer as DSW or assigned Faculty
  participant UI as FacultyDashboard
  participant API as POST /api/clubs/:id/appoint-coordinator
  participant C as club controller
  participant DB as PostgreSQL
  Appointer->>UI: Select student
  UI->>API: Submit studentId
  API->>C: Verify role and club assignment
  C->>DB: Verify Club and STUDENT User
  alt Invalid or unauthorized
    C-->>UI: 400 or 403
  else Valid
    C->>DB: Upsert ClubCoordinator ACTIVE
    C->>DB: Upsert ClubMember
    DB-->>C: Assignment
    C-->>UI: 201 assignment
  end
  UI->>API: GET /api/auth/me
  API->>DB: Load active assignments for profile
  Note over UI,DB: User role remains STUDENT; removal marks assignment INACTIVE.
```

## Brief explanation

Implemented; coordinator is not a separate authentication role.

## Actors involved

DSW or assigned Faculty; appointed Student.

## Relevant APIs

POST /api/clubs/:id/appoint-coordinator; DELETE /api/clubs/:id/coordinators/:studentId; GET /api/auth/me.

## Relevant database models

User, Club, ClubCoordinator, ClubMember.

## Implementation status

Implemented; coordinator is not a separate authentication role.

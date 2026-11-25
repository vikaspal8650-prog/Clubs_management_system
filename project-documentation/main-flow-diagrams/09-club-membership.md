# Club Membership Flow

## Purpose

Shows student club join and duplicate prevention.

## Mermaid diagram

```mermaid
sequenceDiagram
  actor Student
  participant UI as StudentDashboard and clubService
  participant API as POST /api/clubs/:id/join
  participant C as club.controller.joinClub
  participant DB as PostgreSQL
  Student->>UI: Select club and join
  UI->>API: Authenticated request
  API->>C: Verify Student role and club
  alt Club missing or wrong role
    C-->>UI: 404 or 403
  else Valid
    C->>DB: Upsert ClubMember by clubId and userId
    DB-->>C: Membership record
    C-->>UI: 201 membership
  end
  UI->>API: GET /api/clubs
  API->>DB: Read club and caller membership state
  Note over C,DB: Unique clubId plus userId prevents duplicate membership.
```

## Brief explanation

Implemented. Leave/unjoin endpoint not found.

## Actors involved

Student; backend.

## Relevant APIs

POST /api/clubs/:id/join; GET /api/clubs.

## Relevant database models

Club, ClubMember, User.

## Implementation status

Implemented. Leave/unjoin endpoint not found.

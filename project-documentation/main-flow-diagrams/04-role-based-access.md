# Role-Based Access Control Flow

## Purpose

Separates frontend navigation guards from server authorization.

## Mermaid diagram

```mermaid
flowchart TD
  Req[Request] --> Cookie[Read cookie or Bearer token]
  Cookie --> Verify{JWT valid?}
  Verify -->|No| E401[401]
  Verify -->|Yes| User[Check active User and tokenVersion]
  User --> Session{Session valid?}
  Session -->|No| E401
  Session -->|Yes| Role{Route permits role?}
  Role -->|No| E403[403]
  Role -->|Yes| Scope{Department or club scope valid?}
  Scope -->|No| Scope403[403]
  Scope -->|Yes| Handler[Controller and Prisma operation]
  UI[ProtectedRoute checks dashboard role] -. frontend navigation guard .-> Role
  Coord[Coordinator = Student plus ClubCoordinator assignment] --> Scope
```

## Brief explanation

Implemented role gates and resource checks. Frontend guard alone is not authorization.

## Actors involved

DSW, HOD, Faculty Incharge, Student; coordinator is an assignment privilege.

## Relevant APIs

Role gates in backend/src/routes; GET /api/auth/me.

## Relevant database models

User, RefreshSession, ClubCoordinator, Club, Department, Event.

## Implementation status

Implemented role gates and resource checks. Frontend guard alone is not authorization.

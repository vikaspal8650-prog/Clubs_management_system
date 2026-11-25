# Faculty Management Flow

## Purpose

Shows DSW provisioning and Faculty operations constrained to assigned clubs.

## Mermaid diagram

```mermaid
flowchart TD
  DSW[DSW] --> Create[POST /api/users/faculty]
  Create --> Validate{Fields valid?}
  Validate -->|No| Err[400 response]
  Validate -->|Yes| Hash[Hash password and create Faculty User]
  Hash --> U[(User)]
  DSW --> Assign[Set facultyInchargeId on Club]
  Assign --> C[(Club)]
  Faculty[Faculty Incharge] --> Review[Review event for assigned club]
  Faculty --> Coord[Appoint or remove coordinator]
  Faculty --> Attend[Create session for permitted event]
  C --> Scope{Controller assignment check}
  Scope -->|Allowed| Done[Process action]
  Scope -->|Denied| Forbidden[403]
  U --> Faculty
```

## Brief explanation

Implemented. Faculty accounts are User rows, not a separate model.

## Actors involved

DSW; Faculty Incharge; Students in assigned clubs.

## Relevant APIs

POST /api/users/faculty; POST/PUT /api/clubs; POST /api/clubs/:id/appoint-coordinator; POST /api/events/:id/approval; POST /api/events/attendance/sessions.

## Relevant database models

User, Club, ClubCoordinator, Event, AttendanceSession.

## Implementation status

Implemented. Faculty accounts are User rows, not a separate model.

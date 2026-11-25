# Event Publication and Student Registration Flow

## Purpose

Shows APPROVED status as publication and student registration.

## Mermaid diagram

```mermaid
flowchart TD
  Approved[Event status APPROVED] --> List[GET /api/events: students see approved events]
  List --> Student[Student selects event]
  Student --> Register[POST /api/events/:id/register]
  Register --> Check{Approved and capacity available?}
  Check -->|No| Deny[400 not open or full]
  Check -->|Yes| Create[Create EventRegistration]
  Create --> Unique{Already registered?}
  Unique -->|Yes| Conflict[400 duplicate]
  Unique -->|No| DB[(EventRegistration)]
  DB --> Dashboard[Show registration state]
  Note[Capacity check and insert are separate; concurrent overbooking risk] -.-> Register
```

## Brief explanation

Implemented. Publication is the APPROVED status; no separate publish API.

## Actors involved

HOD approves; Student registers.

## Relevant APIs

GET /api/events; POST /api/events/:id/register.

## Relevant database models

Event, Club, EventRegistration, User.

## Implementation status

Implemented. Publication is the APPROVED status; no separate publish API.

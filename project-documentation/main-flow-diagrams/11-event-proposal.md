# Event Proposal Submission Flow

## Purpose

Shows coordinator event submission and optional supporting attachment.

## Mermaid diagram

```mermaid
sequenceDiagram
  actor Coord as Student Coordinator
  participant UI as StudentDashboard and eventService
  participant API as POST /api/events
  participant C as event.controller.createEvent
  participant DB as PostgreSQL
  participant FS as UPLOAD_DIR
  Coord->>UI: Enter event fields and optional file
  UI->>API: Multipart supportingDocument
  API->>C: Student auth; PDF, PNG, JPG up to 2 MB
  C->>DB: Find ClubCoordinator assignment
  alt No assignment
    C-->>UI: 403
  else Assignment exists
    C->>DB: Create Event with PENDING_FACULTY
    opt Attachment supplied
      C->>FS: Store uploaded file
      C->>DB: Create Document reference
    end
    C->>DB: Create notification and activity log
    C-->>UI: 201 event
  end
  Note over C,DB: This path checks assignment existence, not ACTIVE status.
```

## Brief explanation

Implemented. Same-event edit/revision endpoint not found; active status omission is a gap.

## Actors involved

Student Coordinator (base role STUDENT); Faculty notification recipient.

## Relevant APIs

POST /api/events multipart; GET /api/events.

## Relevant database models

ClubCoordinator, Event, Document, Notification, ActivityLog, Club.

## Implementation status

Implemented. Same-event edit/revision endpoint not found; active status omission is a gap.

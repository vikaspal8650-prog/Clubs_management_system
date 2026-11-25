# Event Rejection and Resubmission Flow

## Purpose

Distinguishes implemented rejection from absent same-event proposal revision.

## Mermaid diagram

```mermaid
flowchart TD
  Pending[Pending Faculty or HOD] --> Decision{Reviewer decision}
  Decision -->|Reject| Reject[Set stage rejection status and reason]
  Decision -->|DSW rejects| Override[Set OVERRIDDEN_BY_DSW]
  Reject --> Log[Create EventApproval; notify coordinator]
  Override --> Log
  Log --> DB[(Event and EventApproval)]
  Reject --> Gap[No event edit or resubmit API found]
  Override --> Gap
  Gap -. proposed only, not implemented .-> New[Coordinator may submit a new proposal if UI permits]
  classDef proposed fill:#fff3cd,stroke:#c99a00,color:#333
  class New proposed
```

## Brief explanation

Rejection is implemented. Resubmission/revision of the same event is not found in routes/controllers.

## Actors involved

Faculty Incharge, HOD, DSW, Student Coordinator.

## Relevant APIs

POST /api/events/:id/approval; POST /api/events for a new proposal.

## Relevant database models

Event, EventApproval, Notification, ActivityLog.

## Implementation status

Rejection is implemented. Resubmission/revision of the same event is not found in routes/controllers.

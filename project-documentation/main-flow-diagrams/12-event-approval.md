# Complete Event Approval Flow

## Purpose

Shows actual review path and DSW reject/override behavior.

## Mermaid diagram

```mermaid
stateDiagram-v2
  [*] --> PENDING_FACULTY: Student Coordinator submits
  PENDING_FACULTY --> PENDING_HOD: Assigned Faculty approves
  PENDING_FACULTY --> REJECTED_BY_FACULTY: Faculty rejects
  PENDING_HOD --> APPROVED: Department HOD approves
  PENDING_HOD --> REJECTED_BY_HOD: HOD rejects
  PENDING_FACULTY --> OVERRIDDEN_BY_DSW: DSW rejects/overrides
  PENDING_HOD --> OVERRIDDEN_BY_DSW: DSW rejects/overrides
  APPROVED --> OVERRIDDEN_BY_DSW: DSW rejects/overrides
  note right of APPROVED: HOD approval sets officiallyDeclared=true
  note right of OVERRIDDEN_BY_DSW: DSW cannot approve through this controller
```

## Brief explanation

Faculty then HOD approval is implemented. DSW may reject/override but is not a required final approver.

## Actors involved

Student Coordinator; assigned Faculty; department HOD; DSW.

## Relevant APIs

POST /api/events/:id/approval; alias POST /api/events/:id/approve.

## Relevant database models

Event, EventApproval, Notification, ActivityLog, Club, User.

## Implementation status

Faculty then HOD approval is implemented. DSW may reject/override but is not a required final approver.

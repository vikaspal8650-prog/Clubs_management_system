# Dashboard and Analytics Data Flow

## Purpose

Shows role dashboards and the limited aggregate analytics endpoints.

## Mermaid diagram

```mermaid
flowchart LR
  subgraph FE[Role dashboards]
    DSW[DSW]
    HOD[HOD]
    Faculty[Faculty Incharge]
    Student[Student]
    S[Frontend services]
    DSW --> S
    HOD --> S
    Faculty --> S
    Student --> S
  end
  S --> E[GET /api/events]
  S --> C[GET /api/clubs]
  S --> A[GET /api/events/me/attendance]
  S --> CERT[GET /api/certificates]
  S --> P[GET /api/analytics/event-participation]
  S --> M[GET /api/analytics/club-membership]
  E --> ED[(Event and EventRegistration)]
  C --> CD[(Club and ClubMember)]
  A --> AD[(Attendance)]
  CERT --> CERTD[(CertificateRecord)]
  P --> ED
  M --> CD
  Gap[No general dashboard-statistics or department-analytics endpoint verified]:::gap
  Gap -.-> S
  classDef gap fill:#fff3cd,stroke:#c99a00,color:#333
```

## Brief explanation

Dashboards implemented. Aggregates are limited to event registrations and club membership.

## Actors involved

DSW, HOD, Faculty Incharge, Student.

## Relevant APIs

GET /api/events; GET /api/clubs; GET /api/events/me/attendance; GET /api/certificates; GET /api/analytics/event-participation; GET /api/analytics/club-membership.

## Relevant database models

Event, EventRegistration, Club, ClubMember, Attendance, CertificateRecord, User.

## Implementation status

Dashboards implemented. Aggregates are limited to event registrations and club membership.

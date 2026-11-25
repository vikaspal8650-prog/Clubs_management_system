# DSW Administration Flow

## Purpose

Shows verified administrative APIs and DSW event decision limitation.

## Mermaid diagram

```mermaid
flowchart TD
  DSW[DSW dashboard] --> Users[GET /api/users]
  DSW --> Stats[GET /api/users/stats]
  DSW --> HOD[POST /api/users/hod]
  DSW --> Faculty[POST /api/users/faculty]
  DSW --> Depts[Department CRUD]
  DSW --> Clubs[Club CRUD]
  DSW --> Analytics[Analytics endpoints]
  Users --> U[(User)]
  Stats --> U
  HOD --> U
  Faculty --> U
  Depts --> D[(Department)]
  Clubs --> C[(Club)]
  Analytics --> A[(EventRegistration and ClubMember)]
  Note[DSW event action is reject or override only; it cannot approve]:::note
  DSW -.-> Note
  classDef note fill:#fff3cd,stroke:#c99a00,color:#333
```

## Brief explanation

Implemented administration routes. Initial DSW account creation is unverified.

## Actors involved

DSW; provisioned HOD and Faculty.

## Relevant APIs

GET /api/users; GET /api/users/stats; POST /api/users/hod; POST /api/users/faculty; department, club, analytics endpoints.

## Relevant database models

User, Department, Club, EventRegistration, ClubMember.

## Implementation status

Implemented administration routes. Initial DSW account creation is unverified.

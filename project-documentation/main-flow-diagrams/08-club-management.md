# Club Creation and Management Flow

## Purpose

Shows DSW club CRUD and optional relational assignments.

## Mermaid diagram

```mermaid
flowchart TD
  DSW[DSW] --> Form[Club fields and optional department, HOD, Faculty IDs]
  Form --> Resolve[Resolve referenced records]
  Resolve --> Valid{References valid?}
  Valid -->|No| Error[400 error]
  Valid -->|Yes| Save[POST /api/clubs or PUT /api/clubs/:id]
  Save --> Club[(Club)]
  Club --> Dept[Optional Department relation]
  Club --> HOD[Optional HOD User relation]
  Club --> Faculty[Optional FacultyIncharge User relation]
  DSW --> Delete[DELETE /api/clubs/:id]
  Delete --> Tx[Transaction removes selected dependents and Club]
```

## Brief explanation

Implemented. Delete does not explicitly remove every dependent type, including certificate records and attendance sessions.

## Actors involved

DSW; HOD; Faculty Incharge; Student members.

## Relevant APIs

GET/POST /api/clubs; PUT/DELETE /api/clubs/:id.

## Relevant database models

Club, Department, User, ClubMember, ClubCoordinator, Event, EventApproval, EventRegistration, Attendance, Document.

## Implementation status

Implemented. Delete does not explicitly remove every dependent type, including certificate records and attendance sessions.

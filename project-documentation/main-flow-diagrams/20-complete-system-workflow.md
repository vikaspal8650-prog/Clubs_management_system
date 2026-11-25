# Complete End-to-End System Workflow

## Purpose

Connects source-verified account, club, event, attendance, certificate and analytics stages.

## Mermaid diagram

```mermaid
flowchart TD
  Start([College users]) --> StudentReg[Student registration]
  Start --> Staff[DSW provisions HOD and Faculty]
  StudentReg --> Login[Login and cookie session]
  Staff --> Login
  Login --> Dept[DSW manages Department and HOD link]
  Dept --> Club[DSW creates Club and assigns Faculty]
  Club --> Join[Student joins club]
  Join --> Coord[Faculty/DSW appoints Student Coordinator]
  Coord --> Proposal[Coordinator submits proposal and optional file]
  Proposal --> Faculty{Assigned Faculty review}
  Faculty -->|Reject| Rejected[Rejected; same-event revision absent]
  Faculty -->|Approve| HOD{Department HOD review}
  HOD -->|Reject| Rejected
  HOD -->|Approve| Published[Event APPROVED]
  Published --> Register[Student registers]
  Register --> Session[Staff creates QR session]
  Session --> Attendance[Eligible student check-in]
  Attendance --> Cert[Coordinator submits eligible prize winners]
  Cert --> Review[Faculty then HOD then DSW certificate review]
  Review --> PDF[Student views or exports PDF]
  Published --> Analytics[Role-scoped analytics]
  Attendance --> Reports[Attendance listing]
  Rejected --> Override[DSW may reject/override; cannot approve]
  Note[Coordinator remains STUDENT. General repository and password recovery not verified.]:::gap
  Note -.-> Coord
  classDef gap fill:#fff3cd,stroke:#c99a00,color:#333
```

## Brief explanation

End-to-end modules exist in source; production and live behavior unverified. DSW event permission is reject/override only.

## Actors involved

Student, Student Coordinator privilege, Faculty Incharge, HOD, DSW.

## Relevant APIs

Uses auth, user, department, club, event, attendance, certificate and analytics endpoints documented in files 02-19.

## Relevant database models

User, Department, Club, ClubMember, ClubCoordinator, Event, EventApproval, EventRegistration, AttendanceSession, Attendance, Document, CertificateRecord, RefreshSession.

## Implementation status

End-to-end modules exist in source; production and live behavior unverified. DSW event permission is reject/override only.

# QR Code Attendance Flow

## Purpose

Shows session generation and authenticated student check-in through QR URL.

## Mermaid diagram

```mermaid
sequenceDiagram
  actor Staff as Faculty, HOD or DSW
  actor Student
  participant UI as Dashboard and AttendanceMark
  participant API as Event attendance routes
  participant DB as PostgreSQL
  Staff->>API: POST /api/events/attendance/sessions with eventId
  API->>DB: Verify approved event and staff scope
  API->>DB: Close prior session and create two-hour signed-token session
  API-->>UI: Token and expiry
  UI-->>Student: Display QR link /attendance/mark?session=token
  Student->>UI: Open link and authenticate
  UI->>API: GET /api/events/attendance/sessions/:token
  API->>DB: Verify token, session, registration and club membership
  UI->>API: POST /api/events/attendance/sessions/:token/check-in
  API->>DB: Create PRESENT Attendance
  alt Duplicate event/student
    DB-->>API: Unique constraint; 409
  else New record
    DB-->>API: Attendance row
    API-->>UI: Check-in success
  end
  Note over UI: QR is displayed; camera-based scanning is not found.
```

## Brief explanation

Session and check-in implemented. No in-app camera scanner found; authentication, registration and membership are required.

## Actors involved

Faculty Incharge, HOD, DSW; registered club-member Student.

## Relevant APIs

POST /api/events/attendance/sessions; GET /api/events/attendance/sessions; GET /api/events/attendance/sessions/:token; POST /api/events/attendance/sessions/:token/check-in.

## Relevant database models

AttendanceSession, Attendance, Event, EventRegistration, ClubMember, User.

## Implementation status

Session and check-in implemented. No in-app camera scanner found; authentication, registration and membership are required.

# Attendance Management and Reporting Flow

## Purpose

Shows attendance record creation and role-scoped listing, with legacy path noted.

## Mermaid diagram

```mermaid
flowchart TD
  Session[Approved event session] --> Checkin[Student follows QR link]
  Checkin --> Verify{Valid session, registered and member?}
  Verify -->|No| Denied[401, 403 or expired]
  Verify -->|Yes| Record[Create PRESENT Attendance]
  Record --> Unique{Unique eventId and userId?}
  Unique -->|Duplicate| Conflict[409 already recorded]
  Unique -->|New| DB[(Attendance)]
  DB --> StudentView[GET /api/events/me/attendance: own records]
  DB --> StaffView[GET /api/events/me/attendance?eventId=id: scoped staff records]
  Legacy[POST /api/events/:id/attendance] --> Block[Controller returns 403]
  Gap[No attendance export/report API found] -.-> StaffView
```

## Brief explanation

Record/listing implemented. Reporting is limited; legacy direct-mark endpoint is not an alternate path.

## Actors involved

Student; Faculty Incharge; HOD; DSW.

## Relevant APIs

GET /api/events/me/attendance; QR session endpoints; legacy POST /api/events/:id/attendance returns 403.

## Relevant database models

Attendance, AttendanceSession, Event, User, Club.

## Implementation status

Record/listing implemented. Reporting is limited; legacy direct-mark endpoint is not an alternate path.

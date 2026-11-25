# User Registration Flow

## Purpose

Shows public Student registration and distinguishes DSW-provisioned staff.

## Mermaid diagram

```mermaid
sequenceDiagram
  actor Student
  participant UI as RegisterStudent
  participant API as POST /api/auth/register
  participant C as auth.controller.register
  participant DB as PostgreSQL
  Student->>UI: Enter identity, academic and password fields
  UI->>API: Submit JSON
  API->>C: Rate limit and validate
  C->>C: bcrypt hash password
  alt Invalid input
    C-->>UI: 400 validation error
  else Valid input
    C->>DB: Create active STUDENT User
    alt Duplicate email or roll number
      DB-->>C: Unique constraint error
      C-->>UI: 409 conflict
    else Created
      DB-->>C: User
      C-->>UI: 201 user without password
    end
  end
  Note over UI,API: DSW provisions HOD and Faculty through separate endpoints.
```

## Brief explanation

Student registration implemented. Initial DSW account creation is not established by these endpoints.

## Actors involved

Student; DSW for staff provisioning.

## Relevant APIs

POST /api/auth/register; POST /api/users/hod; POST /api/users/faculty.

## Relevant database models

User.

## Implementation status

Student registration implemented. Initial DSW account creation is not established by these endpoints.

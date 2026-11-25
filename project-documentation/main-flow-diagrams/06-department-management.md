# Department Management Flow

## Purpose

Shows DSW department CRUD and optional unique HOD assignment.

## Mermaid diagram

```mermaid
flowchart TD
  DSW[DSW] --> Read[GET /api/departments]
  DSW --> Form[Name, code, description, optional HOD]
  Form --> Check{Required fields and HOD valid?}
  Check -->|No| Error[400 or 409]
  Check -->|Yes| Save[POST /api/departments or PUT /api/departments/:id]
  Save --> DB[(Department)]
  DB --> HOD[Optional unique hodId relation to User]
  DSW --> Delete[DELETE /api/departments/:id]
  Delete --> Detach[HOD and Club department relations can be set null]
  Detach --> DB
```

## Brief explanation

Implemented. Department and student branch fields may differ.

## Actors involved

DSW; optional HOD.

## Relevant APIs

GET/POST /api/departments; PUT/DELETE /api/departments/:id.

## Relevant database models

Department, User, Club.

## Implementation status

Implemented. Department and student branch fields may differ.

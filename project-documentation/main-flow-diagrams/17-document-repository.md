# Document Repository Flow

## Purpose

Documents implemented are event proposal attachments, not a general repository.

## Mermaid diagram

```mermaid
flowchart TD
  Coord[Student Coordinator proposal] --> Upload[Optional multipart supportingDocument]
  Upload --> Valid{PDF, PNG or JPG and <=2 MB?}
  Valid -->|No| Reject[400 or 413]
  Valid -->|Yes| Store[Store in UPLOAD_DIR]
  Store --> Row[Create Document with fileUrl and Event relation]
  Row --> DB[(Document)]
  Reader[Authorized reviewer] --> Get[GET /uploads/:file]
  Get --> Auth{Authenticated and resource role allowed?}
  Auth -->|No| Deny[401, 403 or 404]
  Auth -->|Yes| Send[Send file from UPLOAD_DIR]
  Send -.-> Store
  Missing[General repository, arbitrary uploads and certificate file storage absent]:::gap
  Missing -.-> DB
  classDef gap fill:#fff3cd,stroke:#c99a00,color:#333
```

## Brief explanation

Partial. Event proposal file upload and protected retrieval exist; no general repository API found.

## Actors involved

Student Coordinator; Faculty; department HOD; DSW; authorized reader.

## Relevant APIs

POST /api/events multipart; authenticated GET /uploads/:file.

## Relevant database models

Document, Event, Club, User.

## Implementation status

Partial. Event proposal file upload and protected retrieval exist; no general repository API found.

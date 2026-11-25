# Certificate Generation and Distribution Flow

## Purpose

Shows three-student certificate batch, approvals, resubmission and client PDF export.

## Mermaid diagram

```mermaid
flowchart TD
  Coord[Active Student Coordinator] --> Batch[POST /api/certificates/batches: three distinct winners]
  Batch --> Valid{Event/club match; students present?}
  Valid -->|No| Error[400, 403 or 404]
  Valid -->|Yes| Create[Create CertificateRecord rows and JSON payload]
  Create --> Faculty{Assigned Faculty review}
  Faculty -->|Reject with reason| Rejected[REJECTED]
  Faculty -->|Approve| HOD{Department HOD review}
  HOD -->|Reject with reason| Rejected
  HOD -->|Approve| DSW{DSW review}
  DSW -->|Reject with reason| Rejected
  DSW -->|Approve| Approved[APPROVED]
  Rejected --> Resubmit[Submitter may RESUBMIT]
  Resubmit --> Faculty
  Approved --> Student[Student views certificate]
  Student --> PDF[CertificateView and jsPDF export]
  Create --> DB[(CertificateRecord)]
  Approved --> DB
```

## Brief explanation

Approval and client PDF export implemented. No separate certificate file storage/delivery API found.

## Actors involved

Active Student Coordinator; Faculty; HOD; DSW; certificate recipient Student.

## Relevant APIs

GET /api/certificates; POST /api/certificates/batches; PATCH /api/certificates/:id with APPROVE, REJECT or RESUBMIT.

## Relevant database models

CertificateRecord, User, Event, Club, Attendance.

## Implementation status

Approval and client PDF export implemented. No separate certificate file storage/delivery API found.

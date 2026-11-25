# Main Flow Diagrams

Exactly 20 source-based diagrams for the Centralized Departmental Club Management System. Each file contains one Mermaid diagram, purpose, explanation, actors, verified APIs/models, and status.

01. [Overall System Architecture](01-system-architecture.md)
02. [User Registration Flow](02-user-registration.md)
03. [User Login and Authentication Flow](03-authentication.md)
04. [Role-Based Access Control Flow](04-role-based-access.md)
05. [DSW Administration Flow](05-dsw-administration.md)
06. [Department Management Flow](06-department-management.md)
07. [Faculty Management Flow](07-faculty-management.md)
08. [Club Creation and Management Flow](08-club-management.md)
09. [Club Membership Flow](09-club-membership.md)
10. [Student Coordinator Appointment Flow](10-student-coordinator.md)
11. [Event Proposal Submission Flow](11-event-proposal.md)
12. [Complete Event Approval Flow](12-event-approval.md)
13. [Event Rejection and Resubmission Flow](13-event-rejection.md)
14. [Event Publication and Student Registration Flow](14-event-publication.md)
15. [QR Code Attendance Flow](15-qr-attendance.md)
16. [Attendance Management and Reporting Flow](16-attendance-management.md)
17. [Document Repository Flow](17-document-repository.md)
18. [Certificate Generation and Distribution Flow](18-certificates.md)
19. [Dashboard and Analytics Data Flow](19-dashboard-analytics.md)
20. [Complete End-to-End System Workflow](20-complete-system-workflow.md)

## Accuracy notes

- Student Coordinator is a Student with a ClubCoordinator assignment, not a separate role.
- Event approval is Student Coordinator → Faculty Incharge → HOD → APPROVED. DSW can reject/override but is not a required approval stage and cannot approve in the event controller.
- Revision of rejected event proposals, a general document repository, password recovery, and camera-based QR scanning were not found in the inspected implementation.


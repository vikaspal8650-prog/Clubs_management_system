# 🏫 Centralized Departmental Club Management System

A centralized web-based platform for managing college departmental clubs, students, faculty, events, approvals, attendance, certificates, and club activities through a role-based management system.

---

## 📌 Overview

The **Centralized Departmental Club Management System (CCMS)** provides a single platform for managing the complete lifecycle of college clubs.

Instead of managing club activities through separate forms, spreadsheets, messages, and manual approvals, CCMS brings the complete workflow into one centralized system.

The platform supports four major user roles:

- **DSW (Dean of Student Welfare)**
- **HOD (Head of Department)**
- **Faculty In-Charge**
- **Student**

A student can also be appointed as a **Club Coordinator** by the Faculty In-Charge.

---

## 🎯 Problem Statement

College clubs often manage registrations, events, approvals, attendance, certificates, and documents through disconnected systems.

This can lead to:

- Manual paperwork
- Delayed approvals
- Difficulty tracking club activities
- Duplicate or inconsistent records
- Poor communication between students, faculty, and administration
- Difficulty maintaining attendance and certificates
- Lack of centralized monitoring

---

## 💡 Proposed Solution

CCMS provides a centralized platform where administrators, faculty, and students can manage club-related activities according to their roles.

The system provides:

- Role-based dashboards
- Club management
- Student management
- Event management
- Multi-level approval workflow
- QR-based attendance
- Certificate generation
- Document management
- Activity monitoring
- Centralized database

---

## 👥 User Roles

### 🏛️ DSW

The DSW has the highest administrative authority.

Responsibilities include:

- Manage HOD accounts
- Manage Faculty In-Charge accounts
- Create and manage clubs
- Monitor all clubs
- Monitor events
- View overall system activity
- Override/reject approvals when required
- Monitor reports and analytics

---

### 👨‍🏫 HOD

The HOD manages activities related to their department.

Responsibilities include:

- Review club proposals
- Approve/reject requests after Faculty In-Charge review
- Monitor departmental clubs
- Review events
- Monitor students and activities

---

### 👨‍🏫 Faculty In-Charge

Faculty In-Charge supervises a club and its activities.

Responsibilities include:

- Manage assigned club
- Review student proposals
- Approve/reject club activities
- Appoint Club Coordinator
- Review events
- Manage club-related activities
- Monitor student participation

---

### 🎓 Student

Students can:

- Register on the platform
- Join clubs
- View club information
- Participate in events
- View event details
- Mark attendance
- View certificates
- Submit proposals
- Access approved documents

A student may also be appointed as a **Club Coordinator**.

---

## 🔄 Club Proposal Workflow

The club/event approval workflow follows a hierarchical process:

```text
Student / Club Coordinator
          │
          ▼
   Faculty In-Charge
          │
       Approve
          │
          ▼
         HOD
          │
       Approve
          │
          ▼
         DSW
          │
          ▼
       Final Control
# Software Requirements Specification Document (SRSD)

## 1. Introduction

ComplianceApp is a cloud-based compliance management platform that supports organizations in maintaining DOT-required records and workflows. Built with modern technologies and a party-model database structure, it provides a scalable solution for tracking driver, equipment, and organization compliance across multiple fleets.

## 2. System Overview

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Serverless API routes (Next.js), Prisma ORM
- **Database**: PostgreSQL on DigitalOcean
- **Authentication**: Clerk (JWT with RBAC)
- **Realtime**: WebSocket support
- **File Storage**: DigitalOcean Spaces (planned)
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **Data Fetching**: TanStack Query

## 3. Architecture & Components

### 3.1 Party Model Tables

- `party`: base entity
- `organization`: FK to `party`
- `person`: FK to `party`
- `equipment`: FK to `party`
- `role`: polymorphic relationships between parties

### 3.2 Issues System

- `issue`: base table for all issues
- Child tables:
  - `license_issue`
  - `accident_issue`
  - `roadside_inspection_issue`
  - etc.

### 3.3 Corrective Actions

- `corrective_action_form`
- `corrective_action_task`
- `document`: for uploads and evidence

### 3.4 Status & Lifecycle

- `status`: active, inactive, pending, suspended
- Rules define valid transitions

## 4. Requirements

### 4.1 Functional

- Track status for all parties and issues
- Support roadside inspections and accident workflows
- Manage driver onboarding
- Prevent duplicates using fuzzy/ID match
- Automate expiration-based alerts
- Allow admins to override with reason
- Support company audits with filtered reports
- Exportable audit logs

### 4.2 Non-Functional

- Secure authentication and data encryption
- No record deletion — soft delete only
- Data must be auditable and traceable
- All changes versioned

## 5. Security

- Clerk authentication and RBAC
- Prisma middleware for access control
- Audit logging and activity history
- GDPR: data export, user deletion

## 6. Validation & Testing

- Form-level validation with React Hook Form
- Status transitions tested with unit tests
- End-to-end scenarios tested with Playwright
- Manual testing in dev/staging environments


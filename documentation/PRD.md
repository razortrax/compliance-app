# Product Requirements Document (PRD)

## 1. Elevator Pitch

ComplianceApp is a web-based fleet compliance platform that simplifies DOT record-keeping, automates expiration tracking, and manages accident and inspection violations with smart workflows. It enables safety managers and operations teams to stay ahead of regulatory requirements through a modern, scalable system built with Next.js and a flexible party-model architecture.

## 2. Who Is This App For

- Fleet Safety Managers
- Operations Managers
- Executives overseeing compliance
- Administrative Staff and Clerks
- Maintenance Managers (for Equipment)
- Drivers (future mobile access)

## 3. Functional Requirements

- Role-based login: Master, Organization, Location
- Party model with Organizations, People, Equipment, and Roles
- Smart compliance status (green/yellow/orange/red)
- Master-detail issue tracking system
- Lifecycle tracking for entities and issues
- Duplicate detection using SSN/EIN/VIN
- Notification system for expiring items
- Roadside Inspection and Accident workflows
- Corrective Action Forms with attachments and supervisor sign-off
- Audit readiness report automation
- Onboarding workflows (esp. for drivers)
- Document upload/versioning
- WebSocket for real-time compliance status
- Admin interface for managing companies, users, and vendors

## 4. User Stories

- As a Master Manager, I can access multiple companies and view each company’s compliance overview.
- As an Organization Manager, I can review my drivers and equipment, create new compliance issues, and track corrective actions.
- As a Location Manager, I only see drivers/equipment at my location and can initiate compliance updates.
- As a Safety Manager, I can add roadside inspections and automatically create corrective actions for violations.
- As a Company Admin, I can review duplicates when entering people/equipment.
- As a Driver (future), I can upload documents for renewals via a mobile portal.

## 5. User Interface

- **Top Navigation Bar**: Switch modules (Org, Drivers, Equipment), access notifications, and user context.
- **Context Sidebar**: Adaptive issue nav per module (e.g., physicals for drivers).
- **Selector Buttons**:
  - Company Selector (square) — Master users only
  - Driver/Equipment Selector (rectangular) — context-aware, fills sidebar when alone
- **Master-Detail View**: Sortable list of issues with right-side panel for detail/edit forms.
- **Modal Overlays**: Forms for corrective actions, new issues, document viewer.
- **Status Colors**:
  - Green = OK
  - Yellow = Due in 60d
  - Orange = Due in 30d
  - Red = Expired


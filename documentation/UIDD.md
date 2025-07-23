# User Interface Design Document (UIDD)

## Overview

ComplianceApp features a modern, light-themed UI with intuitive navigation and role-based views for compliance tracking.

## Layout Structure

| Region | Purpose | Notes |
|--------|---------|-------|
| **Top Navigation Bar** | Module switching, notifications, user info | Not shown on Master Overview |
| **Context Sidebar** | Issue navigation by module | Always visible on desktop; hidden on mobile |
| **Slide-Out Selector Drawer** | On-demand list of Drivers or Equipment | Open via button or shortcut (G D / G E) |
| **Main Content Area** | Work surface for master-detail issue tracking | 12-column responsive grid |

## Selector Buttons

- **Company Selector Button** (Master Manager only)
  - Square button with icon
  - Only shown inside a specific company
- **Driver/Equipment Selector Button**
  - Full-width when alone, half-width with company button
  - Text label + icons
  - Shows driver list by default, toggles to equipment

## Master-Detail Pattern

- **Master Panel**: Table with sortable list of issues
- **Detail Panel**: Read-only by default with context-sensitive action buttons

## Modals

- Form overlays for create/edit actions
- Corrective Action Form modal
- Full-screen document viewer

## Visual Design

- Status color strip or pill appears on:
  - Selector rows
  - List rows
  - Issue cards
- Consistent icons, padding, spacing
- Designed to reduce onboarding time and minimize training required


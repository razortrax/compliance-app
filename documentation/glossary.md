# Glossary

*Updated: January 24, 2025*

## Compliance Terminology

**AIN (Annual Inspections)**: Proactive DOT compliance requirements with scheduled expiration dates that organizations must maintain (e.g., vehicle inspections, driver physicals, training certifications).

**RSIN (Roadside Inspections)**: Reactive enforcement events with complex violation workflows that occur during roadside stops and require incident management.

**Party**: Core entity in the system - any person, organization, location, equipment, or consultant that can have roles and relationships.

**Role**: Defines the relationship between two parties, including the type of relationship and permissions within organizational hierarchy.

**Issue**: Any compliance-related item that requires tracking, has expiration dates, or needs management workflow (licenses, certifications, violations, etc.).

## System Architecture

**AppLayout**: The main layout component that provides consistent header, sidebar, and content structure across all pages.

**Contextual Navigation**: Smart navigation system that changes based on user role and current page context.

**Party Model**: Database architecture where all entities inherit from a base Party table with flexible role relationships.

**Smart Redirect**: Automatic routing system that directs users to appropriate pages based on their role after authentication.

## User Roles & Access

**Master User**: Super-admin with access to all organizations and global system management. Can create and manage multiple organizations.

**Organization Manager**: Manager of a specific organization with access to all locations, drivers, and equipment within their scope.

**Location Manager**: Manager of a specific location with access only to drivers and equipment assigned to their location.

**Consultant**: External user who can be assigned to manage specific organizations on behalf of the master.

## Entity Types

**Organization**: Business entity that owns locations, drivers, and equipment. Can be created by masters or through signup flow.

**Location**: Physical location belonging to an organization where drivers and equipment can be assigned.

**Driver**: Person with DRIVER role who operates commercial vehicles and requires compliance tracking.

**Staff**: Person with STAFF role who works for the organization but doesn't drive commercially.

**Equipment**: Commercial vehicles and equipment that require compliance tracking and maintenance.

## Navigation Contexts

**Master Navigation**: Full hierarchy display (Master | Organization | Drivers | Equipment) with global access.

**Organization Navigation**: Organization-scoped display (Organization | Drivers | Equipment) for org managers.

**Location Navigation**: Location-scoped display (Location | Drivers | Equipment) for location managers.

**Drill-down Navigation**: When users navigate from higher level to lower level (e.g., Master → Organization → Location).

## UI/UX Patterns

**Tab Structure**: Standard page organization with Details tab plus related entity tabs (Drivers, Equipment, Locations).

**Modal Forms**: Consistent pattern for all add/edit operations using dialog overlays.

**KPI Dashboard**: Color-coded metrics display showing counts and status indicators for key compliance items.

**Empty State**: Helpful placeholder content when lists are empty, with clear call-to-action buttons.

**Card Grid**: Standard layout for displaying lists of entities with consistent spacing and interaction patterns.

## Technical Terms

**CRUD Operations**: Create, Read, Update, Delete - standard database operations for entity management.

**Access Control**: Permission system that determines what data users can see and modify based on their role and relationships.

**Transaction**: Database operation that ensures multiple related changes happen atomically (all succeed or all fail).

**REST API**: Standard HTTP-based API following representational state transfer principles.

**Optimistic Update**: UI pattern where changes are displayed immediately before server confirmation.

## Data Relationships

**Organization Hierarchy**: Master → Organizations → Locations → Drivers/Equipment

**Role Assignment**: Users can have multiple roles across different organizations and locations.

**Party Relationships**: Flexible many-to-many relationships between any entities through the Role table.

**Access Inheritance**: Permissions flow down the hierarchy (Master sees all, Org sees their scope, Location sees assigned items).

## Form & Data Patterns

**Streamlined Forms**: Essential fields only, with complex data (multiple contacts, licenses) handled in separate dedicated tables.

**Smart Defaults**: Forms auto-populate logical defaults like role types and current organization context.

**Enhanced Controls**: Improved UI controls like year/month date pickers and location selectors.

**Validation Strategy**: Client-side validation for immediate feedback, server-side validation for security.

## Future Terms (Planned)

**License Issue**: Specific license or certification with expiration tracking.

**Registration Issue**: Vehicle registration and related documentation.

**Violation Workflow**: Process for managing and resolving compliance violations.

**Bulk Import**: System for importing large datasets from spreadsheets or external systems.

**Audit Trail**: Historical record of all changes and compliance actions for regulatory reporting.

---

*This glossary reflects the current implemented system and established patterns. Update as new features are developed.*

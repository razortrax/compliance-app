# Roadside Inspections (RINS) - Comprehensive Plan

**Document Version:** 1.0  
**Last Updated:** January 27, 2025  
**Status:** Phase 1A Complete - Basic RINS Entry

## Table of Contents
1. [Overview](#overview)
2. [Business Requirements](#business-requirements)
3. [Workflow & User Experience](#workflow--user-experience)
4. [Database Design](#database-design)
5. [Implementation Phases](#implementation-phases)
6. [Technical Architecture](#technical-architecture)
7. [Violation Management System](#violation-management-system)
8. [API Endpoints](#api-endpoints)
9. [Future Enhancements](#future-enhancements)
10. [Success Metrics](#success-metrics)
11. [Decision Log](#decision-log)

---

## Overview

Roadside Inspections (RINS) represent a critical compliance management feature that handles DOT roadside inspection incidents. Unlike other driver issues that track expiration dates, RINS are **reactive, incident-based records** that document inspection events, violations, and required corrective actions.

### Key Differentiators
- **Incident-based** (not expiration tracking)
- **Multi-party relationships** (driver, equipment, violations)
- **Complex violation workflows** with out-of-service tracking
- **Corrective Action Form (CAF) generation**
- **Organization-level display** with drill-down capabilities
- **FMCSA integration** potential for automation

---

## Business Requirements

### Primary Use Cases
1. **Manual DVER Entry** - Input Driver/Vehicle Examination Reports from roadside inspections
2. **Violation Documentation** - Record specific DOT violations with inspector comments
3. **Out-of-Service Management** - Track equipment/driver OOS status and remedy dates
4. **Corrective Action Tracking** - Generate and assign CAFs to appropriate staff
5. **Compliance Reporting** - Organization-level view of inspection history and trends

### Stakeholder Needs
- **Compliance Managers** - Quick overview of inspection incidents and violation trends
- **Safety Directors** - Detailed violation analysis and corrective action status
- **Drivers** - Access to their inspection history and required actions
- **Maintenance Teams** - Equipment-specific violations and OOS tracking
- **Consultants** - Multi-organization inspection management

### Regulatory Context
- **49 CFR Part 350-399** - Federal Motor Carrier Safety Regulations
- **CVSA Standards** - Commercial Vehicle Safety Alliance inspection procedures
- **State DOT Requirements** - Varies by jurisdiction
- **FMCSA DataQs Portal** - Future integration for automated data retrieval

---

## Workflow & User Experience

### 1. Inspection Initiation
**Current (Phase 1A):** Organization-level only
- Navigate to Organization → Roadside Inspections
- Click "Add Roadside Inspection"
- Form auto-populates organization context

**Future (Phase 1B+):** Multiple entry points
- **Driver Page** → Driver-specific RINS with auto-populated driver
- **Equipment Page** → Equipment-specific RINS with auto-populated equipment
- **Location Page** → Location-filtered RINS options

### 2. DVER Data Entry
```
Inspector Information:
├── Report Number (optional)
├── Inspection Date & Time (required)
├── Inspector Name & Badge (required)
└── Inspection Location (required)

Facility Details:
├── Facility Name
├── Full Address
└── Contact Information

Inspection Details:
├── Inspection Level (I-VI)
├── Overall Result (Pass/Warning/OOS)
├── DVER Received Status
├── DVER Source (Driver/FMCSA/Third Party)
└── Entry Method (Manual/OCR/API)
```

### 3. Driver & Equipment Selection
- **Driver Selection** - Dropdown with organization drivers (auto-selected from context)
- **Equipment Selection** - Multi-select with live search, displays as "Unit 1, Unit 2..."
- **Equipment Details** - Automatically populated (make, model, year, VIN, plate)

### 4. Violation Management
#### Live Search System
```
Search Process:
├── Type 2+ characters in violation search
├── Real-time filtering of 40+ DOT violation codes
├── Search by: Code (392.2), Description (brake), Section (49 CFR)
├── Visual indicators: Severity, Type, Section reference
└── Click to select and auto-populate violation details
```

#### Detailed Violation Entry
```
For Each Violation:
├── Auto-populated: Code, Description, Severity, Type
├── Required: Inspector Comments
├── Optional: Unit Number Assignment
├── OOS Management:
│   ├── Out-of-Service Toggle
│   ├── OOS Date (auto-set to today, editable)
│   └── Back-in-Service Date (optional)
└── Validation: Comments required, OOS date required if OOS checked
```

### 5. Form Validation & Submission
- **Required Fields** - Driver, Equipment, Inspector details, Date
- **Violation Validation** - Inspector comments required for all violations
- **OOS Validation** - OOS date required when violation marked out-of-service
- **Data Integrity** - Equipment details fetched and stored for historical accuracy

---

## Database Design

### Core Models

#### `roadside_inspection_issue`
```sql
id                  String    @id @default(cuid())
issueId             String    @unique -- FK to base issue
reportNumber        String?
inspectionDate      DateTime
inspectionTime      String?
inspectorName       String
inspectorBadge      String?
inspectionLocation  String
facilityName        String?
facilityAddress     String?
facilityCity        String?
facilityState       String?
facilityZip         String?
inspectionLevel     RinsLevel?
overallResult       RinsResult?
driverLicense       String?
driverLicenseState  String?
driverDOB           DateTime?
dverReceived        Boolean   @default(false)
dverSource          DverSource?
entryMethod         EntryMethod @default(Manual_Entry)
```

#### `rins_equipment_involvement`
```sql
id              String    @id @default(cuid())
rinsId          String    -- FK to roadside_inspection_issue
equipmentId     String    -- FK to equipment (for reference)
unitNumber      Int       -- 1, 2, 3 (display order)
-- Stored equipment details (historical accuracy)
make            String?
model           String?
year            Int?
plateNumber     String?
vin             String?
-- CVSA inspection results
cvsaSticker     String?
oosSticker      String?
```

#### `rins_violation`
```sql
id                  String              @id @default(cuid())
rinsId              String              -- FK to roadside_inspection_issue
violationCode       String              -- 392.2A(1)
section             String?             -- 49 CFR 392.2A(1)
description         String              -- Full violation description
unitNumber          Int?                -- Which equipment (1,2,3) or null for driver
outOfService        Boolean             @default(false)
outOfServiceDate    DateTime?           -- When placed OOS
backInServiceDate   DateTime?           -- When returned to service
inspectorComments   String?             -- Required inspector notes
severity            ViolationSeverity?  -- Warning/Critical/Major
violationType       ViolationType?      -- Driver/Equipment/Company
-- Future CAF assignment (Phase 1B)
assignedPartyId     String?             -- FK to responsible party
citationNumber      String?             -- If citation issued
```

### Enums
```sql
enum RinsLevel {
  Level_I, Level_II, Level_III, Level_IV, Level_V, Level_VI
}

enum RinsResult {
  Pass, Warning, Out_Of_Service
}

enum DverSource {
  Driver_Reported, FMCSA_Portal_Check, Third_Party_Report
}

enum EntryMethod {
  Manual_Entry, OCR_Upload, API_Import
}

enum ViolationType {
  Driver_Qualification, Driver_Performance, Equipment_Defect, Company_Administrative
}

enum ViolationSeverity {
  Warning, Critical, Major
}
```

---

## Implementation Phases

### ✅ Phase 1A: Basic RINS Entry (COMPLETE)
**Timeline:** Completed January 27, 2025

**Deliverables:**
- [x] Organization-level RINS page with master-detail layout
- [x] Complete DVER data entry form
- [x] Driver and equipment selection with auto-population
- [x] Live violation search with 40+ DOT codes
- [x] Detailed violation entry with inspector comments
- [x] Out-of-service date tracking
- [x] Form validation and data integrity checks
- [x] API routes for CRUD operations with RBAC
- [x] Database schema with all core tables
- [x] Contextual navigation and header integration

**Key Features:**
- Manual DVER entry from organization level
- Comprehensive violation database with live search
- Equipment details preservation for historical accuracy
- Out-of-service tracking with dates
- Inspector comment requirements for all violations

### 🔄 Phase 1B: Access Control & CAF Assignment (PLANNED)
**Timeline:** Q1 2025 (after staff/role model extension)

**Deliverables:**
- [ ] Driver-level RINS access with proper context
- [ ] Equipment-level RINS access
- [ ] Location-level RINS filtering
- [ ] Staff/Role model extension for CAF assignment
- [ ] Violation assignment to responsible parties
- [ ] Basic CAF generation workflow

**Dependencies:**
- Organization staff/role model completion
- Role-based access control refinement

### 🔄 Phase 1C: CAF Automation & Digital Signatures (PLANNED)
**Timeline:** Q2 2025

**Deliverables:**
- [ ] Automated CAF generation from violations
- [ ] Digital signature workflow for CAF completion
- [ ] CAF tracking and status management
- [ ] Email notifications for CAF assignments
- [ ] CAF completion validation and documentation

**Dependencies:**
- Digital signature infrastructure
- Email notification system

### 🔄 Phase 2: Advanced Features (FUTURE)
**Timeline:** Q3-Q4 2025

**Deliverables:**
- [ ] OCR integration for DVER uploads
- [ ] FMCSA DataQs portal integration
- [ ] Automated violation trend analysis
- [ ] Predictive maintenance recommendations
- [ ] Advanced reporting and analytics
- [ ] Mobile app integration for field entry

---

## Technical Architecture

### API Design
```
Base Path: /api/roadside_inspections

GET    /                    # List inspections (filtered by access)
POST   /                    # Create new inspection
GET    /:id                 # Get specific inspection with details
PUT    /:id                 # Update inspection (full replace)
DELETE /:id                 # Soft delete inspection
```

### Data Flow
```
Form Submission → Validation → API Route → Database Transaction:
├── Create/Update roadside_inspection_issue
├── Delete existing rins_equipment_involvement
├── Create new equipment records (with fetched details)
├── Delete existing rins_violation
├── Create new violation records (with full metadata)
└── Return complete inspection with relations
```

### Access Control (RBAC)
```
Access Hierarchy:
├── Direct Ownership (party.userId === currentUserId)
├── Master Consultant (manages all organizations)
├── Organization Manager (manages organization drivers/equipment)
├── Location Manager (manages location-specific staff)
└── Driver Self-Access (own inspection records only)
```

### State Management
```
Frontend State:
├── selectedInspection (master-detail UI)
├── inspectionsList (filtered by context)
├── organizations (for selector)
├── driver (for context)
├── formState (create/edit modes)
└── violations (search results and selected)
```

---

## Violation Management System

### Violation Database
**Source:** 49 CFR Parts 390-399 (Federal Motor Carrier Safety Regulations)

**Categories:**
- **390.x** - General Company/Administrative (4 violations)
- **391.x** - Driver Qualification (6 violations)
- **392.x** - Driver Performance/Behavior (8 violations)
- **393.x** - Equipment/Vehicle Safety (12 violations)
- **396.x** - Inspection, Repair, and Maintenance (5 violations)

**Total:** 40+ common violations with complete metadata

### Search Algorithm
```javascript
function searchViolations(query) {
  return VIOLATION_CODES.filter(violation => 
    violation.code.toLowerCase().includes(query) ||
    violation.description.toLowerCase().includes(query) ||
    violation.section.toLowerCase().includes(query)
  ).slice(0, 10) // Performance limit
}
```

### Violation Metadata
```javascript
interface ViolationCode {
  code: string          // "392.2A"
  section: string       // "49 CFR 392.2A"
  description: string   // "Ill or fatigued operator"
  violationType: string // "DRIVER"
  severity: string      // "OUT_OF_SERVICE"
}
```

### Out-of-Service Workflow
1. **Violation Selection** → Auto-sets OOS if violation severity is "OUT_OF_SERVICE"
2. **OOS Toggle** → Enables OOS date fields
3. **OOS Date** → Required, defaults to inspection date
4. **Back-in-Service Date** → Optional, set when remedied
5. **Validation** → Ensures OOS date provided for all OOS violations

---

## API Endpoints

### List Inspections
```http
GET /api/roadside_inspections?partyId={id}&organizationId={id}

Response:
{
  "inspections": [
    {
      "id": "rins_123",
      "issue": { "title": "Roadside Inspection - I-95 Rest Stop" },
      "inspectionDate": "2025-01-15",
      "inspectorName": "Officer Johnson",
      "overallResult": "Warning",
      "equipment": [...],
      "violations": [...]
    }
  ]
}
```

### Create Inspection
```http
POST /api/roadside_inspections

Request Body:
{
  "inspectionDate": "2025-01-15",
  "inspectorName": "Officer Johnson",
  "inspectionLocation": "I-95 Rest Stop",
  "selectedDriverId": "party_123",
  "equipment": [
    { "unitNumber": 1, "equipmentId": "eq_456" }
  ],
  "violations": [
    {
      "violationCode": "392.2",
      "description": "Ill or fatigued operator",
      "inspectorComments": "Driver appeared drowsy during inspection",
      "outOfService": true,
      "outOfServiceDate": "2025-01-15",
      "violationType": "DRIVER",
      "severity": "OUT_OF_SERVICE"
    }
  ]
}
```

### Get Inspection Details
```http
GET /api/roadside_inspections/{id}

Response:
{
  "id": "rins_123",
  "reportNumber": "DOT-2025-001",
  "inspectionDate": "2025-01-15T10:30:00Z",
  "inspectorName": "Officer Johnson",
  "issue": {
    "party": {
      "person": { "firstName": "John", "lastName": "Driver" }
    }
  },
  "equipment": [
    {
      "unitNumber": 1,
      "make": "Freightliner",
      "model": "Cascadia",
      "year": 2020,
      "plateNumber": "ABC123",
      "vin": "1FUJGHDV8LLAB1234"
    }
  ],
  "violations": [
    {
      "violationCode": "392.2",
      "description": "Ill or fatigued operator",
      "inspectorComments": "Driver appeared drowsy",
      "outOfService": true,
      "outOfServiceDate": "2025-01-15T00:00:00Z",
      "severity": "Critical",
      "violationType": "Driver_Performance"
    }
  ]
}
```

---

## Future Enhancements

### OCR Integration (Phase 2)
```
OCR Workflow:
├── Upload DVER PDF/Image
├── Extract text using OCR service (AWS Textract/Google Vision)
├── Parse inspection data with AI/ML
├── Pre-populate form fields
├── User review and correction
└── Submit with "OCR_Upload" entry method
```

### FMCSA DataQs Integration
```
FMCSA API Workflow:
├── Query FMCSA DataQs portal by DOT number
├── Retrieve inspection records and violations
├── Map FMCSA data to internal schema
├── Create RINS records with "API_Import" method
├── Flag for user review and validation
└── Automated daily sync for new inspections
```

### Predictive Analytics
- **Violation Trends** - Identify recurring violation patterns
- **Driver Risk Scoring** - Calculate risk scores based on inspection history
- **Equipment Maintenance** - Predict maintenance needs from violation data
- **Compliance Forecasting** - Project future compliance issues

### Mobile App Integration
- **Field Entry** - Real-time DVER entry during inspections
- **Photo Capture** - Equipment and violation documentation
- **GPS Coordinates** - Automatic location tagging
- **Offline Mode** - Entry without internet connectivity

---

## Success Metrics

### Operational Metrics
- **DVER Entry Time** - Target: <5 minutes per inspection
- **Data Accuracy** - Target: >95% accurate equipment details
- **Violation Documentation** - Target: 100% inspector comments completion
- **User Adoption** - Target: 80% of inspections entered within 24 hours

### Compliance Metrics
- **Inspection Response Time** - Time from inspection to DVER entry
- **CAF Completion Rate** - Percentage of violations with completed CAFs
- **OOS Resolution Time** - Time from OOS to back-in-service
- **Violation Trends** - Month-over-month violation reduction

### Technical Metrics
- **API Response Time** - Target: <500ms for inspection retrieval
- **Form Validation Success** - Target: >90% successful submissions
- **Search Performance** - Target: <100ms violation search response
- **Data Integrity** - Target: 0% data loss or corruption

---

## Decision Log

### January 27, 2025 - Phase 1A Implementation Decisions

**Decision 1: Organization-Level Entry First**
- **Context:** Multiple potential entry points (driver, equipment, organization, location)
- **Decision:** Implement organization-level entry first, expand in Phase 1B
- **Rationale:** Simplifies initial implementation while covering primary use case
- **Impact:** Faster delivery, requires future enhancement for other contexts

**Decision 2: Live Violation Search vs. Static List**
- **Context:** How to handle 1000+ possible DOT violation codes
- **Decision:** Implement live search with curated 40+ common violations
- **Rationale:** Better UX than checkboxes, covers 80% of real-world violations
- **Impact:** Requires violation database maintenance, excellent user experience

**Decision 3: Equipment Details Storage Strategy**
- **Context:** Equipment details may change over time, affecting historical accuracy
- **Decision:** Store equipment details in `rins_equipment_involvement` at time of inspection
- **Rationale:** Preserves historical accuracy for compliance and reporting
- **Impact:** Larger database footprint, better data integrity

**Decision 4: Out-of-Service Date Management**
- **Context:** How to handle OOS dates for violations and equipment/drivers
- **Decision:** Start with violation-level OOS dates, defer equipment/driver OOS tracking
- **Rationale:** Simpler implementation, covers immediate compliance needs
- **Impact:** May need future enhancement for comprehensive OOS management

**Decision 5: Violation Comment Requirements**
- **Context:** Should inspector comments be required for all violations?
- **Decision:** Require inspector comments for all violations
- **Rationale:** Essential for compliance documentation and future CAF generation
- **Impact:** Enforces data quality, may slow data entry slightly

**Decision 6: Form Validation Strategy**
- **Context:** Client-side vs. server-side validation approach
- **Decision:** Implement both client-side (UX) and server-side (security) validation
- **Rationale:** Best user experience with robust data integrity
- **Impact:** Additional development effort, better overall system reliability

**Decision 7: RBAC Implementation**
- **Context:** Access control complexity for multi-level organizations
- **Decision:** Copy proven RBAC pattern from other issue types
- **Rationale:** Consistent security model, faster implementation
- **Impact:** Reliable access control, easier maintenance

---

**End of Document** 
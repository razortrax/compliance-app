# Compliance Requirements & Issue Types

_Created: January 24, 2025_

## Overview

This document defines the specific compliance issues that must be tracked for each entity type in the ComplianceApp system. Each issue type has specific requirements, expiration tracking, and regulatory implications.

## Issue Type Architecture

### Base Issue Table Structure

```sql
issue {
  id              String   @id
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  issueType       String   -- Maps to specific issue type tables
  status          String   -- open, pending, resolved, expired
  priority        String   -- low, medium, high, critical
  partyId         String   -- Links to organization, driver, or equipment
  title           String
  description     String?
  dueDate         DateTime? -- For proactive compliance tracking
  resolvedAt      DateTime?
}
```

### Specific Issue Type Tables

Each issue type extends the base issue with specific fields:

- `license_issue` - Licenses and certifications
- `accident_issue` - Accident incidents and reporting
- `inspection_issue` - AIN and RSIN results
- `registration_issue` - Vehicle registrations (planned)
- `maintenance_issue` - Equipment maintenance (planned)
- `training_issue` - Training and qualification records (planned)

---

## Organization Compliance Issues

### Required Tracking for Organizations

#### 1. Operating Authority & Registration

**Issue Type**: `license_issue`

- **DOT Number Registration**: USDOT number validity and status
- **Operating Authority**: MC/FF/MX authority certificates
- **State Registration**: Individual state operating permits
- **IFTA Registration**: International Fuel Tax Agreement
- **UCR Registration**: Unified Carrier Registration

#### 2. Insurance & Financial Responsibility

**Issue Type**: `license_issue`

- **Primary Liability Insurance**: $750K minimum for most operations
- **Cargo Insurance**: Coverage for transported goods
- **Workers Compensation**: State-required coverage
- **Umbrella Policy**: Additional liability coverage

#### 3. Safety & Compliance Programs

**Issue Type**: `license_issue`

- **Safety Management Certificate**: Company safety programs
- **Drug & Alcohol Testing Program**: DOT compliance program
- **Driver Qualification Files**: Systematic driver file management
- **Hours of Service Compliance**: ELD and logbook systems

#### 4. Regulatory Filings

**Issue Type**: `license_issue`

- **Biennial Update (MCS-150)**: Every 2 years for USDOT carriers
- **Process Agent (BOC-3)**: Legal process agent designation
- **Hazmat Registration**: If transporting hazardous materials

---

## Driver Compliance Issues

### Required Tracking for Drivers

#### 1. Commercial Driver's License (CDL)

**Issue Type**: `license_issue`

- **CDL Validity**: Current license with proper endorsements
- **License Class**: A, B, or C based on vehicle operation
- **Endorsements**: H (Hazmat), P (Passenger), S (School Bus), etc.
- **Restrictions**: Medical, mechanical, or operational limitations

#### 2. Medical Certification

**Issue Type**: `license_issue`

- **DOT Physical**: Medical examiner certificate (1-2 year validity)
- **Medical Variance**: Sleep apnea, diabetes, vision exemptions
- **Self-Certification**: Interstate/intrastate medical status
- **Medical Examiner Registry**: Certified examiner verification

#### 3. Drug & Alcohol Compliance

**Issue Type**: `license_issue`

- **Pre-Employment Testing**: Initial drug screen
- **Random Testing Pool**: Ongoing random selection
- **Post-Accident Testing**: Required after qualifying incidents
- **Return-to-Duty**: After positive test or refusal

#### 4. Training & Qualification Records

**Issue Type**: `training_issue` (planned)

- **Entry-Level Driver Training**: ELDT certificate if applicable
- **Hazmat Training**: If transporting hazardous materials
- **Defensive Driving**: Company-required safety training
- **Equipment-Specific Training**: Specialized vehicle operation

#### 5. Motor Vehicle Record (MVR)

**Issue Type**: `license_issue`

- **Annual MVR Review**: Driving record check
- **Violation History**: Traffic citations and convictions
- **License Suspensions**: Any license actions or restrictions
- **Interstate Data Exchange**: Cross-state violation reporting

#### 6. Incident Management

**Issue Type**: `accident_issue`, `inspection_issue`

- **Roadside Inspections (RSIN)**: Enforcement encounters with violations
- **Accidents**: DOT-reportable accidents and investigations
- **Citations**: Moving violations and regulatory citations
- **Corrective Actions**: Required follow-up actions

---

## Equipment Compliance Issues

### Required Tracking for Equipment

#### 1. Vehicle Registration & Licensing

**Issue Type**: `registration_issue` (planned)

- **State Registration**: Vehicle registration and plates
- **IFTA Stickers**: International fuel tax decals
- **Operating Permits**: State-specific operating authority
- **Overweight Permits**: Special route and load permits

#### 2. Annual Inspections (AIN)

**Issue Type**: `inspection_issue`

- **DOT Annual Inspection**: Required yearly safety inspection
- **State Inspection**: Additional state-required inspections
- **Brake System**: Specialized brake inspection certificates
- **Emissions Testing**: Environmental compliance testing

#### 3. Insurance & Financial Requirements

**Issue Type**: `license_issue`

- **Vehicle Insurance**: Physical damage and liability coverage
- **Cargo Insurance**: Load-specific coverage requirements
- **Gap Coverage**: Coverage for lease/loan requirements

#### 4. Maintenance & Safety Records

**Issue Type**: `maintenance_issue` (planned)

- **Preventive Maintenance**: Scheduled service intervals
- **Safety Inspections**: Pre-trip and periodic safety checks
- **Repair Documentation**: Major repair and modification records
- **Warranty Tracking**: Equipment warranty status

#### 5. Specialized Equipment Compliance

**Issue Type**: `license_issue`

- **Tank Inspections**: For liquid bulk carriers
- **Crane Certifications**: For equipment with lifting capability
- **Reefer Compliance**: Refrigerated equipment certifications
- **Hazmat Equipment**: Specialized hazmat transport equipment

#### 6. Roadside Inspection Results (RSIN)

**Issue Type**: `inspection_issue`

- **Level I-VI Inspections**: Comprehensive roadside inspections
- **Violation Records**: Out-of-service violations and citations
- **BASIC Scores**: Behavior Analysis and Safety Improvement Categories
- **Corrective Actions**: Required repairs and follow-up

---

## Issue Priority & Status Classifications

### Priority Levels

- **Critical**: Immediate out-of-service or shutdown risk
- **High**: Compliance violation with potential penalties
- **Medium**: Approaching expiration (30-60 days)
- **Low**: General tracking and documentation

### Status Classifications

- **Open**: Active issue requiring attention
- **Pending**: Awaiting documentation or verification
- **Resolved**: Completed with proper documentation
- **Expired**: Past due date, requires immediate action

### Color Coding System

- **🔴 Red**: Expired or critical violation
- **🟠 Orange**: Due within 30 days
- **🟡 Yellow**: Due within 60 days
- **🟢 Green**: Current and compliant

---

## Expiration Tracking & Alerts

### Automated Alert Triggers

- **90 Days**: Initial renewal reminder
- **60 Days**: Second notice and action planning
- **30 Days**: Critical renewal deadline
- **15 Days**: Final warning before expiration
- **Expired**: Immediate action required notification

### Alert Recipients

- **Primary**: Assigned safety manager or compliance officer
- **Secondary**: Department supervisors and managers
- **Executive**: For critical violations or repeated non-compliance

---

## Regulatory Authority Mapping

### Federal Requirements

- **FMCSA**: Federal Motor Carrier Safety Administration
- **DOT**: Department of Transportation
- **EPA**: Environmental Protection Agency
- **OSHA**: Occupational Safety and Health Administration

### State Requirements

- **State DOT**: State transportation departments
- **State Police**: Commercial vehicle enforcement
- **Tax Authorities**: Fuel tax and registration requirements
- **Environmental**: State environmental compliance

---

## Implementation Status

### ✅ Currently Implemented

- **Base Issue System**: Core issue tracking infrastructure
- **License Issues**: Basic license and certification tracking
- **Accident Issues**: Accident incident management
- **Inspection Issues**: AIN and RSIN inspection results

### 🟡 Partially Implemented

- **Organization Issues**: Basic structure, needs specific issue types
- **Driver Issues**: Person management exists, needs compliance tracking
- **Equipment Issues**: Equipment management exists, needs compliance tracking

### 🔴 Not Yet Implemented

- **Registration Issues**: Vehicle registration tracking
- **Maintenance Issues**: Equipment maintenance management
- **Training Issues**: Training record management
- **Contact Management**: Multiple contact information per entity
- **Document Management**: File upload and attachment system
- **Automated Alerts**: Expiration notification system

---

## Next Development Priorities

1. **License Management**: Complete license_issue implementation with specific license types
2. **Registration System**: Implement registration_issue for vehicle licensing
3. **Contact System**: Multiple phone/email/address management
4. **Document Storage**: File upload and document management
5. **Alert System**: Automated expiration notifications
6. **Training Records**: Training and qualification tracking
7. **Maintenance Tracking**: Equipment maintenance management

---

**Note**: This document serves as the comprehensive reference for all compliance requirements. Update as regulations change or new requirements are identified.

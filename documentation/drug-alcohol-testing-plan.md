# Drug & Alcohol Testing Implementation Plan

_Created: January 27, 2025_  
_Status: Phase 1 - Core D&A Issues System_

## Overview

Drug & Alcohol testing is a unique driver issue type that requires random selection processes rather than expiration-based renewals. This document outlines the complete implementation plan for DOT-compliant random testing workflows.

---

## Business Requirements

### Testing Rules by Company Size & Management Structure

- **1-5 drivers** → Consortium A (managed at Fleetrax level)
- **6-15 drivers** → Consortium B (managed at Fleetrax level)
- **16+ drivers** → Direct company selection (self-managed)

### Testing Frequency Requirements

- **Drug testing**: 50% of average annual drivers
- **Alcohol testing**: 10% of average annual drivers (subset of drug test drivers)
- **Quarterly selection**: Based on average drivers ÷ 4
- **Average calculation**: Rolling 12-month average of active drivers

### Key Differences from Other Driver Issues

- ✅ Same Header/Sidebar components as other driver issues
- ✅ Master-detail layout (300px list + details panel)
- ❌ **No expiration dates** (unlike licenses, training, MVRs, physicals)
- ❌ **No renewal process** (tests are one-time events)
- ✅ **Manual selection process** with alerts when due
- ✅ **Random selection algorithm** with override capability

---

## Complete Workflow Process

### 1. Selection Phase

#### For Self-Managed Companies (16+ drivers):

- Organization user triggers selection via "Drug & Alcohol Selection" button
- System calculates rolling 12-month average driver count for that organization
- Algorithm selects required number of drivers for quarterly testing
- Creates new `drugalcohol_issue` records for selected drivers

#### For Consortium Companies (1-15 drivers):

- **Consortium User** (Fleetrax level) manages multiple organizations
- Consortium user can see drivers across all consortium organizations
- Consortium user reviews selection requirements and history
- Consortium user adds "selected drivers" records to organization-level drugalcohol issues
- Selection decisions are made at consortium level, then applied to individual organizations

### 2. Notification Phase

- Fleetrax sends notice to company with list of selected drivers
- Specifies whether driver needs drug test only or drug + alcohol test
- Driver has 2 hours to reach approved testing facility
- **Same process for both self-managed and consortium companies**

### 3. Testing Phase

1. Company sends driver to collector for urine sample
2. Collector overnights sample to Quest lab in Kansas
3. AIS handles billing and coordination
4. Quest runs tests and uploads results to AIS
5. Medical Review Officer (MRO) reviews and certifies results
6. Results become available on pulse.applicantinfo.com portal

### 4. Results Recording Phase

- Fleetrax user monitors AIS portal for test results
- Records results in driver's `drugalcohol_issue` records
- Updates compliance status and any required follow-up actions
- **Same process for both self-managed and consortium companies**

---

## Database Design Requirements

### Record Structure

- **One record per test per driver** (not batch records)
- **Possible two records per driver** if selected for both drug AND alcohol
- **No expiration tracking** (tests are point-in-time events)
- **Selection history** may be added later if needed to address clustering concerns

### Key Relationships

- Links to `issue` table (standard pattern)
- Links to driver's `party` record
- May link to selection batch/event for reporting

---

## Implementation Strategy

### Phase 1: Core D&A Issues System ⭐ _CURRENT PHASE_

**Deliverables:**

- ✅ Database schema for `drugalcohol_issue` table
- ✅ API routes (GET, POST, PUT, DELETE) for CRUD operations
- ✅ Master-detail UI matching other driver issues pattern
- ✅ Form components for recording test results
- ✅ Navigation integration in driver sidebar
- ✅ Basic compliance status tracking

**Goals:**

- Establish foundation for D&A testing
- Maintain consistency with existing driver issues
- Enable manual test result recording
- Prepare structure for selection system

### Phase 2: Selection Algorithm & Automation ⏳ _FUTURE_

**Deliverables:**

#### Self-Managed Companies (16+ drivers):

- ✅ Organization-level "Drug & Alcohol Selection" button
- ✅ Rolling 12-month average driver calculation for organization
- ✅ Random selection algorithm with override capability
- ✅ Alert system for when quarterly selections are due

#### Consortium Management (1-15 drivers):

- ✅ Consortium user role and permissions system
- ✅ Cross-organization driver visibility for consortium users
- ✅ Consortium-level selection interface and workflow
- ✅ Organization-level drugalcohol issue creation from consortium selections
- ✅ Multi-organization reporting and compliance tracking

#### Shared Features:

- ✅ Selection batch tracking and reporting
- ✅ Integration with notification workflows
- ✅ Override capability for addressing clustering concerns

**Advanced Features (Future Consideration):**

- ✅ Anti-clustering algorithms if needed
- ✅ Historical selection analysis
- ✅ Automated consortium integration
- ✅ Direct AIS portal integration

---

## Technical Considerations

### Random Selection Algorithm

- **True randomness** vs. "feels random" to users
- **Override capability** for addressing clustering concerns
- **DOT compliance** - regulations require "random" but don't specify algorithm
- **Consultant feedback** - AIS system perceived as non-random, overcome with overrides

### Consortium Integration

- **Consortium A** (1-5 drivers) - managed at Fleetrax level by consortium users
- **Consortium B** (6-15 drivers) - managed at Fleetrax level by consortium users
- **Provider**: Likely applicantinfo.com/AIS, pending research
- **Management Structure**: Multi-level hierarchy (Consortium User → Organizations → Drivers)
- **Selection Process**: Consortium users select drivers across multiple organizations
- **Fallback**: General DOT consortium requirements

### Alert System

- **When selections are due** - quarterly based on rolling average
- **Integration** with existing expiration alert system
- **Organization-level** notifications for compliance managers

---

## Research Notes

### Consortium Information

- **Primary provider**: applicantinfo.com (AIS)
- **Research needed**: Specific consortium rules and formulas
- **Fallback**: General DOT random testing requirements
- **Documentation**: May need to contact AIS for detailed consortium specifications

### DOT Compliance References

- **Random testing requirements**: 49 CFR Part 382
- **Consortium participation**: 49 CFR 382.105
- **Testing procedures**: 49 CFR Part 40
- **Annual reporting**: Required percentage compliance documentation

---

## Success Metrics

### Phase 1 Completion Criteria

- [ ] Can create and edit drugalcohol_issue records
- [ ] Master-detail interface matches other driver issues
- [ ] Test results can be recorded and displayed
- [ ] Navigation integrated with driver sidebar
- [ ] API endpoints support all CRUD operations

### Phase 2 Completion Criteria

- [ ] Selection algorithm produces DOT-compliant random lists
- [ ] **Self-managed companies**: Organization users can trigger selections on-demand
- [ ] **Consortium companies**: Consortium users can select drivers across organizations
- [ ] Alert system notifies when selections are due
- [ ] Override functionality addresses clustering concerns
- [ ] Rolling 12-month averages calculated correctly
- [ ] Multi-level user permissions support consortium management structure

---

## Decision Log

| Date       | Decision                          | Rationale                                                                                                                                                  |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-01-27 | Two-phase implementation          | Maintains momentum on core driver issues while preserving selection complexity for focused development                                                     |
| 2025-01-27 | Manual selection trigger          | Gives users control, avoids automated chaos, aligns with consultant workflow preferences                                                                   |
| 2025-01-27 | One record per test per driver    | Clean database design, supports drug + alcohol for same driver, enables detailed tracking                                                                  |
| 2025-01-27 | Rolling 12-month average          | Most accurate representation of workforce for compliance calculations                                                                                      |
| 2025-01-27 | True random selection             | Meets DOT requirements, addresses consultant concerns about AIS clustering with override capability                                                        |
| 2025-01-27 | Multi-level consortium management | Consortiums managed at Fleetrax level by consortium users, not individual organizations. Enables proper oversight and selection across multiple companies. |

---

_This document will be updated as implementation progresses and requirements are refined._

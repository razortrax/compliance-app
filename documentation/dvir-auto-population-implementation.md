# DVIR Auto-Population Implementation Guide

**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Business Priority**: High - Eliminates manual RSIN data entry

---

## 🎯 **Business Logic Overview**

### **Critical Validation Rules**

- **Driver Records**: MUST exist before DVIR processing (compliance requirement)
- **Equipment Records**: MUST exist before DVIR processing (fleet management requirement)
- **Inspector Records**: AUTO-CREATED as external staff (safe to generate)
- **Agency Records**: AUTO-CREATED as external organizations (safe to generate)

### **Workflow Decision Tree**

```
DVIR Upload → OCR Extract → Validate Required Records
├── Missing Driver? → Block + Notify User → User Adds Driver → Retry
├── Missing Equipment? → Block + Notify User → User Adds Equipment → Retry
└── All Found? → Auto-Create Inspector/Agency → Pre-populate RSIN Form
```

---

## 📋 **Data Mapping Reference**

### **DVIR Document Structure → Database Fields**

#### **Inspector Information** (Auto-Create as Staff)

```typescript
DVIR Field                    → Database Field (staff table)
Inspector: "Officer Sarah Martinez" → person.firstName: "Officer Sarah", lastName: "Martinez"
Badge Number: "DOT-8847"      → staff.badgeNumber: "DOT-8847"
Agency: "FMCSA"              → staff.department: "FMCSA"
```

#### **Driver Information** (Must Exist - Validate Only)

```typescript
DVIR Field                    → Database Lookup (person table)
Driver: "Moran Alva Ray"     → person.firstName: "Moran", lastName: "Alva Ray"
License Number: "0004046218268" → person.licenseNumber: "0004046218268"
License State: "SC"          → person.licenseState: "SC"
Date of Birth: "10/23/1965"  → person.dateOfBirth: "1965-10-23"
```

#### **Equipment Information** (Must Exist - Validate Only)

```typescript
DVIR Field                    → Database Lookup (equipment table)
Unit 1 VIN: "1XKDD903P5S486670" → equipment.vinNumber: "1XKDD903P5S486670"
Make: "Freightliner"         → equipment.make: "Freightliner"
Model: "Cascadia"            → equipment.model: "Cascadia"
Year: "2024"                 → equipment.year: 2024
Plate: "2264406"             → equipment.plateNumber: "2264406"
```

#### **Incident Information** (Create New RSIN)

```typescript
DVIR Field                    → Database Field (incident table)
Report Number: "US1974906108" → incident.reportNumber: "US1974906108"
Inspection Date: "01/07/2025" → incident.incidentDate: "2025-01-07"
Inspection Time: "12:37 PM"   → incident.incidentTime: "12:37"
Location: "NEWBERRY SC"       → incident.locationCity: "NEWBERRY", locationState: "SC"
```

#### **Violation Information** (Create Incident Violations)

```typescript
DVIR Field                    → Database Field (incident_violation table)
Code: "393.5(A1-B4LAC)"      → incident_violation.violationCode: "393.5(A1-B4LAC)"
Section: "393.5(A1-B4LAC)"   → incident_violation.section: "393.5(A1-B4LAC)"
Unit: "2"                    → incident_violation.unitNumber: "2"
Description: "Brake - Audible air leak..." → incident_violation.description: "..."
Severity: "WARNING"          → incident_violation.severity: "Warning"
OOS: "No"                    → incident_violation.outOfService: false
```

---

## 🔧 **Technical Implementation**

### **Core Functions** (`src/lib/dvir-automation.ts`)

#### **1. OCR Processing**

```typescript
// Current: Mock data for testing
// Production: AWS Textract integration
DVIRProcessor.extractWithTextract(file: File) → Promise<string>
```

#### **2. Data Extraction & Parsing**

```typescript
DVIRProcessor.parseDVIRText(rawText: string) → DVIRDocument
// Extracts structured data from OCR text
```

#### **3. Record Validation & Creation**

```typescript
checkAndCreateExternalRecordsFromDVIR(
  dvir: DVIRDocument,
  organizationId: string,
  db: PrismaClient
) → Promise<{
  created: { inspector?: Staff },
  missing: { driver?: DriverInfo, equipment?: EquipmentInfo[] },
  canProceed: boolean
}>
```

#### **4. Incident Pre-Population**

```typescript
createIncidentFromDVIR(
  dvir: DVIRDocument,
  driverId?: string,
  organizationId?: string
) → IncidentData
// Converts DVIR to RSIN form data structure
```

### **API Integration Points**

#### **Upload Endpoint** (New)

```typescript
POST /api/incidents/upload-dvir
Body: FormData with DVIR file
Response: {
  success: boolean,
  missing?: { driver?: object, equipment?: object[] },
  prePopulated?: IncidentData,
  message: string
}
```

#### **Existing Endpoints** (Use As-Is)

```typescript
POST /api/incidents                    // Create RSIN from pre-populated data
GET /api/violations/search             // Violation code lookup
GET /api/equipment?organizationId=X    // Equipment validation
GET /api/persons?organizationId=X      // Driver validation
```

---

## 🚀 **Implementation Steps**

### **Phase 1: UI Integration** (1-2 hours)

1. **Add Upload Button**: Next to "New RSIN" button on Roadside Inspections page
2. **Upload Modal**: File picker with progress indicator
3. **Missing Records Modal**: Display required Driver/Equipment with "Add" links
4. **Success Flow**: Auto-open RSIN form with pre-populated data

### **Phase 2: Backend Integration** (2-3 hours)

1. **Create Upload API**: `/api/incidents/upload-dvir` endpoint
2. **Integrate Validation**: Use existing `checkAndCreateExternalRecordsFromDVIR`
3. **File Storage**: Save DVIR to DigitalOcean Spaces
4. **Error Handling**: Comprehensive error responses

### **Phase 3: OCR Production Setup** (1 hour)

1. **AWS Credentials**: Add to `.env.local` (see `scripts/setup-aws-textract.md`)
2. **Update OCR Call**: Replace mock data with actual AWS Textract
3. **Fallback Logic**: Google Vision API if Textract fails
4. **Cost Monitoring**: Track usage for billing

### **Phase 4: Testing & Validation** (1 hour)

1. **Test Data**: Run `scripts/create-test-dvir-data.ts`
2. **Mock Testing**: Upload any file (mock data used)
3. **Real Testing**: Upload actual DVIR with OCR
4. **Edge Cases**: Missing records, malformed documents

---

## 🧪 **Testing Procedures**

### **Setup Test Environment**

```bash
# 1. Create test data (matches mock DVIR)
npm run ts-node scripts/create-test-dvir-data.ts

# 2. Verify test data
✅ Organization: WATERS TECH TRANSPORTATION LLC (DOT: 3651508)
✅ Driver: Moran Alva Ray (License: 0004046218268)
✅ Equipment 1: 2024 Freightliner Cascadia (VIN: 1XKDD903P5S486670)
✅ Equipment 2: 2024 Great Dane GDAN (VIN: 1GRA0622KMR51658)
```

### **Test Scenarios**

#### **Scenario 1: Perfect Match** (Expected: Success)

- Upload DVIR with existing Driver + Equipment
- Result: Auto-create Inspector, pre-populate RSIN form

#### **Scenario 2: Missing Driver** (Expected: Block)

- Upload DVIR with unknown driver license
- Result: Show missing driver notification, block processing

#### **Scenario 3: Missing Equipment** (Expected: Block)

- Upload DVIR with unknown VIN
- Result: Show missing equipment notification, block processing

#### **Scenario 4: New Inspector** (Expected: Auto-Create)

- Upload DVIR with new inspector name
- Result: Auto-create inspector as staff, continue processing

---

## 💰 **Cost Analysis**

### **OCR Service Costs**

```
AWS Textract (Recommended):
- Free Tier: 1,000 pages/month
- Paid: $1.50 per 1,000 pages
- Monthly Estimate: 100 DVIRs = $0.15

Google Vision API (Fallback):
- Free Tier: 1,000 pages/month
- Paid: $1.50 per 1,000 pages
- Same cost structure as AWS

Projected Monthly Cost:
- Small Fleet (100 DVIRs): $0.15
- Medium Fleet (500 DVIRs): $0.75
- Large Fleet (2000 DVIRs): $3.00
```

### **Storage Costs** (DigitalOcean Spaces)

```
DVIR Document Storage:
- Average DVIR size: 2MB (scanned PDF)
- Monthly storage: 100 DVIRs = 200MB = $0.01
- Annual storage: 1,200 DVIRs = 2.4GB = $0.12
```

---

## 🔒 **Security & Compliance**

### **Data Privacy**

- **OCR Processing**: Documents processed and discarded (not stored by AWS)
- **File Storage**: Encrypted at rest in DigitalOcean Spaces
- **Access Control**: Role-based access to DVIR documents
- **Audit Trail**: Complete logging of document processing

### **Business Continuity**

- **Fallback Methods**: Manual RSIN entry always available
- **Offline Processing**: Queue uploads when internet unavailable
- **Error Recovery**: Retry failed OCR with different service
- **Data Backup**: DVIR documents included in backup strategy

---

## 📖 **Quick Reference**

### **Key Files**

```
src/lib/dvir-automation.ts              // Core processing logic
scripts/create-test-dvir-data.ts        // Test data generation
scripts/setup-aws-textract.md          // OCR credentials setup
documentation/integration-roadmap.md    // High-level planning
```

### **Database Tables Involved**

```
party                    // Base entity for all records
person                   // Driver records (must exist)
equipment               // Vehicle records (must exist)
staff                   // Inspector records (auto-created)
incident                // RSIN records (created from DVIR)
incident_violation      // Violation records (extracted from DVIR)
incident_equipment      // Equipment involvement (linked by VIN)
violation_code          // DOT violation lookup (existing)
```

### **Environment Variables**

```
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=us-east-1
```

---

## ⚡ **Ready for Implementation**

This system is architecturally complete and ready for UI integration. The core business logic, data validation, and error handling are implemented. The primary implementation work involves:

1. **Frontend**: Upload button and missing records modal
2. **API**: Upload endpoint integration
3. **OCR**: Production credentials setup
4. **Testing**: Validate with real DVIR documents

**Estimated Implementation Time**: 4-6 hours total
**Business Impact**: Eliminates 10-15 minutes of manual data entry per RSIN
**ROI**: Positive after ~20 DVIR uploads per month

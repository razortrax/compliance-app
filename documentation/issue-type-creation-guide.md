# Issue Type Creation Guide

## 🚀 **Streamlined Process for Creating New Issue Types**

This guide provides templates, checklists, and automated tools to make creating new issue types fast and consistent.

---

## **Option 1: Automated Generator (Recommended)**

### **Quick Start**

```bash
# 1. Create field definition file
node scripts/generate-issue-type.js inspection driver inspection-fields.json

# 2. Copy generated files to proper locations
# 3. Run database migration
npx prisma db push

# 4. Test the new issue type
```

### **Field Definition Format**

Create a JSON file defining your issue fields:

```json
{
  "issueType": "inspection",
  "entityType": "driver",
  "fields": [
    {
      "name": "inspectionType",
      "type": "ENUM",
      "values": ["Annual_Inspection", "Roadside_Inspection", "Pre_Trip"],
      "required": true,
      "description": "Type of inspection performed"
    },
    {
      "name": "inspectorName",
      "type": "VARCHAR",
      "maxLength": 100,
      "required": true,
      "description": "Name of the inspector"
    },
    {
      "name": "passedInspection",
      "type": "BOOLEAN",
      "required": true,
      "default": false,
      "description": "Whether the inspection was passed"
    },
    {
      "name": "inspectionDate",
      "type": "TIMESTAMP",
      "required": true,
      "description": "Date of inspection"
    },
    {
      "name": "notes",
      "type": "TEXT",
      "required": false,
      "description": "Additional inspection notes"
    }
  ]
}
```

---

## **Option 2: Manual Checklist (Backup)**

### **📋 Complete Creation Checklist**

#### **Phase 1: Database Schema (5 minutes)**

- [ ] **Prisma Schema**: Add new `{issue_type}_issue` model
- [ ] **Enums**: Define all required enums
- [ ] **Relationships**: Link to main `issue` table
- [ ] **Migration**: Run `npx prisma db push`

#### **Phase 2: Backend API (10 minutes)**

- [ ] **Main Route**: `/api/{issue_type}_issues/route.ts`
  - [ ] GET (list all issues)
  - [ ] POST (create new issue)
  - [ ] Import required Prisma enums
  - [ ] Access control logic
- [ ] **Individual Route**: `/api/{issue_type}_issues/[id]/route.ts`
  - [ ] GET (fetch single)
  - [ ] PUT (update)
  - [ ] DELETE (soft delete)
  - [ ] **CRITICAL**: Copy access control from licenses API
- [ ] **Renewal Route**: `/api/{issue_type}_issues/renew/route.ts`
  - [ ] POST (renewal process)
  - [ ] Date calculations
  - [ ] Transaction logic

#### **Phase 3: React Components (15 minutes)**

- [ ] **Form Component**: `src/components/{issue_type}_issues/{issue_type}-issue-form.tsx`
  - [ ] `"use client"` directive
  - [ ] ShadCN UI components
  - [ ] Date pickers for date fields
  - [ ] Enum dropdowns
  - [ ] **CRITICAL**: Return saved issue in onSuccess
- [ ] **Renewal Form**: `src/components/{issue_type}_issues/{issue_type}-renewal-form.tsx`
  - [ ] Date auto-calculation
  - [ ] Minimal data duplication
  - [ ] **CRITICAL**: Return new issue in onSuccess

#### **Phase 4: Main Page (20 minutes)**

- [ ] **Page File**: `src/app/{issue_type}_issues/page.tsx`
  - [ ] `"use client"` directive
  - [ ] Import `AppLayout` and all UI components
  - [ ] Master-detail layout (400px list + details panel)
  - [ ] **CRITICAL**: Auto-select after create/renewal
  - [ ] **CRITICAL**: Refresh selected issue after edit
  - [ ] AddAddon integration
  - [ ] All state management (showAddForm, showEditForm, showRenewalForm)

#### **Phase 5: Navigation (2 minutes)**

- [ ] **Sidebar Update**: Add menu item to `app-sidebar.tsx`
  - [ ] Correct href with entity parameter
  - [ ] Appropriate icon
  - [ ] Disabled state when no entity selected

#### **Phase 6: Testing & Polish (5 minutes)**

- [ ] **Build Test**: `npm run build`
- [ ] **Runtime Test**: Create, edit, renew, add attachments
- [ ] **Navigation Test**: All contextual elements work
- [ ] **Access Control Test**: Proper permissions

---

## **🎯 Standard Pattern Requirements**

### **Every Issue Type MUST Have:**

#### **UI/UX Standards**

- ✅ **AppLayout wrapper** with contextual navigation
- ✅ **Master-detail layout**: 400px list + dynamic details panel
- ✅ **Consistent header**: Entity name, top nav, org selector
- ✅ **Three main states**: Add form, Edit form, Details view
- ✅ **Renewal process**: Replace "Deactivate" with "Renew"
- ✅ **Addons system**: File attachments with titles/notes
- ✅ **Auto-selection**: New issues automatically selected after creation

#### **Technical Standards**

- ✅ **Client components**: `"use client"` directive
- ✅ **Type safety**: Proper TypeScript interfaces
- ✅ **ShadCN styling**: Consistent UI components
- ✅ **Date handling**: `date-fns` for formatting
- ✅ **Error handling**: User-friendly error messages
- ✅ **Loading states**: Proper loading indicators

#### **Data Flow Standards**

- ✅ **API consistency**: Same patterns as licenses/MVRs
- ✅ **Access control**: Role-based permissions
- ✅ **Refresh logic**: Update UI after all operations
- ✅ **Transaction safety**: Database transactions for complex operations

---

## **📁 File Templates**

### **Prisma Schema Template**

```prisma
enum {IssueType}{FieldName} {
  VALUE_ONE
  VALUE_TWO
}

model {issue_type}_issue {
  id               String           @id @default(cuid())
  issueId          String           @unique
  // Custom fields here
  startDate        DateTime?
  expirationDate   DateTime?
  renewalDate      DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  issue            issue            @relation(fields: [issueId], references: [id], onDelete: Cascade)
}

// Add to issue model:
// {issue_type}_issue   {issue_type}_issue?
```

### **API Route Template (Main)**

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { {EnumType1}, {EnumType2} } from '@prisma/client'

interface {IssueType}IssueData {
  // Field definitions
  partyId: string
  title?: string
  description?: string
}

export async function GET(request: NextRequest) {
  // Copy from mvr_issues/route.ts
}

export async function POST(request: NextRequest) {
  // Copy from mvr_issues/route.ts
  // Update field mappings
}
```

### **Form Component Template**

```typescript
"use client"
import { useState } from 'react'
// Import all UI components
import { format } from 'date-fns'

interface {IssueType}IssueFormProps {
  partyId?: string
  {issueType}Issue?: any
  onSuccess?: (newIssue?: any) => void
  onCancel?: () => void
}

export default function {IssueType}IssueForm({ partyId, {issueType}Issue, onSuccess, onCancel }: {IssueType}IssueFormProps) {
  // Copy structure from mvr-issue-form.tsx
  // Update field definitions
  // CRITICAL: Return saved issue in onSuccess
}
```

### **Main Page Template**

```typescript
"use client"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
// Import all components

export default function {IssueType}IssuesPage() {
  // Copy complete structure from mvr_issues/page.tsx
  // Update issue type specific elements
  // CRITICAL: Implement auto-selection after create/renewal
}
```

---

## **🔧 Common Gotchas & Solutions**

### **Build Errors**

- ❌ **Missing `"use client"`** → Add to all page files
- ❌ **Type mismatches** → Import shared interfaces
- ❌ **Enum casting** → Cast strings to Prisma enums
- ❌ **Missing imports** → Check all component imports

### **Runtime Errors**

- ❌ **403 Forbidden** → Copy access control from licenses API
- ❌ **404 static chunks** → Clean build: `rm -rf .next && npm run dev`
- ❌ **Changes not reflecting** → Implement refresh functions

### **UX Issues**

- ❌ **Manual selection needed** → Auto-select after create/renewal
- ❌ **Missing contextual nav** → Copy AppLayout setup from licenses
- ❌ **Inconsistent styling** → Use ShadCN components throughout

---

## **🎯 Success Metrics**

**A successful issue type implementation should:**

- ✅ Build without errors
- ✅ Create, edit, renew, delete issues
- ✅ Auto-select new issues
- ✅ Handle attachments
- ✅ Proper role-based access
- ✅ Consistent UI/UX with existing issue types
- ✅ No performance issues

---

## **🚀 Next Issue Types to Implement**

### **Driver Issues (4 remaining)**

1. **Annual Inspections (AIN)** - DOT compliance tracking
2. **Roadside Inspections (RSIN)** - Incident management
3. **Accidents** - Incident reporting and tracking
4. **Violations** - Citation and penalty tracking

### **Equipment Issues (4 total)**

1. **Equipment Inspections** - Vehicle maintenance tracking
2. **Equipment Licenses** - Registration and permits
3. **Equipment Violations** - Equipment-related citations
4. **Equipment Maintenance** - Repair and service tracking

Each should take **15-30 minutes** with this streamlined process! 🎯

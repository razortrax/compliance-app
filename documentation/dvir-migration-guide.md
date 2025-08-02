# DVER → DVIR Migration Guide

*Created: January 31, 2025*

## Overview

This guide documents the systematic migration from incorrect "DVER" terminology to the correct "DVIR" (Driver Vehicle Inspection Report) terminology throughout the Fleetrax codebase.

## ✅ COMPLETED UPDATES

### **1. Database Schema**
- ✅ Updated `enum DverSource` → `enum DvirSource` in `prisma/schema.prisma`

### **2. Core Library Files**
- ✅ **NEW**: `src/lib/dvir-automation.ts` (corrected implementation)
  - `DVIRDocument`, `DVIREquipment`, `DVIRViolation` interfaces
  - `DVIRProcessor` class with `processDVIR()` method
  - `createIncidentFromDVIR()` function
- ✅ **DELETED**: `src/lib/dver-automation.ts` (old implementation)

### **3. UI Components**
- ✅ **NEW**: `src/components/incidents/dvir-upload-modal.tsx` (corrected implementation)
  - `DVIRUploadModal` component
  - Proper DVIR terminology throughout
- ✅ **DELETED**: `src/components/incidents/dver-upload-modal.tsx` (old implementation)
- ✅ **UPDATED**: `src/components/incidents/incident-form.tsx`
  - `dverReceived` → `dvirReceived`
  - `dverSource` → `dvirSource`
- ✅ **UPDATED**: `src/components/incidents/unified-incident-form.tsx`
  - `dverReceived` → `dvirReceived`
  - `dverSource` → `dvirSource`
- ✅ **NEW**: `src/components/roadside_inspections/roadside-inspection-form-fixed.tsx` (corrected implementation)

### **4. Page Components**
- ✅ **UPDATED**: `src/app/roadside_inspections/page.tsx`
  - `dverReceived` → `dvirReceived`
  - `dverSource` → `dvirSource`
  - Display labels: "DVER" → "DVIR"
- ✅ **UPDATED**: `src/app/roadside_inspections/page.tsx.broken`
  - `dverSource` → `dvirSource`
  - Display labels: "DVER" → "DVIR"

### **5. Documentation**
- ✅ **UPDATED**: `documentation/current-status.md`
  - "DVER Auto-Population System" → "DVIR Auto-Population System"
- ✅ **UPDATED**: `documentation/driver-issues-completion-plan.md`
  - "DVIR (not DVER) integration" → "DVIR integration"
- ✅ **UPDATED**: `documentation/roadside-inspections-plan.md`
  - `dverReceived` → `dvirReceived`
  - `dverSource` → `dvirSource`
  - `DverSource` → `DvirSource`

---

## 🚨 REQUIRED NEXT STEPS

### **Step 1: Database Migration** (CRITICAL)

You **must** run a Prisma migration to rename the enum in the database:

```bash
# Generate and run the migration
npx prisma migrate dev --name rename_dver_source_to_dvir_source

# Regenerate Prisma client
npx prisma generate
```

**Expected Migration SQL:**
```sql
-- AlterEnum
ALTER TYPE "DverSource" RENAME TO "DvirSource";

-- Update column references if needed
-- (Prisma should handle this automatically)
```

### **Step 2: Replace Component File** (After Migration)

Once the database migration is complete, replace the old roadside inspection form:

```bash
# Remove the old file with DVER references
rm src/components/roadside_inspections/roadside-inspection-form.tsx

# Rename the corrected file
mv src/components/roadside_inspections/roadside-inspection-form-fixed.tsx \
   src/components/roadside_inspections/roadside-inspection-form.tsx
```

### **Step 3: Update Import References**

Update any files that import the DVIR components:

**Files to check for import updates:**
- Any files importing from `@/lib/dver-automation` → `@/lib/dvir-automation`
- Any files importing `DVERUploadModal` → `DVIRUploadModal`
- Check for any remaining DVER references in JSX components

### **Step 4: Search for Remaining References**

Run a comprehensive search to catch any missed references:

```bash
# Search for any remaining DVER references
grep -r "DVER" src/ --exclude-dir=node_modules
grep -r "dver" src/ --exclude-dir=node_modules

# Search in documentation
grep -r "DVER" documentation/
grep -r "dver" documentation/
```

---

## 🔧 Verification Checklist

After completing the migration, verify everything works:

### **Database Verification**
```bash
# Check that the enum was renamed
npx prisma studio
# Navigate to the enum section and verify DvirSource exists
```

### **TypeScript Compilation**
```bash
# Ensure no TypeScript errors
npm run build
```

### **Component Functionality**
- [ ] Roadside inspection form loads without errors
- [ ] DVIR upload modal opens and functions correctly
- [ ] All dropdown menus for DVIR source work properly
- [ ] Form submissions include correct field names

### **UI Text Verification**
- [ ] All labels show "DVIR" instead of "DVER"
- [ ] Form field labels are correct
- [ ] Error messages reference correct terminology

---

## 📋 Database Field Mapping

### **Before Migration**
```sql
dverReceived    Boolean   @default(false)
dverSource      DverSource?
```

### **After Migration**
```sql
dvirReceived    Boolean   @default(false)
dvirSource      DvirSource?
```

### **Enum Values (Unchanged)**
```sql
enum DvirSource {
  Driver_Reported
  FMCSA_Portal_Check  
  Third_Party_Report
}
```

---

## 🎯 Expected Outcomes

### **User-Facing Changes**
- All forms and displays will show "DVIR" instead of "DVER"
- Professional terminology aligns with DOT standards
- No functional changes to workflow or data structure

### **Developer Benefits**
- Consistent terminology throughout codebase
- Proper alignment with DOT compliance standards
- Reduced confusion for future development

### **Technical Improvements**
- Clean TypeScript compilation
- Proper enum naming in database
- Consistent API field names

---

## 🚨 Rollback Plan

If issues arise during migration:

### **Database Rollback**
```bash
# Revert the migration
npx prisma migrate reset
# Note: This will reset ALL data - use with caution
```

### **Code Rollback**
```bash
# Restore from git if needed
git checkout HEAD~1 -- src/components/roadside_inspections/
git checkout HEAD~1 -- src/lib/
```

---

## 📞 Support

If you encounter issues during migration:

1. **Check database connection** before running migrations
2. **Backup database** before running migrations in production
3. **Test in development environment** first
4. **Verify all imports** after completing the migration

---

**Important**: The migration primarily affects roadside inspections and accidents functionality. Regular license, training, MVR, and physical issue management will not be affected by this change.

*Complete this migration before proceeding with additional driver issue overhauls to ensure consistent terminology throughout the system.* 
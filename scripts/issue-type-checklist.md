# ⚡ Quick Issue Type Creation Checklist

**Target Time: 15-30 minutes per issue type**

---

## 🗃️ **Phase 1: Database (5 min)**

- [ ] Add enums to `prisma/schema.prisma`
- [ ] Add `{name}_issue` model with fields
- [ ] Add relation to main `issue` model
- [ ] Run: `npx prisma db push`

---

## 🔌 **Phase 2: API Routes (10 min)**

### Main Route: `src/app/api/{name}_issues/route.ts`

- [ ] Copy from `mvr_issues/route.ts`
- [ ] Update interface and field mappings
- [ ] Import Prisma enums
- [ ] Update issue type name

### Individual Route: `src/app/api/{name}_issues/[id]/route.ts`

- [ ] Copy from `mvr_issues/[id]/route.ts`
- [ ] **CRITICAL**: Keep access control logic
- [ ] Update field mappings

### Renewal Route: `src/app/api/{name}_issues/renew/route.ts`

- [ ] Copy from `mvr_issues/renew/route.ts`
- [ ] Update date calculations
- [ ] Update data duplication logic

---

## ⚛️ **Phase 3: Components (15 min)**

### Form: `src/components/{name}_issues/{name}-issue-form.tsx`

- [ ] Copy from `mvr-issue-form.tsx`
- [ ] Add `"use client"` directive
- [ ] Update field definitions and form structure
- [ ] Add date pickers for date fields
- [ ] **CRITICAL**: `onSuccess?: (newIssue?: any) => void`
- [ ] **CRITICAL**: Return saved issue in handleSubmit

### Renewal Form: `src/components/{name}_issues/{name}-renewal-form.tsx`

- [ ] Copy from `mvr-renewal-form.tsx`
- [ ] Update date calculations
- [ ] **CRITICAL**: Return new issue in onSuccess

---

## 📄 **Phase 4: Main Page (20 min)**

### Page: `src/app/{name}_issues/page.tsx`

- [ ] Copy entire structure from `mvr_issues/page.tsx`
- [ ] Add `"use client"` directive
- [ ] Update all interface names and issue type references
- [ ] **CRITICAL**: Auto-select in create handler:
  ```typescript
  onSuccess={(newIssue) => {
    setShowAddForm(false)
    fetchIssues()
    if (newIssue) setSelectedIssue(newIssue)
  }}
  ```
- [ ] **CRITICAL**: Auto-select in renewal handler:
  ```typescript
  onSuccess={async (newIssue) => {
    setShowRenewalForm(false)
    await fetchIssues()
    if (newIssue) setSelectedIssue(newIssue)
  }}
  ```
- [ ] **CRITICAL**: Implement `refreshSelectedIssueAfterEdit`

---

## 🧭 **Phase 5: Navigation (2 min)**

### Sidebar: `src/components/layouts/app-sidebar.tsx`

- [ ] Add menu item in driver/equipment section:
  ```typescript
  {
    name: "{Name}s",
    href: entityId ? `/{name}_issues?entityId=${entityId}` : "#",
    icon: FileText,
    disabled: !entityId
  }
  ```

---

## ✅ **Phase 6: Test (5 min)**

- [ ] `npm run build` - no errors
- [ ] Create new issue - auto-selects
- [ ] Edit issue - changes reflect
- [ ] Renew issue - auto-selects new
- [ ] Add attachments - works
- [ ] Navigation - all contextual elements

---

## 🚨 **Critical Success Patterns**

### **Auto-Selection Pattern**

```typescript
// In form components
onSuccess?: (newIssue?: any) => void

// In main page handlers
onSuccess={(newIssue) => {
  // Close form, refresh list, select new issue
  if (newIssue) setSelectedIssue(newIssue)
}}
```

### **Refresh Pattern**

```typescript
// After edit operations
const refreshSelectedIssueAfterEdit = async () => {
  if (selectedIssue) {
    const res = await fetch(`/api/{name}_issues/${selectedIssue.id}`);
    const updated = await res.json();
    setSelectedIssue(updated);
  }
};
```

### **Access Control Pattern**

```typescript
// Copy this exact logic from licenses API
// Check user roles: master, organization manager, etc.
```

---

## 🎯 **Time Targets**

- **Database**: 5 minutes
- **API Routes**: 10 minutes
- **Components**: 15 minutes
- **Main Page**: 20 minutes
- **Navigation**: 2 minutes
- **Testing**: 5 minutes
- **Total**: **~60 minutes max**

**With templates and copy-paste: 15-30 minutes! 🚀**

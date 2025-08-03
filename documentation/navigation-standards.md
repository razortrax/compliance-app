# Navigation Standards - CRITICAL RULES

**Last Updated**: January 2025  
**Status**: MANDATORY COMPLIANCE  
**Violation**: Zero Tolerance Policy

---

## 🚨 **CRITICAL RULE: NEVER MAKE BUTTON NAMES DYNAMIC**

### **❌ FORBIDDEN - Dynamic Button Names**
```typescript
// NEVER DO THIS - FORBIDDEN!
{ label: masterOrg?.name || 'Master' }          // ❌ Dynamic master name
{ label: organization?.name || 'Organization' } // ❌ Dynamic org name  
{ label: driver?.name || 'Driver' }             // ❌ Dynamic driver name
{ label: equipment?.name || 'Equipment' }       // ❌ Dynamic equipment name
```

### **✅ REQUIRED - Static Button Names**
```typescript
// ALWAYS DO THIS - REQUIRED!
{ label: 'Master' }      // ✅ Always "Master"
{ label: 'Organization' } // ✅ Always "Organization"  
{ label: 'Drivers' }     // ✅ Always "Drivers"
{ label: 'Equipment' }   // ✅ Always "Equipment"
```

---

## 📋 **ORGANIZATION PAGE TOP NAVIGATION STANDARD**

### **Template (COPY EXACTLY)**
```typescript
// Correct static top navigation - NEVER make these dynamic!
const topNav = [
  { 
    label: 'Master', 
    href: masterOrg?.id ? `/master/${masterOrg.id}` : '/dashboard',
    isActive: false
  },
  { 
    label: 'Organization', 
    href: `/organizations/${orgId}`,
    isActive: true
  },
  { 
    label: 'Drivers', 
    href: `/organizations/${orgId}/drivers`,
    isActive: false
  },
  { 
    label: 'Equipment', 
    href: `/organizations/${orgId}/equipment`,
    isActive: false
  }
]
```

### **Required For All Organization Pages:**
- `src/app/master/[masterOrgId]/organization/[orgId]/*/page.tsx`
- `src/app/organizations/[id]/*/page.tsx`

---

## 🎯 **NAVIGATION CONTEXT RULES**

### **1. Master Pages**
```typescript
const topNav = [
  { label: 'Master', href: `/master/${masterOrgId}`, isActive: true }
]
```

### **2. Organization Pages** 
```typescript
const topNav = [
  { label: 'Master', href: `/master/${masterOrg.id}`, isActive: false },
  { label: 'Organization', href: `/organizations/${orgId}`, isActive: true },
  { label: 'Drivers', href: `/organizations/${orgId}/drivers`, isActive: false },
  { label: 'Equipment', href: `/organizations/${orgId}/equipment`, isActive: false }
]
```

### **3. Driver Pages**
```typescript
const topNav = [
  { label: 'Master', href: `/master/${masterOrg.id}`, isActive: false },
  { label: 'Organization', href: `/organizations/${orgId}`, isActive: false },
  { label: 'Drivers', href: `/organizations/${orgId}/drivers`, isActive: true },
  { label: 'Equipment', href: `/organizations/${orgId}/equipment`, isActive: false }
]
```

### **4. Equipment Pages**
```typescript
const topNav = [
  { label: 'Master', href: `/master/${masterOrg.id}`, isActive: false },
  { label: 'Organization', href: `/organizations/${orgId}`, isActive: false },
  { label: 'Drivers', href: `/organizations/${orgId}/drivers`, isActive: false },
  { label: 'Equipment', href: `/organizations/${orgId}/equipment`, isActive: true }
]
```

---

## 🔒 **ENFORCEMENT RULES**

### **Code Review Checklist**
- [ ] All button labels are static strings
- [ ] No dynamic names in navigation buttons
- [ ] TopNav structure matches the standard template
- [ ] Correct href patterns are used
- [ ] IsActive flags are set correctly

### **Common Violations (REJECT IMMEDIATELY)**
1. **Dynamic Labels**: Using `organization?.name` instead of `'Organization'`
2. **Inconsistent Structure**: Different topNav arrays across pages
3. **Wrong URLs**: Using master URLs in organization context
4. **Missing Static Flags**: Forgetting the `isActive` indicators

### **Testing Requirements**
- Navigation must work consistently across all contexts
- Button names must never change based on data
- URLs must follow the correct routing patterns
- Active states must highlight the current page context

---

## 💡 **WHY THESE RULES EXIST**

### **User Experience**
- **Predictable Navigation**: Users expect consistent button names
- **Mental Model**: Static labels help users understand the hierarchy
- **Visual Stability**: UI doesn't shift when data loads

### **Technical Benefits**
- **Maintainable Code**: Standard patterns are easier to debug
- **Consistent Behavior**: Same navigation experience everywhere
- **Reduced Bugs**: Less conditional logic means fewer edge cases

### **Business Impact**
- **Professional Appearance**: Consistent UI builds trust
- **Reduced Support**: Users don't get confused by changing labels
- **Faster Development**: Templates speed up implementation

---

## 🛠️ **IMPLEMENTATION GUIDE**

### **Step 1: Copy the Template**
Always start with the exact template from this document

### **Step 2: Update Context Variables**
Only change `masterOrgId`, `orgId`, `driverId`, `equipmentId`

### **Step 3: Set Active State**
Update `isActive: true` for the current page context

### **Step 4: Test Navigation**
Verify all links work and active states display correctly

---

## 🚨 **VIOLATION CONSEQUENCES**

### **Immediate Actions Required**
1. **Code Rejection**: Any PR with dynamic navigation labels will be rejected
2. **Immediate Fix**: Must be corrected before merge approval
3. **Pattern Review**: Check all related pages for similar violations

### **Pattern Compliance**
- All organization pages must use identical topNav structure
- Labels must remain static regardless of data state
- URL patterns must follow the established conventions
- Active states must accurately reflect current page context

---

## 📖 **QUICK REFERENCE**

### **Remember These Key Points:**
1. **Labels**: Always static strings, never dynamic
2. **Structure**: Use the exact template provided
3. **URLs**: Follow established routing patterns  
4. **Testing**: Verify navigation works in all contexts

### **When In Doubt:**
- Copy the template exactly
- Keep all labels static
- Test the navigation thoroughly
- Ask for review if uncertain

**This document exists because navigation consistency is critical for user experience and system maintainability. No exceptions.** 
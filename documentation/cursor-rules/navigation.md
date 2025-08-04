# Navigation Rules - DEFINITIVE PATTERNS

## 🚨 CRITICAL: FIXED NAVIGATION PATTERNS

### **These navigation patterns are MANDATORY and NEVER change:**

**Master users**: `Master | Organization | Drivers | Equipment` *(always)*
**Organization users**: `Organization | Drivers | Equipment` *(always)*  
**Location users**: `Location | Drivers | Equipment` *(always)*

### 🚫 **WRONG PATTERNS** (Never Do This):
- ❌ `Master | Organization | Equipment` (missing Drivers)
- ❌ `Master | Organization | Driver` (missing Equipment)  
- ❌ `Master | Organization | Equipment | Equipment` (duplicate)
- ❌ Navigation that changes based on current page

### ✅ **CORRECT IMPLEMENTATION**

The navigation should be **STATIC** and **ROLE-BASED ONLY** - it should NOT change based on:
- Current page (driver vs equipment)
- Context (which driver/equipment you're viewing)
- Sidebar state

```typescript
// ✅ CORRECT - One function that builds complete navigation
function buildStandardNavigation(
  masterOrgId: string,
  orgId: string,
  userRole?: string
): NavigationItem[] {
  if (userRole === 'master') {
    return [
      { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
      { label: 'Organization', href: `/master/${masterOrgId}/organization/${orgId}`, isActive: false },
      { label: 'Drivers', href: `/master/${masterOrgId}/organization/${orgId}/drivers`, isActive: false },
      { label: 'Equipment', href: `/master/${masterOrgId}/organization/${orgId}/equipment`, isActive: false }
    ]
  } else if (userRole === 'location') {
    return [
      { label: 'Location', href: `/organizations/${orgId}`, isActive: false },
      { label: 'Drivers', href: `/organizations/${orgId}/drivers`, isActive: false },
      { label: 'Equipment', href: `/organizations/${orgId}/equipment`, isActive: false }
    ]
  } else {
    // Organization user
    return [
      { label: 'Organization', href: `/organizations/${orgId}`, isActive: false },
      { label: 'Drivers', href: `/organizations/${orgId}/drivers`, isActive: false },
      { label: 'Equipment', href: `/organizations/${orgId}/equipment`, isActive: false }
    ]
  }
}
```

## 🔧 Implementation Rules

1. **Single Navigation Function**: Use one function for all pages
2. **Role-Based Only**: Navigation depends ONLY on user role
3. **Always Complete**: Always show both Drivers AND Equipment
4. **No Context Dependency**: Don't change based on current page

## 🚫 Delete These Functions
- `buildStandardDriverNavigation()` ❌
- `buildStandardEquipmentNavigation()` ❌

Replace with single `buildStandardNavigation()` function.

## 🧭 Top Navigation (Breadcrumbs)

### CRITICAL: Always Pass User Role
**NEVER** build navigation without fetching and passing the user's role. Navigation must be role-aware.

```typescript
// ✅ CORRECT - Always fetch user role
const [userRole, setUserRole] = useState<string | null>(null)

useEffect(() => {
  fetchUserRole()
}, [])

const fetchUserRole = async () => {
  const role = await getUserRole() // Use utility function
  setUserRole(role)
}

// ✅ CORRECT - Use single navigation function
topNav={buildStandardNavigation(masterOrgId, orgId, userRole)}
```

## 🔧 Sidebar Menu

### Equipment Sidebar Links
Equipment sidebar buttons must link to **equipment-specific** routes, not organization-level:

```typescript
// ✅ CORRECT - Equipment-specific routes
href={`/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/registrations`}
href={`/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`}
href={`/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/accidents`}

// ❌ WRONG - Organization-level routes  
href={`/master/${masterOrgId}/organization/${orgId}/roadside_inspections`}
href={`/master/${masterOrgId}/organization/${orgId}/accidents`}
```

### Required Props
Always pass all required props to AppLayout:
```typescript
<AppLayout
  name={masterOrg.name}
  topNav={buildStandardNavigation(masterOrgId, orgId, userRole)} // Use single function!
  sidebarMenu="equipment" // or "driver"
  equipmentId={equipmentId}           // For equipment pages
  driverId={driverId}                 // For driver pages
  masterOrgId={masterOrgId}
  currentOrgId={orgId}
>
```

## 🚫 Common Mistakes to Avoid

1. **Missing User Role**: Never build navigation without user role
2. **Context-Dependent Navigation**: Don't change navigation based on current page
3. **Missing Drivers or Equipment**: ALWAYS show both in top nav
4. **Multiple Navigation Functions**: Use ONLY the single buildStandardNavigation function

## 🔍 Testing Checklist

Before submitting navigation changes:
- [ ] Master users see: `Master | Organization | Drivers | Equipment`
- [ ] Org users see: `Organization | Drivers | Equipment`
- [ ] Location users see: `Location | Drivers | Equipment`
- [ ] Navigation NEVER changes based on current page
- [ ] All AppLayout props are passed correctly
- [ ] User role is fetched and passed to navigation builder 
# Type Safety Guidelines

## 🚨 ELIMINATE TYPE COERCION: Fix Root Causes, Not Symptoms

**Established after discovering widespread use of `as any` masking real type definition issues throughout the codebase.**

## Core Principles

### 1. **BAN UNSAFE TYPE COERCION**
```typescript
// ❌ BANNED - Masks real issues
const equipment = data.equipment as any
const selectedInspection = inspection as any
const registration = reg as any

// ✅ CORRECT - Fix the root type issue
interface EquipmentWithRelations extends Equipment {
  vehicleType: VehicleType
  location?: Location
}
const equipment: EquipmentWithRelations = data.equipment
```

### 2. **STRICT TYPE DEFINITIONS**
```typescript
// ❌ LAZY - Allows any structure
interface SomeProps {
  data: any
  items: any[]
}

// ✅ PRECISE - Enforces correct structure
interface SomeProps {
  data: {
    id: string
    name: string
    status: 'active' | 'inactive'
  }
  items: Array<{
    id: string
    label: string
    value: string
  }>
}
```

## Common Type Issues and Solutions

### 1. **Prisma Type Conflicts**
**Problem:** "Two different types with this name exist"

```typescript
// ❌ SYMPTOM FIX
const equipment = data.equipment as any

// ✅ ROOT CAUSE FIX
// Define precise interface for your use case
interface EquipmentFormData {
  id: string
  make: string
  model: string
  year?: number
  vin: string
  vehicleTypeId: string  // Use ID, not full relation
}

// Transform Prisma data to your interface
const equipmentData: EquipmentFormData = {
  id: data.equipment.id,
  make: data.equipment.make,
  model: data.equipment.model,
  year: data.equipment.year,
  vin: data.equipment.vin,
  vehicleTypeId: data.equipment.vehicleTypeId
}
```

### 2. **Optional vs Required Props**
**Problem:** Property might be undefined

```typescript
// ❌ IGNORE THE ISSUE
const name = user.name!  // Force non-null
const role = user.role as UserRole

// ✅ HANDLE PROPERLY
const name = user.name || 'Unknown'
const role = user.role ?? 'default'

// Or use proper type guards
if (user.role) {
  // TypeScript knows role is defined here
  const validRole: UserRole = user.role
}
```

### 3. **Function Parameter Types**
**Problem:** Function signature mismatches

```typescript
// ❌ FORCE FIT
buildStandardNavigation(id as string, orgId as string, role as any)

// ✅ FIX SIGNATURE OR HANDLING
// Option 1: Fix the data
const safeId = id || ''
const safeOrgId = orgId || ''
const safeRole = role || 'default'
buildStandardNavigation(safeId, safeOrgId, safeRole)

// Option 2: Update function to handle undefined
function buildStandardNavigation(
  id: string | undefined,
  orgId: string | undefined, 
  role: string | undefined
) {
  if (!id || !orgId) return []
  // Handle the undefined cases properly
}
```

## Type Definition Standards

### 1. **Component Props**
```typescript
// ✅ EXPLICIT AND COMPLETE
interface UserFormProps {
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  onSubmit: (data: UserFormData) => void
  onCancel: () => void
  isLoading?: boolean
  errors?: Record<string, string>
}

// ❌ VAGUE AND UNSAFE
interface UserFormProps {
  user?: any
  onSubmit: any
  onCancel: any
  isLoading?: any
  errors?: any
}
```

### 2. **API Response Types**
```typescript
// ✅ DEFINE PRECISE API TYPES
interface DriversApiResponse {
  drivers: Array<{
    id: string
    firstName: string
    lastName: string
    licenseNumber?: string
    compliance: {
      expiringIssues: number
      totalIssues: number
    }
  }>
  summary: {
    totalDrivers: number
    activeDrivers: number
    expiringIssues: number
  }
}

// ❌ ACCEPT ANYTHING
interface DriversApiResponse {
  drivers: any[]
  summary: any
}
```

### 3. **Database Entity Types**
```typescript
// ✅ EXTEND PRISMA TYPES WHEN NEEDED
import { Equipment, VehicleType, Location } from '@prisma/client'

interface EquipmentWithDetails extends Equipment {
  vehicleType: VehicleType
  location: Location | null
}

// ❌ OVERRIDE WITH ANY
interface EquipmentWithDetails {
  [key: string]: any
}
```

## Refactoring Guidelines

### Phase 1: Identify Type Coercion
```bash
# Find all unsafe type coercion
grep -r "as any" src/ --include="*.tsx" --include="*.ts"
grep -r "as unknown" src/ --include="*.tsx" --include="*.ts"
grep -r "!" src/ --include="*.tsx" --include="*.ts" | grep -v "!=="
```

### Phase 2: Categorize Issues
1. **Prisma type conflicts** - Most common
2. **Optional property access** - Second most common  
3. **Function signature mismatches** - Usually indicates interface changes
4. **API response handling** - Often vague typing

### Phase 3: Systematic Fixes
```typescript
// Pattern: Fix all Equipment type issues at once
// Pattern: Fix all User property access at once
// Pattern: Fix all navigation function calls at once
```

## Enforcement Rules

### 1. **Code Review Checklist**
- [ ] No `as any` type coercion
- [ ] No `as unknown` type coercion  
- [ ] No force non-null assertions (`!`) unless justified
- [ ] All interface properties properly typed
- [ ] Function parameters have explicit types

### 2. **ESLint Rules** (Recommended)
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/explicit-function-return-type": "warn"
}
```

### 3. **TypeScript Strict Mode**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## Success Metrics

- **Zero** `as any` type coercions in new code
- **Decreasing** count of `as any` in existing code
- **Zero** TypeScript compilation warnings
- **Improved** IDE autocomplete and error detection

---

**Remember: Type safety is not optional. It prevents runtime errors and improves developer experience.** 
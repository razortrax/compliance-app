# Gold Standard Template for Driver Issue Pages

## 🚨 **CRITICAL: EXACT LAYOUT STRUCTURE REQUIRED**

### **📐 Main Layout Pattern (MANDATORY)**
```typescript
<AppLayout {...requiredProps}>
  <div className="max-w-7xl mx-auto h-full">           {/* ⚠️ CRITICAL: Max width container */}
    <div className="space-y-6">                        {/* ⚠️ CRITICAL: Vertical spacing */}
      
      {/* Header Section - EXACT STRUCTURE */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ICON className="h-6 w-6" />
            TITLE
          </h1>
          <p className="text-gray-600 mt-1">
            Description for {driver.firstName} {driver.lastName}
          </p>
        </div>
        
        {/* Button Group - RIGHT ALIGNED */}
        <div className="flex items-center gap-3">
          {/* Conditional action buttons */}
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add ISSUE_TYPE
          </Button>
        </div>
      </div>

      {/* Split Pane Layout - EXACT STRUCTURE */}
      <div className="flex gap-6 h-[calc(100vh-200px)]">  {/* ⚠️ CRITICAL: Fixed flexbox */}
        
        {/* Left Pane - EXACT STRUCTURE */}
        <div className="w-[300px] flex-shrink-0">          {/* ⚠️ CRITICAL: Fixed width */}
          <Card className="h-full">                        {/* ⚠️ CRITICAL: Full height */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ICON className="h-5 w-5" />
                TITLE ({data.issues.length})
              </CardTitle>
              <CardDescription>
                Description text
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">  {/* ⚠️ CRITICAL: Scrollable */}
              {/* List content */}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane - EXACT STRUCTURE */}
        <div className="flex-1">                           {/* ⚠️ CRITICAL: Flexible width */}
          <Card className="h-full">                        {/* ⚠️ CRITICAL: Full height */}
            <CardHeader>
              <CardTitle>ISSUE_TYPE Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">  {/* ⚠️ CRITICAL: Scrollable */}
              {/* Details + ActivityLog */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</AppLayout>
```

## 📋 **MANDATORY IMPLEMENTATION CHECKLIST**

### **🔍 Step 1: State Management (Copy from Training exactly)**
```typescript
const [data, setData] = useState<ContextData | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null)
const [organizations, setOrganizations] = useState<any[]>([])        // ⚠️ CRITICAL
const [isSheetOpen, setIsSheetOpen] = useState(false)               // ⚠️ CRITICAL
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)
```

### **🔍 Step 2: Data Fetching (Copy useEffect patterns exactly)**
```typescript
// Main data fetch - EXACT ERROR HANDLING
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/{ISSUE_TYPE}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Driver not found in this organization')
        } else if (response.status === 403) {
          throw new Error('Access denied to this organization')
        } else {
          throw new Error(`Failed to load data: ${response.status}`)
        }
      }
      
      const result = await response.json()
      setData(result)
      
      // Auto-select first issue if available
      if (result.issues && result.issues.length > 0) {
        setSelectedIssue(result.issues[0])
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [masterOrgId, orgId, driverId])

// Organizations fetch - ⚠️ CRITICAL FOR SIDEBAR
useEffect(() => {
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const orgs = await response.json()
        setOrganizations(orgs)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }
  fetchOrganizations()
}, [])
```

### **🔍 Step 3: Navigation & Organization Handler**
```typescript
// ⚠️ CRITICAL: Static topNav using buildStandardDriverNavigation
const topNav = buildStandardDriverNavigation(
  { id: '', role: '' },
  data.masterOrg,
  data.organization,
  undefined,
  'drivers' // or 'equipment'
)

// ⚠️ CRITICAL: Organization selector handler
const handleOrganizationSelect = (org: any) => {
  console.log('Organization selected:', org.id)
  setIsSheetOpen(false)
  window.location.href = `/master/${masterOrgId}/organization/${org.id}`
}
```

### **🔍 Step 4: AppLayout Props (ALL 6 required)**
```typescript
<AppLayout 
  name={data.masterOrg.name}                     // ⚠️ CRITICAL
  topNav={topNav}                                // ⚠️ CRITICAL
  showOrgSelector={true}                         // ⚠️ CRITICAL
  organizations={organizations}                  // ⚠️ CRITICAL  
  onOrganizationSelect={handleOrganizationSelect} // ⚠️ CRITICAL
  isSheetOpen={isSheetOpen}                     // ⚠️ CRITICAL
  onSheetOpenChange={setIsSheetOpen}            // ⚠️ CRITICAL
  className="p-6"
>
```

### **🔍 Step 5: Activity Log Integration**
```typescript
// ⚠️ CRITICAL: Import ActivityLog
import { ActivityLog } from '@/components/ui/activity-log'

// ⚠️ CRITICAL: Add in details section
<ActivityLog 
  issueId={selectedIssue.issue.id}
  title="Activity Log"
  allowedTypes={['note', 'communication', 'url', 'credential', 'attachment', 'task']}
  compact={false}
  maxHeight="400px"
/>
```

## 🎯 **IMPLEMENTATION PROCESS**

### **Phase 1: Copy Training File Exactly**
1. **Copy entire Training file** → Rename to new issue type
2. **Find & Replace**: `training` → `{issue_type}`, `Training` → `{ISSUE_TYPE}`
3. **DO NOT change layout structure**

### **Phase 2: Systematic Verification**
1. ✅ **Layout Structure**: `flex gap-6 h-[calc(100vh-200px)]`
2. ✅ **Left Pane**: `w-[300px] flex-shrink-0`
3. ✅ **Right Pane**: `flex-1`
4. ✅ **Cards**: `className="h-full"`
5. ✅ **CardContent**: `className="flex-1 overflow-auto"`
6. ✅ **Container**: `max-w-7xl mx-auto h-full`
7. ✅ **Header Structure**: Exact button alignment
8. ✅ **State variables**: All 8 required
9. ✅ **AppLayout props**: All 7 required
10. ✅ **ActivityLog**: Integrated with exact props

### **Phase 3: API & Form Customization**
1. Update API endpoints (keep URL-driven pattern)
2. Update form components
3. Update interfaces/types
4. **DO NOT** change core structure/layout

## ⚠️ **NEVER SKIP THESE - VISUAL COMPLIANCE**

1. **Fixed flexbox layout** (`flex gap-6 h-[calc(100vh-200px)]`)
2. **Fixed left pane width** (`w-[300px] flex-shrink-0`)
3. **Full height cards** (`className="h-full"`)
4. **Scrollable content** (`flex-1 overflow-auto`)
5. **Organization selector state** (`organizations`, `isSheetOpen`)
6. **Complete AppLayout props** (all 7 required)
7. **ActivityLog integration** (exact props)
8. **Container div with proper margins** (`max-w-7xl mx-auto h-full`)
9. **Header button alignment** (right-aligned action buttons)

## 🔧 **Comprehensive Verification Script**
```bash
# Layout Structure Checks
grep -n "flex gap-6 h-\[calc" {new_file}              # Fixed flexbox
grep -n "w-\[300px\] flex-shrink-0" {new_file}        # Fixed left width
grep -n "className=\"h-full\"" {new_file}             # Full height cards
grep -n "flex-1 overflow-auto" {new_file}             # Scrollable content

# State & Props Checks  
grep -n "organizations.*useState" {new_file}           # Organization state
grep -n "showOrgSelector.*true" {new_file}            # Org selector enabled
grep -n "max-w-7xl mx-auto" {new_file}               # Container margins
grep -n "buildStandardDriverNavigation" {new_file}    # Static navigation
grep -n "ActivityLog" {new_file}                      # Activity log integrated

# API & Structure Checks
grep -n "URL-driven.*api/master" {new_file}           # URL-driven APIs
grep -n "status.*Active" {new_file}                   # Correct issue status
```

## 🚨 **ZERO TOLERANCE POLICY**

**If ANY verification check fails, STOP and fix before proceeding. Layout inconsistency creates user confusion and breaks the unified experience.** 
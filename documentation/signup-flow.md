# Signup & Onboarding Flow

*Design Document for ComplianceApp User Journey*

## **Public Landing Page (localhost:3000)**

### Role Selection Cards
```
┌─────────────────┐  ┌─────────────────┐
│   Master        │  │  Organization   │
│   Manager       │  │   Manager       │
│                 │  │                 │
│ • Multi-company │  │ • Single org    │
│ • Full control  │  │ • Assigned by   │
│ • Plan limits   │  │   Master        │
└─────────────────┘  └─────────────────┘
     [Get Started]       [Get Started]
```

## **Signup Process**

### Step 1: Role-Aware Signup
- Clerk signup modal with role context
- Store role selection in user metadata
- Standard email/password authentication

### Step 2: Smart Routing Logic
```
After Signup → Check Role & Company Count:

Master Manager:
├─ 0 companies → Organizations Page (onboarding wizard)
└─ 1+ companies → Master Overview Dashboard

Organization Manager:
└─ Always → Organizations Page (assigned organization)
```

## **Onboarding Wizard (Empty Organizations Page)**

### Welcome Screen
```
🎉 Welcome to Fleetrax!
Let's get your fleet compliance tracking set up.

Choose your setup path:
┌─ 🚀 Quick Start       ┐ → Manual entry (3-5 records)
├─ 📊 Import Data       ┤ → Bulk import (future)
└─ 👀 Take a Tour       ┘ → Demo with sample data
```

### Quick Start Flow
```
Step 1: ✅ Create Organization
Step 2: 📋 Add Sample Data
   ├─ Add 2-3 drivers
   ├─ Add 1-2 vehicles  
   └─ Create sample issues
Step 3: 🎯 Set Preferences
   ├─ Notification settings
   └─ Compliance priorities
Step 4: 🚀 Launch Dashboard
```

## **Post-Onboarding Experience**

### Master with Single Organization
- Organizations page with their one company
- Option to add more organizations
- Simple company management

### Master with Multiple Organizations  
- Master Overview Dashboard:
  - Top KPIs (expiring issues, open inspections, accidents)
  - Company selector
  - Per-company metrics grid
  - Quick actions across companies

### Organization Manager
- Organizations page with assigned company
- Full management capabilities for their organization
- Cannot create additional organizations

## **Future Enhancements**

### Bulk Import System
- Excel/CSV templates for drivers, equipment, issues
- Validation and error handling
- Preview before import
- Duplicate detection

### Advanced Onboarding
- Video tutorials
- Progressive disclosure
- Role-based guidance
- Integration setup (DOT API, etc.)

## **Technical Implementation Notes**

### User Role Storage
```typescript
// Clerk user metadata
{
  role: 'master' | 'organization' | 'location',
  organizationIds: string[], // for non-masters
  setupCompleted: boolean,
  onboardingStep: number
}
```

### Routing Middleware
- Check user role and organization count
- Redirect based on business logic
- Handle edge cases (deleted orgs, role changes)

### Database Changes
- Track onboarding completion
- Store wizard preferences
- Link users to organizations via roles table 
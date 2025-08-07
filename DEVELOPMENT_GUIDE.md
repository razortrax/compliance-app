# Development Guide

*The single source of truth for all development practices and standards.*

## 🚀 Quick Start for New Developers

**Immediate (Today):**
```bash
# 1. Set up automatic enforcement
./scripts/setup-git-hooks.sh

# 2. All developers read the main guide
cat DEVELOPMENT_GUIDE.md
```

## 📋 Development Standards

### Mandatory Pre-Commit Workflow
1. **Run build validation**: `npm run build` (zero TypeScript errors required)
2. **Test core functionality**: Verify no regressions in working features
3. **Document breaking changes**: Update relevant documentation
4. **Follow change management**: Use systematic approach for interface changes

### Documentation Requirements
- **Interface Changes**: Document in `documentation/cursor-rules/change-management.md`
- **Build Standards**: Follow `documentation/cursor-rules/build-validation.md`
- **Type Safety**: Adhere to `documentation/cursor-rules/type-safety.md`
- **Cleanup Procedures**: Use `documentation/cursor-rules/cleanup-procedures.md`

## 🛠 Recent Major Improvements

### RINS (Roadside Inspections) System Fixes (January 2025)
**Status**: ✅ Complete and Production Ready

**Major Standardization Achievement (February 2025):**
- **Universal Access**: RSIN functionality now available from all three contexts:
  - Organization-level: `Master → Organization → Roadside Inspections`
  - Driver-specific: `Master → Organization → Drivers → [Driver] → Roadside Inspections`
  - Equipment-specific: `Master → Organization → Equipment → [Equipment] → Roadside Inspections`
- **Context-Based Auto-Population**: Intelligent pre-selection based on entry point
- **Complete CAF Workflow**: Full Corrective Action Form generation, assignment, and approval process
- **Unified Experience**: Identical functionality across all three entry points

**CAF (Corrective Action Form) Workflow Implementation:**
- **Smart Violation Grouping**: Groups violations by type (Driver/Equipment/Company) into separate CAFs
- **Digital Signatures**: Web-based signature capture with PDF export capabilities
- **Document Management**: File upload/download system for supporting documentation
- **Maintenance Integration**: Direct work order creation for equipment-related violations
- **Role-Based Permissions**: Master users and staff with appropriate permissions can approve CAFs
- **Status Tracking**: Complete workflow from ASSIGNED → IN_PROGRESS → COMPLETED → SIGNED → APPROVED

**Key Improvements:**
- **Violation Type Mapping**: Fixed incorrect violation type assignments using intelligent code-based mapping
- **Navigation Consistency**: Master users now see correct "Master" button in top navigation  
- **UI/UX Cleanup**: Removed confusing X button from detail pages
- **Database Migration**: Updated all existing violations with correct types

**Technical Implementation:**
- **Smart Violation Classification**: 
  - 391.x codes → Driver Qualification
  - 392.x codes → Driver Performance  
  - 393.x/396.x codes → Equipment
  - 390.x codes → Company Operations
- **API Enhancement**: `/api/violations/search` now includes intelligent type mapping with severity detection
- **Database Cleanup**: Migration script corrected 2 existing violations with wrong types
- **Navigation Fix**: Changed hardcoded 'driver' role to 'master' in master organization pages

**FMCSA Integration:**
- Seeded 2,021+ violation codes from official FMCSA data
- Real-time violation search with proper categorization
- Enhanced violation cards showing inspector comments and type badges

**Next Phase**: Ready for CAF (Corrective Action Form) workflow implementation

### Equipment Management System (January 2025)
**Status**: ✅ Complete and Production Ready

**Key Features:**
- **Smart Category-Based Validation**: Category (Power Unit/Trailer) is required; Vehicle Type only for Power Units
- **Comprehensive Enum System**: 19+ vehicle types, categories, colors, fuel types, ownership types
- **Conditional UI**: Vehicle Type field appears/disappears based on category selection
- **Enhanced Validation**: Both client-side and server-side validation with clear error messages

**Technical Implementation:**
- Fixed API validation: `categoryId` required, `vehicleTypeId` optional
- Seeded equipment enums database with comprehensive data
- Conditional form rendering based on category selection
- Auto-clearing logic when switching between Power Unit and Trailer

**Developer Notes:**
- Equipment creation now supports both trailers and power units seamlessly
- Form validates category selection before submission
- API endpoints properly handle all equipment fields and relationships

### Systematic Development Process Implementation
**Status**: ✅ Active

**Components:**
- Automated git hooks for build validation
- Comprehensive change management protocols  
- Type safety enforcement guidelines
- Mandatory build success requirements
- Cleanup procedures for deprecated code

## 🔧 Core Development Rules

### 1. Change Management Protocol
- **Never modify working interfaces** without systematic migration
- **Identify ALL consumers** via grep search before breaking changes
- **Plan migration strategy** and update all usage sites first
- **Require explicit approval** before touching stable functionality

### 2. Build Validation Requirements
- **Run `npm run build`** before every significant change
- **Zero TypeScript compilation errors** required for commits
- **Test working functionality** to prevent regressions
- **Clear .next cache** when encountering runtime issues

### 3. Type Safety Standards
- **Eliminate `as any` type coercions** - each indicates a type definition mismatch
- **Regenerate Prisma client** after schema changes: `npx prisma generate`
- **Use proper TypeScript types** from Prisma client
- **Fix type mismatches** at the source, not with casting

### 4. Code Cleanliness
- **Remove deprecated/unused files** to prevent confusion
- **Delete duplicate components** that serve the same purpose
- **Maintain single source of truth** for each functionality
- **Document which code is active** vs legacy

## 📚 Reference Documentation

All detailed documentation is located in `documentation/cursor-rules/`:
- `development-standards.md` - Quick reference overview
- `change-management.md` - Protocol for managing interface changes  
- `build-validation.md` - Guidelines for mandatory build workflow
- `type-safety.md` - TypeScript usage and type safety guidelines
- `cleanup-procedures.md` - Rules for code cleanliness

## 🚨 Emergency Protocols

### When Things Break
1. **Run build first**: `npm run build` to see actual errors
2. **Clear cache**: `rm -rf .next` if runtime issues persist
3. **Check git history**: Recent changes that might have caused issues
4. **Systematic debugging**: Fix one error at a time, not multiple simultaneously

### When Making Breaking Changes
1. **Pause and plan**: Document the change and identify all consumers
2. **Get approval**: Discuss with team before modifying working functionality
3. **Migrate systematically**: Update all consumers before changing interfaces
4. **Test thoroughly**: Verify no regressions in existing functionality

---

*This guide is the foundation for maintaining code quality and preventing regressions. All developers must follow these standards.* 
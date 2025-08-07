# Changelog

All notable changes to ComplianceApp will be documented in this file.

## [Unreleased] - February 2025

### 🎯 RSIN System Standardization & CAF Workflow - COMPLETE

#### Major Features Added
- **Universal RSIN Access**: Standardized RSIN functionality across all three entry points:
  - Organization-level RSINs with full driver/equipment selection
  - Driver-specific RSINs with intelligent driver pre-selection
  - Equipment-specific RSINs with intelligent equipment pre-selection
- **Complete CAF Workflow**: Full Corrective Action Form system implementation
  - Smart violation grouping by type (Driver/Equipment/Company)
  - Digital signature capture and management
  - PDF generation (fillable and completed forms)
  - Document attachment system
  - Role-based approval workflow
  - Maintenance work order integration for equipment violations
- **Context-Based Auto-Population**: Intelligent pre-selection based on navigation context
- **CAF Management Dashboard**: Centralized CAF oversight for master users
- **RSIN Management User Guide**: Comprehensive step-by-step instructions with promotional tone

#### Enhanced
- **PDF Generation**: Fillable CAF PDFs with digital signature support
- **Document Management**: File upload/download system for CAF attachments
- **Status Tracking**: Complete workflow states (ASSIGNED → IN_PROGRESS → COMPLETED → SIGNED → APPROVED)
- **Permission System**: Role-based CAF signing and approval capabilities

## [Previous] - January 2025

### 🎯 RINS (Roadside Inspections) System Enhancements

#### Fixed
- **Violation Type Classification**: Corrected violation type mapping using intelligent code-based rules
  - 391.x codes now properly map to "Driver Qualification"
  - 392.x codes now properly map to "Driver Performance"  
  - 393.x/396.x codes now properly map to "Equipment"
  - 390.x codes now properly map to "Company Operations"
- **Master Navigation**: Fixed missing "Master" button in top navigation for master users
- **UI/UX**: Removed confusing X button from RINS detail pages

#### Added
- **FMCSA Violation Database**: Seeded 2,021+ violation codes from official FMCSA data
- **Enhanced Violation Search**: Real-time search with proper categorization and severity detection
- **Violation Detail Cards**: Added inspector comments and color-coded type badges
- **Database Migration**: Automatic correction of existing violation types

#### Technical
- Enhanced `/api/violations/search` endpoint with intelligent mapping
- Fixed hardcoded user roles in master organization pages
- Added comprehensive violation type validation and fallback logic

### 🔧 Equipment Management System

#### Fixed
- **Category Validation**: Made Category field required, Vehicle Type conditional on Power Units
- **API Validation**: Corrected `categoryId` requirement vs `vehicleTypeId` optional
- **Form Logic**: Vehicle Type field now auto-hides/clears for Trailers

#### Added
- **Equipment Enums**: Comprehensive seed data for categories, vehicle types, colors, fuel types
- **Conditional UI**: Smart form rendering based on category selection
- **Enhanced Validation**: Both client-side and server-side validation

### 🛠 Development Process

#### Added
- **Systematic Standards**: Comprehensive development guidelines and enforcement
- **Git Hooks**: Automatic validation of build and standards
- **Documentation**: Complete cursor rules and change management protocols

---

## Previous Versions

*Historical changes will be documented here as we continue development.* 
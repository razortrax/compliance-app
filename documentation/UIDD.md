# UI/UX Design Decisions

*Updated: January 24, 2025 - Current Implementation*

## Layout Architecture

### AppLayout Pattern
- **Single Layout Component**: All pages use consistent AppLayout with header, sidebar, content
- **Contextual Header**: Top navigation changes based on user role and current page context
- **Smart Sidebar**: Role-based menus with organization/driver/equipment selectors
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Navigation Philosophy
- **Contextual Navigation**: Top nav reflects user's permission scope and current context
- **Breadcrumb Logic**: Navigation shows hierarchical relationship (Master → Organization → Specific Entity)
- **Smart Defaults**: Users land on appropriate pages based on their role after authentication

## Page Structure Standards

### Standard Page Layout
1. **Header**: Logo + Name + Top Navigation + Greeting + Account
2. **Name Row**: Entity name + Action buttons (Edit, Reports, etc.)
3. **Tab Navigation**: Primary content organization (Details | Related Entities)
4. **Content Area**: Tab-specific content with KPIs and entity lists

### Tab Organization Pattern
- **Details Tab**: Overview KPIs + Entity information + Edit functionality
- **Related Entity Tabs**: Filtered lists of associated entities (Drivers, Equipment, Locations)
- **Future Tabs**: Compliance-specific tabs (Licenses, Inspections, Issues)

## Component Design System

### Modal Patterns
- **Add/Edit Forms**: Consistent modal approach for all CRUD operations
- **Modal Sizing**: Standard sizes (sm:max-w-[600px] for forms, [700px] for complex forms)
- **Form Structure**: Header with title/description + Form content + Action buttons
- **Loading States**: Disabled buttons with loading text during operations

### Form Design Standards
- **Card-based Sections**: Group related fields in cards with headers
- **Streamlined Fields**: Only essential fields, complex data in separate tables
- **Smart Defaults**: Auto-populate reasonable defaults (role types, current organization)
- **Enhanced Controls**: Year/month dropdowns for dates, location selectors

### Data Display Patterns
- **Card Grids**: Entity lists use card layout with consistent spacing
- **KPI Dashboards**: Color-coded metrics in grid format
- **Empty States**: Helpful empty states with clear call-to-action buttons
- **Status Indicators**: Consistent badge system for entity status

## Color & Status System

### KPI Color Coding
- **Blue**: Driver/Person counts
- **Green**: Equipment/Vehicle counts  
- **Yellow**: Expiring issues/warnings
- **Red**: Critical issues/violations
- **Purple**: Accidents/incidents

### Status Badge Colors
- **Active**: Green background for active entities
- **Inactive**: Gray background for deactivated entities
- **Pending**: Yellow background for pending approvals
- **Warning**: Orange background for attention needed

## Navigation Context Rules

### Master User Navigation
- **Full Hierarchy**: Master | Organization | Drivers | Equipment
- **Organization Selector**: Always visible for switching between managed orgs
- **Global Access**: Can view all organizations and drill down to any level

### Organization Manager Navigation
- **Organization Scope**: Organization | Drivers | Equipment  
- **Limited Selector**: Organization selector only if consulting multiple orgs
- **Scoped Access**: Only see data within their organizational boundary

### Location Manager Navigation
- **Location Scope**: Location | Drivers | Equipment
- **No Selectors**: Direct access to their assigned location only
- **Filtered Data**: Only see drivers/equipment assigned to their location

## Interaction Standards

### Loading States
- **Page Loading**: Full-page spinner with AppLayout shell
- **Data Loading**: Section-specific loading indicators
- **Button Loading**: Disabled state with loading text and spinner icon
- **Optimistic Updates**: Immediate UI feedback with error rollback

### Error Handling
- **Inline Errors**: Form validation errors displayed inline
- **Toast Notifications**: Success/error messages for operations
- **Graceful Degradation**: Helpful error states with recovery options
- **Not Found Pages**: Clear messaging with navigation back options

## Responsive Design

### Breakpoint Strategy
- **Mobile First**: Design for mobile, enhance for larger screens
- **Key Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid Adaptation**: KPI grids collapse appropriately (5→3→2→1 columns)
- **Navigation Adaptation**: Sidebar becomes collapsible on mobile

### Touch Considerations
- **Button Sizing**: Minimum 44px touch targets
- **Modal Behavior**: Full-screen modals on mobile when needed
- **Form Inputs**: Proper mobile keyboard types for inputs
- **Gesture Support**: Standard swipe/tap patterns where applicable

## Accessibility Standards

### Keyboard Navigation
- **Tab Order**: Logical tab progression through interface
- **Focus Indicators**: Clear focus states on all interactive elements
- **Keyboard Shortcuts**: Standard shortcuts for common actions
- **Modal Trapping**: Focus management within modals

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Descriptive labels for complex interactions
- **Status Announcements**: Screen reader feedback for state changes
- **Alt Text**: Descriptive alt text for all images and icons

## Future Enhancement Guidelines

### Performance Optimization
- **Lazy Loading**: Load heavy components only when needed
- **Image Optimization**: Use Next.js Image component consistently
- **Bundle Splitting**: Code splitting for different user roles
- **Caching Strategy**: Smart caching for compliance data freshness

### Scalability Considerations
- **Component Reusability**: Design components for multiple contexts
- **Configuration-Driven**: Make layouts configurable for different compliance types
- **Theme Support**: Prepare for white-label/multi-tenant theming
- **Internationalization**: Structure for future multi-language support

---

**Design Principle**: Consistency, clarity, and compliance-focused user experience across all interfaces.


# Architecture Rules & Patterns

## Core Technology Constraints
- Use **Next.js <15** with App Router only. No major version upgrades without approval.
- Lock to **React <19** to avoid compatibility issues with Next.js.
- No unofficial or unstable architecture changes allowed without written review.

## Database Architecture
- **Party Model**: All entities (Organization, Location, Person, Equipment, Consultant) inherit from Party table
- **Role Relationships**: Flexible many-to-many relationships through Role table
- **Access Control**: Master orgs can manage all orgs, consultants have specific assignments
- **Transactions**: Use Prisma transactions for multi-table operations
- **ID Generation**: Use `@paralleldrive/cuid2` for unique identifiers

## Frontend Patterns

### Layout System
- **AppLayout**: Single layout component with header, sidebar, content
- **AppHeader**: Contextual top navigation based on user role and path
- **AppSidebar**: Role-based menu with organization/driver/equipment selectors
- **Responsive**: Mobile-first approach with Tailwind breakpoints

### Navigation Architecture
- **Contextual Top Nav**: Changes based on user role and current page
  - Master: `Master | Organization | Drivers | Equipment`
  - Org Manager: `Organization | Drivers | Equipment`
  - Location Manager: `Location | Drivers | Equipment`
- **Sidebar Context Menus**: Different menus for Organization/Driver/Equipment contexts
- **Smart Routing**: Automatic redirect based on user role after authentication

### Component Patterns
- **Modal Forms**: All add/edit operations use consistent modal patterns
- **Tab Structure**: Details | Related Entities (Drivers/Equipment/Locations)
- **KPI Dashboards**: Real-time counts with color-coded metrics
- **Empty States**: Consistent empty state components with call-to-action
- **Status Badges**: Standardized status display across entities

## API Design Patterns

### REST Endpoints
- **Resource-based**: `/api/entities` and `/api/entities/[id]`
- **Nested Resources**: `/api/organizations/[id]/locations`
- **Action Endpoints**: `/api/entities/[id]/action` for specific operations

### Access Control Strategy
1. **User Role Detection**: Check user's primary role (master/org/location)
2. **Master Access**: Masters can access all organizations
3. **Direct Ownership**: Users can access organizations they created
4. **Consultant Access**: Users can access organizations they consult for
5. **Hierarchical Filtering**: Data filtered by organizational scope

### Error Handling
- **Consistent Responses**: Standard error format across all endpoints
- **Status Codes**: Proper HTTP status codes (401, 403, 404, 500)
- **Logging**: Console logging for debugging with structured format

## UI/UX Standards

### Design System
- **ShadCN Components**: Use only ShadCN components for consistency
- **Tailwind Classes**: Utility-first CSS with semantic color system
- **Typography**: Consistent heading hierarchy and text sizing
- **Spacing**: 4px grid system for consistent spacing

### Interaction Patterns
- **Loading States**: Spinner animations for async operations
- **Optimistic Updates**: Immediate UI feedback with rollback on error
- **Form Validation**: Client-side validation with server-side verification
- **Modal Management**: Centralized modal state management

## Data Flow Architecture

### State Management
- **React State**: Use useState for component-level state
- **Data Fetching**: Direct fetch calls with useEffect
- **Real-time Updates**: Manual refresh after mutations
- **Form State**: Controlled components with useState

### Caching Strategy
- **No Caching**: Fresh data on every request (compliance requires current data)
- **Optimistic Updates**: UI updates immediately, syncs with server
- **Error Recovery**: Automatic retry for failed operations

## Compliance Terminology
- **AIN**: Annual Inspections (proactive DOT requirements with expiration dates)
- **RSIN**: Roadside Inspections (reactive enforcement events with violation workflows)
- **Party**: Any entity that can have roles and relationships
- **Role**: Relationship between parties with specific permissions
- **Issue**: Any compliance-related item with expiration or tracking requirements

## Security Patterns
- **Authentication**: Clerk for user management and authentication
- **Authorization**: Role-based access control through party relationships
- **Data Isolation**: Users only see data within their organizational scope
- **API Security**: All endpoints validate user permissions before data access

## Performance Guidelines
- **Database Queries**: Minimize N+1 queries with proper includes
- **Component Loading**: Lazy load heavy components where appropriate
- **Image Optimization**: Use Next.js Image component for optimizations
- **Bundle Size**: Keep bundle size manageable, avoid unnecessary dependencies

## Code Organization
- **Feature-based Structure**: Group related components, APIs, and types
- **Shared Components**: Common UI components in `/components/ui`
- **Business Logic**: Keep business logic in API routes, not components
- **Type Safety**: Comprehensive TypeScript usage across all files

## Testing Strategy (Future)
- **Unit Tests**: Jest for utility functions and components
- **Integration Tests**: API endpoint testing with test database
- **E2E Tests**: Critical user flows with Playwright
- **Manual Testing**: Comprehensive testing of all CRUD operations

---

**Follow these patterns** to maintain consistency and quality across the application.

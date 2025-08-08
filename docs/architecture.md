# Fleetrax Technical Architecture

## System Overview

Fleetrax is built as a modern, scalable SaaS platform using a comprehensive full-stack architecture designed for enterprise fleet compliance management.

## Technology Stack

### Frontend Architecture

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for full type safety
- **UI Library**: React 18 with ShadCN UI components
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React hooks with optimistic updates
- **Authentication**: Clerk with role-based access control

### Backend Architecture

- **API**: Next.js API Routes (serverless)
- **Database ORM**: Prisma with PostgreSQL
- **Authentication**: Clerk server-side integration
- **File Storage**: DigitalOcean Spaces (S3-compatible)
- **Validation**: Zod schemas for type-safe data handling

### Database Design

- **Primary DB**: PostgreSQL on DigitalOcean
- **Key Pattern**: Unified Party Model for all entities
- **Relationships**: Complex many-to-many with role-based access
- **Performance**: Optimized indexing for compliance queries

## Core Architectural Patterns

### 1. Unified Party Model

All entities (Organizations, Drivers, Equipment, Locations) inherit from a unified `party` table:

```typescript
model party {
  id        String   @id @default(cuid())
  userId    String?  // Clerk user association
  status    String   @default("active")

  // Entity-specific tables
  organization Organization?
  person       Person?
  equipment    Equipment?
  location     Location?

  // Universal relationships
  roles        Role[]
  issues       Issue[]
  activities   ActivityLog[]
}
```

### 2. Role-Based Access Control

- **Master Organizations**: Manage multiple organizations
- **Organizations**: Standard company-level access
- **Locations**: Site-specific access control
- **Consultants**: External compliance advisors

### 3. Unified Incident Management

Single system handles both accidents and roadside inspections:

```typescript
model incident {
  id           String      @id @default(cuid())
  incidentType IncidentType // ACCIDENT | ROADSIDE_INSPECTION
  incidentDate DateTime

  // Common fields
  officerName  String
  agencyName   String?
  reportNumber String?

  // Relationships
  equipment    IncidentEquipment[]
  violations   IncidentViolation[]
}
```

## URL-Driven Architecture

### Hierarchical Resource Structure

```
/api/master/{masterOrgId}/organization/{orgId}/driver/{driverId}/{resource}
```

**Benefits:**

- Context derivation from URL path
- Improved caching and performance
- Clear resource hierarchy
- Enhanced security through path validation

### Gold Standard Template

All driver issue pages follow consistent patterns:

- **Layout**: 300px left pane, flexible right content
- **Data Loading**: URL-driven with optimized queries
- **Components**: Unified activity log integration
- **Navigation**: Consistent breadcrumb structure

## Performance Optimizations

### Database Layer

- **Indexing Strategy**: Optimized for compliance queries
- **Query Optimization**: Prisma with efficient joins
- **Connection Pooling**: Managed by DigitalOcean

### Application Layer

- **Parallel Fetching**: Promise.allSettled for data loading
- **Component Optimization**: Tree-shaking and code splitting
- **Caching**: Intelligent data invalidation strategies

### Network Layer

- **API Optimization**: Minimal round trips
- **File Storage**: CDN-distributed via DigitalOcean Spaces
- **Response Compression**: Optimized payload sizes

## Security Architecture

### Authentication & Authorization

- **Identity Provider**: Clerk with enterprise features
- **Session Management**: Server-side validation
- **Role Enforcement**: Database-level access control
- **Audit Trail**: Complete action logging

### Data Security

- **Encryption**: Sensitive data encrypted at rest
- **Validation**: Comprehensive input sanitization
- **Access Control**: Organization-level data isolation
- **Compliance**: GDPR and DOT regulation adherence

## Scalability Design

### Horizontal Scaling

- **Stateless APIs**: Serverless-ready architecture
- **Database Sharding**: Prepared for multi-tenant scaling
- **CDN Distribution**: Global file storage and delivery
- **Load Balancing**: Cloud-native scaling capabilities

### Monitoring & Observability

- **Error Tracking**: Sentry integration planned
- **Performance Monitoring**: Real-time metrics
- **Health Checks**: Automated system monitoring
- **Logging**: Structured logging for debugging

## Integration Architecture

### Current Integrations

- **Clerk**: Authentication and user management
- **DigitalOcean Spaces**: File storage and CDN
- **PostgreSQL**: Primary data storage

### Planned Integrations

- **FMCSA.gov**: Real-time DVIR submission
- **ApplicantInfo.com**: Drug & alcohol testing
- **Tazworks.com**: MVR and physical examinations
- **GoMotive.com**: Fleet tracking and telematics

## Development Architecture

### Code Organization

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
├── lib/                 # Business logic and utilities
├── types/               # TypeScript type definitions
└── middleware.ts        # Request processing

prisma/
├── schema.prisma        # Database schema
└── migrations/          # Version-controlled DB changes
```

### Quality Assurance

- **TypeScript**: 100% type coverage
- **Linting**: ESLint with strict rules
- **Formatting**: Prettier with team standards
- **Testing**: Manual testing with real scenarios

## Deployment Architecture

### Production Environment

- **Platform**: DigitalOcean App Platform
- **Database**: Managed PostgreSQL cluster
- **Storage**: DigitalOcean Spaces with CDN
- **Monitoring**: Built-in platform monitoring

### Development Workflow

- **Version Control**: Git with semantic commits
- **Branching**: Feature branches with main deployment
- **Database**: Prisma migrations for schema changes
- **Environment**: Development/staging/production tiers

---

This architecture provides a solid foundation for enterprise-scale fleet compliance management while maintaining developer productivity and system reliability.

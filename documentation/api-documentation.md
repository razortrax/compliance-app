# API Documentation

_Updated: January 24, 2025 - Current Implementation_

## Authentication & Authorization

All API endpoints require authentication through Clerk. The `auth()` function from `@clerk/nextjs/server` provides user context.

### Access Control Logic

1. **User Role Detection**: Check user's primary role relationship
2. **Master Access**: Masters can access all organizations
3. **Direct Ownership**: Users can access organizations they created
4. **Consultant Access**: Users can access organizations they consult for
5. **Hierarchical Filtering**: Data filtered by organizational scope

## Organizations API

### `GET /api/organizations`

Lists organizations accessible to the current user.

**Access Control**:

- Masters see all organizations
- Users see organizations they own or consult for

**Response Format**:

```json
[
  {
    "id": "org_123",
    "name": "Acme Trucking",
    "dotNumber": "123456",
    "ein": "12-3456789",
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "phone": "555-123-4567",
    "email": "contact@acmetrucking.com",
    "createdAt": "2025-01-24T00:00:00Z",
    "party": {
      "id": "party_123"
    }
  }
]
```

### `POST /api/organizations`

Creates a new organization.

**Request Body**:

```json
{
  "name": "New Trucking Co",
  "dotNumber": "789012",
  "ein": "98-7654321",
  "address": "456 Oak Ave",
  "city": "Other City",
  "state": "TX",
  "zipCode": "54321",
  "phone": "555-987-6543",
  "email": "info@newtrucking.com"
}
```

**Access Control**: All authenticated users can create organizations

### `GET /api/organizations/count`

Returns count of organizations for smart routing logic.

**Response**: `{ "count": 5 }`

### `PUT /api/organizations/[id]`

Updates an existing organization.

**Access Control**: Must have access to the organization

### `GET /api/organizations/[id]`

Retrieves a specific organization.

**Response**: Single organization object (same format as GET list)

## Locations API

### `GET /api/organizations/[id]/locations`

Lists locations for a specific organization.

**Access Control**: Must have access to the parent organization

**Response Format**:

```json
[
  {
    "id": "loc_123",
    "name": "Main Terminal",
    "address": "789 Terminal Blvd",
    "city": "Hub City",
    "state": "IL",
    "zipCode": "60601",
    "phone": "555-111-2222",
    "email": "terminal@acmetrucking.com",
    "organizationId": "org_123",
    "party": {
      "id": "party_456"
    }
  }
]
```

### `POST /api/organizations/[id]/locations`

Creates a new location within an organization.

**Request Body**:

```json
{
  "name": "Branch Office",
  "address": "321 Branch St",
  "city": "Branch City",
  "state": "FL",
  "zipCode": "33101",
  "phone": "555-333-4444",
  "email": "branch@acmetrucking.com"
}
```

### `GET /api/organizations/[id]/locations/[locationId]`

Retrieves a specific location.

### `PUT /api/organizations/[id]/locations/[locationId]`

Updates a specific location.

## Persons (Drivers/Staff) API

### `GET /api/persons`

Lists all persons (drivers and staff) accessible to the current user.

**Access Control**: Complex filtering based on user's organizational relationships

**Query Parameters**:

- `organizationId`: Filter by organization
- `locationId`: Filter by location
- `roleType`: Filter by DRIVER or STAFF

**Response Format**:

```json
[
  {
    "id": "person_123",
    "firstName": "John",
    "lastName": "Driver",
    "dateOfBirth": "1985-06-15",
    "endDate": null,
    "party": {
      "id": "party_789",
      "role": [
        {
          "id": "role_456",
          "roleType": "DRIVER",
          "organizationId": "org_123",
          "locationId": "loc_123",
          "createdAt": "2025-01-24T00:00:00Z"
        }
      ]
    }
  }
]
```

### `POST /api/persons`

Creates a new person (driver or staff member).

**Request Body**:

```json
{
  "firstName": "Jane",
  "lastName": "Driver",
  "dateOfBirth": "1990-03-20",
  "organizationId": "org_123",
  "locationId": "loc_123",
  "roleType": "DRIVER"
}
```

**Access Control**: Must have access to the specified organization

### `GET /api/persons/[id]`

Retrieves a specific person.

### `PUT /api/persons/[id]`

Updates a specific person.

### `POST /api/persons/[id]/deactivate`

Deactivates a person by setting their end date.

**Request Body**:

```json
{
  "endDate": "2025-01-24",
  "reason": "Terminated"
}
```

## Equipment API

### `GET /api/equipment`

Lists all equipment accessible to the current user.

**Access Control**: Filtered by user's organizational relationships

**Query Parameters**:

- `organizationId`: Filter by organization
- `locationId`: Filter by location

**Response Format**:

```json
[
  {
    "id": "equip_123",
    "type": "TRUCK",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2020,
    "vin": "1FUJGLDR5LSHA1234",
    "party": {
      "id": "party_999",
      "role": [
        {
          "id": "role_789",
          "roleType": "EQUIPMENT",
          "organizationId": "org_123",
          "locationId": "loc_123"
        }
      ]
    }
  }
]
```

### `POST /api/equipment`

Creates new equipment.

**Request Body**:

```json
{
  "type": "TRAILER",
  "make": "Great Dane",
  "model": "Freedom",
  "year": 2022,
  "vin": "1GRAA9522PE123456",
  "organizationId": "org_123",
  "locationId": "loc_123"
}
```

### `GET /api/equipment/[id]`

Retrieves specific equipment.

### `PUT /api/equipment/[id]`

Updates specific equipment.

## User Management API

### `GET /api/user/role`

Returns the current user's primary role for navigation context.

**Response Format**:

```json
{
  "role": {
    "id": "role_123",
    "roleType": "MASTER",
    "organizationId": "org_123",
    "locationId": null
  },
  "masterOrgId": "org_123"
}
```

### `GET /api/user/profile`

Returns the current user's profile information.

### `POST /api/user/complete-profile`

Completes user profile setup during onboarding.

### `PUT /api/user/update-organization`

Updates user's organization association.

## Consultant API

### `POST /api/consultants/register`

Registers a new consultant user.

**Request Body**:

```json
{
  "email": "consultant@example.com",
  "organizationIds": ["org_123", "org_456"]
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `500`: Internal server error

## Access Control Examples

### Master User Access

```javascript
// Masters can access all organizations
const organizations = await db.organization.findMany({
  include: { party: true },
});
```

### Organization Manager Access

```javascript
// Organization managers see only their organizations
const organizations = await db.organization.findMany({
  where: {
    OR: [{ createdBy: userId }, { party: { role: { some: { userId, roleType: "CONSULTANT" } } } }],
  },
});
```

### Location Manager Access

```javascript
// Location managers see only their assigned location
const drivers = await db.person.findMany({
  where: {
    party: {
      role: {
        some: {
          locationId: userLocationId,
          roleType: "DRIVER",
        },
      },
    },
  },
});
```

## Transaction Examples

### Creating Person with Role

```javascript
await db.$transaction(async (tx) => {
  const party = await tx.party.create({ data: { id: partyId } });

  const person = await tx.person.create({
    data: { ...personData, partyId },
  });

  await tx.role.create({
    data: {
      partyId,
      organizationId,
      locationId,
      roleType: "DRIVER",
    },
  });
});
```

## Future API Endpoints (Planned)

- `/api/licenses` - License and certification management
- `/api/inspections` - Annual and roadside inspection tracking
- `/api/violations` - Violation and corrective action workflows
- `/api/documents` - File upload and document management
- `/api/contacts` - Multiple contact information management
- `/api/reports` - Compliance reporting and analytics

---

**Security Note**: All endpoints implement proper access control. Never expose data outside user's permission scope.

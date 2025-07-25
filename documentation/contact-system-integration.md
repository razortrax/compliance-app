# Contact System Integration Guide

*Created: January 24, 2025*

## Overview

This document shows how the contact system integrates with our existing Party model and what schema changes are needed.

## Current Schema Integration

### Adding Contact Tables to Existing Schema
```prisma
// Add to existing prisma/schema.prisma

model contact {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Contact Information
  type        String    // phone, email, address, social
  subtype     String    // mobile, work, personal, home, billing, etc.
  value       String    // The actual contact value
  label       String?   // Custom display label
  
  // Metadata
  priority    String    @default("secondary") // primary, secondary, emergency
  isActive    Boolean   @default(true)
  isVerified  Boolean   @default(false)
  verifiedAt  DateTime?
  
  // Linking Strategy - EITHER party OR role, not both
  partyId     String?   // Personal contact
  roleId      String?   // Work contact
  
  // Relationships
  party           party?           @relation(fields: [partyId], references: [id], onDelete: Cascade)
  role            role?            @relation(fields: [roleId], references: [id], onDelete: Cascade)
  phone_contact   phone_contact?
  email_contact   email_contact?
  address_contact address_contact?
  social_contact  social_contact?

  // Ensure exactly one link (party OR role)
  @@check(raw("(party_id IS NOT NULL)::int + (role_id IS NOT NULL)::int = 1"))
}

model phone_contact {
  id              String   @id @default(cuid())
  contactId       String   @unique
  countryCode     String   @default("+1")
  areaCode        String?
  number          String
  extension       String?
  canReceiveSMS   Boolean  @default(false)
  canReceiveCalls Boolean  @default(true)
  contact         contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
}

model email_contact {
  id              String    @id @default(cuid())
  contactId       String    @unique
  emailAddress    String
  isNewsletterOpt Boolean   @default(false)
  isMarketingOpt  Boolean   @default(false)
  bounceCount     Int       @default(0)
  lastBounceAt    DateTime?
  contact         contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
}

model address_contact {
  id           String   @id @default(cuid())
  contactId    String   @unique
  street1      String
  street2      String?
  city         String
  state        String
  zipCode      String
  country      String   @default("US")
  isValidated  Boolean  @default(false)
  latitude     Decimal?
  longitude    Decimal?
  contact      contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
}

model social_contact {
  id           String   @id @default(cuid())
  contactId    String   @unique
  platform     String   // linkedin, twitter, facebook, instagram, tiktok
  username     String?
  profileUrl   String?
  isVerified   Boolean  @default(false)
  contact      contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
}
```

### Updates to Existing Models
```prisma
// Update existing models to include contact relationships

model party {
  id           String        @id
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  status       String        @default("active")
  userId       String?
  consultant   consultant?
  equipment    equipment?
  issue        issue[]
  organization organization?
  location     location?
  person       person?
  role         role[]
  contact      contact[]     // NEW: Personal contacts
}

model role {
  id             String     @id
  partyId        String
  roleType       String
  organizationId String?
  locationId     String?
  status         String     @default("pending")
  startDate      DateTime   @default(now())
  endDate        DateTime?
  isActive       Boolean    @default(true)
  expiresAt      DateTime?
  consultationId String?
  party          party      @relation(fields: [partyId], references: [id], onDelete: Cascade)
  location       location?  @relation(fields: [locationId], references: [id])
  contact        contact[]  // NEW: Work contacts
}
```

## Migration Strategy

### Step 1: Add Contact Tables
```sql
-- Create contact tables
CREATE TABLE contact (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  type VARCHAR NOT NULL,
  subtype VARCHAR NOT NULL,
  value TEXT NOT NULL,
  label VARCHAR,
  priority VARCHAR DEFAULT 'secondary',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  party_id VARCHAR REFERENCES party(id) ON DELETE CASCADE,
  role_id VARCHAR REFERENCES role(id) ON DELETE CASCADE,
  CONSTRAINT contact_link_check CHECK (
    (party_id IS NOT NULL)::int + (role_id IS NOT NULL)::int = 1
  )
);

-- Add extended contact tables
CREATE TABLE phone_contact (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id VARCHAR UNIQUE REFERENCES contact(id) ON DELETE CASCADE,
  country_code VARCHAR DEFAULT '+1',
  area_code VARCHAR,
  number VARCHAR NOT NULL,
  extension VARCHAR,
  can_receive_sms BOOLEAN DEFAULT false,
  can_receive_calls BOOLEAN DEFAULT true
);

-- Similar for email_contact, address_contact, social_contact
```

### Step 2: Migrate Existing Contact Data
```sql
-- Migrate existing person phone/email to contact system
INSERT INTO contact (type, subtype, value, label, priority, party_id)
SELECT 
  'phone',
  'mobile',
  phone,
  'Personal Phone',
  'primary',
  party_id
FROM person 
WHERE phone IS NOT NULL;

INSERT INTO contact (type, subtype, value, label, priority, party_id)
SELECT 
  'email',
  'personal',
  email,
  'Personal Email',
  'primary',
  party_id
FROM person 
WHERE email IS NOT NULL;
```

### Step 3: Remove Old Contact Fields
```sql
-- After migration, remove old contact fields from person table
ALTER TABLE person DROP COLUMN phone;
ALTER TABLE person DROP COLUMN email;
ALTER TABLE person DROP COLUMN address;
ALTER TABLE person DROP COLUMN city;
ALTER TABLE person DROP COLUMN state;
ALTER TABLE person DROP COLUMN zip_code;
```

## Example Data Scenarios

### Personal Driver with Multiple Contacts
```typescript
// John Driver's contacts after migration
const johnContacts = [
  // Personal contacts (linked to party)
  {
    type: 'phone',
    subtype: 'mobile',
    value: '555-123-4567',
    label: 'Personal Mobile',
    priority: 'primary',
    partyId: 'john_party_123',
    roleId: null
  },
  {
    type: 'email', 
    subtype: 'personal',
    value: 'john.personal@gmail.com',
    label: 'Personal Email',
    priority: 'primary',
    partyId: 'john_party_123',
    roleId: null
  },
  {
    type: 'address',
    subtype: 'home',
    value: '123 Main St, Hometown, TX 12345',
    label: 'Home Address',
    priority: 'primary',
    partyId: 'john_party_123',
    roleId: null
  },
  
  // Work contacts (linked to driver role at ABC Trucking)
  {
    type: 'phone',
    subtype: 'work',
    value: '555-987-6543',
    label: 'Company Phone',
    priority: 'secondary',
    partyId: null,
    roleId: 'john_abc_driver_role_456'
  },
  {
    type: 'email',
    subtype: 'work', 
    value: 'john.driver@abctrucking.com',
    label: 'Work Email',
    priority: 'secondary',
    partyId: null,
    roleId: 'john_abc_driver_role_456'
  },
  
  // Emergency contact (personal)
  {
    type: 'phone',
    subtype: 'emergency',
    value: '555-111-2222',
    label: 'Emergency Contact',
    priority: 'emergency',
    partyId: 'john_party_123',
    roleId: null
  }
]
```

### Organization Contacts
```typescript
// ABC Trucking organization contacts
const abcTruckingContacts = [
  {
    type: 'phone',
    subtype: 'main',
    value: '555-TRUCKING',
    label: 'Main Office',
    priority: 'primary',
    partyId: 'abc_trucking_party_789',
    roleId: null
  },
  {
    type: 'email',
    subtype: 'general',
    value: 'info@abctrucking.com',
    label: 'General Inquiries',
    priority: 'primary',
    partyId: 'abc_trucking_party_789',
    roleId: null
  },
  {
    type: 'address',
    subtype: 'headquarters',
    value: '456 Corporate Blvd, Business City, TX 54321',
    label: 'Corporate Headquarters',
    priority: 'primary',
    partyId: 'abc_trucking_party_789',
    roleId: null
  }
]
```

## API Implementation

### Contact API Endpoints
```typescript
// GET /api/parties/[partyId]/contacts - Unified contact list
export async function GET(request: Request, { params }: { params: { partyId: string } }) {
  const contacts = await getPersonContacts(params.partyId)
  return Response.json(contacts)
}

// POST /api/contacts - Create new contact
export async function POST(request: Request) {
  const body = await request.json()
  
  // Validate that exactly one of partyId or roleId is provided
  if ((!body.partyId && !body.roleId) || (body.partyId && body.roleId)) {
    return Response.json({ error: 'Must provide exactly one of partyId or roleId' }, { status: 400 })
  }
  
  const contact = await createContact(body)
  return Response.json(contact, { status: 201 })
}
```

### Contact Query Functions
```typescript
async function getPersonContacts(personPartyId: string) {
  return await db.contact.findMany({
    where: {
      OR: [
        { partyId: personPartyId }, // Personal contacts
        { 
          role: { 
            partyId: personPartyId,
            isActive: true 
          } 
        } // Work contacts via active roles
      ]
    },
    include: {
      party: true,
      role: {
        include: {
          organization: { select: { name: true } }
        }
      },
      phone_contact: true,
      email_contact: true,
      address_contact: true,
      social_contact: true
    },
    orderBy: [
      { priority: 'asc' },
      { type: 'asc' },
      { createdAt: 'asc' }
    ]
  })
}
```

## UI Components Integration

### Driver Page with Contacts Tab
```typescript
// Add to existing driver page tabs
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="contacts">Contacts</TabsTrigger>
    <TabsTrigger value="licenses">Licenses</TabsTrigger>
    <TabsTrigger value="incidents">Incidents</TabsTrigger>
  </TabsList>
  
  <TabsContent value="contacts">
    <ContactList 
      partyId={driver.partyId}
      allowEdit={true}
      showAddButton={true}
    />
  </TabsContent>
</Tabs>
```

### Contact Display in Driver Card
```typescript
// Enhanced driver card with primary contacts
function DriverCard({ driver }: { driver: Driver }) {
  const contacts = usePersonContacts(driver.partyId)
  const primaryPhone = contacts.find(c => c.type === 'phone' && c.priority === 'primary')
  const primaryEmail = contacts.find(c => c.type === 'email' && c.priority === 'primary')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{driver.firstName} {driver.lastName}</CardTitle>
      </CardHeader>
      <CardContent>
        {primaryPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{primaryPhone.value}</span>
            <Badge variant={primaryPhone.partyId ? 'outline' : 'secondary'}>
              {primaryPhone.partyId ? 'Personal' : getWorkLabel(primaryPhone.role)}
            </Badge>
          </div>
        )}
        {primaryEmail && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{primaryEmail.value}</span>
            <Badge variant={primaryEmail.partyId ? 'outline' : 'secondary'}>
              {primaryEmail.partyId ? 'Personal' : getWorkLabel(primaryEmail.role)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## Benefits of This Integration

✅ **Seamless Migration**: Existing contact data migrates cleanly  
✅ **Enhanced Functionality**: Rich contact management without breaking existing features  
✅ **Clear Separation**: Personal vs work contacts with visual distinction  
✅ **Flexible Display**: Unified view with contextual tags  
✅ **Role Management**: Work contacts automatically managed with role changes  
✅ **Audit Trail**: Complete history of contact changes  

## Implementation Timeline

### Week 1: Database Schema
- Add contact tables to schema
- Create migration scripts
- Test migration with sample data

### Week 2: API Development  
- Implement contact CRUD endpoints
- Add contact queries to existing entity APIs
- Test API functionality

### Week 3: UI Components
- Create ContactList and ContactForm components
- Add contact tabs to driver/organization pages
- Implement contact display in cards

### Week 4: Migration & Testing
- Migrate existing contact data
- Remove old contact fields
- Comprehensive testing of new system

---

**This integration provides a solid foundation for comprehensive contact management while preserving all existing functionality.** 
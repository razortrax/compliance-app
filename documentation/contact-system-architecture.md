# Contact System Architecture

*Created: January 24, 2025*

## Overview

The contact system allows multiple contact methods (phone, email, address, social media) to be linked to both parties (personal contacts) and roles (work-related contacts). This provides flexibility for personal vs. organizational contact information while maintaining a unified display interface.

## Contact Method Types

### Primary Contact Types
- **Phone**: Mobile, Home, Work, Fax
- **Email**: Personal, Work, Billing, Emergency
- **Address**: Home, Work, Mailing, Billing
- **Social Media**: LinkedIn, Twitter, Facebook, etc.

### Contact Attributes
- **Type**: Phone, Email, Address, Social
- **Subtype**: Mobile, Work, Personal, etc.
- **Value**: The actual contact information
- **Label**: Display name (e.g., "Mobile", "Work Email")
- **Priority**: Primary, Secondary, Emergency
- **Is Active**: Whether the contact is currently valid
- **Is Verified**: Whether the contact has been verified

## Database Architecture

### Contact Table Structure
```sql
contact {
  id          String    @id
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  -- Contact Information
  type        String    -- phone, email, address, social
  subtype     String    -- mobile, work, personal, home, billing, etc.
  value       String    -- The actual contact value
  label       String?   -- Custom display label
  
  -- Metadata
  priority    String    @default("secondary") -- primary, secondary, emergency
  isActive    Boolean   @default(true)
  isVerified  Boolean   @default(false)
  verifiedAt  DateTime?
  
  -- Linking Strategy
  partyId     String?   -- Personal contact (linked to party)
  roleId      String?   -- Work contact (linked to role)
  
  -- Validation: Must have either partyId OR roleId, not both
  -- Constraint: CHECK ((partyId IS NOT NULL) != (roleId IS NOT NULL))
  
  -- Relationships
  party       party?    @relation(fields: [partyId], references: [id], onDelete: Cascade)
  role        role?     @relation(fields: [roleId], references: [id], onDelete: Cascade)
}
```

### Extended Phone Contact Structure
```sql
phone_contact {
  id            String   @id
  contactId     String   @unique
  countryCode   String   @default("+1")
  areaCode      String?
  number        String
  extension     String?
  canReceiveSMS Boolean  @default(false)
  canReceiveCalls Boolean @default(true)
  contact       contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
}
```

### Extended Email Contact Structure
```sql
email_contact {
  id              String   @id
  contactId       String   @unique
  emailAddress    String
  isNewsletterOpt Boolean  @default(false)
  isMarketingOpt  Boolean  @default(false)
  bounceCount     Int      @default(0)
  lastBounceAt    DateTime?
  contact         contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
}
```

### Extended Address Contact Structure  
```sql
address_contact {
  id           String   @id
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
```

### Extended Social Contact Structure
```sql
social_contact {
  id           String   @id
  contactId    String   @unique
  platform     String   -- linkedin, twitter, facebook, instagram
  username     String?
  profileUrl   String?
  isVerified   Boolean  @default(false)
  contact      contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
}
```

## Contact Linking Strategy

### Personal Contacts (Linked to Party)
- **When to Use**: Personal contact information that belongs to the individual
- **Examples**:
  - Personal cell phone
  - Personal email address
  - Home address
  - Personal social media profiles

```typescript
// Example: Personal mobile phone for John Driver
{
  type: "phone",
  subtype: "mobile", 
  value: "555-123-4567",
  label: "Personal Mobile",
  priority: "primary",
  partyId: "party_john_123", // Links to John's party record
  roleId: null
}
```

### Work Contacts (Linked to Role)
- **When to Use**: Work-related contact information tied to a specific role/organization
- **Examples**:
  - Company-provided phone
  - Work email address  
  - Work location address
  - Professional social media

```typescript
// Example: Work phone for John Driver at ABC Trucking
{
  type: "phone",
  subtype: "work",
  value: "555-987-6543", 
  label: "ABC Trucking Mobile",
  priority: "secondary",
  partyId: null,
  roleId: "role_john_abc_driver_456" // Links to John's driver role at ABC
}
```

## Display Strategy

### Unified Contact List Display
All contacts for a person are displayed together with contextual tags:

```
John Driver - Contact Information

📱 Phone Numbers
├── (555) 123-4567 [Personal] [Primary] ⭐
├── (555) 987-6543 [ABC Trucking - Driver] [Secondary]
└── (555) 111-2222 [Emergency Contact] [Emergency] 🚨

📧 Email Addresses  
├── john.personal@gmail.com [Personal] [Primary] ⭐
├── john.driver@abctrucking.com [ABC Trucking - Driver] [Secondary]
└── john.backup@yahoo.com [Personal] [Backup]

🏠 Addresses
├── 123 Main St, Hometown, TX 12345 [Home] [Primary] ⭐
├── 456 Terminal Rd, Work City, TX 54321 [ABC Trucking - Terminal] [Work]
└── PO Box 789, Mail City, TX 98765 [Mailing] [Secondary]

🌐 Social Media
├── linkedin.com/in/johndriver [Professional] [ABC Trucking - Driver]
└── twitter.com/johnd [Personal]
```

### Tag Generation Logic
```typescript
interface ContactDisplayTag {
  text: string
  type: 'personal' | 'work' | 'emergency' | 'primary'
  color: 'blue' | 'green' | 'orange' | 'red'
}

function generateContactTags(contact: Contact): ContactDisplayTag[] {
  const tags = []
  
  if (contact.partyId) {
    tags.push({ text: 'Personal', type: 'personal', color: 'blue' })
  }
  
  if (contact.roleId) {
    const role = contact.role
    const orgName = role.organization?.name || 'Unknown Org'
    const roleType = role.roleType.toLowerCase()
    tags.push({ 
      text: `${orgName} - ${roleType}`, 
      type: 'work', 
      color: 'green' 
    })
  }
  
  if (contact.priority === 'primary') {
    tags.push({ text: 'Primary', type: 'primary', color: 'blue' })
  }
  
  if (contact.priority === 'emergency') {
    tags.push({ text: 'Emergency', type: 'emergency', color: 'red' })
  }
  
  return tags
}
```

## Contact Management Workflows

### Adding Personal Contact
```typescript
// Add personal mobile phone
await createContact({
  type: 'phone',
  subtype: 'mobile',
  value: '555-123-4567',
  label: 'Personal Mobile',
  priority: 'primary',
  partyId: personPartyId,
  roleId: null
})
```

### Adding Work Contact
```typescript
// Add work email when person gets driver role
await createContact({
  type: 'email', 
  subtype: 'work',
  value: 'john@abctrucking.com',
  label: 'Work Email',
  priority: 'secondary',
  partyId: null,
  roleId: driverRoleId
})
```

### Contact Inheritance During Role Changes
When a person's role changes or ends:

1. **Personal Contacts**: Remain unchanged (always accessible)
2. **Work Contacts**: 
   - **Role Deactivated**: Contacts remain but marked as inactive
   - **Role Transferred**: Option to transfer contacts to new role
   - **Role Ended**: Contacts archived but preserved for audit

## API Design

### Contact Endpoints
```
GET    /api/contacts?partyId=123              # Get all contacts for party
GET    /api/contacts?roleId=456               # Get all contacts for role  
GET    /api/parties/123/contacts              # Get unified contact list for party
POST   /api/contacts                          # Create new contact
PUT    /api/contacts/789                      # Update contact
DELETE /api/contacts/789                      # Delete contact (soft delete)
```

### Unified Contact Query
```typescript
// Get all contacts for a person (personal + all work roles)
async function getPersonContacts(personPartyId: string) {
  const contacts = await db.contact.findMany({
    where: {
      OR: [
        { partyId: personPartyId }, // Personal contacts
        { 
          role: { 
            partyId: personPartyId,  // Work contacts via roles
            isActive: true 
          } 
        }
      ]
    },
    include: {
      party: true,
      role: {
        include: {
          organization: true
        }
      },
      phone_contact: true,
      email_contact: true,
      address_contact: true,
      social_contact: true
    },
    orderBy: [
      { priority: 'asc' }, // primary first
      { type: 'asc' },
      { createdAt: 'asc' }
    ]
  })
  
  return contacts
}
```

## UI Component Structure

### ContactList Component
```typescript
interface ContactListProps {
  partyId: string
  showPersonal?: boolean
  showWork?: boolean
  allowEdit?: boolean
}

function ContactList({ partyId, showPersonal = true, showWork = true }: ContactListProps) {
  const contacts = usePersonContacts(partyId)
  
  const groupedContacts = groupBy(contacts, 'type')
  
  return (
    <div className="space-y-6">
      {Object.entries(groupedContacts).map(([type, contacts]) => (
        <ContactTypeSection
          key={type}
          type={type}
          contacts={contacts}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
        />
      ))}
    </div>
  )
}
```

### Contact Form Component
```typescript
interface ContactFormProps {
  partyId?: string
  roleId?: string
  contact?: Contact
  onSuccess: () => void
  onCancel: () => void
}

function ContactForm({ partyId, roleId, contact }: ContactFormProps) {
  const [contactType, setContactType] = useState('phone')
  const [isPersonal, setIsPersonal] = useState(!!partyId)
  
  // Form logic that creates contact with proper partyId or roleId
}
```

## Implementation Priority

### Phase 1: Basic Contact System
1. **Database Schema**: Create contact tables with party/role linking
2. **Basic API**: CRUD operations for contacts
3. **Contact Form**: Add/edit contact modal
4. **Contact Display**: Simple list with tags

### Phase 2: Enhanced Contact Features  
5. **Extended Types**: Phone, email, address, social extensions
6. **Validation**: Phone formatting, email verification, address validation
7. **Contact Import**: Bulk import from existing systems
8. **Contact Export**: Export for external systems

### Phase 3: Advanced Contact Management
9. **Contact Verification**: Email/SMS verification workflows
10. **Contact Preferences**: Communication preferences per contact
11. **Contact History**: Audit trail of contact changes
12. **Smart Suggestions**: Suggest contacts based on role/organization

## Benefits of This Architecture

✅ **Flexible Linking**: Supports both personal and work contacts  
✅ **Unified Display**: All contacts shown together with clear context  
✅ **Role Inheritance**: Work contacts follow organizational relationships  
✅ **Data Integrity**: Clear separation between personal and organizational data  
✅ **Audit Trail**: Contact changes tracked with proper attribution  
✅ **Scalable**: Supports multiple contact methods and future expansion  

---

**This architecture provides the foundation for comprehensive contact management while maintaining clear separation between personal and organizational contact information.** 
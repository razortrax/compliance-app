# Organization "Others" Tab Requirements

**Last Updated**: January 2025  
**Status**: Planning Phase  
**Priority**: Future Enhancement

---

## 🎯 **Purpose**

The "Others" tab in the organization page will manage external parties that the organization works with, including vendors, agencies, repair shops, inspectors, labs, and collection sites. This system uses the existing party model to maintain consistent data relationships.

---

## 📋 **Entity Types**

### **1. Vendors**
- **Purpose**: Suppliers of parts, services, or equipment
- **Sub-table**: Vendor contacts (sales reps, account managers)
- **Use Cases**: Equipment maintenance, parts ordering, service contracts

### **2. Agencies**
- **Purpose**: Government and regulatory organizations
- **Sub-table**: Agency contacts (inspectors, administrators)
- **Use Cases**: DOT interactions, regulatory compliance, audit coordination

### **3. Repair Shops**
- **Purpose**: Maintenance and repair service providers
- **Sub-table**: Shop contacts (mechanics, service managers)
- **Use Cases**: Equipment maintenance issues, annual inspections

### **4. Inspectors**
- **Purpose**: Individual DOT/regulatory inspectors
- **Sub-table**: Inspector contact details and specializations
- **Use Cases**: Annual inspections, roadside inspection follow-up

### **5. Testing Labs**
- **Purpose**: Medical and compliance testing facilities
- **Sub-table**: Lab contacts (technicians, administrators)
- **Use Cases**: Drug & alcohol testing, physical exams, equipment testing

### **6. Collection Sites**
- **Purpose**: Drug & alcohol testing collection locations
- **Sub-table**: Site contacts and operating hours
- **Use Cases**: Random drug testing, post-accident testing

---

## 🏗️ **Data Structure**

### **Party Model Integration**
```typescript
// Core party record
party: {
  id: string
  status: 'active' | 'inactive'
  partyType: 'ORGANIZATION' // External organizations
}

// Organization record for external entities
organization: {
  id: string
  partyId: string
  name: string
  organizationType: 'vendor' | 'agency' | 'repair_shop' | 'testing_lab' | 'collection_site'
  dotNumber?: string // For agencies with DOT numbers
  certifications?: string[] // Professional certifications
  specializations?: string[] // Areas of expertise
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email?: string
  website?: string
  notes?: string
}

// Role linking external org to our organization
role: {
  id: string
  partyId: string // External organization's party ID
  roleType: 'EXTERNAL_ORGANIZATION'
  organizationId: string // Our organization ID
  status: 'active'
  isActive: true
  relationship: 'vendor' | 'agency' | 'repair_shop' | 'inspector' | 'testing_lab' | 'collection_site'
  startDate: Date
  endDate?: Date
}
```

### **Contacts Sub-table**
```typescript
// Person records for contacts within external organizations
person: {
  id: string
  partyId: string // Contact's party ID
  firstName: string
  lastName: string
  title?: string
  department?: string
  email?: string
  phone?: string
  mobile?: string
  specialization?: string
}

// Role linking contact person to external organization
role: {
  id: string
  partyId: string // Contact's party ID
  roleType: 'CONTACT'
  organizationId: string // External organization ID
  status: 'active'
  isActive: true
  contactType: 'primary' | 'secondary' | 'emergency'
}
```

---

## 🎨 **UI Design**

### **Layout Structure**
- **Tab Integration**: Add "Others" tab after "Staff" in organization page
- **Two-Column Layout**: 
  - Left: Entity type selector and list (300px)
  - Right: Selected entity details with contacts sub-table

### **Entity Type Selector**
```
┌─ Vendors (12)
├─ Agencies (3)
├─ Repair Shops (8)
├─ Inspectors (15)
├─ Testing Labs (4)
└─ Collection Sites (6)
```

### **Entity List View**
```
[Selected Entity Type - e.g., Repair Shops]
┌─────────────────────────────┐
│ ABC Auto Repair             │
│ 123 Main St, Austin TX     │
│ (512) 555-0100             │
│ 3 contacts                 │
├─────────────────────────────┤
│ XYZ Truck Service          │
│ 456 Oak Ave, Dallas TX     │
│ (214) 555-0200             │
│ 2 contacts                 │
└─────────────────────────────┘
[+ Add New]
```

### **Detail View with Contacts**
```
Name Row: [Entity Name] [Edit Button]

Entity Information Card:
- Name, Type, Certifications
- Address, Phone, Email, Website
- Specializations, Notes

Contacts Sub-table:
┌─────────────────────────────────────────────┐
│ Name          │ Title         │ Phone       │
├─────────────────────────────────────────────┤
│ John Smith    │ Service Mgr   │ 555-0101   │
│ Jane Doe      │ Mechanic      │ 555-0102   │
└─────────────────────────────────────────────┘
[+ Add Contact]
```

---

## 🔧 **Integration Points**

### **Equipment Issues Integration**
- **Maintenance Issues**: Repair shop selector from organization's repair shops
- **Annual Inspections**: Inspector selector from organization's inspectors
- **Parts Orders**: Vendor selector for equipment parts and services

### **Driver Issues Integration**
- **Drug & Alcohol Testing**: Collection site and testing lab selectors
- **Physical Exams**: Testing lab selector for DOT physicals
- **Training**: Vendor selector for training providers

### **Incident Management**
- **Roadside Inspections**: Inspector records for follow-up contact
- **Accidents**: Repair shop selection for vehicle repairs
- **CAF Workflow**: Agency contacts for regulatory communication

---

## 📊 **API Endpoints**

### **Entity Management**
```typescript
GET /api/organizations/{orgId}/others
GET /api/organizations/{orgId}/others/{entityType}
POST /api/organizations/{orgId}/others
PUT /api/organizations/{orgId}/others/{otherId}
DELETE /api/organizations/{orgId}/others/{otherId}
```

### **Contact Management**
```typescript
GET /api/organizations/{orgId}/others/{otherId}/contacts
POST /api/organizations/{orgId}/others/{otherId}/contacts
PUT /api/organizations/{orgId}/others/{otherId}/contacts/{contactId}
DELETE /api/organizations/{orgId}/others/{otherId}/contacts/{contactId}
```

### **Lookup Endpoints**
```typescript
GET /api/organizations/{orgId}/vendors        // For equipment forms
GET /api/organizations/{orgId}/repair-shops   // For maintenance forms
GET /api/organizations/{orgId}/testing-labs   // For drug/alcohol forms
GET /api/organizations/{orgId}/inspectors     // For annual inspection forms
```

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Structure** (When Equipment Issues Begin)
- Basic entity management (CRUD operations)
- Party model integration
- Simple contact management

### **Phase 2: Integration** (During Equipment Development)
- Repair shop selector in maintenance forms
- Inspector selector in annual inspection forms
- Vendor integration for parts/services

### **Phase 3: Enhancement** (Future)
- Advanced contact management
- Service history tracking
- Performance rating system
- Contract management

---

## 💡 **Business Value**

### **Operational Efficiency**
- **Centralized Contacts**: Single source for all external organization contacts
- **Quick Access**: Easy selection in forms without manual entry
- **Relationship Tracking**: Maintain history of interactions and services

### **Compliance Benefits**
- **Inspector Database**: Track inspector certifications and specializations
- **Audit Trail**: Complete record of external service providers
- **Regulatory Contacts**: Direct access to agency contacts for compliance issues

### **Cost Management**
- **Vendor Comparison**: Track multiple vendors for competitive pricing
- **Service History**: Monitor repair shop performance and costs
- **Contract Tracking**: Manage service agreements and renewals

---

## 🔮 **Future Enhancements**

### **Advanced Features**
- **Performance Ratings**: Rate external organizations on quality and timeliness
- **Service Contracts**: Track agreement terms and renewal dates
- **Invoice Integration**: Link external organizations to accounting systems
- **Notification System**: Alerts for contract renewals and performance issues

### **Reporting Integration**
- **Vendor Performance Reports**: Cost analysis and service quality metrics
- **Compliance Reporting**: Agency interaction tracking for audit preparation
- **Service History Reports**: Maintenance and repair tracking by provider

---

## 📝 **Implementation Notes**

1. **Data Migration**: Existing inspector and vendor data should be migrated to this system
2. **Backwards Compatibility**: Ensure existing forms continue to work during transition
3. **Search Functionality**: Implement robust search for large contact databases
4. **Import/Export**: Allow bulk import of external organization data
5. **Integration Testing**: Verify all form selectors work correctly with new data structure
6. **Contact System Integration**: Coordinate with planned contact system enhancements (see `contact-system-architecture.md`) for personal relationships, emergency contacts, and enhanced supervision features

## 🔗 **Related Documentation**

- **Contact System Architecture**: `contact-system-architecture.md` - Contains planned enhancements for personal relationships, emergency contacts, and supervision systems that will integrate with the Others tab
- **Current Status**: `current-status.md` - Overall project status and implementation priorities
- **Navigation Standards**: `navigation-standards.md` - UI consistency requirements for Others tab implementation

This system provides a comprehensive foundation for managing external relationships while maintaining consistency with the existing party model architecture. 
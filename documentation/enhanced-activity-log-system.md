# Enhanced Activity Log System

## Overview

The Enhanced Activity Log System is a **universal, tag-based activity tracking component** that can be attached to any entity in the compliance application. It replaces the simple "Add Ons" system with a sophisticated, flexible logging solution inspired by industry best practices.

## 🚀 Key Features

### **Multi-Activity Types**

- **📝 Note** - General notes and observations
- **📞 Communication** - Phone calls, emails, meetings, voicemails
- **🔗 URL** - Portal links, reference sites, documentation
- **🔐 Credential** - Usernames/passwords for portals (encrypted)
- **📎 Attachment** - Files, documents, photos, certificates
- **✅ Task** - Follow-up items, reminders with due dates

### **Multi-Tag System**

- **Multiple tags per activity**: `["communication", "urgent", "follow-up"]`
- **Quick-select tags**: Common tags like `urgent`, `phone`, `dot`, `renewal`
- **Custom tags**: Users can create organization-specific tags
- **Easy editing**: Click to add/remove tags inline
- **Smart filtering**: Filter activities by type and tags

### **Entity Flexibility**

Can be attached to **any entity** in the system:

- **Issues**: MVR, License, Training, Physical, Drug/Alcohol
- **Drivers**: Person-level activity tracking
- **Organizations**: Company-wide communications
- **Equipment**: Vehicle maintenance logs
- **Locations**: Site-specific activities
- **CAFs**: Corrective Action Form progress tracking

## 🗄️ Database Schema

### **`activity_log` Table**

```sql
CREATE TABLE activity_log (
  id               TEXT PRIMARY KEY,

  -- Entity relationships (flexible - any entity)
  issueId          TEXT REFERENCES issue(id),
  organizationId   TEXT REFERENCES organization(id),
  personId         TEXT REFERENCES person(id),
  equipmentId      TEXT REFERENCES equipment(id),
  locationId       TEXT REFERENCES location(id),
  cafId            TEXT REFERENCES corrective_action_form(id),

  -- Activity content
  activityType     TEXT NOT NULL, -- 'note', 'communication', 'url', 'credential', 'attachment', 'task'
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,

  -- Multi-tag system
  tags             TEXT[], -- Array: ['communication', 'phone', 'urgent']

  -- Type-specific fields
  fileName         TEXT,    -- For attachments
  fileType         TEXT,
  fileSize         INTEGER,
  filePath         TEXT,
  username         TEXT,    -- For credentials
  password         TEXT,    -- Encrypted
  portalUrl        TEXT,
  dueDate          TIMESTAMP, -- For tasks
  isCompleted      BOOLEAN DEFAULT false,
  priority         TEXT,    -- 'low', 'medium', 'high', 'urgent'

  -- System fields
  createdBy        TEXT NOT NULL,
  createdAt        TIMESTAMP DEFAULT now(),
  updatedAt        TIMESTAMP DEFAULT now()
);
```

### **`organization_tag` Table** (Future Enhancement)

```sql
CREATE TABLE organization_tag (
  id             TEXT PRIMARY KEY,
  organizationId TEXT REFERENCES organization(id),
  tagName        TEXT NOT NULL,
  tagColor       TEXT,    -- Hex color for UI
  tagIcon        TEXT,    -- Icon identifier
  isActive       BOOLEAN DEFAULT true,
  createdAt      TIMESTAMP DEFAULT now(),

  UNIQUE(organizationId, tagName)
);
```

## 🎯 Usage Examples

### **Basic Implementation**

```tsx
import { ActivityLog } from '@/components/ui/activity-log'

// For driver issues (MVR, License, Training)
<ActivityLog
  issueId={mvrIssue.id}
  title="Activity Log"
  allowedTypes={['note', 'communication', 'url', 'credential', 'attachment']}
  compact={false}
  maxHeight="400px"
/>

// For driver-level tracking
<ActivityLog
  personId={driver.id}
  title="Driver Communications"
  allowedTypes={['note', 'communication', 'task']}
  compact={true}
/>

// For organization-wide activities
<ActivityLog
  organizationId={organization.id}
  title="Company Activities"
  allowedTypes={['communication', 'task', 'url']}
/>

// For equipment maintenance
<ActivityLog
  equipmentId={truck.id}
  title="Maintenance Log"
  allowedTypes={['note', 'attachment', 'task']}
/>
```

### **Props Interface**

```tsx
interface ActivityLogProps {
  // Entity context - can connect to any entity
  issueId?: string;
  organizationId?: string;
  personId?: string;
  equipmentId?: string;
  locationId?: string;
  cafId?: string;

  // UI configuration
  title?: string;
  allowedTypes?: string[]; // Subset of activity types to allow
  showEntityLabel?: boolean; // Show which entity this is attached to
  compact?: boolean; // Compact display mode
  maxHeight?: string; // Maximum height with scroll
}
```

## 🏷️ Default Tag Library

### **General Tags**

- `urgent`, `high-priority`, `follow-up`, `reminder`, `important`

### **Communication Tags**

- `phone`, `email`, `meeting`, `voicemail`, `text`

### **DOT/Compliance Tags**

- `dot`, `dmv`, `inspection`, `violation`, `renewal`, `license`, `training`

### **Status Tags**

- `pending`, `completed`, `in-progress`, `cancelled`, `approved`, `rejected`

## 🎨 UI Features

### **Activity Type Selection**

Visual card-based selection with icons and descriptions:

```
[📝 Note]        [📞 Communication]    [🔗 URL]
[🔐 Credential]  [📎 Attachment]       [✅ Task]
```

### **Tag Management**

- **Quick-select buttons** for common tags
- **Custom tag input** for organization-specific needs
- **Multi-select capability** - multiple tags per activity
- **Inline editing** - click to add/remove tags

### **Smart Filtering**

- **Filter by type**: Show only communications, notes, etc.
- **Filter by tags**: Show only urgent items, phone calls, etc.
- **Combined filters**: e.g., urgent communications
- **Clear all filters** button

### **Timeline View**

Chronological display with:

- **Activity icons** and **color coding** by type
- **Timestamp** formatting (Today 2:30 PM, Yesterday, etc.)
- **Tag badges** with visual distinction
- **Type-specific content** (credentials show username, tasks show due dates)

## 🔒 Security Features

### **Credential Management**

- **Encrypted passwords** using secure encryption (placeholder implementation)
- **Portal URL tracking** for quick access
- **Username storage** for reference
- **Access control** - only creator can edit/delete activities

### **User Permissions**

- **Creator ownership** - users can only edit their own activities
- **Entity access control** - must have access to entity to log activities
- **Audit trail** - full timestamp tracking

## 🔧 API Endpoints

### **GET /api/activity-log**

Fetch activities with entity context filtering:

```
GET /api/activity-log?issueId=123&limit=50
GET /api/activity-log?personId=456&activityType=communication
GET /api/activity-log?organizationId=789&tags=urgent,follow-up
```

### **POST /api/activity-log**

Create new activity:

```json
{
  "activityType": "communication",
  "title": "Called DMV office",
  "content": "Spoke with Sarah about license renewal process",
  "tags": ["phone", "dmv", "license"],
  "issueId": "license-123"
}
```

### **PUT /api/activity-log**

Update existing activity (creator only):

```json
{
  "id": "activity-456",
  "tags": ["phone", "dmv", "license", "completed"]
}
```

### **DELETE /api/activity-log?id=123**

Delete activity (creator only)

## 🚀 Integration Points

### **Current Integrations**

✅ **MVR Issues** - Fully integrated with enhanced ActivityLog
✅ **License Issues** - Fully integrated with enhanced ActivityLog  
✅ **Training Issues** - Fully integrated with enhanced ActivityLog

### **Future Integrations**

🔲 **Physical Issues** - Pending field completion
🔲 **Drug/Alcohol Issues** - Ready for integration
🔲 **Accident Issues** - Ready for integration
🔲 **Roadside Inspections** - Ready for integration
🔲 **Organization Pages** - Company-wide activity tracking
🔲 **Equipment Pages** - Maintenance and inspection logs
🔲 **Driver Overview** - Person-level activity dashboard

## 📈 Benefits Over Previous System

### **Previous "Add Ons" Limitations**

- ❌ Simple file attachments only
- ❌ Basic notes without categorization
- ❌ No filtering or search capabilities
- ❌ Limited to single entity type
- ❌ No timeline or chronological view

### **Enhanced ActivityLog Advantages**

- ✅ **Multiple activity types** with specific features
- ✅ **Multi-tag system** for flexible categorization
- ✅ **Universal entity support** - works everywhere
- ✅ **Advanced filtering** and search capabilities
- ✅ **Timeline view** with smart timestamps
- ✅ **Type-specific fields** (due dates, credentials, etc.)
- ✅ **Future-ready** for organizational customization

## 🔮 Future Enhancements

### **Phase 1: Organization Customization**

- **Custom tag creation** in organization preferences
- **Tag color and icon customization**
- **Organization-specific tag templates**

### **Phase 2: Advanced Features**

- **Global activity search** across all entities
- **Bulk operations** - mass tag updates
- **Activity templates** for common scenarios
- **Email/SMS notifications** for urgent activities

### **Phase 3: Integration & Analytics**

- **External system integration** (CRM, email)
- **Activity analytics** and reporting
- **Compliance tracking** through activity patterns
- **Automated activity creation** from system events

## 🛠️ Implementation Notes

### **Performance Considerations**

- **Pagination** - Limited to 100 activities per fetch
- **Indexing** - Database indexes on entity IDs and timestamps
- **Lazy loading** - Activities loaded only when component mounts

### **Backwards Compatibility**

- **Legacy attachment table** preserved for existing data
- **Migration path** available for converting old attachments
- **Gradual rollout** across different entity types

### **Testing**

- **Unit tests** for ActivityLog component
- **API tests** for all CRUD operations
- **Integration tests** with existing entity pages
- **Performance tests** for large activity volumes

## 📋 Migration Guide

### **From Old Add Ons to Enhanced ActivityLog**

1. **Replace component import**:

   ```tsx
   // Old
   import { AddAddonModal } from "@/components/ui/add-addon-modal";

   // New
   import { ActivityLog } from "@/components/ui/activity-log";
   ```

2. **Replace component usage**:

   ```tsx
   // Old
   <AddAddonModal
     isOpen={showModal}
     onClose={() => setShowModal(false)}
     issueId={issue.id}
   />

   // New
   <ActivityLog
     issueId={issue.id}
     allowedTypes={['note', 'communication', 'attachment']}
   />
   ```

3. **Remove state management**:
   ```tsx
   // Remove these - no longer needed
   const [showAddAddonModal, setShowAddAddonModal] = useState(false);
   const [attachments, setAttachments] = useState([]);
   const refreshAttachments = () => {
     /* ... */
   };
   ```

The Enhanced Activity Log System represents a **significant leap forward** in compliance tracking capabilities, providing the flexibility and power needed for comprehensive activity management across all aspects of the compliance application.

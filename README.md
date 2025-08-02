# Fleetrax - Fleet DOT Compliance Management

A comprehensive SaaS platform for managing fleet DOT compliance requirements, including driver qualifications, vehicle inspections, maintenance records, and regulatory documentation.

## 🏢 **Important: Proprietary Software**

**This is proprietary, commercial software.** 

- ✅ **Viewing for learning**: Educational purposes only
- ❌ **Commercial use prohibited**: Cannot be used to compete or offer similar services  
- ❌ **No redistribution**: Cannot be shared or republished
- 📄 **License**: See [LICENSE](./LICENSE) file for complete terms

For commercial licensing inquiries: patrick@traxsys.ai

## 🚀 Latest Features

### **Enhanced Activity Log System** 🆕
Universal, tag-based activity tracking that can be attached to any entity in the system:
- **Multi-Activity Types**: Notes, Communications, URLs, Credentials, Attachments, Tasks
- **Smart Tagging**: Multi-tag support with quick-select and custom tags
- **Advanced Filtering**: Filter by activity type and tags
- **Universal Integration**: Works with Issues, Drivers, Organizations, Equipment, Locations, CAFs
- **Security**: Encrypted credentials, creator ownership, access control

📖 **[Full Documentation](./documentation/enhanced-activity-log-system.md)**

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Next.js 14, TypeScript, React, ShadCN UI, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (DigitalOcean)
- **Authentication**: Clerk
- **File Storage**: DigitalOcean Spaces (S3-compatible)
- **Deployment**: DigitalOcean

### **Key Features**
- ✅ **Role-Based Access Control** (Master, Organization, Location, Consultant)
- ✅ **Complete Driver Issue Management** (Licenses, MVR, Training, Physical, Drug/Alcohol)
- ✅ **Accident & Incident Reporting** with violation tracking
- ✅ **Roadside Inspection Management** with out-of-service tracking
- ✅ **Enhanced Activity Log System** with universal entity support
- ✅ **Gold Standard Pages** with consistent UX patterns
- ✅ **Smart Navigation** with URL-driven context
- ✅ **File Management** with DigitalOcean Spaces integration

## 📚 Documentation

### **Core Documentation**
- 📋 **[Current Status](./documentation/current-status.md)** - Implementation progress and milestones
- 🏛️ **[Architecture](./documentation/cursor-rules/architecture.md)** - System design and patterns
- 🗄️ **[Database Schema](./documentation/cursor-rules/database.md)** - Prisma models and relationships

### **Feature Documentation**
- 📝 **[Enhanced Activity Log System](./documentation/enhanced-activity-log-system.md)** - Universal activity tracking
- 🔍 **[Roadside Inspections](./documentation/roadside-inspections-plan.md)** - Inspection management
- 💊 **[Drug & Alcohol Testing](./documentation/drug-alcohol-testing-plan.md)** - Testing documentation
- 📞 **[Contact System](./documentation/contact-system-architecture.md)** - Communication tracking

### **Development Guides**
- 🛠️ **[Contributing](./documentation/contributing.md)** - Development guidelines
- 🔧 **[Issue Type Creation](./documentation/issue-type-creation-guide.md)** - Adding new issue types
- 🚨 **[Troubleshooting](./documentation/troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- PostgreSQL database
- Clerk account for authentication
- DigitalOcean Spaces for file storage

### **Installation**
```bash
# Clone repository
git clone [repository-url]
cd compliance_app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# DigitalOcean Spaces
DO_SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACES_KEY="..."
DO_SPACES_SECRET="..."
DO_SPACES_BUCKET="..."
```

## 🎯 Current Status

**Phase 7 Complete**: Enhanced Activity Log System
- ✅ Universal ActivityLog component with multi-entity support
- ✅ Tag-based filtering and smart search
- ✅ Full integration into Gold Standard pages (MVR, License, Training)
- ✅ Comprehensive API with CRUD operations
- ✅ Security features and access control

**Next Phase**: Physical Issues Field Completion & Equipment Management

## 🤝 Contributing

1. Follow the [Contributing Guidelines](./documentation/contributing.md)
2. Check [Current Status](./documentation/current-status.md) for implementation priorities
3. Review [Architecture Documentation](./documentation/cursor-rules/architecture.md) for patterns
4. Test thoroughly and update documentation

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for fleet compliance management**

# Fleetrax 🚛

*Fleet DOT Compliance Management SaaS Platform*

Fleetrax is a comprehensive web-based SaaS platform designed to simplify DOT record-keeping, automate expiration tracking, and manage compliance workflows for fleet operators. Built with modern technologies and a flexible party-model architecture.

## ✨ Key Features

### 🔐 **Multi-Role Authentication**
- **Master Consultants**: Manage multiple client organizations
- **Organization Managers**: Full organizational oversight
- **Location Managers**: Location-specific management
- Role-based access control with Clerk authentication

### 📊 **License Management**
- **Master-Detail Interface**: Intuitive split-pane design
- **License Renewal Workflow**: Automated date population and status tracking
- **Photo Management**: Front/back license photo uploads with DigitalOcean Spaces
- **Comprehensive Tracking**: CDL types, endorsements, restrictions, start/expiration dates

### 🚗 **Driver & Equipment Management**
- **Individual Detail Pages**: Full sidebar navigation for each entity
- **Smart Navigation Flow**: List pages → detail pages with consistent UX
- **Deactivation Management**: End-date tracking for inactive entities
- **Role Assignment**: Automatic role assignment based on context

### 📁 **File Storage & Attachments**
- **DigitalOcean Spaces Integration**: S3-compatible storage with CDN support
- **Organized File Structure**: Systematic folder organization by type and entity
- **Multiple File Types**: Images, PDFs, Word documents with size validation
- **Progress Tracking**: Real-time upload progress and error handling

### 🏢 **Multi-Tenant Architecture**
- **Party Model**: Flexible entity relationships (Organizations, Locations, Drivers, Equipment)
- **Hierarchical Access**: Master → Organization → Location structure
- **Consultant Support**: Organization-level access for external consultants

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Serverless API routes, Prisma ORM
- **Database**: PostgreSQL on DigitalOcean
- **Authentication**: Clerk (JWT with RBAC)
- **File Storage**: DigitalOcean Spaces (S3-compatible)
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- DigitalOcean PostgreSQL database
- Clerk account for authentication
- DigitalOcean Spaces for file storage

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd compliance_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.local` with:
   ```env
   # Database
   DATABASE_URL="your-postgresql-connection-string"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   CLERK_SECRET_KEY=your-clerk-secret-key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   
   # DigitalOcean Spaces
   DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   DO_SPACES_REGION=nyc3
   DO_SPACES_BUCKET=compliance-app-files
   DO_SPACES_KEY=your-spaces-access-key
   DO_SPACES_SECRET=your-spaces-secret-key
   DO_SPACES_CDN_ENDPOINT=https://your-cdn-endpoint.com
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **View the application**
   Open [http://localhost:3000](http://localhost:3000)

### Database Management

- **View data**: `npx prisma studio`
- **Reset database**: `npx prisma migrate reset`
- **Deploy migrations**: `npx prisma migrate deploy`

## 📁 Project Structure

```
compliance_app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── attachments/   # File upload management
│   │   │   ├── licenses/      # License CRUD + renewal
│   │   │   ├── persons/       # Driver management
│   │   │   └── equipment/     # Equipment management
│   │   ├── drivers/[id]/      # Driver detail pages
│   │   └── equipment/[id]/    # Equipment detail pages
│   ├── components/            # React components
│   │   ├── licenses/         # License-specific components
│   │   ├── layouts/          # Layout components
│   │   └── ui/               # ShadCN UI components
│   ├── lib/                  # Utility libraries
│   │   ├── storage.ts        # DigitalOcean Spaces integration
│   │   └── utils.ts          # Shared utilities
│   └── db/                   # Database configuration
├── prisma/                   # Database schema and migrations
├── documentation/            # Comprehensive project docs
└── public/                   # Static assets
```

## 🎯 Current Implementation Status

### ✅ **Completed Features**
- ✅ Core authentication and user management
- ✅ Organization, location, driver, and equipment management
- ✅ License management with renewal workflow
- ✅ File upload system with DigitalOcean Spaces
- ✅ Master-detail interfaces with consistent navigation
- ✅ Role-based access control across all features

### 🚧 **In Development**
- 🔄 Additional issue types (Physical exams, Drug & Alcohol, MVR, Training)
- 🔄 Compliance dashboard with KPIs
- 🔄 Automated expiration alerts

### 📋 **Planned Features**
- 📋 Roadside inspection management
- 📋 Accident reporting workflows
- 📋 Audit report generation
- 📋 Mobile-responsive optimizations

## 🧪 Development

### **Available Scripts**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### **Key Development Notes**
- Uses cloud-native PostgreSQL (no local database required)
- All file storage handled via DigitalOcean Spaces
- Comprehensive role-based access control implemented
- Party model architecture for flexible entity relationships

## 📚 Documentation

Comprehensive documentation available in `/documentation/`:

- **[Current Status](documentation/current-status.md)** - Implementation progress and roadmap
- **[Architecture](documentation/SRSD.md)** - System design and technical specifications  
- **[Product Requirements](documentation/PRD.md)** - Feature specifications and user stories
- **[Contributing Guide](documentation/contributing.md)** - Development setup and standards
- **[Compliance Requirements](documentation/compliance-requirements.md)** - DOT compliance breakdown

## 🔒 Security & Compliance

- **Authentication**: Secure JWT-based auth with Clerk
- **Access Control**: Multi-level role-based permissions
- **Data Protection**: Encrypted database connections
- **File Security**: Secure file upload validation and storage
- **Audit Trail**: Comprehensive logging of all data changes

## 🚀 Deployment

The application is production-ready and can be deployed to:
- **Vercel** (recommended for Next.js)
- **DigitalOcean App Platform**
- **AWS**
- **Any platform supporting Node.js**

## 📄 License

[Add your license information here]

## 🤝 Contributing

See [CONTRIBUTING.md](documentation/contributing.md) for development guidelines and setup instructions.

---

**Built with ❤️ for fleet safety and compliance management**

# Quick Recovery Guide

_For when Cursor crashes and you need to get back on track immediately_

## 🚨 Immediate Context Recovery (2 minutes)

1. **Read Current Status**:

   ```bash
   cat documentation/current-status.md
   ```

2. **Check Environment**:

   ```bash
   ls -la .env*
   # If no .env.local exists, copy from example
   ```

3. **Verify Database Schema**:
   ```bash
   head -20 prisma/schema.prisma
   ```

## 🔄 Recovery Checklist

### Phase 1: Foundation (10 minutes)

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Basic UI components installed
- [ ] Authentication working

### Phase 2: Core App (30 minutes)

- [ ] Application layout implemented
- [ ] Navigation structure
- [ ] Basic party model components
- [ ] Issue tracking foundation

### Phase 3: Features (60+ minutes)

- [ ] Master-detail patterns
- [ ] Form handling
- [ ] Status color coding
- [ ] Role-based access

## 📋 Essential Commands

```bash
# Environment setup
cp .env.local.example .env.local
# Edit .env.local with actual credentials

# Database setup
npx prisma migrate dev
npx prisma studio  # Verify connection

# Install UI components (as needed)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form

# Development
pnpm dev
```

## 🧠 Context Restoration

### Key Files to Review:

1. `documentation/PRD.md` - What we're building
2. `documentation/UIDD.md` - How it should look
3. `documentation/decisions.md` - Tech choices made
4. `documentation/current-status.md` - What's actually done

### User Preferences (from memories):

- Card modals for new records (not full pages) [[memory:3822843]]
- Auto-select new records after creation [[memory:3822854]]
- Color-coded expiration indicators [[memory:3487975]]
- Automatic field naming conventions [[memory:3675279]]

### Architecture Reminders:

- **Database**: PostgreSQL only, no SQLite
- **Framework**: Next.js 14, no major upgrades
- **Authentication**: Clerk with RBAC
- **UI**: ShadCN + Tailwind, "new-york" style
- **Data Model**: Party-based (Organization, Person, Equipment)

## 🎯 Current Priority

**Phase**: Initial Foundation Setup
**Next**: Environment → Database → UI Components → Auth → App Shell

This guide should get you back to productive development within 15-20 minutes after any crash.

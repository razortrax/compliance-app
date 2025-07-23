# Context: Design & Technical Decisions

This file captures important decisions made during ComplianceApp development, with rationale and implications.

---

## ✅ Chosen Stack

- **Frontend**: Next.js 14 App Router
- **Styling**: Tailwind CSS + ShadCN UI
- **Auth**: Clerk (JWT, RBAC support)
- **Database**: PostgreSQL on DigitalOcean
- **ORM**: Prisma
- **Forms**: React Hook Form
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **File Storage**: DigitalOcean Spaces

---

## 🛑 Rejected Alternatives

| Alternative | Rejected Because |
|-------------|------------------|
| SQLite      | Not production-safe, causes Prisma issues |
| Supabase    | Caused repeated sync issues in early dev |
| NextAuth.js | Less scalable auth, less polished UI |
| Plain Tailwind | Too verbose and repetitive |
| Local PostgreSQL | Inconsistent with team setup |

---

## 🧠 Development Conventions

- No use of SQLite, even for local dev
- All records use soft delete — never hard delete
- Status changes must be traceable and auditable
- Onboarding flows must always collect history
- Expired records must remain accessible to Master
- All components must load from cloud DB (no mocks)

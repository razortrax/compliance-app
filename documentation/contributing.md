# Contributing to ComplianceApp

Thank you for considering contributing to ComplianceApp! This guide outlines the standards and procedures for setting up your environment, working on features, and collaborating via Git.

---

## 🔧 Local Setup (Cloud-Connected)

ComplianceApp uses a cloud-native PostgreSQL database hosted on DigitalOcean. No local Postgres installation is required.

### Steps:

1. Clone the repo.
2. Copy `.env.local.example` to `.env.local` and fill in credentials.
3. Run:
   ```bash
   pnpm install
   npx prisma migrate dev
   npm run dev
   ```
4. Inspect data using:
   ```bash
   npx prisma studio
   ```

---

## 🗂️ Project Structure (Overview)

```
/prisma
  schema.prisma
  scripts/
/src
  /app
  /components
  /db
  /features
  /hooks
  /lib
  /types
```

Organized by feature (e.g., drivers, equipment, issues) for modular scaling.

---

## 🔍 Environment Files

Refer to `.env.local.example` for required environment variables:

- PostgreSQL connection string
- Clerk authentication keys
- DO Spaces credentials for file storage

---

## ✅ Pre-Push Checklist

Before pushing code:

```bash
pnpm lint && pnpm test
```

---

## 🧪 Tooling

- **Prisma Studio**: Live DB view/edit
- **MSW**: Frontend mocking
- **Vitest/Jest**: Unit tests
- **Playwright/Cypress**: End-to-end testing

---

## 🔁 Git Workflow

- `main`: Protected production branch
- `develop`: Integration branch for new features
- Feature branches: `feature/xyz-description`

### Pull Requests

- Required for all merges into `main` or `develop`
- Review for scope, security, and UI consistency

### Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for docs-only changes
- `chore:` for tooling/infra updates

### Example:

```
feat(driver): add license expiration color coding
```

---

## 🚫 Common Pitfalls

- Always use real cloud DB for development
- Don’t use SQLite in dev or prod
- Don’t skip access control logic when testing

---

## 🆘 Need Help?

If you have questions about contributing, please contact:

**Patrick Lensing**  
Email: patrick@traxsys.ai  
Company: TraxSys Inc

Thank you for contributing to safer fleets with Fleetrax!

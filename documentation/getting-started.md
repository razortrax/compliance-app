### Getting Started (Development)

Follow these steps to run the app locally:

- **Prereqs**: Node 18+ and pnpm or npm. Postgres available (local or cloud).

- **Install**:
  - npm ci

- **Environment**:
  - Create `.env.local` in the repo root. Common keys:
    - DATABASE_URL=postgresql://user:pass@host:5432/db
    - NEXT_PUBLIC_SENTRY_DSN=your_dev_dsn
    - SENTRY_DSN=your_dev_dsn
    - NODE_ENV=development

- **Database**:
  - npx prisma migrate dev

- **Run**:
  - npm run dev

- **Sentry test page**:
  - Visit `/test-sentry` while running in dev to trigger a UI error and an API error for verification.

- **Typecheck/Lint**:
  - npm run typecheck
  - npm run lint

- **E2E (optional)**:
  - Set env vars (if needed) and run: `npx playwright test`

# Database Rules

- Use **DigitalOcean PostgreSQL** only — no SQLite or local Postgres allowed.
- Database must be connected before running any migrations.
- Never swap database adapters (e.g., Prisma to Drizzle) without review.

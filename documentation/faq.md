# Context: Frequently Asked Questions

This document captures common questions and their answers for quick context access.

---

## Why PostgreSQL on DigitalOcean?

Supabase caused persistent issues during early dev. DigitalOcean PostgreSQL is stable, scalable, and compatible with Prisma.

## Why not start simple with SQLite or local files?

The project is architected for production readiness from day one. Simpler stacks would require major rewrites and re-documentation.

## What is a "party model"?

A party model treats people, organizations, and equipment as variations of a core "party" entity. This makes relationships between them easier to manage and future-proof.

## Why is Clerk used for auth?

Clerk offers built-in UI, JWT support, and role-based access control — all with zero backend setup. It aligns with the project's security needs.

## Why use Zustand instead of Redux?

Zustand is lighter, easier to use, and handles UI state well without boilerplate.

# Development Standards Overview

## 🎯 MISSION: Systematic, Disciplined Development Process

**Established after major incident with 50+ compilation errors due to undisciplined interface changes. These standards prevent cascading failures and ensure code quality.**

## Quick Reference Checklist

### Before Any Code Change

- [ ] Read relevant documentation in `documentation/cursor-rules/`
- [ ] Understand impact scope (how many files affected?)
- [ ] Plan systematic approach for changes affecting >3 files

### Before Any Commit

- [ ] Run `npm run build` - must pass with zero errors
- [ ] No `as any` type coercion in new code
- [ ] No files with suspicious names (_.old, _.backup, etc.)
- [ ] All TypeScript errors resolved properly (not masked)

### Before Interface Changes

- [ ] Follow Change Management Protocol
- [ ] Identify ALL consumers with grep search
- [ ] Get approval for changes affecting >5 files
- [ ] Plan incremental migration strategy

## Core Documents

### 1. **Change Management Protocol** 📋

`documentation/cursor-rules/change-management.md`

**When to read:** Before modifying any existing interface, component, or API

**Key rules:**

- NEVER change working interfaces without systematic migration
- ALWAYS identify all consumers before making changes
- GET APPROVAL for changes affecting >5 files
- USE incremental migration, never big-bang changes

### 2. **Build Validation Protocol** 🔨

`documentation/cursor-rules/build-validation.md`

**When to read:** Every day (this is your development workflow)

**Key rules:**

- MANDATORY `npm run build` before every commit
- ZERO tolerance for TypeScript compilation errors
- FIX patterns systematically, not one-by-one
- USE git hooks to prevent broken commits

### 3. **Type Safety Guidelines** 🛡️

`documentation/cursor-rules/type-safety.md`

**When to read:** When dealing with TypeScript errors or type mismatches

**Key rules:**

- BANNED: `as any` type coercion
- FIX root causes, not symptoms
- DEFINE precise interfaces
- HANDLE undefined/null properly

### 4. **Cleanup Procedures** 🧹

`documentation/cursor-rules/cleanup-procedures.md`

**When to read:** Weekly, and when you see confusing file names

**Key rules:**

- DELETE deprecated files immediately
- NO files named _.old, _.backup, \*.broken
- USE git for file recovery, not file renaming
- DOCUMENT component purpose clearly

## Enforcement Levels

### 🚨 **CRITICAL (Zero Tolerance)**

- Broken builds in main branch
- Type coercion with `as any` in new code
- Interface changes without migration plan
- Deprecated files committed to repository

### ⚠️ **MAJOR (Must Fix Before PR)**

- TypeScript compilation warnings
- Missing error handling
- Unclear component ownership
- Changes affecting >5 files without approval

### 📝 **MINOR (Address During Development)**

- Unused imports
- Console.log statements
- Inconsistent naming conventions
- Missing JSDoc comments

## Development Workflow

### 1. **Starting New Work**

```bash
# 1. Ensure clean starting state
npm run build

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Read relevant standards docs
# 4. Plan approach for any interface changes
```

### 2. **During Development**

```bash
# After each significant change
npm run build

# Before lunch/breaks
npm run build

# Before end of day
npm run build
```

### 3. **Before Committing**

```bash
# 1. Final build validation
npm run build

# 2. Check for cleanup issues
find src/ -name "*-old*" -o -name "*-copy*"

# 3. Review type safety
grep -r "as any" src/ --include="*.tsx" --include="*.ts"

# 4. Commit with descriptive message
git commit -m "feat: add user management with proper types and validation"
```

### 4. **Code Review Process**

- [ ] Reviewer verifies build passes
- [ ] No type coercion in changes
- [ ] Interface changes follow protocol
- [ ] No deprecated files added

## Emergency Procedures

### If Build Suddenly Breaks

```bash
# 1. Immediate assessment
npm run build 2>&1 | head -20

# 2. Check recent commits
git log --oneline -5

# 3. If widespread breakage, consider revert
git revert <commit-hash>

# 4. Apply systematic fix approach
```

### If Someone Commits Broken Build

```bash
# 1. Immediate revert
git revert HEAD

# 2. Notify team
# 3. Help fix properly following protocols
```

## Success Metrics

### Technical Health

- **Zero** compilation errors in main branch
- **Zero** `as any` type coercion in new code
- **Zero** deprecated files in repository
- **100%** build validation compliance

### Development Velocity

- **Faster** debugging (clear type safety)
- **Faster** onboarding (clean codebase)
- **Fewer** regressions (systematic changes)
- **Higher** confidence in deployments

### Team Communication

- **Clear** change impact communication
- **Proactive** approval seeking for major changes
- **Systematic** problem-solving approach
- **Shared** responsibility for code quality

## Training Resources

### New Developer Onboarding

1. Read all `documentation/cursor-rules/*.md` files
2. Practice build validation workflow
3. Review recent git history for examples
4. Pair with experienced developer for first interface change

### Existing Developer Refresher

1. Review Change Management Protocol quarterly
2. Audit personal code for type safety issues
3. Practice systematic debugging approach
4. Share knowledge with team

## Document Maintenance

These standards documents should be:

- **Reviewed** quarterly for effectiveness
- **Updated** based on new incidents or learnings
- **Referenced** in code reviews and PR templates
- **Enforced** consistently across team

---

## 🎯 Remember Our Mission

**"Systematic, disciplined development prevents cascading failures."**

Working code is more valuable than perfect code. Stability over optimization. Team success over individual speed.

---

**Quick Links:**

- [Change Management](./change-management.md) - Before modifying interfaces
- [Build Validation](./build-validation.md) - Daily development workflow
- [Type Safety](./type-safety.md) - Handling TypeScript properly
- [Cleanup Procedures](./cleanup-procedures.md) - Maintaining clean codebase

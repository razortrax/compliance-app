# Build Validation Protocol

## 🚨 MANDATORY: Zero Compilation Errors Policy

**Established after incident where 50+ TypeScript compilation errors accumulated due to lack of systematic build validation.**

## Core Rules

### 1. **MANDATORY BUILD BEFORE COMMIT**

```bash
# ALWAYS run this before any git commit
npm run build
```

**No exceptions. Ever.**

### 2. **Zero Tolerance for TypeScript Errors**

- ❌ **NEVER** ignore TypeScript compilation errors
- ❌ **NEVER** use `@ts-ignore` as a quick fix
- ❌ **NEVER** commit broken builds "to fix later"
- ✅ Fix all type errors properly before committing

### 3. **Systematic Error Resolution**

When build fails:

1. **Don't fix errors one-by-one reactively**
2. **Use systematic approach:**
   ```bash
   # Find ALL instances of similar errors
   grep -r "Property.*does not exist" --include="*.tsx" --include="*.ts"
   grep -r "Type.*is not assignable" --include="*.tsx" --include="*.ts"
   ```
3. **Fix patterns, not individual cases**
4. **Test build after each pattern fix**

## Development Workflow

### Daily Development

```bash
# 1. Before starting work
npm run build

# 2. After each significant change
npm run build

# 3. Before lunch break
npm run build

# 4. Before end of day
npm run build

# 5. Before any git commit
npm run build
```

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. After implementing core functionality
npm run build

# 3. After adding new components
npm run build

# 4. Before pushing to remote
npm run build

# 5. Before creating pull request
npm run build
```

## Build Error Categories

### 1. **Critical Errors (Fix Immediately)**

- Type mismatches in core interfaces
- Missing imports/exports
- Syntax errors
- Schema mismatches

### 2. **Pattern Errors (Fix Systematically)**

- Repeated prop mismatches across files
- Consistent function signature issues
- Widespread interface changes

### 3. **Warning Errors (Address Regularly)**

- Unused variables
- Missing dependencies in useEffect
- Deprecated prop usages

## Automated Checks

### Git Hooks (Recommended)

```bash
# .git/hooks/pre-commit
#!/bin/sh
echo "Running build validation..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Commit rejected."
  exit 1
fi
echo "✅ Build successful. Proceeding with commit."
```

### CI/CD Pipeline

```yaml
# Ensure builds are validated in CI
steps:
  - name: Build Validation
    run: npm run build
  - name: Type Check
    run: npx tsc --noEmit
```

## Emergency Procedures

### If You Accidentally Commit Broken Build

```bash
# 1. Immediate revert
git revert HEAD

# 2. Fix in separate branch
git checkout -b fix/build-errors

# 3. Apply systematic fixes
npm run build  # Fix all errors

# 4. Verify fix
npm run build  # Must pass

# 5. Re-commit properly
git commit -m "fix: resolve build compilation errors"
```

### If Build Suddenly Breaks

```bash
# 1. Check recent changes
git log --oneline -5

# 2. Identify scope of breakage
npm run build 2>&1 | grep "error"

# 3. If widespread, consider reverting
git revert <problematic-commit>

# 4. Apply systematic fix methodology
```

## Tools for Build Validation

### Quick Build Check Script

```bash
#!/bin/bash
# save as: scripts/quick-build-check.sh
echo "🔍 Running quick build validation..."
npm run build --silent
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed - fix before proceeding"
  exit 1
fi
```

### Error Pattern Analysis

```bash
# Find common error patterns
npm run build 2>&1 | grep -E "(Property.*does not exist|Type.*not assignable|Cannot find|Expected.*arguments)"
```

## Success Metrics

- **Zero** compilation errors in main branch
- **Zero** broken builds committed
- **100%** build validation before commits
- **Rapid** error pattern identification

---

**Remember: A broken build affects everyone. Build validation is a team responsibility.**

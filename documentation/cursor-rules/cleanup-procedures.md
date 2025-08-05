# Cleanup Procedures

## 🚨 ELIMINATE CONFUSION: Active vs Deprecated Code

**Established after widespread confusion about which components and pages are active vs deprecated, leading to fixes being applied to wrong files.**

## Core Principles

### 1. **ACTIVE CODE ONLY**
- ❌ **NEVER** keep deprecated files "just in case"
- ❌ **NEVER** rename files to `.old`, `.backup`, `.broken`
- ✅ **DELETE** unused code immediately
- ✅ **USE GIT** for file recovery if needed

### 2. **CLEAR INTENT**
Every file should have clear purpose:
- **Active** - Currently used in application
- **Deprecated** - Marked for removal with timeline
- **Deleted** - Removed completely

## File Cleanup Protocols

### 1. **Immediate Deletion Candidates**
```bash
# Find files with suspicious naming
find src/ -name "*.old" -o -name "*.backup" -o -name "*.disabled" -o -name "*.broken"
find src/ -name "*-old.*" -o -name "*-backup.*" -o -name "*_old.*"
find src/ -name "*.tsx.old" -o -name "*.ts.backup"

# Delete immediately
rm -f [suspicious-files]
```

### 2. **Duplicate Component Detection**
```bash
# Find potential duplicates
find src/components/ -name "*-2.*" -o -name "*-copy.*" -o -name "*-new.*"
find src/components/ -name "*Form.tsx" | sort
find src/components/ -name "*form.tsx" | sort

# Review and consolidate
```

### 3. **Unused Import Detection**
```bash
# Find potentially unused components
grep -r "import.*from.*components" src/ --include="*.tsx" --include="*.ts" | \
  cut -d: -f2 | grep "import" | sort | uniq -c | sort -n

# Investigate components with low usage counts
```

## Systematic Cleanup Workflow

### Phase 1: Assessment
```bash
# 1. List all suspicious files
find src/ -name "*.old" -o -name "*-backup*" -o -name "*-copy*" > cleanup-candidates.txt

# 2. Check git history for recently deleted files
git log --name-status --oneline -10 | grep "^D"

# 3. Identify duplicate functionality
find src/ -name "*form*" | sort
find src/ -name "*modal*" | sort
find src/ -name "*dialog*" | sort
```

### Phase 2: Safe Deletion
```bash
# 1. Verify file is not imported anywhere
file_to_check="src/components/old-component.tsx"
grep -r "old-component" src/ --include="*.tsx" --include="*.ts"

# 2. If no imports found, safe to delete
git rm $file_to_check

# 3. Commit deletion with clear message
git commit -m "cleanup: remove unused old-component.tsx"
```

### Phase 3: Consolidation
```typescript
// Consolidate similar components
// Instead of: UserForm.tsx, UserFormNew.tsx, user-form-v2.tsx
// Have only: UserForm.tsx (the working version)

// Document the consolidation
// components/README.md:
// - UserForm.tsx: Active form component for user creation/editing
// - Removed: UserFormNew.tsx, user-form-v2.tsx (consolidated into UserForm.tsx)
```

## Regular Maintenance Schedule

### Weekly Cleanup (Every Friday)
```bash
# 1. Find new suspicious files
find src/ -name "*-old*" -o -name "*-copy*" -o -name "*-backup*"

# 2. Check for unused imports
npx unimported

# 3. Review recent additions for duplicates
git log --name-status --since="1 week ago" | grep "^A" | grep -E "\.(tsx|ts)$"
```

### Monthly Deep Clean (First Friday)
```bash
# 1. Comprehensive duplicate search
find src/ -name "*.tsx" -exec basename {} \; | sort | uniq -d

# 2. Dead code analysis
npx ts-unused-exports tsconfig.json

# 3. Component usage audit
# For each component, verify it's actually used
```

### Quarterly Architecture Review
1. **Review component organization**
2. **Consolidate similar functionality**
3. **Update documentation**
4. **Plan major refactoring if needed**

## Cleanup Decision Tree

```
Is this file imported anywhere?
├─ YES → Is it the preferred version?
│  ├─ YES → Keep, document purpose
│  └─ NO → Can we migrate imports to preferred version?
│     ├─ YES → Migrate, then delete
│     └─ NO → Document why both exist
└─ NO → Is it in git history?
   ├─ YES → Safe to delete
   └─ NO → Review carefully, likely safe to delete
```

## Documentation Standards

### 1. **Component Documentation**
```typescript
/**
 * UserForm - Active form component for user creation and editing
 * 
 * @status ACTIVE
 * @created 2024-01-15
 * @last_updated 2024-01-20
 * @usage Used in: UserModal, SettingsPage, AdminPanel
 * 
 * @deprecated_alternatives 
 * - UserFormOld.tsx (removed 2024-01-18)
 * - user-form-v2.tsx (removed 2024-01-19)
 */
```

### 2. **Deletion Log**
```markdown
# Component Deletion Log

## 2024-01-20
- Removed: `src/components/old-user-form.tsx`
- Reason: Consolidated into UserForm.tsx
- Last used: Never (was experimental)
- Git commit: abc123

## 2024-01-19  
- Removed: `src/app/roadside_inspections/page.tsx.broken`
- Reason: Fixed version exists at same path
- Last used: N/A (was broken backup)
- Git commit: def456
```

## Automation Tools

### 1. **Cleanup Script**
```bash
#!/bin/bash
# scripts/cleanup-check.sh

echo "🧹 Running cleanup check..."

# Find suspicious files
suspicious=$(find src/ -name "*-old*" -o -name "*-copy*" -o -name "*-backup*")
if [ -n "$suspicious" ]; then
  echo "⚠️  Suspicious files found:"
  echo "$suspicious"
else
  echo "✅ No suspicious files found"
fi

# Check for unused exports
echo "🔍 Checking for unused exports..."
npx ts-unused-exports tsconfig.json --silent
```

### 2. **Pre-commit Hook**
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Prevent committing suspicious file names
suspicious=$(git diff --cached --name-only | grep -E "\.(old|backup|copy|broken)$")
if [ -n "$suspicious" ]; then
  echo "❌ Commit rejected: suspicious file names detected"
  echo "$suspicious"
  echo "Use proper naming or delete these files"
  exit 1
fi
```

## Success Metrics

- **Zero** files with suspicious naming patterns
- **Zero** unused component exports
- **Clear** component ownership and purpose
- **Fast** developer onboarding (no confusion about which files to use)

---

**Remember: Clean code is easier to maintain, debug, and extend. Delete aggressively, git preserves history.** 
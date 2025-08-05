# Change Management Protocol

## 🚨 CRITICAL RULE: NO BREAKING CHANGES WITHOUT SYSTEMATIC MIGRATION

**This protocol was established after a major incident where sweeping interface changes to `AppLayout` and navigation utilities caused 50+ TypeScript compilation errors across the entire codebase.**

## Core Principles

### 1. **HANDS-OFF RULE FOR STABLE FUNCTIONALITY**
- ❌ **NEVER** modify working interfaces, components, or APIs without explicit discussion and approval
- ❌ **NEVER** assume "small changes" won't have cascading effects
- ✅ If functionality is working, leave it alone unless there's a compelling business reason to change it
- ✅ Always ask: "Is this change necessary, or am I optimizing something that already works?"

### 2. **MANDATORY BUILD VALIDATION**
- ❌ **NEVER** commit code without running `npm run build` successfully
- ❌ **NEVER** ignore TypeScript compilation errors, even temporarily
- ✅ **ALWAYS** run full build before any git commit
- ✅ Zero tolerance for compilation errors in main branch

## Breaking Change Protocol

### Phase 1: Impact Assessment
**Before making ANY interface changes:**

1. **Identify ALL consumers:**
   ```bash
   # Search for all usages of the component/interface
   grep -r "ComponentName" src/ --include="*.tsx" --include="*.ts"
   grep -r "interfaceName" src/ --include="*.tsx" --include="*.ts"
   grep -r "functionName" src/ --include="*.tsx" --include="*.ts"
   ```

2. **Document all affected files:**
   - Create a checklist of every file that needs updating
   - Estimate impact scope (< 5 files = minor, 5-20 files = major, 20+ files = critical)

3. **Get explicit approval for major/critical changes:**
   - Discuss with team lead
   - Document business justification
   - Plan rollback strategy

### Phase 2: Safe Migration Strategy
**Never change interfaces directly. Use this pattern:**

1. **Create new interface alongside old one:**
   ```typescript
   // Keep old interface working
   interface AppLayoutProps { ... }
   
   // Add new interface
   interface AppLayoutPropsV2 { ... }
   ```

2. **Update consumers incrementally:**
   - Update 1-3 files at a time
   - Test each change individually
   - Run `npm run build` after each update

3. **Remove old interface only after 100% migration:**
   - Verify zero usages of old interface
   - Run full build and test suite
   - Document the migration completion

### Phase 3: Verification
**After ALL changes:**

1. **Full build validation:**
   ```bash
   npm run build
   ```

2. **Runtime testing:**
   - Test core user flows
   - Verify no broken pages
   - Check console for errors

3. **Clean up:**
   - Remove temporary interfaces
   - Update documentation
   - Remove deprecated files

## Emergency Rollback Procedure

If breaking changes are discovered after commit:

1. **Immediate rollback:**
   ```bash
   git revert <commit-hash>
   ```

2. **Fix in separate branch:**
   - Follow proper migration protocol
   - Test thoroughly before re-merging

3. **Post-incident review:**
   - Document what went wrong
   - Update protocols to prevent recurrence

## Enforcement

- **All developers** must follow this protocol
- **Code reviews** must verify protocol compliance
- **No exceptions** for "quick fixes" or "urgent changes"
- **CI/CD** should enforce build validation

## Examples of Protocol Violations

❌ **BAD:**
```typescript
// Changing interface directly
interface AppLayoutProps {
  // Removed: organizations, showOrgSelector  
  // Added: topNav instead of navigation
}
```

✅ **GOOD:**
```typescript
// Safe migration approach
interface AppLayoutProps {
  // Keep old props for backward compatibility
  organizations?: Organization[]
  showOrgSelector?: boolean
  navigation?: NavItem[]  // deprecated
  
  // Add new props
  topNav?: NavItem[]      // new preferred prop
}
```

---

**Remember: Working code is more valuable than "perfect" code. Stability over optimization.** 
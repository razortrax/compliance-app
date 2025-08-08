# 🧹 Fleetrax Cleanup Procedures

## **The Problem**

Next.js development can accumulate cache corruption, leading to:

- "Cannot find module" errors for vendor chunks
- 404 errors for static assets
- 500 Internal Server Errors
- Ugly HTML error pages
- Build failures
- Stale/corrupted state

## **🔧 Cleanup Levels**

### **Level 1: Quick Cleanup** ⚡

**When to use:** Minor issues, after small changes

```bash
npm run quick-cleanup
# OR
./scripts/quick-cleanup.sh
```

**What it does:**

- ✅ Kills Node.js processes
- ✅ Clears `.next` build cache
- ✅ Clears `node_modules/.cache`
- ✅ Resolves port conflicts
- ✅ Restarts dev server

---

### **Level 2: Full Cleanup** 🧹

**When to use:** Major changes, persistent issues, after schema/API changes

```bash
npm run cleanup
# OR
./scripts/cleanup-and-restart.sh
```

**What it does:**

- ✅ Everything from Quick Cleanup
- ✅ Clears NPM cache
- ✅ **Option to remove node_modules** (aggressive)
- ✅ Reinstalls dependencies
- ✅ Comprehensive port cleanup

---

### **Level 3: Nuclear Option** ☢️

**When to use:** Everything is broken, weird dependency issues

```bash
npm run reset
```

**What it does:**

- ✅ Removes node_modules completely
- ✅ Removes package-lock.json
- ✅ Clears all caches
- ✅ Fresh npm install
- ✅ Starts dev server

---

## **🎯 When to Use Each Level**

| Scenario                     | Cleanup Level | Command                 |
| ---------------------------- | ------------- | ----------------------- |
| Minor changes, quick restart | Quick ⚡      | `npm run quick-cleanup` |
| Added new pages/components   | Quick ⚡      | `npm run quick-cleanup` |
| Database schema changes      | Full 🧹       | `npm run cleanup`       |
| API route changes            | Full 🧹       | `npm run cleanup`       |
| Package.json changes         | Full 🧹       | `npm run cleanup`       |
| Vendor chunk errors          | Full 🧹       | `npm run cleanup`       |
| Everything broken            | Nuclear ☢️    | `npm run reset`         |

---

## **🔄 Routine After Major Changes**

### **After completing any of these, ALWAYS run cleanup:**

1. ✅ Moving pages to new URL structure
2. ✅ Creating/deleting API routes
3. ✅ Schema migrations
4. ✅ Adding new dependencies
5. ✅ Refactoring major components
6. ✅ Any "Gold Standard" implementations

### **The Routine:**

```bash
# 1. Save your work
git add . && git commit -m "Feature complete"

# 2. Run appropriate cleanup
npm run cleanup  # or quick-cleanup for minor changes

# 3. Wait for server to start
# 4. Hard refresh browser (Cmd+Shift+R)
# 5. Clear browser cache if needed
# 6. Test critical paths
```

---

## **🚨 Emergency Troubleshooting**

### **Still getting errors after cleanup?**

1. **Browser Issues:**

   ```bash
   # Clear browser cache and hard refresh
   Cmd + Shift + R  # Mac
   Ctrl + Shift + R # Windows/Linux
   ```

2. **Try Incognito/Private Browsing**
   - Rules out browser cache/extension issues

3. **Check if server actually started:**

   ```bash
   lsof -i :3000  # Check what's running on port 3000
   ```

4. **Manual process cleanup:**

   ```bash
   npm run kill-processes
   # Wait 5 seconds
   npm run dev
   ```

5. **Manual cache cleanup:**
   ```bash
   npm run clear-cache
   npm run dev
   ```

---

## **🎯 Prevention Tips**

1. **Run quick cleanup after every 3-5 changes**
2. **Run full cleanup after any major refactoring**
3. **Always cleanup before testing new features**
4. **Keep browser dev tools open to catch errors early**
5. **Use incognito for testing to avoid cache issues**

---

## **📁 Available Scripts**

| Command                  | Description                | Use Case              |
| ------------------------ | -------------------------- | --------------------- |
| `npm run quick-cleanup`  | Fast cache clear + restart | Minor changes         |
| `npm run cleanup`        | Full cleanup + restart     | Major changes         |
| `npm run reset`          | Nuclear option             | Everything broken     |
| `npm run kill-processes` | Just kill Node processes   | Quick process cleanup |
| `npm run clear-cache`    | Just clear caches          | Manual cache cleanup  |

---

## **🔍 Signs You Need Cleanup**

### **Immediate Cleanup Required:**

- ❌ "Cannot find module" errors
- ❌ 404 for static assets (main-app.js, etc.)
- ❌ Vendor chunk errors
- ❌ 500 errors on working pages
- ❌ Ugly HTML error pages
- ❌ Build failures

### **Good Time for Preventive Cleanup:**

- ✅ Just completed major feature
- ✅ About to test new functionality
- ✅ Before committing changes
- ✅ After schema/API changes
- ✅ When switching between features

---

**Remember: It's better to cleanup proactively than to debug corruption reactively!** 🎯

# MANDATORY Sentry Verification Rule

## 🚨 **CRITICAL DEVELOPMENT RULE**

**Sentry verification is MANDATORY before claiming error monitoring is working.**

## ⚠️ **NEVER OVERWRITE ENVIRONMENT FILES**

### **🔒 PROTECTION RULE**
**ALWAYS backup `.env.local` before any modifications:**

```bash
# ALWAYS do this FIRST
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# Then check existing content
cat .env.local

# Only then make changes
```

### **❌ NEVER use these commands without backup:**
```bash
# DANGEROUS - overwrites entire file
cat > .env.local << 'EOF'

# DANGEROUS - replaces without checking
echo "..." > .env.local
```

### **✅ SAFE modification methods:**
```bash
# Safe - append only
echo "NEW_VAR=value" >> .env.local

# Safe - edit interactively  
nano .env.local

# Safe - targeted replacement
sed -i.backup 's/old-value/new-value/' .env.local
```

## 📋 **BEFORE Every Development Session**

### **1. Verify Sentry Configuration**
```bash
curl http://localhost:3000/api/test-sentry
```

**✅ Expected SUCCESS Response:**
```json
{
  "success": true,
  "message": "✅ Sentry test error captured! Check your Sentry dashboard.",
  "dsn_configured": true
}
```

**❌ FAILURE Response (Fix Immediately):**
```json
{
  "success": false,
  "error": "🚨 SENTRY NOT CONFIGURED!",
  "message": "Please add your actual Sentry DSN to .env.local"
}
```

### **2. Verify Dashboard Access**
- **Open:** https://sentry.io/organizations/traxsys-inc/projects/fleetrax/
- **Check:** Recent errors from test endpoint
- **Confirm:** Error appears with full context

## 🛡️ **PROTECTION AGAINST FALSE POSITIVES**

### **Never Trust "Success" Without Verification**
1. ✅ **Test endpoint** must return `success: true`
2. ✅ **Dashboard** must show the test error
3. ✅ **Error context** must include organization/user data
4. ✅ **Timestamp** must match recent test

### **If Sentry Test Fails**
1. 🚨 **STOP all development** immediately
2. 🔧 **Fix DSN configuration** in `.env.local`
3. 🔄 **Restart server** (`npm run dev`)
4. ✅ **Re-test** until verification passes
5. 📊 **Check dashboard** for test error

## ⚠️ **COMMON FAILURE SCENARIOS**

### **Scenario 1: Missing DSN**
**Problem:** `.env.local` contains `your-dsn-here`
**Solution:** Replace with actual Sentry DSN from dashboard

### **Scenario 2: Overwritten Configuration**
**Problem:** Tool accidentally overwrote `.env.local`
**Solution:** Restore actual DSN from Sentry dashboard

### **Scenario 3: Silent Failures**
**Problem:** Code claims success but no errors in dashboard
**Solution:** Use verification endpoint, not trust claims

### **Scenario 4: Wrong Environment**
**Problem:** DSN in `.env` but server reading `.env.local`
**Solution:** Ensure DSN in correct environment file

## 📊 **VERIFICATION CHECKLIST**

### **Before Coding Session:**
- [ ] **Backup `.env.local`** if modifications needed
- [ ] Run `curl http://localhost:3000/api/test-sentry`
- [ ] Verify `success: true` response
- [ ] Check Sentry dashboard for test error
- [ ] Confirm error context is complete

### **After Major Changes:**
- [ ] Re-run Sentry verification test
- [ ] Check dashboard for any new errors
- [ ] Investigate any unexpected errors immediately

### **Before Committing:**
- [ ] Final Sentry verification test
- [ ] Review all errors from coding session
- [ ] Ensure no critical errors remain unfixed

## 🎯 **DEVELOPMENT WORKFLOW INTEGRATION**

### **Terminal Alias (Recommended)**
Add to your shell profile:
```bash
alias check-sentry="curl -s http://localhost:3000/api/test-sentry | grep -q '\"success\":true' && echo '✅ Sentry OK' || echo '🚨 Sentry BROKEN'"
```

### **Quick Status Check**
```bash
# Quick verification
check-sentry

# Detailed verification  
curl http://localhost:3000/api/test-sentry

# Debug configuration
curl http://localhost:3000/api/debug-sentry
```

## 🚨 **ZERO TOLERANCE POLICY**

### **Never Proceed With Broken Sentry**
- ❌ **NO development** without working Sentry
- ❌ **NO commits** without Sentry verification  
- ❌ **NO "it's probably fine"** assumptions
- ❌ **NO trusting success messages** without dashboard confirmation
- ❌ **NO overwriting environment files** without backup

### **This Rule Prevents:**
- 🐛 **Silent error accumulation**
- 🔍 **Debugging time waste** 
- 💥 **Production issues** going unnoticed
- 📈 **Technical debt** from untracked errors
- 🗑️ **Accidental loss** of configuration

---

**🎯 Remember: Sentry is our production safety net. It MUST work in development!** 
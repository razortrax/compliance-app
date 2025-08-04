# Sentry Debugging Protocol

## 🎯 **Purpose**
Establish a systematic approach to error monitoring and debugging after code changes, leveraging Sentry's real-time error capture.

## 📋 **Post-Edit/Test Checklist**

### **1. After Major Code Changes**
- [ ] **Test core functionality** in browser
- [ ] **Check Sentry dashboard** for new errors: https://sentry.io/organizations/traxsys-inc/projects/fleetrax/
- [ ] **Review error context** (user, organization, feature area)
- [ ] **Address any critical errors** before proceeding

### **2. Before Committing Code**
- [ ] **Run Sentry test endpoint**: `curl http://localhost:3000/api/test-sentry`
- [ ] **Review error trends** in Sentry dashboard
- [ ] **Ensure no new error patterns** introduced
- [ ] **Check performance metrics** for regressions

### **3. Weekly Error Review**
- [ ] **Analyze error groupings** and patterns
- [ ] **Identify recurring issues** across features
- [ ] **Review performance trends** 
- [ ] **Plan fixes** for top error categories

## 🔧 **Quick Sentry Checks**

### **Test Endpoint**
```bash
curl http://localhost:3000/api/test-sentry
```
Expected response: `✅ Sentry test error captured!`

### **Manual Error Capture**
```typescript
import { captureAPIError, captureEquipmentError } from '@/lib/sentry-utils'

// In API routes
captureAPIError(error, {
  endpoint: '/api/your-endpoint',
  method: 'POST',
  organizationId: orgId,
  extra: { context: 'specific operation' }
})

// In component logic  
captureEquipmentError(error, {
  equipmentId: id,
  organizationId: orgId,
  action: 'create-registration',
  extra: { formData: data }
})
```

## 🚨 **Critical Error Categories**

### **High Priority (Address Immediately)**
- **Database connection errors**
- **Authentication failures** 
- **Equipment compliance errors**
- **Driver issue creation failures**

### **Medium Priority (Address Within 24h)**
- **Form validation errors**
- **Performance degradation** 
- **Integration API failures**

### **Low Priority (Address Weekly)**
- **Type compatibility warnings**
- **UI rendering issues**
- **Non-critical validation errors**

## 📊 **Sentry Dashboard Sections**

### **Issues Tab**
- **New errors** since last check
- **Error frequency** and trends
- **User impact** analysis

### **Performance Tab**
- **Slow transactions** (>2s)
- **Database query performance**
- **API endpoint response times**

### **Releases Tab**
- **Error introduction** by deploy
- **Performance regression** tracking

## 🎯 **Gold Standard Features Monitoring**

### **Driver Issues** 
- License creation/renewal errors
- MVR processing failures
- Physical issue tracking
- Training record management

### **Equipment Issues**
- Registration creation/renewal 
- Roadside inspection errors
- Accident report processing
- Equipment form validation

### **Compliance Features**
- Violation processing
- CAF generation
- Activity log errors
- Audit trail issues

## 🔄 **When Errors Occur**

### **Immediate Actions**
1. **Copy error ID** from Sentry
2. **Check error context** (user, org, action)
3. **Reproduce locally** if possible
4. **Fix and test** the issue
5. **Verify fix** in Sentry dashboard

### **Error Prevention**
1. **Add error boundaries** for new components
2. **Use Sentry utils** for API error capture
3. **Add performance tracking** for slow operations
4. **Include context** in all error captures

## 📈 **Success Metrics**

### **Weekly Goals**
- **<10 new errors** per week
- **<5 critical errors** total
- **Zero compliance-related errors**
- **API response times <500ms**

### **Monthly Goals** 
- **Error-free major features** (equipment, drivers)
- **Zero data loss incidents**
- **Performance improvements** month-over-month

---

**🎯 Remember: Sentry is our early warning system. Check it after every significant change!** 
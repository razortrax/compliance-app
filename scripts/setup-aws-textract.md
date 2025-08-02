# AWS Textract Setup for DVIR OCR

## 🎯 **Why AWS Textract?**
- **Best for Forms**: Specifically designed for structured documents like DVIRs
- **High Accuracy**: Superior text extraction for inspection forms
- **Cost Effective**: $1.50 per 1,000 pages (Free tier: 1,000/month)

## 🔧 **Setup Steps:**

### **1. Create AWS Account** (if needed)
- Go to: https://aws.amazon.com/
- Sign up for free account
- Free tier includes 1,000 Textract pages/month

### **2. Create IAM User for Textract**
```bash
# 1. Go to AWS Console → IAM → Users
# 2. Click "Create User"
# 3. User name: "fleetrax-textract"
# 4. Attach policy: "AmazonTextractFullAccess"
# 5. Create access key for "Application running outside AWS"
```

### **3. Add Credentials to Fleetrax**
```bash
# In your .env.local file:
AWS_ACCESS_KEY_ID="your_access_key_here"
AWS_SECRET_ACCESS_KEY="your_secret_key_here"
AWS_REGION="us-east-1"
```

### **4. Test Setup**
```bash
# Upload a DVIR document in Fleetrax
# Should now use real OCR instead of mock data
```

## 💰 **Cost Example:**
```
Monthly DVIR uploads: 100 documents
Monthly cost: $0.15 (under free tier!)

Monthly DVIR uploads: 2,000 documents  
Monthly cost: $3.00
```

## 🔒 **Security Notes:**
- ✅ IAM user has minimal permissions (Textract only)
- ✅ Documents are processed and deleted (not stored by AWS)
- ✅ Credentials stored in environment variables only
- ✅ No sensitive data leaves your control

## 🧪 **Testing:**
1. **Before Setup**: Upload any file → mock data returned
2. **After Setup**: Upload real DVIR → actual document data extracted! 
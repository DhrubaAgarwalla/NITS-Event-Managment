# Club Bank Details Management Guide

## Overview

This guide explains how clubs can add their bank details to receive direct payments through the Razorpay integration. There are two payment models available:

1. **Platform Collection Model** (Simpler) - Platform collects payments, distributes to clubs
2. **Direct Payment Model** (Advanced) - Payments go directly to club accounts via Razorpay Route

## 🏦 Bank Details Management

### How Club Members Add Bank Details

#### **Option 1: Through Club Dashboard**

1. **Login to Club Dashboard**
   - Club members login with their club credentials
   - Navigate to Club Dashboard

2. **Access Bank Details Section**
   - Click on "Bank Details" tab or button
   - Opens the bank details management interface

3. **Fill Basic Bank Information**
   ```
   Required Fields:
   - Account Holder Name (as per bank records)
   - Account Number
   - IFSC Code
   - Bank Name
   - Account Type (Savings/Current)
   
   Optional Fields:
   - Branch Name
   - UPI ID (for quick payments)
   ```

4. **Add Contact Information**
   ```
   Required for Razorpay Route:
   - Contact Person Name
   - Contact Email
   - Contact Phone
   - Business Type
   
   Address Details:
   - Address Line 1 & 2
   - City, State, PIN Code
   ```

5. **Save and Verify**
   - Click "Save Bank Details"
   - Details are stored in Firebase
   - Status shows as "Pending"

#### **Option 2: Admin-Assisted Setup**

1. **Club Contacts Admin**
   - Club sends bank details via secure channel
   - Admin adds details on behalf of club

2. **Admin Dashboard Entry**
   - Admin accesses club management
   - Enters bank details for the club
   - Marks as verified

### Bank Details Form Fields

#### **Basic Information Tab**
```javascript
{
  account_holder_name: "Club Name or Authorized Person",
  account_number: "1234567890123456",
  ifsc_code: "SBIN0001234",
  bank_name: "State Bank of India",
  branch_name: "College Branch",
  account_type: "savings", // or "current"
  upi_id: "club@paytm" // Optional
}
```

#### **Contact & Address Tab**
```javascript
{
  contact_name: "Club President/Treasurer",
  contact_email: "treasurer@club.com",
  contact_phone: "+91 9876543210",
  business_type: "society", // individual, partnership, etc.
  
  // Address
  address_line1: "College Campus",
  address_line2: "Department Building",
  city: "Silchar",
  state: "Assam",
  pincode: "788010"
}
```

#### **Razorpay Setup Tab**
- Shows Razorpay Route setup status
- Button to create linked account
- Verification status tracking

## 💳 Payment Models

### **Model 1: Platform Collection (Recommended for Start)**

**How it works:**
1. All payments go to main platform Razorpay account
2. Platform tracks which payments belong to which clubs
3. Platform manually transfers money to clubs periodically
4. Clubs provide bank details for transfers

**Advantages:**
- ✅ Simple setup - no Razorpay verification needed for clubs
- ✅ Quick implementation
- ✅ Platform has full control over payments
- ✅ Easy reconciliation

**Disadvantages:**
- ❌ Manual transfer process
- ❌ Clubs wait for platform to transfer money
- ❌ Platform holds money temporarily

**Implementation:**
```javascript
// Event payment goes to platform account
const paymentData = {
  amount: eventAmount,
  currency: 'INR',
  receipt: `event_${eventId}_${Date.now()}`,
  notes: {
    event_id: eventId,
    club_id: clubId,
    payment_for: 'event_registration'
  }
};

// Platform tracks club earnings
const clubEarnings = {
  club_id: clubId,
  event_id: eventId,
  amount: eventAmount,
  status: 'pending_transfer',
  payment_id: razorpayPaymentId
};
```

### **Model 2: Direct Payment via Razorpay Route (Advanced)**

**How it works:**
1. Each club gets a Razorpay linked account
2. Payments are automatically split and sent to club accounts
3. Platform can take a commission (optional)
4. Real-time settlement to club accounts

**Advantages:**
- ✅ Automatic payment distribution
- ✅ Real-time settlement
- ✅ No manual transfers needed
- ✅ Transparent payment tracking

**Disadvantages:**
- ❌ Complex setup - requires club verification
- ❌ Razorpay Route has additional fees
- ❌ Clubs need business verification
- ❌ More complex reconciliation

**Implementation:**
```javascript
// Create linked account for club
const linkedAccount = await razorpay.accounts.create({
  email: clubBankDetails.contact_email,
  phone: clubBankDetails.contact_phone,
  type: 'route',
  reference_id: `club_${clubId}`,
  legal_business_name: clubBankDetails.account_holder_name
});

// Add bank account to linked account
const bankAccount = await razorpay.accounts.addBankAccount(
  linkedAccount.id,
  {
    account_number: clubBankDetails.account_number,
    ifsc_code: clubBankDetails.ifsc_code,
    beneficiary_name: clubBankDetails.account_holder_name
  }
);

// Create payment with route
const order = await razorpay.orders.create({
  amount: eventAmount,
  currency: 'INR',
  transfers: [
    {
      account: linkedAccount.id,
      amount: eventAmount * 0.95, // 95% to club, 5% platform fee
      currency: 'INR',
      notes: {
        event_id: eventId,
        club_id: clubId
      }
    }
  ]
});
```

## 🔧 Implementation Steps

### **Step 1: Choose Payment Model**

**For Platform Collection Model:**
1. Use existing Razorpay integration
2. Add bank details collection for clubs
3. Implement manual transfer tracking
4. Create transfer management dashboard

**For Direct Payment Model:**
1. Implement Razorpay Route integration
2. Add linked account creation API
3. Implement automatic payment splitting
4. Add verification status tracking

### **Step 2: Database Schema**

```javascript
// Firebase structure for club bank details
club_bank_details: {
  [clubId]: {
    // Basic bank info
    account_holder_name: "string",
    account_number: "string",
    ifsc_code: "string",
    bank_name: "string",
    branch_name: "string",
    account_type: "savings|current",
    upi_id: "string",
    
    // Contact info
    contact_name: "string",
    contact_email: "string",
    contact_phone: "string",
    business_type: "string",
    
    // Address
    address_line1: "string",
    address_line2: "string",
    city: "string",
    state: "string",
    pincode: "string",
    
    // Razorpay Route (if using Model 2)
    razorpay_account_id: "string",
    razorpay_bank_account_id: "string",
    verification_status: "pending|under_review|verified|rejected",
    
    // Metadata
    created_at: "ISO string",
    updated_at: "ISO string",
    created_by: "user_id"
  }
}
```

### **Step 3: Security Considerations**

1. **Data Encryption**
   - Encrypt sensitive bank details
   - Use Firebase security rules
   - Limit access to club members only

2. **Verification Process**
   - Verify bank details before activation
   - Require document uploads for verification
   - Admin approval for bank detail changes

3. **Audit Trail**
   - Log all bank detail changes
   - Track who made changes and when
   - Maintain change history

## 📊 Admin Management

### **Admin Dashboard Features**

1. **Club Bank Details Overview**
   - List all clubs with bank details status
   - Verification status tracking
   - Quick actions for approval/rejection

2. **Payment Distribution Management**
   - Track pending transfers (Model 1)
   - Monitor Razorpay Route status (Model 2)
   - Generate transfer reports

3. **Verification Tools**
   - Bank detail verification interface
   - Document upload and review
   - Bulk approval/rejection tools

## 🚀 Recommended Implementation Approach

### **Phase 1: Start with Platform Collection**
1. Implement bank details collection
2. Use existing Razorpay integration
3. Manual transfer process
4. Simple and quick to deploy

### **Phase 2: Upgrade to Direct Payments**
1. Add Razorpay Route integration
2. Implement linked account creation
3. Automatic payment splitting
4. Enhanced automation

### **Phase 3: Advanced Features**
1. Real-time settlement tracking
2. Automated reconciliation
3. Advanced analytics
4. Multi-currency support

## 💡 Best Practices

1. **Start Simple**: Begin with platform collection model
2. **Gradual Migration**: Move to direct payments after testing
3. **Clear Communication**: Explain both models to clubs
4. **Backup Plans**: Always have manual transfer option
5. **Regular Audits**: Monitor payment flows regularly

## 🔒 Security & Compliance

1. **PCI DSS Compliance**: Through Razorpay
2. **Data Protection**: Encrypt bank details
3. **Access Control**: Role-based permissions
4. **Audit Logs**: Complete transaction history
5. **Backup & Recovery**: Regular data backups

---

**Current Status**: Bank details collection system implemented
**Next Step**: Choose payment model and implement accordingly
**Recommendation**: Start with Platform Collection model for immediate deployment

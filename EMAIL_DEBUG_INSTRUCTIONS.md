# Email Service Debugging Instructions

## Problem Summary
The email service works perfectly when tested directly against the backend, but fails when used in the deployed frontend. We've added comprehensive debugging to identify the issue.

## What We've Done

### 1. ✅ Verified Backend is Working
- All backend endpoints are functional
- CORS is configured correctly
- Email sending works perfectly
- QR email endpoint works

### 2. ✅ Added Debugging to Frontend
- Enhanced error logging in `emailService.js`
- Added detailed logging in `registrationService.js`
- Created a debugging component

## How to Debug the Issue

### Step 1: Add the Debugger Component
Temporarily add the EmailServiceDebugger to any page in your deployed app:

```jsx
// In any component file (e.g., src/pages/Dashboard.jsx)
import EmailServiceDebugger from '../components/EmailServiceDebugger';

// Add this inside your component's return statement:
<EmailServiceDebugger />
```

### Step 2: Test in Deployed Environment
1. Deploy your app with the debugger component
2. Open the deployed app in your browser
3. Open browser developer tools (F12) and go to Console tab
4. Click "Test Backend" button first
5. Then click "Test Email" button
6. Check both the visual results and console logs

### Step 3: Check Console Logs
Look for these log messages in the browser console:
- `📧 EmailService: Starting QR code email send process...`
- `📧 Backend URL: [URL]`
- `📧 Email data received: [data]`
- `📧 Sending request to: [URL]`
- `📧 Response status: [status]`

### Step 4: Analyze Results

#### If Backend Test Fails:
- Environment variable `VITE_SHEETS_BACKEND_URL` is not set correctly
- Network connectivity issues
- CORS issues (though unlikely since our tests passed)

#### If Backend Test Passes but Email Test Fails:
- Check the specific error message in console
- Look for validation errors (missing data, invalid QR code format)
- Check for network timeouts or payload size issues

#### If Both Tests Pass:
- The issue is in the registration flow, not the email service
- Check QR code generation process
- Check event data retrieval

## Common Issues and Solutions

### Issue 1: Environment Variable Not Set
**Symptoms:** Backend URL shows as `http://localhost:3001` in deployed app
**Solution:** Ensure `VITE_SHEETS_BACKEND_URL` is set in Vercel environment variables

### Issue 2: QR Code Format Error
**Symptoms:** "Invalid QR code image format" error
**Solution:** Check QR code generation in `qrCodeService.js`

### Issue 3: Missing Event Data
**Symptoms:** Email fails with missing event title/location
**Solution:** Check event data retrieval in registration process

### Issue 4: Network Timeout
**Symptoms:** Request hangs or times out
**Solution:** Check Vercel function timeout limits

## Next Steps After Debugging

1. **Remove the debugger component** after identifying the issue
2. **Fix the specific problem** based on debug results
3. **Test the registration flow** end-to-end
4. **Monitor console logs** during actual registrations

## Quick Fix Options

If you need a temporary workaround:

### Option 1: Graceful Degradation
Make email sending non-blocking:
```javascript
// In registrationService.js, wrap email sending in try-catch
try {
  await emailService.sendQRCodeEmail(emailData);
} catch (error) {
  console.warn('Email failed, but registration succeeded:', error);
  // Continue with registration process
}
```

### Option 2: Retry Logic
Add retry mechanism for failed emails:
```javascript
// Retry email sending up to 3 times
for (let i = 0; i < 3; i++) {
  const result = await emailService.sendQRCodeEmail(emailData);
  if (result.success) break;
  if (i === 2) console.error('Email failed after 3 attempts');
}
```

## Contact Information
If you need help interpreting the debug results, share:
1. Console log output
2. Debugger component results
3. Any error messages from the browser network tab

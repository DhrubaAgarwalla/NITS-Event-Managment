# Razorpay Integration Setup Guide

## Step 1: Create Razorpay Account

### 1.1 Sign Up
1. Visit https://dashboard.razorpay.com/signup
2. Enter your business email and create password
3. Verify your email address
4. Complete business information form

### 1.2 Business Verification
1. Upload required documents:
   - PAN Card
   - Business Registration Certificate
   - Bank Account Details
   - Address Proof
2. Wait for verification (usually 24-48 hours)

## Step 2: Generate API Keys

### 2.1 Test Mode Keys (For Development)
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Key** in Test Mode section
4. Download and save:
   - **Key ID**: `rzp_test_xxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxx`

### 2.2 Live Mode Keys (For Production)
1. After business verification is complete
2. Go to **Settings** → **API Keys**
3. Click **Generate Key** in Live Mode section
4. Download and save:
   - **Key ID**: `rzp_live_xxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxx`

## Step 3: Configure Webhooks

### 3.1 Create Webhook
1. Go to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. Enter webhook URL: `https://your-domain.vercel.app/api/razorpay/webhook`
4. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
5. Save and copy the **Webhook Secret**

## Step 4: Update Environment Variables

Update your `.env` file with the following:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 5: Set Up Direct Club Payments (Optional)

### 5.1 Route Configuration
1. Go to **Route** section in Razorpay Dashboard
2. Click **Create Linked Account** for each club
3. Provide club's bank account details
4. Configure automatic transfer rules
5. Set commission percentage (if any)

### 5.2 Implementation Notes
- Direct payments require Route feature
- Each club needs separate linked account
- Automatic transfers can be configured
- Commission can be set per club

## Step 6: Testing

### 6.1 Test Payment Flow
1. Use test mode keys
2. Test with dummy card numbers:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
3. Verify webhook notifications
4. Check Firebase registration updates

### 6.2 Test Cards
```
Success Cards:
- 4111 1111 1111 1111 (Visa)
- 5555 5555 5555 4444 (Mastercard)
- 3782 8224 6310 005 (American Express)

Failure Cards:
- 4000 0000 0000 0002 (Generic failure)
- 4000 0000 0000 0069 (Expired card)
- 4000 0000 0000 0119 (Processing error)

CVV: Any 3 digits
Expiry: Any future date
```

## Step 7: Go Live

### 7.1 Switch to Live Mode
1. Complete business verification
2. Generate live API keys
3. Update environment variables
4. Update webhook URLs to production
5. Test with small amounts first

### 7.2 Production Checklist
- [ ] Business verification complete
- [ ] Live API keys generated
- [ ] Webhook URLs updated
- [ ] SSL certificate active
- [ ] Error handling tested
- [ ] Payment flow tested end-to-end
- [ ] Refund process tested

## Step 8: Monitoring and Maintenance

### 8.1 Dashboard Monitoring
- Monitor payment success rates
- Check webhook delivery status
- Review failed payments
- Monitor settlement reports

### 8.2 Error Handling
- Implement retry logic for failed webhooks
- Set up alerts for payment failures
- Monitor API rate limits
- Handle network timeouts gracefully

## Security Best Practices

1. **Never expose Key Secret** in frontend code
2. **Verify webhook signatures** to prevent tampering
3. **Use HTTPS** for all webhook endpoints
4. **Validate payment amounts** server-side
5. **Log all transactions** for audit trail
6. **Implement rate limiting** on payment endpoints

## Support and Documentation

- **Razorpay Documentation**: https://razorpay.com/docs/
- **API Reference**: https://razorpay.com/docs/api/
- **Support**: https://razorpay.com/support/
- **Status Page**: https://status.razorpay.com/

## Deployment Checklist

### Pre-Deployment
- [ ] Razorpay account created and verified
- [ ] Test API keys generated and tested
- [ ] Webhook endpoints configured and tested
- [ ] Environment variables set correctly
- [ ] Payment flow tested end-to-end
- [ ] Error handling implemented and tested
- [ ] Admin dashboard payment management tested

### Production Deployment
- [ ] Live API keys generated (after business verification)
- [ ] Production webhook URLs configured
- [ ] SSL certificate active on domain
- [ ] Environment variables updated for production
- [ ] Database backup taken before deployment
- [ ] Payment flow tested with small amounts
- [ ] Monitoring and alerts configured

### Post-Deployment
- [ ] Monitor payment success rates
- [ ] Check webhook delivery status
- [ ] Verify Google Sheets integration
- [ ] Test attendance checking with paid registrations
- [ ] Monitor error logs for issues
- [ ] Set up regular payment reconciliation

## Integration Testing

Run the comprehensive test suite:

```javascript
import { runRazorpayTests } from './src/utils/testRazorpayIntegration.js';

// Run all integration tests
const testResults = await runRazorpayTests();
console.log('Test Results:', testResults);
```

## Troubleshooting

### Common Issues
1. **Payment fails immediately**: Check API keys and network
2. **Webhook not received**: Verify URL and SSL certificate
3. **Signature verification fails**: Check webhook secret
4. **Amount mismatch**: Ensure amounts are in paise (multiply by 100)
5. **Registration not updating**: Check Firebase security rules
6. **Google Sheets not syncing**: Verify auto-sync service integration

### Debug Steps
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check webhook logs in Razorpay dashboard
4. Review server logs for errors
5. Test with Razorpay's test environment
6. Run integration test suite
7. Check Firebase database for registration updates

### Performance Optimization
1. **Lazy load Razorpay script** only when needed
2. **Cache payment status** to reduce API calls
3. **Implement retry logic** for failed webhooks
4. **Use connection pooling** for database operations
5. **Monitor API rate limits** and implement backoff

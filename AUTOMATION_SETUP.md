# Event Manager Automation Setup Guide

## 🚀 Quick Start

The Event Manager now includes a comprehensive automation system that runs automatically without requiring admin login. Here's how to set it up and use it.

## ✅ What's Automated

### 1. **Registration Auto-Closure**
- ✅ Closes registration when events are completed
- ✅ Closes registration when registration deadline is reached
- ✅ Updates registration status in real-time

### 2. **Event Status Updates**
- ✅ Automatically updates event status: `upcoming` → `ongoing` → `completed`
- ✅ Based on current date/time vs event dates
- ✅ Maintains accurate event states

### 3. **Club Dashboard Updates**
- ✅ Automatically refreshes club dashboard statistics
- ✅ Updates event counts and status summaries
- ✅ Triggered when automation runs

### 4. **Smart Notifications**
- ✅ 48-hour advance notices
- ✅ 24-hour reminders
- ✅ 2-hour final reminders
- ✅ Event start/end notifications

### 5. **Event Archival**
- ✅ Archives events completed more than 30 days ago
- ✅ Maintains database cleanliness
- ✅ Preserves historical data

### 6. **Additional Features**
- ✅ Missing image detection
- ✅ Missing deadline warnings
- ✅ Priority-based automation
- ✅ Comprehensive logging

## 🔧 Setup Instructions

### 1. **Firebase Rules Update**

The Firebase security rules have been updated to allow automation without authentication. Apply these rules to your Firebase Realtime Database:

```bash
# Copy the updated rules
cp firebase-security-rules.json your-firebase-project/
```

### 2. **Environment Variables**

Ensure your `.env` file contains all required Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. **Deploy to Vercel**

The automation system includes Vercel cron jobs for automatic execution:

```bash
# Deploy to Vercel
vercel --prod

# The cron job will automatically trigger every 5 minutes
```

### 4. **Test the System**

Run the automation test to verify everything is working:

```bash
npm run test:automation
```

## 🎯 How It Works

### Automatic Operation

1. **Browser-Based Automation**: Runs automatically when users visit the site
2. **Vercel Cron Jobs**: Runs every 5 minutes via `/api/automation/trigger`
3. **Background Service**: Continuous monitoring and execution
4. **Smart Scheduling**: Different tasks run at different intervals

### Automation Schedule

| Task | Frequency | Description |
|------|-----------|-------------|
| Core Automation | Every 5 minutes | Registration closure, status updates |
| Comprehensive Check | Every hour | Full validation and cleanup |
| Daily Maintenance | 2 AM IST | Archival and maintenance |
| Weekly Analytics | 3 AM Sunday | Analytics and reporting |

### Public API

The automation system exposes a public API endpoint:

```bash
# Trigger automation manually
curl -X POST https://your-domain.vercel.app/api/automation/trigger

# Check automation status
curl https://your-domain.vercel.app/api/automation/trigger
```

## 📊 Monitoring

### Automation Status Indicator

A status indicator appears in the top-right corner showing:
- 🟢 Green: Automation running normally
- 🟡 Yellow: Some issues detected
- 🔴 Red: Automation stopped or failed
- ⚪ Gray: Not initialized

### Firebase Logs

Automation logs are stored in Firebase at:
- `/automation_logs` - Detailed execution logs
- `/automation_status` - Current system status

### Dashboard Integration

The admin dashboard includes an automation section showing:
- Current automation status
- Recent execution results
- Performance statistics
- Error logs

## 🛠️ Manual Control

### Start/Stop Automation

```javascript
import automationInitializer from './services/automationInitializer';

// Start automation
await automationInitializer.start();

// Stop automation
await automationInitializer.stop();

// Force run automation cycle
await automationInitializer.forceRun();
```

### Adjust Automation Interval

```javascript
// Set automation to run every 10 minutes (600000ms)
automationInitializer.setInterval(600000);
```

### Check Status

```javascript
const status = automationInitializer.getStatus();
console.log('Automation Status:', status);
```

## 🔍 Troubleshooting

### Common Issues

1. **Automation Not Running**
   - Check browser console for errors
   - Verify Firebase connection
   - Check automation status indicator

2. **Events Not Updating**
   - Verify event dates are correct
   - Check Firebase security rules
   - Review automation logs

3. **Performance Issues**
   - Monitor automation frequency
   - Check event count in database
   - Review error logs

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('automation_debug', 'true');
```

### Manual Testing

Test individual automation functions:

```bash
# Run automation test
npm run test:automation

# Check specific automation endpoint
curl -X POST http://localhost:3000/api/automation/trigger
```

## 📈 Performance

- **Optimized for Large Datasets**: Handles thousands of events efficiently
- **Batch Processing**: Groups operations for better performance
- **Rate Limiting**: Prevents API abuse and overload
- **Minimal Resource Usage**: Lightweight background processing

## 🔒 Security

- **Public API with Rate Limiting**: Prevents abuse
- **No Sensitive Data Exposure**: Only updates necessary fields
- **Audit Trail**: Complete logging of all actions
- **Firebase Rules**: Secure access control

## 🎉 Success Indicators

After setup, you should see:

1. ✅ Automation status indicator showing green
2. ✅ Events automatically updating status
3. ✅ Registration closing when appropriate
4. ✅ Club dashboards staying current
5. ✅ Automation logs in Firebase
6. ✅ No manual intervention required

## 📞 Support

If you encounter issues:

1. Check the automation dashboard for status
2. Review automation logs in Firebase
3. Check browser console for errors
4. Verify Firebase rules and permissions
5. Test the automation API endpoint

The automation system is designed to be self-healing and requires minimal maintenance once configured properly.

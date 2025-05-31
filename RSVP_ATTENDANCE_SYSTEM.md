# 📊 RSVP Attendance Tracking System

## Overview

The RSVP Attendance Tracking System is a comprehensive solution for managing event attendance using QR codes. This system automatically generates unique QR codes for each registration, sends them via email, and provides a mobile-friendly scanning interface for real-time attendance tracking.

## 🚀 Features

### Core Functionality
- **Automatic QR Code Generation**: Unique, secure QR codes generated upon registration
- **Email Delivery**: Professional email templates with QR codes sent immediately
- **Mobile QR Scanning**: Touch-friendly interface for scanning QR codes
- **Real-time Attendance Tracking**: Instant database updates when QR codes are scanned
- **Fraud Prevention**: Secure QR codes with hash verification and expiry

### Security Features
- **Unique Hash Verification**: Prevents QR code tampering and duplication
- **Timestamp Validation**: QR codes expire after 24 hours for security
- **Structured Data Format**: JSON-based QR data with version control
- **Event Validation**: QR codes are tied to specific events and registrations

### Integration Features
- **Firebase Integration**: Seamless integration with existing Firebase database
- **Gmail API**: Professional email delivery using Gmail API with OAuth2
- **Export Compatibility**: Attendance data included in Excel, PDF, and Google Sheets exports
- **Dashboard Integration**: Real-time attendance statistics in club dashboard

## 📁 File Structure

```
src/
├── services/
│   ├── qrCodeService.js          # QR code generation and verification
│   ├── emailService.js           # Email delivery with QR codes
│   └── registrationService.js    # Updated with attendance tracking
├── components/
│   ├── QRScanner.jsx            # Mobile QR code scanning interface
│   ├── AttendanceManagement.jsx # Club member attendance management
│   ├── QRCodeDemo.jsx           # Testing and demo component
│   └── ClubDashboard.jsx        # Updated with attendance tab
└── sheets-backend/
    └── src/
        └── routes/
            └── email.js          # Backend email API endpoints
```

## 🔧 Technical Implementation

### QR Code Service (`qrCodeService.js`)
- **Generation**: Creates unique QR codes with embedded security data
- **Verification**: Validates QR codes and checks authenticity
- **Attendance Marking**: Updates database when attendance is confirmed
- **Security**: Hash-based verification and timestamp validation

### Email Service (`emailService.js`)
- **QR Code Emails**: Sends professional emails with embedded QR codes
- **Attendance Confirmations**: Sends confirmation emails when attendance is marked
- **Template System**: HTML email templates with responsive design
- **Backend Integration**: Uses sheets-backend for actual email delivery

### QR Scanner Component (`QRScanner.jsx`)
- **Camera Access**: Uses device camera for QR code scanning
- **jsQR Integration**: Real-time QR code detection and decoding
- **Mobile Optimized**: Touch-friendly interface with proper viewport handling
- **Feedback System**: Immediate visual feedback for scan results

### Attendance Management (`AttendanceManagement.jsx`)
- **Event Selection**: Choose events for attendance tracking
- **Statistics Dashboard**: Real-time attendance statistics and rates
- **Manual Override**: Ability to manually mark attendance if needed
- **Recent Scans**: Display of recently scanned attendees

## 📊 Database Schema Updates

### Registrations Collection
```javascript
{
  // Existing fields...
  qr_code_data: string,              // Unique QR code JSON data
  attendance_status: string,         // 'not_attended' | 'attended'
  attendance_timestamp: string,      // ISO timestamp when marked attended
  qr_code_generated_at: string,      // ISO timestamp when QR was created
  // ...
}
```

## 🔐 QR Code Data Structure

```javascript
{
  type: 'NITS_EVENT_ATTENDANCE',
  registrationId: string,
  eventId: string,
  email: string,
  timestamp: number,
  hash: string,                      // Security hash for verification
  version: '1.0'
}
```

## 📧 Email Templates

### QR Code Registration Email
- **Professional Design**: Responsive HTML template with NIT Silchar branding
- **Event Details**: Complete event information and registration details
- **QR Code Attachment**: High-quality QR code image embedded in email
- **Instructions**: Clear instructions for using the QR code
- **Mobile Friendly**: Optimized for mobile email clients

### Attendance Confirmation Email
- **Success Notification**: Confirms successful attendance marking
- **Timestamp**: Records exact time of attendance
- **Event Information**: Includes event details for reference

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
# Frontend dependencies
cd event-manager
npm install jsqr

# Backend dependencies
cd ../sheets-backend
npm install nodemailer
```

### 2. Environment Configuration
Ensure your `.env` files include:

**Frontend (.env)**
```
VITE_SHEETS_BACKEND_URL=http://localhost:3001
```

**Backend (.env)**
```
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### 3. Gmail API Setup
1. Enable Gmail API in Google Cloud Console
2. Create OAuth2 credentials
3. Generate app-specific password for Gmail
4. Update backend configuration

## 📱 Usage Guide

### For Event Organizers

1. **Event Creation**: Create events as usual - QR codes are automatically generated
2. **Registration Monitoring**: View registrations in the dashboard
3. **Attendance Tracking**: Use the new "Attendance Tracking" tab
4. **QR Code Scanning**: Use mobile device to scan participant QR codes
5. **Export Data**: Download attendance data in Excel/PDF/Google Sheets

### For Participants

1. **Registration**: Register for events through the platform
2. **Email Receipt**: Receive QR code via email immediately
3. **Event Attendance**: Present QR code at event entrance
4. **Confirmation**: Receive attendance confirmation email

### For Club Members

1. **Access Dashboard**: Navigate to club dashboard
2. **Select Attendance Tab**: Click on "📊 Attendance Tracking"
3. **Choose Event**: Select event from dropdown
4. **Scan QR Codes**: Use "📱 Scan QR Code" button
5. **Monitor Statistics**: View real-time attendance data

## 🔍 Testing

### QR Code Demo Component
Access the QR Code Demo component to:
- Generate test QR codes
- Verify QR code security
- Test scanning functionality
- Understand data structure

### Manual Testing Steps
1. Create a test event
2. Register for the event
3. Check email for QR code
4. Use attendance management to scan QR code
5. Verify attendance is marked in database
6. Export data to confirm attendance tracking

## 📊 Export Integration

### Excel Exports
- **Attendance Status Column**: Shows attended/not attended
- **Attendance Timestamp**: Records when attendance was marked
- **Color Coding**: Green for attended, orange for not attended
- **Statistics Section**: Includes attendance rate and counts

### PDF Exports
- **Attendance Data**: Includes attendance status in participant lists
- **Summary Statistics**: Attendance rates and totals
- **Professional Formatting**: Maintains existing PDF styling

### Google Sheets
- **Real-time Data**: Live attendance tracking in shared sheets
- **Collaborative Access**: Multiple users can view attendance data
- **Automatic Updates**: Attendance changes reflect immediately

## 🛠️ Troubleshooting

### Common Issues

**QR Code Not Generating**
- Check Firebase database permissions
- Verify QR code service is properly imported
- Check console for error messages

**Email Not Sending**
- Verify Gmail API configuration
- Check backend email service status
- Ensure app-specific password is correct

**QR Scanner Not Working**
- Check camera permissions in browser
- Ensure HTTPS connection for camera access
- Verify jsQR library is installed

**Attendance Not Marking**
- Check QR code validity and expiry
- Verify registration exists in database
- Check network connectivity

### Debug Mode
Enable debug logging by setting:
```javascript
console.log('QR Code Debug Mode Enabled');
```

## 🔮 Future Enhancements

### Planned Features
- **Bulk QR Code Generation**: Generate QR codes for existing registrations
- **Advanced Analytics**: Detailed attendance analytics and reporting
- **Multi-Event QR Codes**: Single QR code for multiple events
- **Offline Scanning**: Offline QR code scanning with sync capability
- **Custom QR Designs**: Branded QR codes with logos and colors

### Integration Opportunities
- **Mobile App**: Dedicated mobile app for scanning
- **Badge Printing**: Integration with badge printing systems
- **Access Control**: Integration with door access systems
- **Payment Integration**: Link attendance with payment verification

## 📞 Support

For technical support or questions about the RSVP Attendance Tracking System:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Test with the QR Code Demo component
4. Verify all dependencies are installed correctly

## 📄 License

This RSVP Attendance Tracking System is part of the NIT Silchar Event Management System and follows the same licensing terms as the main project.

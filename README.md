# 🚀 NIT Silchar Event Manager
## *Advanced Event Management Platform with Real-Time Data Pipeline & Analytics*

A comprehensive, enterprise-grade event management platform that combines **Real-Time Data Processing**, **Advanced Web Technologies**, and **Intelligent Automation** to deliver sophisticated event analytics, automated workflows, and immersive user experiences.

[![Data Pipeline](https://img.shields.io/badge/Feature-Data%20Pipeline-green)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)
[![Real-Time Analytics](https://img.shields.io/badge/Analytics-Real--Time-orange)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)
[![3D UI](https://img.shields.io/badge/UI-3D%20Immersive-purple)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)
[![Automation](https://img.shields.io/badge/Feature-Smart%20Automation-blue)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)

## 🔄 **Real-Time Data Pipeline & Analytics**

### **Data Pipeline Dashboard**
- **Live Data Processing** with real-time Firebase listeners and batch processing
- **Interactive Analytics Dashboard** with professional charts using Recharts library
- **Component Health Monitoring** with real-time status tracking and error detection
- **Performance Metrics** with processing statistics and throughput monitoring
- **Pipeline Controls** with start/stop functionality and manual trigger capabilities
- **Intelligent Caching** with 5-minute cache duration and automatic refresh every 30 seconds

### **Advanced Analytics Features**
- **Registration Trend Analysis** with daily/weekly/monthly patterns from real Firebase data
- **Real-Time Event Metrics** with live statistics and performance tracking
- **Data Quality Monitoring** with validation error detection and reporting
- **Component Health Tracking** with automated status monitoring for ingestion, processing, and warehouse
- **Interactive Charts** with responsive design and hover tooltips
- **Engagement Analytics** with basic user behavior pattern analysis

### **Intelligent Automation System**
- **Background Automation Service** running every 5 minutes with comprehensive logging
- **Smart Event Status Management** with automatic status updates based on dates
- **Registration Auto-Close** for completed events with intelligent detection
- **Event Archival System** for events older than 30 days with data preservation
- **Automated Notifications** with 48-hour, 24-hour, and 2-hour reminder system
- **Priority-Based Processing** with intelligent task scheduling and error recovery

## ✨ **Core Platform Features**

### 🎪 **Event Management**
- **Advanced Event Creation** with custom fields and multiple participation types (Solo/Team/Both)
- **Smart Registration System** with internal and external form support
- **Real-time Event Tracking** with live statistics and analytics
- **Category & Tag Management** for organized event discovery
- **Intelligent Image Management** with client-side compression and optimization

### 👥 **User Management & Authentication**
- **Role-based Access Control** (Admin, Club, Participant)
- **Firebase Authentication** with secure session management
- **Club Dashboard** with comprehensive event management tools
- **Admin Panel** with data pipeline insights and system-wide management

### 📱 **Smart RSVP & Attendance System**
- **Automatic QR Code Generation** with hash-based security verification
- **Professional Email Delivery** with QR codes and event details using Gmail API
- **Mobile QR Scanner** with real-time camera-based scanning and jsQR library
- **Attendance Analytics** with live statistics and reporting
- **Manual Attendance Override** for backup attendance marking
- **Attendance Confirmation Emails** sent automatically upon successful scan

### 💰 **Payment Integration**
- **Optional Payment Requirements** per event with UPI integration
- **Payment Screenshot Upload** with Cloudinary storage and compression
- **Payment Verification Workflow** with admin approval system
- **Payment Status Tracking** across all export formats

### 📊 **Google Sheets Integration**
- **Smart Sheet Generation** with automatic create/update logic
- **Real-time Auto-Sync** when registrations or attendance changes
- **Multi-Sheet Structure** (Registrations, Team Members, Dashboard)
- **Professional Formatting** with Excel-like styling and colors
- **Public Sharing** with automatic permission management

### 📈 **Data Export & Analytics**
- **Excel Export** with multi-sheet workbooks and advanced formatting
- **PDF Generation** with professional reports and attendance data
- **Live Google Sheets** for collaborative data management
- **Real-time Dashboard** with comprehensive statistics

### 🎨 **Advanced UI/UX**
- **3D Immersive Design** with Three.js integration and React Three Fiber
- **Smooth Scrolling Effects** powered by GSAP animations
- **Dark Theme Interface** with professional styling
- **Mobile-First Responsive Design** optimized for all devices
- **Loading Animations** and comprehensive user feedback

## 🛠️ **Technology Stack**

### **Data Pipeline & Analytics**
- **Real-Time Data Processing** with event-driven architecture and Firebase listeners
- **Data Ingestion Service** with batch processing and error handling
- **Component Health Monitoring** with automated status tracking
- **Recharts Library** for professional data visualization and interactive charts
- **Intelligent Caching System** with 5-minute cache duration and automatic refresh
- **Performance Metrics** with processing statistics and error rate monitoring

### **Frontend Technologies**
- **React 19** with Vite for modern development and optimized builds
- **Three.js & React Three Fiber** for 3D graphics and immersive animations
- **Framer Motion** for smooth page transitions and micro-interactions
- **GSAP** for advanced scrolling effects and timeline animations
- **Recharts** for professional data visualization and analytics charts
- **Firebase SDK** for authentication and real-time database operations
- **Cloudinary** for optimized image storage and delivery with compression

### **Backend & Infrastructure**
- **Node.js Express Server** for Google Sheets integration and API services
- **Firebase Realtime Database** with security rules and real-time listeners
- **Google APIs** (Sheets, Drive, Gmail) with OAuth2 authentication
- **Nodemailer** for professional email delivery with templates
- **QR Code Libraries** (qrcode, jsQR) for generation and scanning
- **Background Automation Service** with scheduled tasks and error recovery

### **Performance & Optimization**
- **Client-Side Image Compression** before upload with Canvas API
- **Intelligent Caching System** with 5-minute cache duration
- **Lazy Loading** for components and images with React.lazy
- **Code Splitting** with Vite optimization and tree shaking
- **Performance Monitoring** with Core Web Vitals tracking
- **Error Boundary** with comprehensive error handling and logging

### **Development & Deployment**
- **Vite** for fast development and optimized builds with HMR
- **ESLint** for code quality and consistency
- **Vercel** for frontend deployment with CI/CD integration
- **Environment Configuration** for secure credential management
- **Rate Limiting** and CORS protection for API security
- **Comprehensive Logging System** with admin-only console visibility

## 🚀 **Getting Started**

### **Prerequisites**

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Firebase Account** with project setup
- **Cloudinary Account** for image storage
- **Google Cloud Project** with Sheets API enabled (for backend service)
- **Gmail Account** with App Password (for email functionality)

### **Installation**

#### **1. Clone the Repository**
```bash
git clone https://github.com/DhrubaAgarwalla/NITS-Event-Managment.git
cd NITS-Event-Managment
```

#### **2. Frontend Setup**
```bash
cd event-manager
npm install
```

#### **3. Backend Service Setup**
```bash
cd ../sheets-backend
npm install
```

#### **4. Environment Configuration**

**Frontend Environment (event-manager/.env)**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_DATABASE_URL=your-firebase-database-url

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_API_KEY=your-cloudinary-api-key
VITE_CLOUDINARY_API_SECRET=your-cloudinary-api-secret
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset

# Backend Service URL
VITE_SHEETS_BACKEND_URL=http://localhost:3001
```

**Backend Environment (sheets-backend/.env)**
```env
# Google Service Account (for Sheets API)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-google-project-id

# Gmail Configuration (for email delivery)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### **5. Start Development Servers**

**Terminal 1 - Frontend:**
```bash
cd event-manager
npm run dev
```

**Terminal 2 - Backend Service:**
```bash
cd sheets-backend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend service at `http://localhost:3001`.

## 📋 **Setup Guides**

### **Firebase Setup**
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** with Email/Password provider
3. Enable **Realtime Database** with security rules
4. Copy configuration to your `.env` file
5. Import database structure from `FIREBASE_DATABASE_STRUCTURE.md`

### **Google Sheets API Setup**
1. Create a Google Cloud Project
2. Enable Google Sheets API and Google Drive API
3. Create a Service Account and download credentials
4. Share your Google Drive folder with the service account email
5. Add credentials to backend `.env` file

### **Cloudinary Setup**
1. Create account at [Cloudinary](https://cloudinary.com)
2. Create an upload preset for unsigned uploads
3. Copy cloud name, API key, and upload preset to `.env`

### **Gmail API Setup**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App-Specific Password
3. Add Gmail credentials to backend `.env` file

## 🚀 **Deployment**

### **Frontend Deployment (Vercel)**
```bash
cd event-manager
npm run build
vercel --prod
```

### **Backend Deployment (Vercel)**
```bash
cd sheets-backend
vercel --prod
```

### **Environment Variables**
Ensure all environment variables are properly configured in your deployment platform:
- **Vercel**: Add environment variables in project settings
- **Netlify**: Configure in site settings
- **Railway/Render**: Add in environment configuration

## 📖 **Usage Guide**

### **For Event Organizers (Clubs)**

#### **Creating Events**
1. **Login** to your club account
2. **Navigate** to Club Dashboard
3. **Click** "Create New Event"
4. **Configure** event details, participation type, and custom fields
5. **Set** payment requirements (optional)
6. **Publish** event for registrations

#### **Managing Registrations**
1. **Track Registrations** in real-time from dashboard
2. **View Participant Details** with custom field responses
3. **Verify Payments** if payment is required
4. **Export Data** to Excel, PDF, or Google Sheets

#### **Attendance Tracking**
1. **Access** "📊 Attendance Tracking" tab
2. **Select** your event from dropdown
3. **Scan QR Codes** using mobile device camera
4. **Monitor** real-time attendance statistics
5. **Manual Override** for backup attendance marking

### **For Participants**

#### **Event Registration**
1. **Browse** available events on the platform
2. **Click** "Register" on desired event
3. **Fill** registration form with required details
4. **Upload** payment screenshot (if required)
5. **Submit** and receive confirmation email with QR code

#### **Event Attendance**
1. **Check** email for QR code after registration
2. **Present** QR code at event entrance
3. **Get** scanned by event organizers
4. **Receive** attendance confirmation email

### **For Administrators**

#### **System Management**
1. **Access** Admin Dashboard with full system overview
2. **Manage** clubs, events, and user accounts
3. **View** comprehensive analytics and reports
4. **Monitor** system health and performance

#### **Data Pipeline Management**
1. **Navigate** to "🔄 Data Pipeline" tab in Admin Dashboard
2. **Start/Stop** the data processing pipeline with real-time controls
3. **Monitor** live analytics with registration trends and component health
4. **View** processing metrics including records processed and error rates
5. **Trigger** manual pipeline runs for immediate data processing
6. **Access** interactive charts with real Firebase data visualization

#### **Google Sheets Management**
1. **Navigate** to "📊 Google Sheets" tab in Admin Dashboard
2. **View** all events with sheet status and sync information
3. **Generate** or update sheets for any event with automatic formatting
4. **Monitor** auto-sync status and performance metrics

## 📊 **Key Features Documentation**

### **🔄 Data Pipeline & Analytics**
- **Real-Time Processing**: Live data ingestion from Firebase with automatic scaling
- **Component Health Monitoring**: Real-time status tracking of ingestion, processing, and warehouse components
- **Performance Metrics**: Processing statistics, error rates, and throughput monitoring
- **Registration Trend Analysis**: Daily/weekly/monthly patterns with real Firebase data
- **Interactive Dashboard**: Professional charts with Recharts library and responsive design
- **Data Quality Assurance**: Validation error detection and reporting
- **Intelligent Caching**: 5-minute cache duration with automatic refresh every 30 seconds

### **🎯 Smart Image Processing**
- **Client-Side Compression**: Automatic image optimization before Cloudinary upload using Canvas API
- **Intelligent Resizing**: Optimal settings based on image type (banner, profile, payment)
- **Progress Tracking**: Real-time compression progress with user feedback
- **Format Optimization**: Automatic format selection for best quality-to-size ratio
- **Bandwidth Optimization**: Reduced upload times and storage costs

### **🤖 Intelligent Automation**
- **Background Automation Service**: Runs every 5 minutes with comprehensive logging
- **Smart Event Status Management**: Automatic status updates based on dates and conditions
- **Registration Auto-Close**: Intelligent detection and closure for completed events
- **Event Archival System**: Automatic archival for events older than 30 days
- **Automated Notifications**: 48-hour, 24-hour, and 2-hour reminder system
- **Priority-Based Processing**: Intelligent task scheduling with error recovery

### **📱 RSVP & Attendance System**
- **QR Code Security**: Hash-based verification prevents tampering
- **Email Integration**: Professional templates with event branding using Gmail API
- **Mobile Scanning**: Optimized camera interface using jsQR library for quick scanning
- **Real-time Updates**: Instant database updates and statistics
- **Backup Methods**: Manual attendance marking for reliability
- **Attendance Confirmation**: Automated email delivery upon successful scan

### **📊 Google Sheets Integration**
- **Smart Generation**: Automatic detection of existing sheets with create/update logic
- **Auto-Sync**: Real-time updates when data changes with background service
- **Multi-Sheet Structure**: Separate sheets for registrations, teams, and analytics
- **Professional Formatting**: Excel-like styling with colors and borders
- **Collaborative Access**: Public sharing with edit permissions

### **💰 Payment Processing**
- **Optional Integration**: Enable/disable per event with flexible configuration
- **UPI Support**: QR codes and payment IDs with screenshot verification
- **Screenshot Verification**: Admin approval workflow with Cloudinary storage
- **Status Tracking**: Payment verification across all export formats
- **Security**: Secure file storage with compression and optimization

### **🔧 Custom Fields System**
- **Dynamic Forms**: Create custom registration fields per event with validation
- **Multiple Types**: Text inputs, dropdowns, and more with responsive design
- **Validation**: Built-in validation for required fields with error handling
- **Export Integration**: Custom fields included in all export formats
- **Mobile Optimized**: Responsive design for mobile registration

## 🔧 **Development**

### **Project Structure**
```
event-manager/
├── src/
│   ├── components/          # React components
│   ├── services/           # API and business logic
│   ├── contexts/           # React contexts
│   ├── styles/            # CSS and styling
│   └── utils/             # Utility functions
├── public/                # Static assets
└── dist/                  # Build output

sheets-backend/
├── src/
│   ├── config/            # Configuration files
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── index.js           # Server entry point
└── vercel.json           # Deployment configuration
```

### **Available Scripts**

**Frontend (event-manager/)**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend (sheets-backend/)**
```bash
npm run dev          # Start development server with auto-reload
npm start            # Start production server
npm run test         # Run backend tests
npm run deploy       # Deploy to Vercel
```

### **Contributing**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 **Documentation**

### **Core System Documentation**
- **[RSVP Attendance System](RSVP_ATTENDANCE_SYSTEM.md)** - Complete guide to QR code attendance tracking
- **[Google Sheets Auto-Sync](GOOGLE_SHEETS_AUTO_SYNC.md)** - Real-time Google Sheets integration
- **[Firebase Database Structure](FIREBASE_DATABASE_STRUCTURE.md)** - Database schema and security rules
- **[Auto-Sync Implementation](AUTO_SYNC_IMPLEMENTATION.md)** - Technical details of auto-sync system
- **[Sheets Optimization Summary](SHEETS_OPTIMIZATION_SUMMARY.md)** - Recent improvements and optimizations

### **Data Pipeline & Analytics Documentation**
- **[Data Pipeline Setup Guide](DATA_PIPELINE_SETUP.md)** - Complete setup and usage guide for the data pipeline
- **[Pipeline Status Check](PIPELINE_STATUS_CHECK.md)** - How to access and monitor the data pipeline
- **[Real Data Pipeline](REAL_DATA_PIPELINE.md)** - Technical implementation details and caching system
- **[Pipeline Fixed](PIPELINE_FIXED.md)** - Latest fixes and improvements to the pipeline system

### **Automation & Performance**
- **[Automation System](AUTOMATION_SYSTEM.md)** - Background automation service documentation
- **[Automation Setup](AUTOMATION_SETUP.md)** - Setup guide for intelligent automation features
- **[Performance Improvements](PERFORMANCE_IMPROVEMENTS.md)** - Image compression and performance optimizations

## 🚀 **Performance & Security**

### **Advanced Performance Features**
- **Optimized Bundle**: Vite-powered build with code splitting and tree shaking
- **Client-Side Image Compression**: Automatic compression before upload (up to 70% size reduction)
- **Intelligent Caching System**: 5-minute cache duration with automatic refresh
- **Lazy Loading**: Components and images loaded on demand with React.lazy
- **Performance Monitoring**: Core Web Vitals tracking with automated optimization suggestions
- **Mobile Optimization**: Touch-friendly interfaces and responsive design
- **Real-Time Data Pipeline**: Efficient data processing with minimal latency

### **Enterprise Security Features**
- **Firebase Security Rules**: Role-based database access control with granular permissions
- **Input Validation**: Comprehensive validation on frontend and backend using Joi
- **CORS Protection**: Proper CORS configuration for API security
- **Rate Limiting**: API rate limiting (100 requests per 15 minutes) to prevent abuse
- **Secure Authentication**: Firebase Auth with proper session management
- **Error Boundary**: Comprehensive error handling with development/production modes
- **Secure Logging**: Admin-only console visibility with configurable log levels
- **Data Encryption**: Secure data transmission and storage

## 🎯 **Production Ready**

This project is production-ready with enterprise-grade features:
- ✅ **Real-Time Data Pipeline** with live processing and analytics
- ✅ **Comprehensive Error Handling** with Error Boundary and logging system
- ✅ **Professional UI/UX Design** with 3D immersive experience
- ✅ **Mobile-First Responsive Design** optimized for all devices
- ✅ **Real-time Data Synchronization** with Firebase and auto-sync
- ✅ **Automated Testing Capabilities** with comprehensive validation
- ✅ **Deployment Automation** with Vercel CI/CD integration
- ✅ **Security Best Practices** with rate limiting and authentication
- ✅ **Performance Optimization** with caching and image compression
- ✅ **Intelligent Automation** with background processing and scheduling
- ✅ **Component Health Monitoring** with real-time status tracking
- ✅ **Advanced Analytics** with interactive charts and data visualization

## 📞 **Support**

For technical support or questions:
1. Check the documentation files in the repository
2. Review the troubleshooting sections in feature-specific docs
3. Open an issue on GitHub with detailed information
4. Contact the development team

## 👨‍💻 **Credits**

**Created by:** Dhruba Kr Agarwalla (Scholar ID: 2411100)
**Institution:** National Institute of Technology Silchar
**Project Type:** Advanced Event Management Platform with Data Pipeline & Analytics
**Development Period:** 2024
**Tech Stack:** Real-Time Data Processing + Full-Stack Web Development

### **Technical Achievements**
- 🔄 **Real-Time Data Pipeline** with live processing and component monitoring
- 📊 **Advanced Analytics** with interactive charts and trend analysis
- 🚀 **Performance Optimization** with 70% image compression and intelligent caching
- 🤖 **Intelligent Automation** with background processing and smart scheduling
- 🎨 **3D Immersive UI** with Three.js and advanced animations
- 🔐 **Enterprise Security** with comprehensive authentication and validation

### **Special Thanks**
- NIT Silchar for providing the platform and requirements
- Firebase team for excellent backend services and real-time database
- Google for comprehensive API ecosystem (Sheets, Drive, Gmail)
- Cloudinary for reliable image management and optimization
- Three.js community for 3D graphics capabilities
- Recharts team for professional data visualization
- Open source community for amazing libraries and tools

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 **Star the Repository**

If you find this project useful, please consider giving it a star ⭐ on GitHub to show your support!

---

## 🌟 **Project Highlights**

This project demonstrates the integration of **Real-Time Data Processing** and **Modern Web Development** to create an intelligent, scalable event management platform. Key technical achievements include:

- **Real-Time Data Pipeline** processing event data with live analytics and monitoring
- **Advanced Performance Optimization** with client-side compression and intelligent caching
- **3D Immersive User Experience** using cutting-edge web technologies
- **Enterprise-Grade Security** with comprehensive authentication and validation
- **Intelligent Automation** with background processing and smart scheduling
- **Professional Data Visualization** with interactive charts and dashboards

**Built with ❤️ and cutting-edge technology for the NIT Silchar community and beyond.**

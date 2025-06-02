# 🎯 NIT Silchar Event Manager

A comprehensive, enterprise-grade event management platform with 3D immersive design, real-time attendance tracking, automated Google Sheets integration, and advanced payment processing capabilities.

## ✨ Key Features

### 🎪 **Event Management**
- **Advanced Event Creation** with custom fields and multiple participation types (Solo/Team/Both)
- **Smart Registration System** with internal and external form support
- **Real-time Event Tracking** with live statistics and analytics
- **Category & Tag Management** for organized event discovery
- **Image Management** with horizontal and vertical banner support

### 👥 **User Management & Authentication**
- **Role-based Access Control** (Admin, Club, Participant)
- **Firebase Authentication** with secure login/logout
- **Club Dashboard** with comprehensive event management tools
- **Admin Panel** for system-wide management and oversight

### 📱 **RSVP & Attendance Tracking**
- **Automatic QR Code Generation** for each registration
- **Professional Email Delivery** with QR codes and event details
- **Mobile QR Scanner** with real-time camera-based scanning
- **Attendance Analytics** with live statistics and reporting
- **Manual Attendance Override** for backup attendance marking

### 💰 **Payment Integration**
- **Optional Payment Requirements** per event with UPI integration
- **Payment Screenshot Upload** with Cloudinary storage
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
- **3D Immersive Design** with Three.js integration
- **Smooth Scrolling Effects** powered by GSAP
- **Dark Theme Interface** with professional styling
- **Mobile-First Responsive Design** optimized for all devices
- **Loading Animations** and comprehensive user feedback

## 🛠️ **Technology Stack**

### **Frontend**
- **React 19** with Vite for modern development
- **Three.js & React Three Fiber** for 3D graphics and animations
- **Framer Motion** for smooth page transitions
- **GSAP** for advanced scrolling effects
- **Firebase SDK** for authentication and real-time database
- **Cloudinary** for optimized image storage and delivery

### **Backend Services**
- **Node.js Express Server** for Google Sheets integration
- **Firebase Realtime Database** with security rules
- **Google APIs** (Sheets, Drive, Gmail) with OAuth2
- **Nodemailer** for professional email delivery
- **QR Code Libraries** for generation and scanning

### **Development & Deployment**
- **Vite** for fast development and optimized builds
- **ESLint** for code quality and consistency
- **Vercel** for frontend deployment
- **Environment Configuration** for secure credential management

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

#### **Google Sheets Management**
1. **Navigate** to "📊 Google Sheets" tab in Admin Dashboard
2. **View** all events with sheet status
3. **Generate** or update sheets for any event
4. **Monitor** auto-sync status and performance

## 📊 **Key Features Documentation**

### **RSVP & Attendance System**
- **QR Code Security**: Hash-based verification prevents tampering
- **Email Integration**: Professional templates with event branding
- **Mobile Scanning**: Optimized camera interface for quick scanning
- **Real-time Updates**: Instant database updates and statistics
- **Backup Methods**: Manual attendance marking for reliability

### **Google Sheets Integration**
- **Smart Generation**: Automatic detection of existing sheets
- **Auto-Sync**: Real-time updates when data changes
- **Multi-Sheet Structure**: Separate sheets for registrations, teams, and analytics
- **Professional Formatting**: Excel-like styling with colors and borders
- **Collaborative Access**: Public sharing with edit permissions

### **Payment Processing**
- **Optional Integration**: Enable/disable per event
- **UPI Support**: QR codes and payment IDs
- **Screenshot Verification**: Admin approval workflow
- **Status Tracking**: Payment verification across all exports
- **Security**: Secure file storage with Cloudinary

### **Custom Fields System**
- **Dynamic Forms**: Create custom registration fields per event
- **Multiple Types**: Text inputs, dropdowns, and more
- **Validation**: Built-in validation for required fields
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

- **[RSVP Attendance System](RSVP_ATTENDANCE_SYSTEM.md)** - Complete guide to QR code attendance tracking
- **[Google Sheets Auto-Sync](GOOGLE_SHEETS_AUTO_SYNC.md)** - Real-time Google Sheets integration
- **[Firebase Database Structure](FIREBASE_DATABASE_STRUCTURE.md)** - Database schema and security rules
- **[Auto-Sync Implementation](AUTO_SYNC_IMPLEMENTATION.md)** - Technical details of auto-sync system
- **[Sheets Optimization Summary](SHEETS_OPTIMIZATION_SUMMARY.md)** - Recent improvements and optimizations

## 🚀 **Performance & Security**

### **Performance Features**
- **Optimized Bundle**: Vite-powered build with code splitting
- **Image Optimization**: Cloudinary CDN with automatic optimization
- **Lazy Loading**: Components and images loaded on demand
- **Caching**: Efficient caching strategies for better performance
- **Mobile Optimization**: Touch-friendly interfaces and responsive design

### **Security Features**
- **Firebase Security Rules**: Role-based database access control
- **Input Validation**: Comprehensive validation on frontend and backend
- **CORS Protection**: Proper CORS configuration for API security
- **Rate Limiting**: API rate limiting to prevent abuse
- **Secure Authentication**: Firebase Auth with proper session management

## 🎯 **Production Ready**

This project is production-ready with:
- ✅ **Comprehensive Error Handling**
- ✅ **Professional UI/UX Design**
- ✅ **Mobile-First Responsive Design**
- ✅ **Real-time Data Synchronization**
- ✅ **Automated Testing Capabilities**
- ✅ **Deployment Automation**
- ✅ **Security Best Practices**
- ✅ **Performance Optimization**

## 📞 **Support**

For technical support or questions:
1. Check the documentation files in the repository
2. Review the troubleshooting sections in feature-specific docs
3. Open an issue on GitHub with detailed information
4. Contact the development team

## 👨‍💻 **Credits**

**Created by:** Dhruba Kr Agarwalla (Scholar ID: 2411100)
**Institution:** National Institute of Technology Silchar
**Project Type:** Enterprise-Grade Event Management Platform
**Development Period:** 2024

### **Special Thanks**
- NIT Silchar for providing the platform and requirements
- Firebase team for excellent backend services
- Google for comprehensive API ecosystem
- Cloudinary for reliable image management
- Open source community for amazing libraries and tools

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 **Star the Repository**

If you find this project useful, please consider giving it a star ⭐ on GitHub to show your support!

---

**Built with ❤️ for the NIT Silchar community and beyond.**

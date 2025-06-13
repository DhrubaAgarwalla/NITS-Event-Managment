# 🚀 NIT Silchar Event Manager

A comprehensive event management platform for NIT Silchar with real-time data processing, automated workflows, and modern web technologies.

[![Data Pipeline](https://img.shields.io/badge/Feature-Data%20Pipeline-green)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)
[![Real-Time Analytics](https://img.shields.io/badge/Analytics-Real--Time-orange)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)
[![Automation](https://img.shields.io/badge/Feature-Smart%20Automation-blue)](https://github.com/DhrubaAgarwalla/NITS-Event-Managment)

## ✨ **Core Features**

### 🎪 **Event Management**
- Event creation with custom fields and participation types (Solo/Team/Both)
- Real-time registration tracking and analytics
- Category & tag management for organized discovery
- Client-side image compression before Cloudinary upload

### 👥 **Authentication & Access Control**
- Firebase Authentication with role-based access (Admin, Club, Participant)
- Club dashboard for event management
- Admin panel with system-wide controls

### 📱 **QR Code Attendance System**
- Automatic QR code generation with security verification
- Mobile QR scanner using jsQR library
- Email delivery with QR codes via Gmail API
- Real-time attendance tracking and confirmation emails

### 💰 **Payment Processing**
- Optional payment requirements per event
- Screenshot upload with Cloudinary storage
- Admin verification workflow

### 📊 **Google Sheets Integration**
- Automatic sheet generation and real-time sync
- Multi-sheet structure (Registrations, Teams, Dashboard)
- Professional formatting and public sharing

### 📈 **Data Pipeline & Analytics**
- Real-time data processing from Firebase
- Interactive charts using Recharts library
- Registration trend analysis and component health monitoring
- 5-minute intelligent caching system

### 🎨 **Modern UI/UX**
- Responsive design with CSS 3D transforms and mobile tilt effects
- GSAP scroll animations and Framer Motion transitions
- Dark theme interface optimized for all devices

## 🛠️ **Technology Stack**

### **Frontend**
- **React 19** with Vite for development and optimized builds
- **Framer Motion** for animations and page transitions
- **GSAP** for scroll effects and timeline animations
- **Recharts** for data visualization and analytics charts
- **Firebase SDK** for authentication and real-time database
- **Cloudinary** for image storage and optimization

### **Backend**
- **Node.js Express Server** for Google Sheets API integration
- **Firebase Realtime Database** with security rules
- **Google APIs** (Sheets, Drive, Gmail) with OAuth2
- **Nodemailer** for email delivery with templates
- **QR Code Libraries** (qrcode, jsQR) for generation and scanning

### **Performance & Deployment**
- **Client-Side Image Compression** using Canvas API
- **Intelligent Caching** with 5-minute duration
- **Code Splitting** and lazy loading with Vite
- **Vercel** deployment with CI/CD integration
- **Rate Limiting** and CORS protection

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v18+)
- Firebase Account
- Cloudinary Account
- Google Cloud Project with Sheets API
- Gmail Account with App Password

### **Installation**

```bash
# Clone repository
git clone https://github.com/DhrubaAgarwalla/NITS-Event-Managment.git
cd NITS-Event-Managment

# Frontend setup
cd event-manager
npm install

# Backend setup
cd ../sheets-backend
npm install
```

### **Environment Configuration**

**Frontend (.env)**
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_DATABASE_URL=your-firebase-database-url
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
VITE_SHEETS_BACKEND_URL=http://localhost:3001
```

**Backend (.env)**
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
PORT=3001
```

### **Development**
```bash
# Terminal 1 - Frontend
cd event-manager && npm run dev

# Terminal 2 - Backend
cd sheets-backend && npm run dev
```

Access: Frontend at `http://localhost:5173`, Backend at `http://localhost:3001`

## 📋 **Setup Guides**

### **Firebase Setup**
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password) and Realtime Database
3. Copy configuration to `.env` file
4. Import database structure from `FIREBASE_DATABASE_STRUCTURE.md`

### **Google Sheets API**
1. Create Google Cloud Project and enable Sheets/Drive APIs
2. Create Service Account and download credentials
3. Add credentials to backend `.env` file

### **Cloudinary & Gmail**
1. Create Cloudinary account and upload preset
2. Enable Gmail 2FA and generate App Password
3. Add credentials to respective `.env` files

## 🚀 **Deployment**

```bash
# Frontend (Vercel)
cd event-manager && npm run build && vercel --prod

# Backend (Vercel)
cd sheets-backend && vercel --prod
```

Configure environment variables in your deployment platform settings.

## 📖 **Usage Guide**

### **For Clubs**
1. Login to club account and access dashboard
2. Create events with custom fields and participation types
3. Track registrations and verify payments in real-time
4. Use QR scanner for attendance tracking
5. Export data to Excel, PDF, or Google Sheets

### **For Participants**
1. Browse and register for events
2. Upload payment screenshot if required
3. Receive QR code via email
4. Present QR code for attendance scanning

### **For Administrators**
1. Access Admin Dashboard for system overview
2. Manage clubs, events, and user accounts
3. Monitor data pipeline and analytics
4. View Google Sheets integration status
5. Access performance monitoring tools

## 📊 **Key Features**

### **Data Pipeline & Analytics**
- Real-time data processing from Firebase with 5-minute caching
- Interactive charts using Recharts library
- Registration trend analysis and component health monitoring
- Performance metrics and error tracking

### **Image Processing**
- Client-side compression before Cloudinary upload
- Automatic optimization based on image type
- Progress tracking and format optimization

### **Automation System**
- Background service for event status management
- Automated notifications and event archival
- Smart scheduling with error recovery

### **QR Code Attendance**
- Secure QR code generation and verification
- Mobile scanning with jsQR library
- Email integration with professional templates
- Real-time attendance updates

### **Google Sheets Integration**
- Automatic sheet generation and real-time sync
- Multi-sheet structure with professional formatting
- Public sharing and collaborative access

### **Payment Processing**
- Optional payment requirements per event
- Screenshot upload and admin verification
- Status tracking across all exports

## 🔧 **Development**

### **Project Structure**
```
event-manager/          # Frontend React app
├── src/components/     # React components
├── src/services/       # API and business logic
├── src/contexts/       # React contexts
└── src/utils/          # Utility functions

sheets-backend/         # Backend API service
├── src/routes/         # API routes
├── src/services/       # Business logic
└── src/config/         # Configuration
```

### **Scripts**
```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting

# Backend
npm run dev          # Development with auto-reload
npm start            # Production server
npm run test         # Run tests
```

## 📚 **Documentation**

Detailed documentation available in repository:
- **[RSVP Attendance System](RSVP_ATTENDANCE_SYSTEM.md)** - QR code attendance tracking
- **[Google Sheets Auto-Sync](GOOGLE_SHEETS_AUTO_SYNC.md)** - Real-time integration
- **[Firebase Database Structure](FIREBASE_DATABASE_STRUCTURE.md)** - Schema and security
- **[Data Pipeline Setup](DATA_PIPELINE_SETUP.md)** - Analytics setup guide
- **[Performance Improvements](PERFORMANCE_IMPROVEMENTS.md)** - Optimization details

## 🚀 **Production Features**

### **Performance**
- Vite-powered build with code splitting
- Client-side image compression (up to 70% reduction)
- 5-minute intelligent caching system
- Lazy loading and performance monitoring

### **Security**
- Firebase security rules with role-based access
- Input validation and CORS protection
- Rate limiting (100 requests per 15 minutes)
- Secure authentication and error handling

### **Production Ready**
- ✅ Real-time data pipeline and analytics
- ✅ Comprehensive error handling
- ✅ Mobile-first responsive design
- ✅ Automated deployment with Vercel
- ✅ Performance optimization and monitoring

## 👨‍💻 **Credits**

**Created by:** Dhruba Kr Agarwalla (Scholar ID: 2411100)
**Institution:** National Institute of Technology Silchar
**Development Period:** 2025

### **Technical Achievements**
- 🔄 Real-time data pipeline with live processing
- 📊 Interactive analytics with Recharts visualization
- 🚀 70% image compression and intelligent caching
- 🤖 Background automation and smart scheduling
- 🎨 Modern UI with CSS 3D effects and animations
- 🔐 Enterprise security with Firebase authentication

### **Acknowledgments**
- NIT Silchar for platform requirements
- Firebase for backend services
- Google for API ecosystem (Sheets, Drive, Gmail)
- Cloudinary for image optimization
- Recharts for data visualization
- Open source community

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the NIT Silchar community**

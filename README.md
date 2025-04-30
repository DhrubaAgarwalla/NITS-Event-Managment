# NIT Silchar Event Manager

A 3D immersive website with high-quality scrolling effects and overlay page animations for managing NIT Silchar clubs and college events.

## Features

- Registration for events
- Club login (who can create events)
- Upcoming/ongoing events
- Track registrants and their details
- Dark-themed 3D immersive design
- Smooth scrolling and animations
- Responsive design for all devices
- Firebase integration for backend

## Technologies Used

- React with Vite
- Three.js for 3D effects
- Framer Motion for animations
- GSAP for scrolling effects
- Firebase for backend and authentication
- Cloudinary for image storage
- Date-fns for date formatting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DhrubaAgarwalla/NITS-Event-Managment.git
   cd NITS-Event-Managment/event-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase and Cloudinary credentials:
   ```
   # Firebase credentials
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   VITE_FIREBASE_DATABASE_URL=your-firebase-database-url

   # Cloudinary credentials
   VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   VITE_CLOUDINARY_API_KEY=your-cloudinary-api-key
   VITE_CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is deployed using Vercel. Any changes pushed to the main branch will be automatically deployed.

## Credits

- Created by Dhruba Kr Agarwalla (Scholar ID: 2411100)
- NIT Silchar

## License

This project is licensed under the MIT License.

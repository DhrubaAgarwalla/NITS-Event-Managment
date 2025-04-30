# Firebase and Cloudinary Setup Guide

This guide will help you set up Firebase and Cloudinary for the NIT Silchar Event Management application.

## Firebase Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired

### 2. Set up Firebase Authentication

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Email/Password" sign-in method
4. Optionally, set up other sign-in methods as needed

### 3. Set up Firebase Realtime Database

1. In the Firebase Console, go to "Realtime Database" in the left sidebar
2. Click "Create database"
3. Start in test mode (we'll secure it later)
4. Choose a database location close to your users

### 4. Update Environment Variables

1. Update the `.env` file with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### 5. Initialize the Database

1. Run the initialization script:
   ```
   node -r esm src/scripts/initFirebase.js
   ```
   This will:
   - Create the necessary database structure
   - Set up categories
   - Create an admin user

## Cloudinary Setup

### 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

### 2. Create an Upload Preset

1. In your Cloudinary dashboard, go to "Settings" > "Upload"
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set "Signing Mode" to "Unsigned"
5. Configure any other settings as needed (folder path, transformations, etc.)
6. Save the preset and note the preset name

### 3. Update Environment Variables

1. Update the `.env` file with your Cloudinary configuration:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

### 4. Test the Cloudinary Setup

1. Run the Cloudinary setup test script:
   ```
   node -r esm src/scripts/setupCloudinary.js
   ```
   This will verify that your Cloudinary configuration is correct.

## Securing Your Firebase Database

After setting up your application, you should secure your Firebase Realtime Database with proper security rules:

1. In the Firebase Console, go to "Realtime Database" > "Rules"
2. Configure rules to secure your database, for example:
   ```json
   {
     "rules": {
       "admins": {
         "$uid": {
           ".read": "auth !== null",
           ".write": "auth !== null && auth.uid === $uid || root.child('admins').child(auth.uid).exists()"
         }
       },
       "clubs": {
         "$uid": {
           ".read": "auth !== null",
           ".write": "auth !== null && (auth.uid === $uid || root.child('admins').child(auth.uid).exists())"
         }
       },
       "events": {
         ".read": true,
         "$eventId": {
           ".write": "auth !== null && (data.child('club_id').val() === auth.uid || root.child('admins').child(auth.uid).exists())"
         }
       },
       "registrations": {
         ".read": "auth !== null",
         ".write": "auth !== null"
       },
       "club_requests": {
         ".read": "auth !== null && root.child('admins').child(auth.uid).exists()",
         ".write": true
       },
       "categories": {
         ".read": true,
         ".write": "auth !== null && root.child('admins').child(auth.uid).exists()"
       }
     }
   }
   ```

## Troubleshooting

### Firebase Authentication Issues

- If you're having trouble with authentication, check the Firebase Authentication console for any error messages
- Make sure your Firebase project has the correct authentication methods enabled
- Check that your environment variables are set correctly

### Cloudinary Upload Issues

- If uploads are failing, check that your upload preset is configured correctly
- Make sure the upload preset is set to "Unsigned"
- Verify that your cloud name and upload preset are set correctly in the `.env` file

### Database Connection Issues

- If you're having trouble connecting to the Firebase Realtime Database, check that your database URL is correct
- Make sure your Firebase project has a Realtime Database created
- Check that your security rules allow the operations you're trying to perform

# Firebase Setup Instructions

## 1. Set Up Firebase Security Rules

You need to update your Firebase Realtime Database security rules to allow authenticated users to read and write data.

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Realtime Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the current rules with the following:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "clubs": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'club_admin'"
    },
    "events": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'club_admin'"
    },
    "registrations": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

6. Click "Publish" to save the rules

## 2. Run the Database Setup Script

1. Make sure you have Node.js installed
2. Open a terminal in the project directory
3. Install required dependencies if not already installed:

```bash
npm install firebase
```

4. Run the setup script with your admin email and password:

```bash
node firebase-setup.js your-email@example.com your-password
```

Replace `your-email@example.com` and `your-password` with the credentials you used to create your account.

## 3. Verify Setup

After running the script, you should be able to:

1. Read and write data in the Firebase Test component
2. See the test data in the Firebase Console under Realtime Database

If you're still having issues, check:
- That your security rules have been published
- That you're signed in with the correct account
- That your Firebase configuration in the app is correct

## Database Structure

The script sets up the following structure:

```
/users/{uid}
  - email
  - role
  - created_at
  - updated_at

/events/{event-id}
  - title
  - description
  - start_date
  - end_date
  - location
  - is_featured
  - status
  - created_by
  - created_at
  - updated_at

/clubs/{club-id}
  - name
  - description
  - logo_url
  - email
  - created_at
  - updated_at

/registrations/{registration-id}
  - event_id
  - user_id
  - status
  - created_at
  - updated_at
```

You can expand this structure as needed for your application.

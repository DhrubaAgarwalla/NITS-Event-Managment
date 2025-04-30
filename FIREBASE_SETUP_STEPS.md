# Firebase Setup Steps

## 1. Update Firebase Security Rules

First, you need to update your Firebase Realtime Database security rules to allow authenticated users to read and write data:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your "nits-event" project
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
    },
    "test": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

6. Click "Publish" to save the rules

## 2. Run the Database Setup Script

After updating the security rules, run the setup script to initialize your database structure:

```bash
node firebase-setup-simple.js dhrubagarwala67@gmail.com your-password
```

Replace `your-password` with the password you used when creating your account.

If you encounter any issues with the script, try these troubleshooting steps:

1. Make sure you're in the correct directory (event-manager)
2. Check that you've updated the Firebase security rules
3. Verify that your Firebase account is properly set up

## 3. Test the Firebase Connection

After running the setup script, go back to your application and test the Firebase connection:

1. Navigate to the Firebase Test page in your application
2. Try to read and write test data
3. You should no longer see permission denied errors

## 4. Verify in Firebase Console

You can also verify that the data was created by checking the Firebase Console:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your "nits-event" project
3. Click on "Realtime Database" in the left sidebar
4. You should see the test data that was created by the script

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

/test
  - message
  - timestamp
```

## Troubleshooting

If you're still having issues after following these steps:

1. **Check Firebase Console Logs**: Look for any error messages in the Firebase Console under "Functions" > "Logs"

2. **Verify Authentication**: Make sure you're properly authenticated before trying to read/write data

3. **Check Security Rules**: Double-check that your security rules have been published and are correct

4. **Browser Console**: Check your browser's developer console for any error messages

5. **Firebase Status**: Check if there are any ongoing Firebase service disruptions at [status.firebase.google.com](https://status.firebase.google.com/)

# Setting Up Google Sheets API in Vercel

Follow these steps to set up the Google Sheets API in your Vercel deployment:

## 1. Create Vercel Environment Variables

You need to add the following environment variables to your Vercel project. You can do this from the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following environment variables with values from your Google API JSON key file:

```
GOOGLE_CREDENTIALS_TYPE=service_account
GOOGLE_CREDENTIALS_PROJECT_ID=tensile-map-434002-j0
GOOGLE_CREDENTIALS_PRIVATE_KEY_ID=e175dc3e6107969bd0f598ab15a06e942a324cc7
GOOGLE_CREDENTIALS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfUCwmKxnOCMv0\n5rpCM3sA7W0HqqL26jOEQXYk3gINV2G597pat1F7lvYheHzZWg5bzUOIpqMgNHjS\nG6wp+eawgyz/TqwuGEUBgLftf7gEj/XYEy0V1AeahcflLWwwho32ooaEKJ96kPhw\nVQrttQpHl5NBpIPhLHhoNTwBbAzVCZ5aGLnJ4eM6n8CE7mIsb7rn+pE1UTDMA25d\nNQiOuQoMqriB6HSOzau8K8EXkVEcFc4hX+vWqFFMu2M28U/oNjZo7A4qTy3FY2No\nhP/VVJZn0yyf4UXMbAFkEQN+ICbSN+3pin/1Dprg5f0t6hpB5EYD2CSmVnQgfhZq\ni2FPumJdAgMBAAECggEADoxyQ+OnoQ+w/KSSL+vwsI/HUao2nHAyU68mxkzHGh1o\n8C0JMWMjZjI17i+jr/ljrsFsYUO8pEV8NZwN7FzWlbCwxsqrrFkdGHWisKYTKWDu\nUFnMzyZAKeYGBD1LAMz+BLpz7w+XzEFo83s8OgkDFsTzmAw4IfxmtSClZyZQnl8M\ngO7744/swYYpzrPJT07kp8LMLnT1Ucu5K3cg+BhAyAgtZ6BAb0ztk98oBYGW81Pi\ne8hWP32s5Ym07o56pudxe/MLfiLjs6EJ/h/KNHk1N6QJMbT4O8MVhIBLH9ShF/Hp\n3MZri9PEhlXlERVp8MdwJlRJ0CK6GUFheuN6CP2tgQKBgQD+T/oqWzOqopTexhVq\neAo7wpfH5HcwFK5TRCXdjcVJWW9fDdjFNj2j5lHCJJ5hiVSfbC6AkL/CIgUhSNku\nlK8JsEYny3kOxUdWlV1UHU0Q00JzTK6a1v1wTGTNzgj//mHDkT3YmzpEjKQuivCx\nBa6cGObb5TxB8/kURLsgMkvO4QKBgQDgy4i8fObXmF37xndveYuxJtFVBbdM9REE\nCvOFd3m52Qw3Y50KuoMRKSs+w69+7/qdB7nNInU8sSlEu3cXRTZeQ0x/CEEdlx5z\ne5wMmE6SBUp2llxhzmZ5xhTWr+zizQVdIL3VuTQb2BRGaefSbf3tXUF/z2ZeTc6x\nRLbgdHKu/QKBgFh0YvQWksr4D8XIqixFInIUxgw9+ALePqAxpOYB6KwRkn5CZ7J4\nokn+01Muv3P3e1qUGzyWnEwe3x/robbk+ljpWg1/ZVTw41ZHT5XxNxvyDzvhYR30\nR2Sm/azjzBeWWFTYkOVlYIf1TyntI7i+3DPpKWs0uZfLD0iwe1HAjMOhAoGBAIuc\n/YSLUleucxiPL9iVNbRFtpdGoIx0XCgVoR9Qj9JkQlkYTg2+vu5mkkw9/v4oj479\noGEOOKAEK+xbPeC/BMBQre7rsn1tQOVabRXJdmrsTE4QnrnEFhMlegXIZ6iIyv8G\n+cAGcZ2lexosZmVkGORWGfsGVb7WNjwUwDvxNtUFAoGALvOPPjxkOuaFI9Vov+xm\nZbBFuTDjfx9L5Qc1Tv87W2/IbvWC2PVOf9t5Q3YRiIlw9+Z9V0dmhnGu3DGmfh9E\n42x3dNfpnj4q+NGbNWdeA/vEe6k6Fzryakhi4azwNV94HkXbQhr2OO63Mq6dcBP/\nZSi+xHDAxau4gIIitRgNXhg=\n-----END PRIVATE KEY-----\n"
GOOGLE_CREDENTIALS_CLIENT_EMAIL=nits-events@tensile-map-434002-j0.iam.gserviceaccount.com
GOOGLE_CREDENTIALS_CLIENT_ID=107173753714311583013
GOOGLE_CREDENTIALS_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_CREDENTIALS_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CREDENTIALS_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/nits-events%40tensile-map-434002-j0.iam.gserviceaccount.com
```

Also add these client-side variables:

```
VITE_GOOGLE_API_KEY=AIzaSyDpZtD_EDIEJLqdpvgU0UGSKGCzVB0f7Pw
VITE_GOOGLE_CLIENT_ID=107173753714311583013
```

## 2. Deploy Your Project

After setting up the environment variables, deploy your project to Vercel:

```bash
vercel --prod
```

## 3. Test the Google Sheets Export

1. Go to your deployed site
2. Navigate to an event with registrations
3. Try exporting the registrations as Google Sheets

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify that all environment variables are set correctly in Vercel
3. Make sure your Google API project has the necessary APIs enabled:
   - Google Sheets API
   - Google Drive API
4. Ensure your Google Service Account has the necessary permissions

## Local Development

For local development, you can use the `.env` file with the same variables. The test script at `api/test-google.js` can be used to verify that your Google API credentials are working correctly:

```bash
node --experimental-json-modules api/test-google.js
```

If successful, it will create a test spreadsheet and provide you with the URL.

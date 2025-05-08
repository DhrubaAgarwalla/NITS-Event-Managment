# Setting Up Google Sheets API in Vercel

Follow these steps to set up the Google Sheets API in your Vercel deployment:

## 1. Create Vercel Environment Variables

You need to add the following environment variables to your Vercel project. You can do this from the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following environment variables with values from your Google API JSON key file:

```
GOOGLE_CREDENTIALS_TYPE=service_account
GOOGLE_CREDENTIALS_PROJECT_ID=your-project-id
GOOGLE_CREDENTIALS_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_CREDENTIALS_PRIVATE_KEY="your-private-key-content-with-newlines"
GOOGLE_CREDENTIALS_CLIENT_EMAIL=your-service-account-email
GOOGLE_CREDENTIALS_CLIENT_ID=your-client-id
GOOGLE_CREDENTIALS_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_CREDENTIALS_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CREDENTIALS_CLIENT_CERT_URL=your-client-cert-url
```

Also add these client-side variables:

```
VITE_GOOGLE_API_KEY=your-google-api-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
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

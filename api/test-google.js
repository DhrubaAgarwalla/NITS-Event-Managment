// Test script to verify Google API credentials
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Google API client
const initializeGoogleClient = () => {
  try {
    // Load credentials from environment variables
    const credentials = {
      type: process.env.GOOGLE_CREDENTIALS_TYPE,
      project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CREDENTIALS_AUTH_URI,
      token_uri: process.env.GOOGLE_CREDENTIALS_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CREDENTIALS_CLIENT_CERT_URL
    };

    console.log('Credentials loaded:', {
      type: credentials.type,
      project_id: credentials.project_id,
      client_email: credentials.client_email,
      client_id: credentials.client_id
    });

    // Create a JWT auth client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    );

    // Initialize the Sheets API
    const sheets = google.sheets({ version: 'v4', auth });

    // Initialize the Drive API
    const drive = google.drive({ version: 'v3', auth });

    return { auth, sheets, drive };
  } catch (error) {
    console.error('Error initializing Google client:', error);
    throw new Error('Failed to initialize Google API client');
  }
};

// Test function to create a simple spreadsheet
const testGoogleSheets = async () => {
  try {
    console.log('Testing Google Sheets API...');
    
    // Initialize Google API client
    const { sheets, drive } = initializeGoogleClient();
    console.log('Google API client initialized successfully');

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Test Spreadsheet',
          locale: 'en_US',
          timeZone: 'Asia/Kolkata',
        },
        sheets: [
          {
            properties: {
              title: 'Sheet1',
              gridProperties: {
                rowCount: 100,
                columnCount: 10,
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    console.log('Spreadsheet created successfully!');
    console.log('Spreadsheet URL:', spreadsheetUrl);

    // Add some test data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Test Data'],
          ['This is a test spreadsheet created to verify Google Sheets API integration'],
          ['Created at:', new Date().toLocaleString()]
        ],
      },
    });
    
    console.log('Test data added to spreadsheet');

    // Set permissions to anyone with the link can edit
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
      fields: 'id',
    });
    
    console.log('Permissions set to "Anyone with the link can edit"');
    console.log('Test completed successfully!');
    
    return {
      success: true,
      message: 'Google Sheets API is working correctly',
      spreadsheetUrl
    };
  } catch (error) {
    console.error('Error testing Google Sheets API:', error);
    return {
      success: false,
      message: 'Error testing Google Sheets API',
      error: error.message
    };
  }
};

// Run the test
testGoogleSheets()
  .then(result => {
    console.log('Test result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });

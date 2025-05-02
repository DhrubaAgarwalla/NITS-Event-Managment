// This is a fallback solution that uses the Google Sheets API directly from the frontend
// It requires the user to be signed in with a Google account that has access to Google Sheets

export const exportToGoogleSheets = async (eventTitle, registrations) => {
  try {
    // Check if the Google API client is loaded
    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API client not loaded. Please refresh the page and try again.');
    }

    // Load the Google Sheets API
    await window.gapi.client.load('sheets', 'v4');

    // Create a new spreadsheet
    const createResponse = await window.gapi.client.sheets.spreadsheets.create({
      properties: {
        title: `${eventTitle} - Registrations`,
        locale: 'en_US',
        timeZone: 'Asia/Kolkata',
      },
      sheets: [
        {
          properties: {
            title: 'Registrations',
            gridProperties: {
              rowCount: 1000,
              columnCount: 12,
            },
          },
        },
      ],
    });

    const spreadsheetId = createResponse.result.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Prepare data for the spreadsheet
    const headerData = [
      ['NIT SILCHAR EVENT REGISTRATION DATA'],
      [`Event: ${eventTitle}`],
      [`Generated: ${new Date().toLocaleString()}`],
      ['']
    ];

    // Calculate registration statistics
    const totalRegistrations = registrations.length;
    const individualRegistrations = registrations.filter(reg => reg.registration_type === 'Individual').length;
    const teamRegistrations = registrations.filter(reg => reg.registration_type === 'Team').length;

    // Add statistics
    headerData.push(['Registration Statistics:']);
    headerData.push(['Total Registrations:', totalRegistrations]);
    headerData.push(['Individual Registrations:', individualRegistrations]);
    headerData.push(['Team Registrations:', teamRegistrations]);
    headerData.push(['']);
    headerData.push(['']);

    // Create a clean, flat structure for the main data
    const dataRows = [];

    // Add header row
    dataRows.push([
      'Serial No.',
      'Name',
      'Email',
      'Phone',
      'Student ID',
      'Department',
      'Year',
      'Type',
      'Registration Date',
      'Status',
      'Team Members',
      'Notes'
    ]);

    // Add data rows
    registrations.forEach((reg, index) => {
      dataRows.push([
        index + 1, // Serial number
        reg.name,
        reg.email,
        reg.phone,
        reg.student_id,
        reg.department,
        reg.year,
        reg.registration_type,
        reg.registration_date,
        reg.status,
        reg.team_members || '', // Team members information
        '' // Empty notes column for clubs to add comments
      ]);
    });

    // Combine header and data
    const allData = [...headerData, ...dataRows];

    // Update the spreadsheet with data
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Registrations!A1',
      valueInputOption: 'RAW',
      resource: {
        values: allData,
      },
    });

    // Return the spreadsheet URL
    return {
      success: true,
      url: spreadsheetUrl,
      filename: `${eventTitle} - Google Sheet`,
      type: 'sheets',
      message: 'Google Sheet created successfully. Click to open.'
    };
  } catch (error) {
    console.error('Error creating Google Sheet directly:', error);
    return {
      success: false,
      message: 'Failed to create Google Sheet directly: ' + error.message,
      error: error
    };
  }
};

// Function to load the Google API client
export const loadGoogleApiClient = (callback) => {
  // Check if the Google API client is already loaded
  if (window.gapi && window.gapi.client) {
    if (callback) callback();
    return;
  }

  // Load the Google API client
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window.gapi.load('client:auth2', () => {
      window.gapi.client.init({
        // IMPORTANT: Replace these with your actual Google API credentials
        // Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
        apiKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfUCwmKxnOCMv0\n5rpCM3sA7W0HqqL26jOEQXYk3gINV2G597pat1F7lvYheHzZWg5bzUOIpqMgNHjS\nG6wp+eawgyz/TqwuGEUBgLftf7gEj/XYEy0V1AeahcflLWwwho32ooaEKJ96kPhw\nVQrttQpHl5NBpIPhLHhoNTwBbAzVCZ5aGLnJ4eM6n8CE7mIsb7rn+pE1UTDMA25d\nNQiOuQoMqriB6HSOzau8K8EXkVEcFc4hX+vWqFFMu2M28U/oNjZo7A4qTy3FY2No\nhP/VVJZn0yyf4UXMbAFkEQN+ICbSN+3pin/1Dprg5f0t6hpB5EYD2CSmVnQgfhZq\ni2FPumJdAgMBAAECggEADoxyQ+OnoQ+w/KSSL+vwsI/HUao2nHAyU68mxkzHGh1o\n8C0JMWMjZjI17i+jr/ljrsFsYUO8pEV8NZwN7FzWlbCwxsqrrFkdGHWisKYTKWDu\nUFnMzyZAKeYGBD1LAMz+BLpz7w+XzEFo83s8OgkDFsTzmAw4IfxmtSClZyZQnl8M\ngO7744/swYYpzrPJT07kp8LMLnT1Ucu5K3cg+BhAyAgtZ6BAb0ztk98oBYGW81Pi\ne8hWP32s5Ym07o56pudxe/MLfiLjs6EJ/h/KNHk1N6QJMbT4O8MVhIBLH9ShF/Hp\n3MZri9PEhlXlERVp8MdwJlRJ0CK6GUFheuN6CP2tgQKBgQD+T/oqWzOqopTexhVq\neAo7wpfH5HcwFK5TRCXdjcVJWW9fDdjFNj2j5lHCJJ5hiVSfbC6AkL/CIgUhSNku\nlK8JsEYny3kOxUdWlV1UHU0Q00JzTK6a1v1wTGTNzgj//mHDkT3YmzpEjKQuivCx\nBa6cGObb5TxB8/kURLsgMkvO4QKBgQDgy4i8fObXmF37xndveYuxJtFVBbdM9REE\nCvOFd3m52Qw3Y50KuoMRKSs+w69+7/qdB7nNInU8sSlEu3cXRTZeQ0x/CEEdlx5z\ne5wMmE6SBUp2llxhzmZ5xhTWr+zizQVdIL3VuTQb2BRGaefSbf3tXUF/z2ZeTc6x\nRLbgdHKu/QKBgFh0YvQWksr4D8XIqixFInIUxgw9+ALePqAxpOYB6KwRkn5CZ7J4\nokn+01Muv3P3e1qUGzyWnEwe3x/robbk+ljpWg1/ZVTw41ZHT5XxNxvyDzvhYR30\nR2Sm/azjzBeWWFTYkOVlYIf1TyntI7i+3DPpKWs0uZfLD0iwe1HAjMOhAoGBAIuc\n/YSLUleucxiPL9iVNbRFtpdGoIx0XCgVoR9Qj9JkQlkYTg2+vu5mkkw9/v4oj479\noGEOOKAEK+xbPeC/BMBQre7rsn1tQOVabRXJdmrsTE4QnrnEFhMlegXIZ6iIyv8G\n+cAGcZ2lexosZmVkGORWGfsGVb7WNjwUwDvxNtUFAoGALvOPPjxkOuaFI9Vov+xm\nZbBFuTDjfx9L5Qc1Tv87W2/IbvWC2PVOf9t5Q3YRiIlw9+Z9V0dmhnGu3DGmfh9E\n42x3dNfpnj4q+NGbNWdeA/vEe6k6Fzryakhi4azwNV94HkXbQhr2OO63Mq6dcBP/\nZSi+xHDAxau4gIIitRgNXhg=\n-----END PRIVATE KEY-----\n', // The API key from Google Cloud Console
        clientId: '107173753714311583013', // The OAuth client ID from Google Cloud Console
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
      }).then(() => {
        if (callback) callback();
      }).catch(error => {
        console.error('Error initializing Google API client:', error);
      });
    });
  };
  document.body.appendChild(script);
};

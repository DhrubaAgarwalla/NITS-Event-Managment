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
        apiKey: import.meta.env.GOOGLE_CREDENTIALS_PRIVATE_KEY,
        clientId: import.meta.env.GOOGLE_CREDENTIALS_CLIENT_ID,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        // Add redirect URI that matches your deployment
        redirect_uri: 'https://nits-event-managment.vercel.app'
      }).then(() => {
        if (callback) callback();
      }).catch(error => {
        console.error('Error initializing Google API client:', error);
      });
    });
  };
  document.body.appendChild(script);
};

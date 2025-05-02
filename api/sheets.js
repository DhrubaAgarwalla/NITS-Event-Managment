import { google } from 'googleapis';

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('API request received:', req.method);

    // Check if credentials are properly set
    const credentialsCheck = {
      type: process.env.GOOGLE_CREDENTIALS_TYPE ? 'Set' : 'Missing',
      project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID ? 'Set' : 'Missing',
      private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID ? 'Set' : 'Missing',
      private_key: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY ? 'Set' : 'Missing',
      client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL ? 'Set' : 'Missing',
      client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID ? 'Set' : 'Missing'
    };

    console.log('Credentials check:', credentialsCheck);

    // Initialize Google API client
    const { sheets, drive } = initializeGoogleClient();
    console.log('Google API client initialized successfully');

    // Get request data
    const { eventTitle, registrations } = req.body;
    console.log('Request data:', { eventTitle, registrationsCount: registrations?.length || 0 });

    if (!eventTitle || !registrations || !Array.isArray(registrations)) {
      console.log('Invalid request data');
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Event title and registrations array are required.'
      });
    }

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
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
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Get the sheet ID
    const registrationsSheetId = spreadsheet.data.sheets[0].properties.sheetId;

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
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Registrations!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: allData,
      },
    });

    // Format the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          // Bold the header row
          {
            repeatCell: {
              range: {
                sheetId: registrationsSheetId,
                startRowIndex: 4,
                endRowIndex: 5,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                    fontSize: 12,
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                    },
                  },
                  backgroundColor: {
                    red: 0.0,
                    green: 0.27,
                    blue: 0.6, // NIT Silchar blue
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
            },
          },
          // Bold the title rows
          {
            repeatCell: {
              range: {
                sheetId: registrationsSheetId,
                startRowIndex: 0,
                endRowIndex: 3,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                    fontSize: 14,
                    foregroundColor: {
                      red: 0.0,
                      green: 0.0,
                      blue: 0.0,
                    },
                  },
                  backgroundColor: {
                    red: 0.93,
                    green: 0.69,
                    blue: 0.13, // Gold color
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
            },
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: registrationsSheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 12,
              },
            },
          },
          // Freeze the header row
          {
            updateSheetProperties: {
              properties: {
                sheetId: registrationsSheetId,
                gridProperties: {
                  frozenRowCount: 5,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          // Alternate row colors for better readability
          {
            addConditionalFormatRule: {
              rule: {
                ranges: [
                  {
                    sheetId: registrationsSheetId,
                    startRowIndex: 5,
                  },
                ],
                booleanRule: {
                  condition: {
                    type: 'CUSTOM_FORMULA',
                    values: [
                      {
                        userEnteredValue: '=MOD(ROW(),2)=0',
                      },
                    ],
                  },
                  format: {
                    backgroundColor: {
                      red: 0.95,
                      green: 0.95,
                      blue: 1.0, // Light blue for even rows
                    },
                  },
                },
              },
              index: 0,
            },
          },
          // Add borders to all data cells
          {
            repeatCell: {
              range: {
                sheetId: registrationsSheetId,
                startRowIndex: 5,
              },
              cell: {
                userEnteredFormat: {
                  borders: {
                    bottom: {
                      style: 'SOLID',
                      width: 1,
                      color: {
                        red: 0.8,
                        green: 0.8,
                        blue: 0.8,
                      },
                    },
                  },
                },
              },
              fields: 'userEnteredFormat.borders',
            },
          },
        ],
      },
    });

    // Create a separate sheet for team members if needed
    if (teamRegistrations > 0) {
      // Extract team members data
      const teamMembersData = [];

      // Add header rows
      teamMembersData.push(['TEAM MEMBERS DETAILS']);
      teamMembersData.push([`Event: ${eventTitle}`]);
      teamMembersData.push([`Generated: ${new Date().toLocaleString()}`]);
      teamMembersData.push(['']);

      // Add column headers
      teamMembersData.push([
        'Serial No.',
        'Team Lead',
        'Team Lead Email',
        'Member Name',
        'Scholar ID',
        'Department',
        'Year',
        'Status',
        'Notes'
      ]);

      // Add team members data
      let serialNo = 1;
      registrations.forEach(reg => {
        if (reg.registration_type === 'Team' && reg.team_members_details && reg.team_members_details.length > 0) {
          reg.team_members_details.forEach(member => {
            teamMembersData.push([
              serialNo++,
              reg.name,
              reg.email,
              member.name || 'N/A',
              member.scholar_id || 'N/A',
              member.department || 'N/A',
              member.year || 'N/A',
              reg.status,
              '' // Empty notes column
            ]);
          });
        }
      });

      // Add a new sheet for team members
      const teamSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Team Members',
                },
              },
            },
          ],
        },
      });

      // Get the sheet ID of the newly created Team Members sheet
      const teamMembersSheetId = teamSheetResponse.data.replies[0].addSheet.properties.sheetId;

      // Update the team members sheet with data
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Team Members!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: teamMembersData,
        },
      });

      // Format the team members sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            // Bold the header row
            {
              repeatCell: {
                range: {
                  sheetId: teamMembersSheetId,
                  startRowIndex: 4,
                  endRowIndex: 5,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      bold: true,
                      fontSize: 12,
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0,
                      },
                    },
                    backgroundColor: {
                      red: 0.0,
                      green: 0.27,
                      blue: 0.6, // NIT Silchar blue
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
              },
            },
            // Bold the title rows
            {
              repeatCell: {
                range: {
                  sheetId: teamMembersSheetId,
                  startRowIndex: 0,
                  endRowIndex: 3,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      bold: true,
                      fontSize: 14,
                      foregroundColor: {
                        red: 0.0,
                        green: 0.0,
                        blue: 0.0,
                      },
                    },
                    backgroundColor: {
                      red: 0.93,
                      green: 0.69,
                      blue: 0.13, // Gold color
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
              },
            },
            // Auto-resize columns
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: teamMembersSheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 9,
                },
              },
            },
            // Freeze the header row
            {
              updateSheetProperties: {
                properties: {
                  sheetId: teamMembersSheetId,
                  gridProperties: {
                    frozenRowCount: 5,
                  },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
            // Alternate row colors for better readability
            {
              addConditionalFormatRule: {
                rule: {
                  ranges: [
                    {
                      sheetId: teamMembersSheetId,
                      startRowIndex: 5,
                    },
                  ],
                  booleanRule: {
                    condition: {
                      type: 'CUSTOM_FORMULA',
                      values: [
                        {
                          userEnteredValue: '=MOD(ROW(),2)=0',
                        },
                      ],
                    },
                    format: {
                      backgroundColor: {
                        red: 0.95,
                        green: 0.95,
                        blue: 1.0, // Light blue for even rows
                      },
                    },
                  },
                },
                index: 0,
              },
            },
            // Add borders to all data cells
            {
              repeatCell: {
                range: {
                  sheetId: teamMembersSheetId,
                  startRowIndex: 5,
                },
                cell: {
                  userEnteredFormat: {
                    borders: {
                      bottom: {
                        style: 'SOLID',
                        width: 1,
                        color: {
                          red: 0.8,
                          green: 0.8,
                          blue: 0.8,
                        },
                      },
                    },
                  },
                },
                fields: 'userEnteredFormat.borders',
              },
            },
          ],
        },
      });
    }

    // Set permissions to anyone with the link can edit
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
      fields: 'id',
    });

    return res.status(200).json({
      success: true,
      message: 'Google Sheet created successfully',
      url: spreadsheetUrl,
      spreadsheetId
    });
  } catch (error) {
    console.error('Error creating Google Sheet:', error);

    // Log detailed error information
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Return a more detailed error response
    return res.status(500).json({
      success: false,
      message: 'Error creating Google Sheet',
      error: error.message,
      errorType: error.name,
      errorCode: error.code || 'unknown'
    });
  }
}

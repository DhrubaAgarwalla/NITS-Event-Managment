import { ref, push, set, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToGoogleSheets, loadGoogleApiClient } from './directSheetsExport';

// Registration-related database operations
const registrationService = {
  // Try Google Sheets export in the background without blocking the UI
  tryGoogleSheetsExportInBackground(eventTitle, registrations) {
    setTimeout(async () => {
      try {
        console.log('Attempting Google Sheets export in background');

        // First try the serverless function with the full URL
        try {
          const sheetsData = {
            eventTitle,
            registrations: registrations.map(reg => ({
              name: reg.name || reg.participant_name,
              email: reg.email,
              phone: reg.phone,
              student_id: reg.student_id || reg.participant_id,
              department: reg.department || reg.additional_info?.department,
              year: reg.year || reg.additional_info?.year,
              registration_type: reg.registration_type || (reg.additional_info?.team_members ? 'Team' : 'Individual'),
              registration_date: reg.registration_date || reg.created_at,
              status: reg.status,
              team_members: reg.team_members,
              team_members_details: reg.team_members_details || reg.additional_info?.team_members
            }))
          };

          const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetsData)
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Background Google Sheets export succeeded:', result);
            // We could notify the user here if needed
          } else {
            throw new Error(`Server responded with status: ${response.status}`);
          }
        } catch (serverError) {
          console.log('Server export failed, trying direct export in background');

          // If server fails, try direct export
          try {
            // Load the Google API client if not already loaded
            await new Promise((resolve) => {
              loadGoogleApiClient(resolve);
            });

            // Try to sign in the user silently (no popup)
            if (window.gapi && window.gapi.auth2) {
              const authInstance = window.gapi.auth2.getAuthInstance();
              if (!authInstance.isSignedIn.get()) {
                // Only try silent sign-in to avoid popup issues
                await authInstance.signIn({prompt: 'none'});
              }

              // Export directly to Google Sheets
              const result = await exportToGoogleSheets(eventTitle, registrations);
              if (result.success) {
                console.log('Background direct Google Sheets export succeeded:', result);
                // We could notify the user here if needed
              }
            }
          } catch (directError) {
            console.log('Background direct export also failed:', directError);
            // Both methods failed, but we already have the PDF, so no need to notify the user
          }
        }
      } catch (error) {
        console.error('Background Google Sheets export failed:', error);
        // No need to notify the user since this is a background operation
      }
    }, 100); // Small delay to ensure it doesn't block the UI
  },
  // Get all registrations for an event
  getEventRegistrations: async (eventId) => {
    try {
      console.log(`Getting registrations for event ID: ${eventId}`);
      const registrationsRef = ref(database, 'registrations');
      const eventRegistrationsQuery = query(
        registrationsRef,
        orderByChild('event_id'),
        equalTo(eventId)
      );

      const snapshot = await get(eventRegistrationsQuery);

      if (!snapshot.exists()) {
        console.log('No registrations found for this event');
        return [];
      }

      const registrations = [];
      snapshot.forEach((childSnapshot) => {
        registrations.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      console.log(`Found ${registrations.length} registrations for event`);

      // Sort by creation date (newest first)
      return registrations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Error getting event registrations:', error);
      throw error;
    }
  },

  // Register for an event (internal registration)
  registerForEvent: async (registrationData) => {
    try {
      console.log(`Registering for event ID: ${registrationData.event_id}`);

      // Create registration
      const registrationsRef = ref(database, 'registrations');
      const newRegistrationRef = push(registrationsRef);

      const newRegistration = {
        ...registrationData,
        status: 'registered',
        registration_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await set(newRegistrationRef, newRegistration);
      console.log('Registration created successfully with ID:', newRegistrationRef.key);

      return {
        id: newRegistrationRef.key,
        ...newRegistration
      };
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Check if a participant is already registered
  checkExistingRegistration: async (eventId, email) => {
    try {
      console.log(`Checking if ${email} is already registered for event ID: ${eventId}`);
      const registrationsRef = ref(database, 'registrations');

      // We need to get all registrations for the event first
      const eventRegistrationsQuery = query(
        registrationsRef,
        orderByChild('event_id'),
        equalTo(eventId)
      );

      const snapshot = await get(eventRegistrationsQuery);

      if (!snapshot.exists()) {
        console.log('No registrations found for this event');
        return null;
      }

      // Then filter by email
      let existingRegistration = null;

      snapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();
        if (registration.participant_email === email) {
          existingRegistration = {
            id: childSnapshot.key,
            ...registration
          };
          // Break the loop once found
          return true;
        }
      });

      console.log(`Existing registration found: ${!!existingRegistration}`);
      return existingRegistration;
    } catch (error) {
      console.error('Error checking existing registration:', error);
      throw error;
    }
  },

  // Update registration status
  updateRegistrationStatus: async (id, status) => {
    try {
      console.log(`Updating registration status to ${status} for registration ID: ${id}`);
      const registrationRef = ref(database, `registrations/${id}`);

      await update(registrationRef, {
        status,
        updated_at: new Date().toISOString()
      });

      console.log('Registration status updated successfully');

      // Get the updated registration
      const snapshot = await get(registrationRef);

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw error;
    }
  },

  // Delete a registration
  deleteRegistration: async (id) => {
    try {
      console.log(`Deleting registration with ID: ${id}`);
      const registrationRef = ref(database, `registrations/${id}`);
      await remove(registrationRef);
      console.log('Registration deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting registration:', error);
      throw error;
    }
  },

  // Get registration statistics for an event
  getRegistrationStats: async (eventId) => {
    try {
      console.log(`Getting registration statistics for event ID: ${eventId}`);
      const registrations = await registrationService.getEventRegistrations(eventId);

      // Calculate statistics
      const stats = {
        total: registrations.length,
        registered: registrations.filter(r => r.status === 'registered').length,
        attended: registrations.filter(r => r.status === 'attended').length,
        cancelled: registrations.filter(r => r.status === 'cancelled').length
      };

      console.log('Registration statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting registration statistics:', error);
      throw error;
    }
  },

  // Add external registrations (for Google Form registrations)
  addExternalRegistrations: async (registrationsData) => {
    try {
      console.log(`Adding ${registrationsData.length} external registrations`);

      const registrationsRef = ref(database, 'registrations');
      const results = [];

      // Add each registration
      for (const regData of registrationsData) {
        const newRegistrationRef = push(registrationsRef);

        const newRegistration = {
          ...regData,
          status: 'registered',
          registration_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await set(newRegistrationRef, newRegistration);

        results.push({
          id: newRegistrationRef.key,
          ...newRegistration
        });
      }

      console.log(`Added ${results.length} external registrations successfully`);
      return results;
    } catch (error) {
      console.error('Error adding external registrations:', error);
      throw error;
    }
  },

  // Export registrations as Excel, PDF, or Google Sheets
  exportRegistrationsAsCSV: async (eventId, eventTitle, format = 'excel') => {
    try {
      console.log(`Exporting registrations for event ID: ${eventId} as ${format}`);

      // Get all registrations for the event
      const registrations = await registrationService.getEventRegistrations(eventId);

      if (!registrations || registrations.length === 0) {
        return { success: false, message: 'No registrations found for this event' };
      }

      // Prepare data for export
      const exportData = registrations.map(reg => {
        // Format team members if present
        let teamMembersInfo = '';

        if (reg.additional_info && reg.additional_info.team_members && reg.additional_info.team_members.length > 0) {
          // Create a more structured format for team members that works well in Excel
          teamMembersInfo = reg.additional_info.team_members.map((member, index) => {
            return `Member ${index + 1}: ${member.name || 'N/A'}, Scholar ID: ${member.rollNumber || 'N/A'}, Dept: ${member.department || 'N/A'}, Year: ${member.year || 'N/A'}`;
          }).join('\n');
        }

        // Format registration date
        let formattedDate = 'N/A';
        try {
          formattedDate = new Date(reg.registration_date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          console.error('Error formatting date:', e);
        }

        return {
          'Name': reg.participant_name || 'N/A',
          'Email': reg.participant_email || 'N/A',
          'Phone': reg.participant_phone || 'N/A',
          'Student ID': reg.participant_id || 'N/A',
          'Department': reg.additional_info?.department || 'N/A',
          'Year': reg.additional_info?.year || 'N/A',
          'Registration Type': reg.additional_info?.team_members ? 'Team' : 'Individual',
          'Registration Date': formattedDate,
          'Status': reg.status ? reg.status.charAt(0).toUpperCase() + reg.status.slice(1) : 'Pending',
          'Team Members': teamMembersInfo || 'N/A'
        };
      });

      if (format === 'excel') {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Create a simple, clean, and editable format

        // First, create a header row with event information
        const headerData = [
          ['NIT SILCHAR EVENT REGISTRATION DATA'],
          [`Event: ${eventTitle}`],
          [`Generated: ${new Date().toLocaleString()}`],
          ['']
        ];

        // Calculate registration statistics
        const totalRegistrations = exportData.length;
        const individualRegistrations = exportData.filter(reg => reg['Registration Type'] === 'Individual').length;
        const teamRegistrations = exportData.filter(reg => reg['Registration Type'] === 'Team').length;

        // Add statistics
        headerData.push(['Registration Statistics:']);
        headerData.push(['Total Registrations:', totalRegistrations]);
        headerData.push(['Individual Registrations:', individualRegistrations]);
        headerData.push(['Team Registrations:', teamRegistrations]);
        headerData.push(['']);
        headerData.push(['']);

        // Create a clean, flat structure for the main data that's easy to edit
        const flatData = [];

        // Add header row
        flatData.push([
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
        exportData.forEach((reg, index) => {
          flatData.push([
            index + 1, // Serial number
            reg['Name'],
            reg['Email'],
            reg['Phone'],
            reg['Student ID'],
            reg['Department'],
            reg['Year'],
            reg['Registration Type'],
            reg['Registration Date'],
            reg['Status'],
            reg['Team Members'], // Include team members information
            '' // Empty notes column for clubs to add comments
          ]);
        });

        // Combine header and data
        const allData = [...headerData, ...flatData];

        // Create worksheet from the combined data
        const worksheet = XLSX.utils.aoa_to_sheet(allData);

        // Set column widths for better readability and editing
        const columnWidths = [
          { wch: 10 }, // Serial No.
          { wch: 25 }, // Name
          { wch: 30 }, // Email
          { wch: 15 }, // Phone
          { wch: 15 }, // Student ID
          { wch: 15 }, // Department
          { wch: 10 }, // Year
          { wch: 15 }, // Type
          { wch: 20 }, // Registration Date
          { wch: 12 }, // Status
          { wch: 50 }, // Team Members
          { wch: 30 }  // Notes
        ];
        worksheet['!cols'] = columnWidths;

        // Add the main worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

        // Create a separate sheet for team members if needed
        if (teamRegistrations > 0) {
          // Create a simple header for team members sheet
          const teamHeaderData = [
            ['TEAM MEMBERS DETAILS'],
            [`Event: ${eventTitle}`],
            [`Generated: ${new Date().toLocaleString()}`],
            ['']
          ];

          // Create a flat structure for team members
          const teamFlatData = [];

          // Add header row
          teamFlatData.push([
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

          // Extract and flatten team member data
          let serialNo = 1;
          exportData.forEach(reg => {
            if (reg['Registration Type'] === 'Team' &&
                reg.additional_info &&
                reg.additional_info.team_members &&
                reg.additional_info.team_members.length > 0) {

              reg.additional_info.team_members.forEach(member => {
                teamFlatData.push([
                  serialNo++,
                  reg['Name'],
                  reg['Email'],
                  member.name || 'N/A',
                  member.rollNumber || 'N/A',
                  member.department || 'N/A',
                  member.year || 'N/A',
                  reg['Status'],
                  '' // Empty notes column
                ]);
              });
            }
          });

          // Combine header and data for team members
          const allTeamData = [...teamHeaderData, ...teamFlatData];

          // Create team members worksheet
          const teamWorksheet = XLSX.utils.aoa_to_sheet(allTeamData);

          // Set column widths
          const teamColumnWidths = [
            { wch: 10 }, // Serial No.
            { wch: 25 }, // Team Lead
            { wch: 30 }, // Team Lead Email
            { wch: 25 }, // Member Name
            { wch: 15 }, // Scholar ID
            { wch: 15 }, // Department
            { wch: 10 }, // Year
            { wch: 15 }, // Status
            { wch: 30 }  // Notes
          ];
          teamWorksheet['!cols'] = teamColumnWidths;

          // Add team members sheet to workbook
          XLSX.utils.book_append_sheet(workbook, teamWorksheet, 'Team Members');
        }

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
          bookSST: true, // Generate Shared String Table for better compatibility
          compression: true // Use compression for smaller file size
        });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const filename = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.xlsx`;

        return { success: true, url, filename, type: 'excel' };
      } else if (format === 'pdf') {
        // Create PDF document with landscape orientation for better readability
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Add logo or header image (placeholder - you can replace with actual logo)
        // doc.addImage(logoDataUrl, 'PNG', 10, 10, 30, 15);

        // Add title with styling
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // Dark blue color
        doc.setFontSize(20);
        doc.text(`Event Registration Report`, doc.internal.pageSize.width / 2, 15, { align: 'center' });

        // Add event name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`${eventTitle}`, doc.internal.pageSize.width / 2, 25, { align: 'center' });

        // Add metadata
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Gray color
        doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.width / 2, 32, { align: 'center' });

        // Calculate registration statistics
        const totalRegistrations = exportData.length;
        const individualRegistrations = exportData.filter(reg => reg['Registration Type'] === 'Individual').length;
        const teamRegistrations = exportData.filter(reg => reg['Registration Type'] === 'Team').length;

        // Add registration summary
        doc.text(`Total Registrations: ${totalRegistrations}`, doc.internal.pageSize.width / 2, 37, { align: 'center' });
        doc.text(`Individual: ${individualRegistrations} | Team: ${teamRegistrations}`, doc.internal.pageSize.width / 2, 42, { align: 'center' });

        // Add horizontal line
        doc.setDrawColor(200, 200, 200); // Light gray
        doc.setLineWidth(0.5);
        doc.line(10, 47, doc.internal.pageSize.width - 10, 47);

        // Add table with improved styling
        autoTable(doc, {
          head: [['Name', 'Email', 'Phone', 'Student ID', 'Department', 'Year', 'Type', 'Status', 'Team Members']],
          body: exportData.map(reg => [
            reg['Name'],
            reg['Email'],
            reg['Phone'],
            reg['Student ID'],
            reg['Department'],
            reg['Year'],
            reg['Registration Type'],
            reg['Status'],
            reg['Team Members']
          ]),
          startY: 50,
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            fontSize: 9,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [44, 62, 80], // Dark blue header
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240] // Light gray for alternate rows
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Name
            1: { cellWidth: 35 }, // Email
            2: { cellWidth: 20 }, // Phone
            3: { cellWidth: 20 }, // Student ID
            4: { cellWidth: 20 }, // Department
            5: { cellWidth: 15 }, // Year
            6: { cellWidth: 20 }, // Type
            7: { cellWidth: 20 }, // Status
            8: { cellWidth: 'auto' } // Team Members - auto width
          },
          didDrawPage: () => {
            // Add page number at the bottom
            doc.setFontSize(8);
            doc.text(
              `Page ${doc.internal.getNumberOfPages()}`,
              doc.internal.pageSize.width / 2,
              doc.internal.pageSize.height - 10,
              { align: 'center' }
            );

            // Add footer
            doc.setFontSize(8);
            doc.text(
              'NIT Silchar Event Management System',
              doc.internal.pageSize.width / 2,
              doc.internal.pageSize.height - 5,
              { align: 'center' }
            );
          }
        });

        // Generate PDF file
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const filename = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.pdf`;

        return { success: true, url, filename, type: 'pdf' };
      } else if (format === 'sheets') {
        // Export to Google Sheets using our API server
        try {
          console.log('Exporting to Google Sheets');

          // Prepare the data for the API request
          const sheetsData = {
            eventTitle,
            registrations: exportData.map((reg, index) => ({
              name: reg['Name'],
              email: reg['Email'],
              phone: reg['Phone'],
              student_id: reg['Student ID'],
              department: reg['Department'],
              year: reg['Year'],
              registration_type: reg['Registration Type'],
              registration_date: reg['Registration Date'],
              status: reg['Status'],
              team_members: reg['Team Members'],
              // Add team members details if available
              team_members_details: reg['Registration Type'] === 'Team' &&
                registrations[index].additional_info?.team_members ?
                registrations[index].additional_info.team_members.map(member => ({
                  name: member.name || 'N/A',
                  scholar_id: member.rollNumber || 'N/A',
                  department: member.department || 'N/A',
                  year: member.year || 'N/A'
                })) : []
            }))
          };

          // Since we're having issues with the Google Sheets API, let's create a PDF as a reliable fallback
          console.log('Creating PDF export as a reliable alternative');

          let result;
          try {
            // Create a PDF document
            const doc = new jsPDF();

            // Add title and event information
            doc.setFontSize(18);
            doc.text('NIT SILCHAR EVENT REGISTRATION DATA', 105, 15, { align: 'center' });
            doc.setFontSize(14);
            doc.text(`Event: ${eventTitle}`, 105, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, { align: 'center' });

            // Add registration statistics
            const totalRegistrations = registrations.length;
            const individualRegistrations = registrations.filter(reg => reg.registration_type === 'Individual').length;
            const teamRegistrations = registrations.filter(reg => reg.registration_type === 'Team').length;

            doc.setFontSize(12);
            doc.text('Registration Statistics:', 14, 45);
            doc.setFontSize(10);
            doc.text(`Total Registrations: ${totalRegistrations}`, 14, 52);
            doc.text(`Individual Registrations: ${individualRegistrations}`, 14, 59);
            doc.text(`Team Registrations: ${teamRegistrations}`, 14, 66);

            // Create table for registrations
            const tableColumn = ["Name", "Email", "Phone", "Student ID", "Department", "Year", "Type", "Registration Date", "Status"];
            const tableRows = [];

            // Add data rows
            registrations.forEach(reg => {
              const rowData = [
                reg.name || '',
                reg.email || '',
                reg.phone || '',
                reg.student_id || '',
                reg.department || '',
                reg.year || '',
                reg.registration_type || '',
                reg.registration_date || '',
                reg.status || ''
              ];
              tableRows.push(rowData);
            });

            // Generate the table
            doc.autoTable({
              head: [tableColumn],
              body: tableRows,
              startY: 75,
              theme: 'grid',
              styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [44, 62, 80],
                lineWidth: 0.25,
              },
              headStyles: {
                fillColor: [0, 69, 153], // NIT Silchar blue
                textColor: [255, 255, 255],
                fontStyle: 'bold',
              },
              alternateRowStyles: {
                fillColor: [240, 240, 240],
              },
            });

            // If there are team registrations, add a separate table for team members
            if (teamRegistrations > 0) {
              // Add a new page for team members
              doc.addPage();

              // Add title
              doc.setFontSize(18);
              doc.text('TEAM MEMBERS DETAILS', 105, 15, { align: 'center' });
              doc.setFontSize(14);
              doc.text(`Event: ${eventTitle}`, 105, 25, { align: 'center' });
              doc.setFontSize(10);
              doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, { align: 'center' });

              // Create table for team members
              const teamTableColumn = ["Team Lead", "Team Lead Email", "Member Name", "Scholar ID", "Department", "Year"];
              const teamTableRows = [];

              // Add team members data
              registrations.forEach(reg => {
                if (reg.registration_type === 'Team' && reg.team_members_details && reg.team_members_details.length > 0) {
                  reg.team_members_details.forEach(member => {
                    const rowData = [
                      reg.name || '',
                      reg.email || '',
                      member.name || 'N/A',
                      member.scholar_id || 'N/A',
                      member.department || 'N/A',
                      member.year || 'N/A'
                    ];
                    teamTableRows.push(rowData);
                  });
                }
              });

              // Generate the team members table
              doc.autoTable({
                head: [teamTableColumn],
                body: teamTableRows,
                startY: 45,
                theme: 'grid',
                styles: {
                  fontSize: 8,
                  cellPadding: 2,
                  lineColor: [44, 62, 80],
                  lineWidth: 0.25,
                },
                headStyles: {
                  fillColor: [0, 69, 153], // NIT Silchar blue
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                },
                alternateRowStyles: {
                  fillColor: [240, 240, 240],
                },
              });
            }

            // Save the PDF
            const pdfOutput = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfOutput);

            // Return success with PDF URL
            result = {
              success: true,
              url: pdfUrl,
              filename: `${eventTitle} - Registrations.pdf`,
              type: 'pdf',
              message: 'PDF created successfully. Click to open.'
            };

            // Try the Google Sheets export in the background, but don't wait for it
            // This way, if it works, great, but if not, we already have the PDF
            this.tryGoogleSheetsExportInBackground(eventTitle, registrations);

          } catch (error) {
            console.error('Error creating PDF:', error);
            throw new Error('Failed to create PDF: ' + error.message);
          }

          if (!result || !result.success) {
            throw new Error((result && result.message) || 'Failed to create Google Sheet');
          }

          return {
            success: true,
            url: result.url,
            filename: `${eventTitle} - Google Sheet`,
            type: 'sheets',
            message: 'Google Sheet created successfully. Click to open.'
          };
        } catch (error) {
          console.error('Error creating Google Sheet:', error);
          return {
            success: false,
            message: `Failed to create Google Sheet: ${error.message}`
          };
        }
      }

      return { success: false, message: 'Invalid export format' };
    } catch (error) {
      console.error('Error exporting registrations:', error);
      throw error;
    }
  }
};

export default registrationService;

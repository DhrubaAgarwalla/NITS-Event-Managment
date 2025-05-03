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
        try {
          console.log('Creating professional Excel file with styling');

          // Create a new workbook
          const workbook = XLSX.utils.book_new();

          // ===== MAIN REGISTRATIONS SHEET =====

          // Create a header section with event information
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

          // Create data structure for the main registrations
          const mainData = [];

          // Add header row
          mainData.push([
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
            'Notes'
          ]);

          // Add data rows
          exportData.forEach((reg, index) => {
            mainData.push([
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
              '' // Empty notes column for clubs to add comments
            ]);
          });

          // Combine header and data
          const allMainData = [...headerData, ...mainData];

          // Create worksheet from the combined data
          const mainWorksheet = XLSX.utils.aoa_to_sheet(allMainData);

          // Add styling to the main worksheet
          // Create a style cache to store cell styles
          if (!mainWorksheet.s) mainWorksheet.s = {};

          // Helper function to apply bold style to a cell
          const applyMainBoldStyle = (cellRef) => {
            mainWorksheet.s[cellRef] = {
              font: { bold: true },
              alignment: { horizontal: 'center' }
            };
          };

          // Helper function to apply header style to a cell
          const applyMainHeaderStyle = (cellRef) => {
            mainWorksheet.s[cellRef] = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: 'center' }
            };
          };

          // Apply styles to title and headers
          applyMainHeaderStyle('A1');
          applyMainBoldStyle('A2');
          applyMainBoldStyle('A3');

          // Apply styles to the statistics section
          applyMainBoldStyle('A5');
          applyMainBoldStyle('A6');
          applyMainBoldStyle('A7');
          applyMainBoldStyle('A8');

          // Find the header row index (where "Serial No." is)
          const headerRowIndex = allMainData.findIndex(row =>
            row.length > 0 && row[0] === 'Serial No.'
          );

          if (headerRowIndex > 0) {
            // Apply header styles to all columns in the header row
            const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
            headerCols.forEach(col => {
              const cellRef = `${col}${headerRowIndex + 1}`;
              mainWorksheet.s[cellRef] = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "5B9BD5" } },
                alignment: { horizontal: 'center' },
                border: {
                  top: { style: 'thin', color: { rgb: "000000" } },
                  bottom: { style: 'thin', color: { rgb: "000000" } },
                  left: { style: 'thin', color: { rgb: "000000" } },
                  right: { style: 'thin', color: { rgb: "000000" } }
                }
              };
            });

            // Apply alternating row colors to data rows
            for (let i = headerRowIndex + 1; i < allMainData.length; i++) {
              const rowColor = i % 2 === 0 ? "F2F2F2" : "FFFFFF";
              headerCols.forEach(col => {
                const cellRef = `${col}${i + 1}`;
                mainWorksheet.s[cellRef] = {
                  fill: { fgColor: { rgb: rowColor } },
                  border: {
                    top: { style: 'thin', color: { rgb: "D0D0D0" } },
                    bottom: { style: 'thin', color: { rgb: "D0D0D0" } },
                    left: { style: 'thin', color: { rgb: "D0D0D0" } },
                    right: { style: 'thin', color: { rgb: "D0D0D0" } }
                  }
                };
              });
            }
          }

          // Add a comment to the first cell to make it more noticeable
          if (!mainWorksheet.comments) mainWorksheet.comments = {};
          mainWorksheet.comments['A1'] = {
            author: 'NIT Silchar',
            text: 'Registration Data for ' + eventTitle
          };

          // Set column widths for better readability
          const mainColumnWidths = [
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
            { wch: 30 }  // Notes
          ];
          mainWorksheet['!cols'] = mainColumnWidths;

          // Add styling to the main worksheet (as much as XLSX allows)
          // Style the title row
          mainWorksheet['!merges'] = [
            // Merge cells for the title (A1:K1)
            {s: {r: 0, c: 0}, e: {r: 0, c: 10}},
            // Merge cells for the event name (A2:K2)
            {s: {r: 1, c: 0}, e: {r: 1, c: 10}},
            // Merge cells for the generation date (A3:K3)
            {s: {r: 2, c: 0}, e: {r: 2, c: 10}},
            // Merge cells for the empty row (A4:K4)
            {s: {r: 3, c: 0}, e: {r: 3, c: 10}},
            // Merge cells for "Registration Statistics:" (A5:K5)
            {s: {r: 4, c: 0}, e: {r: 4, c: 10}}
          ];

          // Add the main worksheet to the workbook
          XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Registrations');

          // ===== TEAM MEMBERS SHEET =====

          // Create a separate sheet for team members
          // Always create the team members sheet, even if there are no team registrations
          {
            // Create a header for team members sheet with color styling
            const teamHeaderData = [
              ['TEAM MEMBERS DETAILS'],
              [`Event: ${eventTitle}`],
              [`Generated: ${new Date().toLocaleString()}`],
              ['']
            ];

            // Add color styling to header cells (this will be applied when opened in Excel)
            // Note: XLSX.js has limited styling capabilities, but we can add some basic styling

            // Create data structure for team members
            const teamData = [];

            // Add header row
            teamData.push([
              'Serial No.',
              'Team Name',
              'Team Lead',
              'Team Lead Email',
              'Team Lead Phone',
              'Member Name',
              'Scholar ID',
              'Department',
              'Year',
              'Notes'
            ]);

            // Extract and organize team member data

            // Debug the registrations data
            console.log('All registrations count:', registrations.length);

            // Log team registrations (case-insensitive)
            const teamRegs = registrations.filter(reg =>
              (reg.registration_type && reg.registration_type.toLowerCase() === 'team') ||
              (reg.additional_info && reg.additional_info.team_members && reg.additional_info.team_members.length > 0)
            );
            console.log('Team registrations count:', teamRegs.length);

            // Detailed logging of team data structure
            if (teamRegs.length > 0) {
              console.log('First team registration data structure:', JSON.stringify(teamRegs[0], null, 2));

              // Check team members structure
              if (teamRegs[0].additional_info && teamRegs[0].additional_info.team_members) {
                console.log('Team members array:', teamRegs[0].additional_info.team_members);
              } else {
                console.log('No team_members found in the first team registration');
              }
            } else {
              console.log('No team registrations found');
            }

            // Group registrations by team for better organization
            const teamGroups = [];

            // Process each registration and group by team
            registrations.forEach(reg => {
              // Check for team registrations using multiple possible formats (case-insensitive)
              const isTeam =
                (reg.registration_type && reg.registration_type.toLowerCase() === 'team') ||
                (reg.additional_info && reg.additional_info.team_members && reg.additional_info.team_members.length > 0);

              // Log each team registration for debugging
              if (isTeam) {
                console.log(`Processing team registration for: ${reg.participant_name}`);
              }

              if (isTeam) {
                // Get team name (with fallback)
                const teamName = reg.additional_info?.team_name || `Team ${reg.participant_name || 'Unknown'}`;
                const teamMembers = [];

                // Check if team_members exists and is an array
                if (reg.additional_info && reg.additional_info.team_members && Array.isArray(reg.additional_info.team_members)) {
                  // Process each team member
                  reg.additional_info.team_members.forEach(member => {
                    // Ensure member is an object
                    if (member && typeof member === 'object') {
                      teamMembers.push({
                        teamName,
                        teamLead: reg.participant_name || reg.Name || 'N/A',
                        teamLeadEmail: reg.participant_email || reg.Email || 'N/A',
                        teamLeadPhone: reg.participant_phone || reg.Phone || 'N/A',
                        memberName: member.name || 'N/A',
                        scholarId: member.rollNumber || member.scholarId || member.scholar_id || 'N/A',
                        department: member.department || member.dept || 'N/A',
                        year: member.year || member.yr || 'N/A',
                        notes: '' // Empty notes column
                      });
                    } else {
                      console.log('Invalid team member data:', member);
                    }
                  });
                } else {
                  // If no valid team members array, add a placeholder for the team
                  console.log('Team registration without valid team_members array:', reg.participant_name);
                  teamMembers.push({
                    teamName,
                    teamLead: reg.participant_name || 'N/A',
                    teamLeadEmail: reg.participant_email || 'N/A',
                    teamLeadPhone: reg.participant_phone || 'N/A',
                    memberName: 'No member data',
                    scholarId: 'N/A',
                    department: 'N/A',
                    year: 'N/A',
                    notes: 'Team registration without member details'
                  });
                }

                // Add this team to our groups
                if (teamMembers.length > 0) {
                  teamGroups.push({
                    teamName,
                    teamLead: reg.participant_name || 'N/A',
                    members: teamMembers
                  });
                }
              }
            });

            // Now add all teams to the teamData array with gaps between teams

            teamGroups.forEach((team, index) => {
              // Add a visual separator between teams (except for the first team)
              if (index > 0) {
                teamData.push([
                  '', '', '', '', '', '', '', '', '', ''
                ]);
              }

              // Add a team header/identifier row
              teamData.push([
                `Team ${index + 1}`,
                team.teamName,
                team.teamLead,
                '', '', '', '', '', '', ''
              ]);

              // Add team members with member number instead of continuous serial
              team.members.forEach((member, memberIndex) => {
                teamData.push([
                  `${index + 1}.${memberIndex + 1}`, // Format: TeamNumber.MemberNumber
                  member.teamName,
                  member.teamLead,
                  member.teamLeadEmail,
                  member.teamLeadPhone,
                  member.memberName,
                  member.scholarId || member.rollNumber || member.scholar_id || 'N/A',
                  member.department || member.dept || 'N/A',
                  member.year || member.yr || 'N/A',
                  member.notes
                ]);
              });

              // We don't need a separator here anymore since we add one before each team
            });

            // If no team members were found, add a placeholder row
            console.log('Team data rows:', teamData.length);
            if (teamData.length <= 1) { // No data rows or only header row exists
              // Add a team header
              teamData.push([
                'Team 1',
                'No team data available',
                'N/A',
                '', '', '', '', '', '', ''
              ]);

              // Add a placeholder member
              teamData.push([
                '1.1',
                'No team data available',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'No team registrations found'
              ]);
            }

            // Combine header and data for team members
            const allTeamData = [...teamHeaderData, ...teamData];

            // Create team members worksheet
            const teamWorksheet = XLSX.utils.aoa_to_sheet(allTeamData);

            // Add styling to the team members worksheet
            // Create a style cache to store cell styles
            if (!teamWorksheet.s) teamWorksheet.s = {};

            // Helper function to apply bold style to a cell
            const applyTeamBoldStyle = (cellRef) => {
              teamWorksheet.s[cellRef] = {
                font: { bold: true },
                alignment: { horizontal: 'center' }
              };
            };

            // Helper function to apply header style to a cell
            const applyTeamHeaderStyle = (cellRef) => {
              teamWorksheet.s[cellRef] = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: 'center' }
              };
            };

            // Helper function to apply team separator style
            const applyTeamSeparatorStyle = (cellRef) => {
              teamWorksheet.s[cellRef] = {
                fill: { fgColor: { rgb: "E6E6E6" } }
              };
            };

            // Helper function to apply team header style
            const applyTeamNameStyle = (cellRef) => {
              teamWorksheet.s[cellRef] = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "70AD47" } },
                alignment: { horizontal: 'center' }
              };
            };

            // Apply styles to title and headers
            applyTeamHeaderStyle('A1');
            applyTeamBoldStyle('A2');
            applyTeamBoldStyle('A3');

            // Find the header row index (where "Serial No." is)
            const teamHeaderRowIndex = allTeamData.findIndex(row =>
              row.length > 0 && row[0] === 'Serial No.'
            );

            if (teamHeaderRowIndex > 0) {
              // Apply header styles to all columns in the header row
              const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
              headerCols.forEach(col => {
                const cellRef = `${col}${teamHeaderRowIndex + 1}`;
                teamWorksheet.s[cellRef] = {
                  font: { bold: true, color: { rgb: "FFFFFF" } },
                  fill: { fgColor: { rgb: "5B9BD5" } },
                  alignment: { horizontal: 'center' },
                  border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } }
                  }
                };
              });

              // Apply styles to data rows
              for (let i = teamHeaderRowIndex + 1; i < allTeamData.length; i++) {
                const row = allTeamData[i];

                // Check if this is a team header row (starts with "Team X")
                if (row[0] && typeof row[0] === 'string' && row[0].startsWith('Team ')) {
                  // Apply team header style
                  headerCols.forEach(col => {
                    const cellRef = `${col}${i + 1}`;
                    applyTeamNameStyle(cellRef);
                  });
                }
                // Check if this is an empty separator row
                else if (row.length === 0 || (row.length === 1 && row[0] === '')) {
                  // Apply separator style
                  headerCols.forEach(col => {
                    const cellRef = `${col}${i + 1}`;
                    applyTeamSeparatorStyle(cellRef);
                  });
                }
                // Regular data row
                else {
                  // Apply alternating row colors
                  const rowColor = i % 2 === 0 ? "F2F2F2" : "FFFFFF";
                  headerCols.forEach(col => {
                    const cellRef = `${col}${i + 1}`;
                    teamWorksheet.s[cellRef] = {
                      fill: { fgColor: { rgb: rowColor } },
                      border: {
                        top: { style: 'thin', color: { rgb: "D0D0D0" } },
                        bottom: { style: 'thin', color: { rgb: "D0D0D0" } },
                        left: { style: 'thin', color: { rgb: "D0D0D0" } },
                        right: { style: 'thin', color: { rgb: "D0D0D0" } }
                      }
                    };
                  });

                  // Make serial number bold
                  applyTeamBoldStyle(`A${i + 1}`);
                }
              }
            }

            // Add a comment to the first cell to make it more noticeable
            if (!teamWorksheet.comments) teamWorksheet.comments = {};
            teamWorksheet.comments['A1'] = {
              author: 'NIT Silchar',
              text: 'Team Members Details for ' + eventTitle
            };

            // Set column widths
            const teamColumnWidths = [
              { wch: 10 }, // Serial No.
              { wch: 20 }, // Team Name
              { wch: 25 }, // Team Lead
              { wch: 30 }, // Team Lead Email
              { wch: 15 }, // Team Lead Phone
              { wch: 25 }, // Member Name
              { wch: 15 }, // Scholar ID
              { wch: 15 }, // Department
              { wch: 10 }, // Year
              { wch: 30 }  // Notes
            ];
            teamWorksheet['!cols'] = teamColumnWidths;

            // Add styling to the team worksheet
            teamWorksheet['!merges'] = [
              // Merge cells for the title (A1:J1)
              {s: {r: 0, c: 0}, e: {r: 0, c: 9}},
              // Merge cells for the event name (A2:J2)
              {s: {r: 1, c: 0}, e: {r: 1, c: 9}},
              // Merge cells for the generation date (A3:J3)
              {s: {r: 2, c: 0}, e: {r: 2, c: 9}},
              // Merge cells for the empty row (A4:J4)
              {s: {r: 3, c: 0}, e: {r: 3, c: 9}}
            ];

            // Add the team members worksheet to the workbook
            XLSX.utils.book_append_sheet(workbook, teamWorksheet, 'Team Members');
          }

          // ===== SUMMARY DASHBOARD SHEET =====

          // Create a simplified dashboard/summary sheet with only the requested sections
          const dashboardData = [
            ['EVENT REGISTRATION DASHBOARD'],
            [`Event: ${eventTitle}`],
            [`Generated: ${new Date().toLocaleString()}`],
            [''],
            ['PARTICIPANT SUMMARY'],
            ['']
          ];

          // Count total participants (including team members)
          let totalTeamMembers = 0;
          let allTeamMemberDepts = {};
          let allTeamMemberYears = {};

          console.log('Starting team member counting...');

          // Process all registrations to count team members - use case-insensitive check
          registrations.forEach(reg => {
            // Check if this is a team registration with members (case-insensitive)
            const isTeam =
              // Check registration_type field (case-insensitive)
              (reg.registration_type && typeof reg.registration_type === 'string' &&
               reg.registration_type.toLowerCase().includes('team')) ||

              // Check Registration Type field from exportData (case-insensitive)
              (reg['Registration Type'] && typeof reg['Registration Type'] === 'string' &&
               reg['Registration Type'].toLowerCase().includes('team')) ||

              // Check for team_members array
              (reg.additional_info && reg.additional_info.team_members &&
               Array.isArray(reg.additional_info.team_members) &&
               reg.additional_info.team_members.length > 0) ||

              // Check for team_name field
              (reg.additional_info && reg.additional_info.team_name);

            // Process team members if this is a team registration
            if (isTeam) {
              console.log(`Processing team registration for: ${reg.participant_name || reg.Name || 'Unknown'}`);

              // Check for team members in additional_info
              if (reg.additional_info && reg.additional_info.team_members &&
                  Array.isArray(reg.additional_info.team_members) &&
                  reg.additional_info.team_members.length > 0) {

                // Count team members
                const memberCount = reg.additional_info.team_members.length;
                totalTeamMembers += memberCount;

                // Count departments and years for team members
                reg.additional_info.team_members.forEach(member => {
                  // Count department (handle different field names)
                  const dept = member.department || member.dept || 'Unknown';
                  allTeamMemberDepts[dept] = (allTeamMemberDepts[dept] || 0) + 1;

                  // Count year (handle different field names)
                  const year = member.year || member.yr || 'Unknown';
                  allTeamMemberYears[year] = (allTeamMemberYears[year] || 0) + 1;
                });
              }
              // Check for team members in Team Members field (string format)
              else if (reg['Team Members'] && typeof reg['Team Members'] === 'string') {
                const teamMembersStr = reg['Team Members'];

                // Count approximate number of members based on "Member X:" occurrences
                const memberMatches = teamMembersStr.match(/Member \d+:/g);
                const memberCount = memberMatches ? memberMatches.length : 0;

                if (memberCount > 0) {
                  totalTeamMembers += memberCount;

                  // Try to extract departments
                  const deptMatches = teamMembersStr.match(/Dept: ([A-Za-z]+)/g);
                  if (deptMatches) {
                    deptMatches.forEach(match => {
                      const dept = match.replace('Dept: ', '');
                      allTeamMemberDepts[dept] = (allTeamMemberDepts[dept] || 0) + 1;
                    });
                  }

                  // Try to extract years
                  const yearMatches = teamMembersStr.match(/Year: ([1-5])/g);
                  if (yearMatches) {
                    yearMatches.forEach(match => {
                      const year = match.replace('Year: ', '');
                      allTeamMemberYears[year] = (allTeamMemberYears[year] || 0) + 1;
                    });
                  }
                }
              }
            }
          });

          // Calculate total participants correctly
          // Total participants = Individual registrations + Team leads + Team members
          const totalParticipants = individualRegistrations + teamRegistrations + totalTeamMembers;

          // Add total participant count to dashboard
          dashboardData.push(['Total Participants:', totalParticipants]);
          dashboardData.push(['']);

          // Calculate department distribution for registrants
          const departmentCounts = {};
          exportData.forEach(reg => {
            const dept = reg['Department'] || 'Unknown';
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
          });

          // Combined department distribution
          dashboardData.push(['DEPARTMENT DISTRIBUTION (ALL PARTICIPANTS)']);
          dashboardData.push(['']);

          // Combine department counts
          const combinedDeptCounts = {...departmentCounts};
          Object.entries(allTeamMemberDepts).forEach(([dept, count]) => {
            combinedDeptCounts[dept] = (combinedDeptCounts[dept] || 0) + count;
          });

          // Add combined department distribution
          Object.entries(combinedDeptCounts).forEach(([dept, count]) => {
            // Calculate percentage safely (avoid division by zero)
            const percentage = totalParticipants > 0 ? (count / totalParticipants * 100).toFixed(1) : '0.0';
            dashboardData.push([dept, `${count} (${percentage}%)`]);
          });

          // Combined year distribution
          dashboardData.push(['']);
          dashboardData.push(['YEAR DISTRIBUTION (ALL PARTICIPANTS)']);
          dashboardData.push(['']);

          // Calculate year distribution for registrants
          const yearCounts = {};
          exportData.forEach(reg => {
            const year = reg['Year'] || 'Unknown';
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          });

          // Combine year counts
          const combinedYearCounts = {...yearCounts};
          Object.entries(allTeamMemberYears).forEach(([year, count]) => {
            combinedYearCounts[year] = (combinedYearCounts[year] || 0) + count;
          });

          // Add combined year distribution
          Object.entries(combinedYearCounts).forEach(([year, count]) => {
            // Calculate percentage safely (avoid division by zero)
            const percentage = totalParticipants > 0 ? (count / totalParticipants * 100).toFixed(1) : '0.0';
            dashboardData.push([year, `${count} (${percentage}%)`]);
          });

          // Create dashboard worksheet
          const dashboardWorksheet = XLSX.utils.aoa_to_sheet(dashboardData);

          // Add cell styling for the dashboard
          // XLSX.js has limited styling capabilities, but we can define some basic styles

          // Create a style cache to store cell styles
          if (!dashboardWorksheet.s) dashboardWorksheet.s = {};

          // Helper function to apply bold style to a cell
          const applyBoldStyle = (cellRef) => {
            dashboardWorksheet.s[cellRef] = {
              font: { bold: true },
              alignment: { horizontal: 'center' }
            };
          };

          // Helper function to apply header style to a cell
          const applyHeaderStyle = (cellRef) => {
            dashboardWorksheet.s[cellRef] = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4472C4" } },
              alignment: { horizontal: 'center' }
            };
          };

          // Helper function to apply section header style
          const applySectionStyle = (cellRef) => {
            dashboardWorksheet.s[cellRef] = {
              font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "44546A" } },
              alignment: { horizontal: 'center' }
            };
          };

          // Apply styles to title and headers
          applyHeaderStyle('A1');
          applyBoldStyle('A2');
          applyBoldStyle('A3');

          // Apply style to participant summary header
          applySectionStyle('A5');

          // Apply bold to total participants
          applyBoldStyle('A7');
          applyBoldStyle('B7');

          // Add some basic styling to make it more colorful
          // Note: XLSX.js has limited styling capabilities, but we can add some properties
          // that Excel will recognize when opening the file

          // Add a comment to the first cell to make it more noticeable
          if (!dashboardWorksheet.comments) dashboardWorksheet.comments = {};
          dashboardWorksheet.comments['A1'] = {
            author: 'NIT Silchar',
            text: 'Dashboard Summary for ' + eventTitle
          };

          // Add comments to highlight important statistics
          dashboardWorksheet.comments['B7'] = {
            author: 'NIT Silchar',
            text: 'Total number of participants including individual registrants, team leads, and team members'
          };

          // Add comments and styling for department distribution
          const deptHeaderIndex = dashboardData.findIndex(row =>
            row.length === 1 && row[0] === 'DEPARTMENT DISTRIBUTION (ALL PARTICIPANTS)'
          );

          if (deptHeaderIndex > 0) {
            const cellRef = `A${deptHeaderIndex + 1}`;
            // Add comment
            dashboardWorksheet.comments[cellRef] = {
              author: 'NIT Silchar',
              text: 'Distribution of all participants by department'
            };
            // Apply section header style
            applySectionStyle(cellRef);

            // Apply bold to department names and counts
            for (let i = 0; i < Object.keys(combinedDeptCounts).length; i++) {
              const rowIndex = deptHeaderIndex + 3 + i; // +3 to skip header and empty row
              applyBoldStyle(`A${rowIndex + 1}`);
            }
          }

          // Add comments and styling for year distribution
          const yearHeaderIndex = dashboardData.findIndex(row =>
            row.length === 1 && row[0] === 'YEAR DISTRIBUTION (ALL PARTICIPANTS)'
          );

          if (yearHeaderIndex > 0) {
            const cellRef = `A${yearHeaderIndex + 1}`;
            // Add comment
            dashboardWorksheet.comments[cellRef] = {
              author: 'NIT Silchar',
              text: 'Distribution of all participants by year'
            };
            // Apply section header style
            applySectionStyle(cellRef);

            // Apply bold to year numbers and counts
            for (let i = 0; i < Object.keys(combinedYearCounts).length; i++) {
              const rowIndex = yearHeaderIndex + 3 + i; // +3 to skip header and empty row
              applyBoldStyle(`A${rowIndex + 1}`);
            }
          }

          // Set column widths
          const dashboardColumnWidths = [
            { wch: 30 }, // Labels
            { wch: 15 }, // Values
          ];
          dashboardWorksheet['!cols'] = dashboardColumnWidths;

          // Add styling to the dashboard worksheet - merge all section headers
          const merges = [];

          // Helper function to add merge for a row across both columns
          const addMerge = (rowIndex) => {
            merges.push({s: {r: rowIndex, c: 0}, e: {r: rowIndex, c: 1}});
          };

          // Merge the header rows
          addMerge(0); // Title
          addMerge(1); // Event name
          addMerge(2); // Generation date
          addMerge(3); // Empty row
          addMerge(4); // PARTICIPANT SUMMARY
          addMerge(5); // Empty row

          // Find and merge all section headers and empty rows
          dashboardData.forEach((row, index) => {
            // Skip the first 6 rows which we've already handled
            if (index < 6) return;

            // If this is a section header (all caps) or empty row, merge it
            if (
              (row.length === 1 && row[0] === '') || // Empty row
              (row.length === 1 && row[0].toUpperCase() === row[0] && row[0] !== '') || // Section header
              (row.length === 2 && row[0] === '' && row[1] === '') // Empty row with two columns
            ) {
              addMerge(index);
            }
          });

          // Apply the merges
          dashboardWorksheet['!merges'] = merges;

          // Add the dashboard as the first worksheet
          XLSX.utils.book_append_sheet(workbook, dashboardWorksheet, 'Dashboard', true);

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

          return {
            success: true,
            url,
            filename,
            type: 'sheets',
            message: 'Excel file created successfully. Click to download.'
          };

        } catch (error) {
          console.error('Error creating Excel file:', error);

          // Fall back to regular Excel export if the enhanced export fails
          try {
            console.log('Falling back to simple Excel export');

            // Use the existing Excel export code
            const result = await registrationService.exportRegistrationsAsCSV(eventId, eventTitle, 'excel');

            if (result.success) {
              return {
                ...result,
                message: 'Enhanced Excel export failed. Basic Excel file created instead.'
              };
            } else {
              throw new Error('Excel fallback also failed');
            }
          } catch (fallbackError) {
            console.error('Error with Excel fallback:', fallbackError);
            return {
              success: false,
              message: `Failed to create Excel file: ${error.message}`
            };
          }
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

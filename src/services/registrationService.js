import { ref, push, set, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Registration-related database operations
const registrationService = {
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

  // Export registrations as Excel or PDF
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
          // Create a more structured format for team members
          teamMembersInfo = reg.additional_info.team_members.map((member, index) => {
            return [
              `Member ${index + 1}: ${member.name}`,
              `Scholar ID: ${member.rollNumber || 'N/A'}`,
              `Department: ${member.department || 'N/A'}`,
              `Year: ${member.year || 'N/A'}`
            ].join('\n');
          }).join('\n\n');
        }

        return {
          'Name': reg.participant_name,
          'Email': reg.participant_email,
          'Phone': reg.participant_phone || 'N/A',
          'Student ID': reg.participant_id || 'N/A',
          'Department': reg.additional_info?.department || 'N/A',
          'Year': reg.additional_info?.year || 'N/A',
          'Registration Type': reg.additional_info?.team_members ? 'Team' : 'Individual',
          'Registration Date': new Date(reg.registration_date).toLocaleString(),
          'Status': reg.status.charAt(0).toUpperCase() + reg.status.slice(1),
          'Team Members': teamMembersInfo || 'N/A'
        };
      });

      if (format === 'excel') {
        // Create Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();

        // Add event information as a header
        XLSX.utils.sheet_add_aoa(worksheet, [
          [`Event: ${eventTitle}`],
          [`Generated on: ${new Date().toLocaleString()}`],
          [''] // Empty row for spacing
        ], { origin: 'A1' });

        // Adjust column widths for better readability
        const columnWidths = [
          { wch: 25 }, // Name
          { wch: 30 }, // Email
          { wch: 15 }, // Phone
          { wch: 15 }, // Student ID
          { wch: 15 }, // Department
          { wch: 10 }, // Year
          { wch: 15 }, // Registration Type
          { wch: 20 }, // Registration Date
          { wch: 12 }, // Status
          { wch: 50 }  // Team Members
        ];
        worksheet['!cols'] = columnWidths;

        // Apply styles to header row (A4:J4)
        // Note: XLSX doesn't support direct styling, but we can prepare the data
        // for better presentation

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
          bookSST: false, // Generate Shared String Table for better compatibility
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
      }

      return { success: false, message: 'Invalid export format' };
    } catch (error) {
      console.error('Error exporting registrations:', error);
      throw error;
    }
  }
};

export default registrationService;

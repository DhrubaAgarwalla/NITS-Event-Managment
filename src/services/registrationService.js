import supabase from '../lib/supabase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Registration-related database operations
const registrationService = {
  // Get all registrations for an event
  getEventRegistrations: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Register for an event (internal registration)
  registerForEvent: async (registrationData) => {
    const { data, error } = await supabase
      .from('registrations')
      .insert([registrationData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Check if a participant is already registered
  checkExistingRegistration: async (eventId, email) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('participant_email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update registration status
  updateRegistrationStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('registrations')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete a registration
  deleteRegistration: async (id) => {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Get registration statistics for an event
  getRegistrationStats: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('status')
      .eq('event_id', eventId);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: data.length,
      registered: data.filter(r => r.status === 'registered').length,
      attended: data.filter(r => r.status === 'attended').length,
      cancelled: data.filter(r => r.status === 'cancelled').length
    };

    return stats;
  },

  // Add external registrations (for Google Form registrations)
  addExternalRegistrations: async (registrationsData) => {
    const { data, error } = await supabase
      .from('registrations')
      .insert(registrationsData)
      .select();

    if (error) throw error;
    return data;
  },

  // Export registrations as Excel or PDF
  exportRegistrationsAsCSV: async (eventId, eventTitle, format = 'excel') => {
    try {
      // Get all registrations for the event
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (regError) throw regError;

      // Get event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, categories(*), clubs(*)')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      if (!registrations || registrations.length === 0) {
        return { success: false, message: 'No registrations found for this event' };
      }

      // Format event title for filename
      const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

      // Choose export format
      if (format === 'pdf') {
        return exportAsPDF(registrations, eventData, safeEventTitle, timestamp);
      } else {
        return exportAsExcel(registrations, eventData, safeEventTitle, timestamp);
      }
    } catch (error) {
      console.error('Error exporting registrations:', error);
      return { success: false, message: error.message || 'Failed to export registrations' };
    }
  }
};

// Helper function to export registrations as Excel
const exportAsExcel = (registrations, eventData, safeEventTitle, timestamp) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Add workbook properties
    workbook.Props = {
      Title: `${eventData.title} - Registrations`,
      Subject: "Event Registrations",
      Author: "NIT Silchar Event Management",
      CreatedDate: new Date()
    };

    // Create main registrations worksheet
    const registrationsData = [];

    // Add title and metadata with merged cells
    registrationsData.push([`Event: ${eventData.title}`, `Export Date: ${new Date().toLocaleString()}`]);
    registrationsData.push([`Total Registrations: ${registrations.length}`]);
    registrationsData.push([]);

    // Add headers
    registrationsData.push([
      'Name',
      'Email',
      'Phone',
      'ID/Roll Number',
      'Department',
      'Year',
      'Team Type',
      'Status',
      'Registration Date'
    ]);

    // Add data rows
    registrations.forEach(registration => {
      registrationsData.push([
        registration.participant_name || '',
        registration.participant_email || '',
        registration.participant_phone || '',
        registration.participant_id || '',
        registration.additional_info?.department || '',
        registration.additional_info?.year || '',
        registration.additional_info?.team_type || 'individual',
        registration.status || '',
        new Date(registration.created_at).toLocaleString() || ''
      ]);
    });

    // Add summary section
    registrationsData.push([]);
    registrationsData.push([]);
    registrationsData.push(['SUMMARY']);
    registrationsData.push(['Total Registrations', registrations.length]);
    registrationsData.push([
      'Individual Registrations',
      registrations.filter(r => !r.additional_info?.team_type || r.additional_info?.team_type === 'individual').length
    ]);
    registrationsData.push([
      'Team Registrations',
      registrations.filter(r => r.additional_info?.team_type === 'team').length
    ]);

    // Create worksheet from data
    const registrationsWs = XLSX.utils.aoa_to_sheet(registrationsData);

    // Apply styling (column widths)
    const wscols = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Roll Number
      { wch: 15 }, // Department
      { wch: 10 }, // Year
      { wch: 15 }, // Team Type
      { wch: 15 }, // Status
      { wch: 25 }  // Registration Date
    ];
    registrationsWs['!cols'] = wscols;

    // Add cell merges for the title
    registrationsWs['!merges'] = [
      // Merge the title cells (A1:I1)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      // Merge the total registrations cells (A2:I2)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
    ];

    // Add cell styles
    // Title cell
    registrationsWs.A1 = {
      v: `Event: ${eventData.title} (Export Date: ${new Date().toLocaleString()})`,
      t: 's',
      s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }
    };

    // Total registrations cell
    registrationsWs.A2 = {
      v: `Total Registrations: ${registrations.length}`,
      t: 's',
      s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } }
    };

    // Header row styling
    const headerRow = 3; // 0-based index, so row 4 in Excel
    for (let i = 0; i < 9; i++) {
      const cell = XLSX.utils.encode_cell({ r: headerRow, c: i });
      if (!registrationsWs[cell]) continue;
      registrationsWs[cell].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '6E44FF' } },
        alignment: { horizontal: 'center' }
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, registrationsWs, 'Registrations');

    // Create event details worksheet
    const eventDetailsData = [];

    // Add title
    eventDetailsData.push([`Event Details: ${eventData.title}`]);
    eventDetailsData.push([]);

    // Add event information
    eventDetailsData.push(['Event ID', eventData.id]);
    eventDetailsData.push(['Event Title', eventData.title]);
    eventDetailsData.push(['Description', eventData.description || 'N/A']);
    eventDetailsData.push(['Category', eventData.categories?.name || 'N/A']);
    eventDetailsData.push(['Organizing Club', eventData.clubs?.name || 'N/A']);
    eventDetailsData.push(['Start Date', new Date(eventData.start_date).toLocaleDateString()]);
    eventDetailsData.push(['End Date', eventData.end_date ? new Date(eventData.end_date).toLocaleDateString() : 'N/A']);
    eventDetailsData.push(['Location', eventData.location || 'N/A']);
    eventDetailsData.push(['Status', eventData.status || 'N/A']);
    eventDetailsData.push(['Registration Deadline', eventData.registration_deadline ? new Date(eventData.registration_deadline).toLocaleDateString() : 'N/A']);
    eventDetailsData.push(['Max Participants', eventData.max_participants || 'Unlimited']);
    eventDetailsData.push(['Participation Type', eventData.participation_type || 'Individual']);

    if (eventData.participation_type === 'team') {
      eventDetailsData.push(['Min Team Size', eventData.min_participants || 'N/A']);
      eventDetailsData.push(['Max Team Size', eventData.max_participants || 'N/A']);
    }

    eventDetailsData.push([]);
    eventDetailsData.push(['Registration Statistics']);
    eventDetailsData.push(['Total Registrations', registrations.length]);
    eventDetailsData.push(['Individual Registrations', registrations.filter(r => !r.additional_info?.team_type || r.additional_info?.team_type === 'individual').length]);
    eventDetailsData.push(['Team Registrations', registrations.filter(r => r.additional_info?.team_type === 'team').length]);

    // Create worksheet
    const eventDetailsWs = XLSX.utils.aoa_to_sheet(eventDetailsData);

    // Apply styling
    // Title cell
    eventDetailsWs.A1 = {
      v: `Event Details: ${eventData.title}`,
      t: 's',
      s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }
    };

    // Merge title cell
    eventDetailsWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    // Set column widths
    eventDetailsWs['!cols'] = [{ wch: 25 }, { wch: 50 }];

    // Style all label cells (first column)
    for (let i = 2; i < eventDetailsData.length; i++) {
      const cell = XLSX.utils.encode_cell({ r: i, c: 0 });
      if (!eventDetailsWs[cell] || !eventDetailsWs[cell].v) continue;

      eventDetailsWs[cell].s = { font: { bold: true } };

      // Special styling for section headers
      if (eventDetailsWs[cell].v === 'Registration Statistics') {
        eventDetailsWs[cell].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: 'E6E6E6' } }
        };
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, eventDetailsWs, 'Event Details');

    // Check if we need to create a team members worksheet
    let hasTeamMembers = false;
    registrations.forEach(registration => {
      if (registration.additional_info?.team_type === 'team' &&
          registration.additional_info?.team_members &&
          registration.additional_info.team_members.length > 0) {
        hasTeamMembers = true;
      }
    });

    // If there are team members, create a team members worksheet
    if (hasTeamMembers) {
      const teamMembersData = [];

      // Add title and description
      teamMembersData.push([`Event: ${eventData.title} - Team Members`, `Export Date: ${new Date().toLocaleString()}`]);
      teamMembersData.push([]);
      teamMembersData.push(['This worksheet contains details of all team members registered for the event.']);
      teamMembersData.push([]);

      // Add headers
      teamMembersData.push([
        'Registration Email',
        'Team Leader Name',
        'Team Member Name',
        'Department',
        'Year',
        'Roll Number'
      ]);

      // Add team members data
      registrations.forEach(registration => {
        if (registration.additional_info?.team_type === 'team' &&
            registration.additional_info?.team_members &&
            registration.additional_info.team_members.length > 0) {

          registration.additional_info.team_members.forEach(member => {
            teamMembersData.push([
              registration.participant_email || '',
              registration.participant_name || '',
              member.name || '',
              member.department || '',
              member.year || '',
              member.rollNumber || ''
            ]);
          });
        }
      });

      // Add summary section
      let totalTeamMembers = 0;
      registrations.forEach(registration => {
        if (registration.additional_info?.team_members) {
          totalTeamMembers += registration.additional_info.team_members.length;
        }
      });

      teamMembersData.push([]);
      teamMembersData.push([]);
      teamMembersData.push(['SUMMARY']);
      teamMembersData.push(['Total Team Leaders', registrations.filter(r => r.additional_info?.team_type === 'team').length]);
      teamMembersData.push(['Total Team Members', totalTeamMembers]);
      teamMembersData.push(['Total Participants', registrations.filter(r => r.additional_info?.team_type === 'team').length + totalTeamMembers]);

      // Create worksheet from data
      const teamMembersWs = XLSX.utils.aoa_to_sheet(teamMembersData);

      // Apply styling (column widths)
      const tmwscols = [
        { wch: 30 }, // Registration Email
        { wch: 25 }, // Team Leader Name
        { wch: 25 }, // Team Member Name
        { wch: 20 }, // Department
        { wch: 10 }, // Year
        { wch: 15 }  // Roll Number
      ];
      teamMembersWs['!cols'] = tmwscols;

      // Add cell merges for the title
      teamMembersWs['!merges'] = [
        // Merge the title cells (A1:F1)
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        // Merge the description cells (A3:F3)
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }
      ];

      // Add cell styles
      // Title cell
      teamMembersWs.A1 = {
        v: `Event: ${eventData.title} - Team Members (Export Date: ${new Date().toLocaleString()})`,
        t: 's',
        s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }
      };

      // Description cell
      teamMembersWs.A3 = {
        v: 'This worksheet contains details of all team members registered for the event.',
        t: 's',
        s: { font: { italic: true }, alignment: { horizontal: 'center' } }
      };

      // Header row styling
      const tmHeaderRow = 4; // 0-based index, so row 5 in Excel
      for (let i = 0; i < 6; i++) {
        const cell = XLSX.utils.encode_cell({ r: tmHeaderRow, c: i });
        if (!teamMembersWs[cell]) continue;
        teamMembersWs[cell].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '6E44FF' } },
          alignment: { horizontal: 'center' }
        };
      }

      // Summary section styling
      const summaryStartRow = teamMembersData.length - 4; // Summary title row
      if (summaryStartRow > 0) {
        // Summary title
        const summaryTitleCell = XLSX.utils.encode_cell({ r: summaryStartRow, c: 0 });
        if (teamMembersWs[summaryTitleCell]) {
          teamMembersWs[summaryTitleCell].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: 'E6E6E6' } }
          };
        }

        // Summary data rows
        for (let i = 1; i <= 3; i++) {
          const labelCell = XLSX.utils.encode_cell({ r: summaryStartRow + i, c: 0 });
          const valueCell = XLSX.utils.encode_cell({ r: summaryStartRow + i, c: 1 });

          if (teamMembersWs[labelCell]) {
            teamMembersWs[labelCell].s = { font: { bold: true } };
          }

          if (teamMembersWs[valueCell]) {
            teamMembersWs[valueCell].s = {
              font: { bold: true, color: { rgb: '6E44FF' } },
              alignment: { horizontal: 'center' }
            };
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, teamMembersWs, 'Team Members');
    }

    // Convert workbook to binary Excel format
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Return the Excel file data
    return {
      success: true,
      excelFile: {
        blob: excelBlob,
        filename: `${safeEventTitle}_registrations_${timestamp}.xlsx`
      }
    };
  } catch (error) {
    console.error('Error exporting registrations:', error);
    return { success: false, message: error.message || 'Failed to export registrations' };
  }
};

// Helper function to export registrations as PDF
const exportAsPDF = (registrations, eventData, safeEventTitle, timestamp) => {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add document title and metadata
    doc.setProperties({
      title: `${eventData.title} - Registrations`,
      subject: 'Event Registrations',
      author: 'NIT Silchar Event Management',
      creator: 'NIT Silchar Event Management'
    });

    // Add header with logo and title
    doc.setFontSize(20);
    doc.setTextColor(110, 68, 255); // Primary color
    doc.text('NIT Silchar Event Management', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text(`Event: ${eventData.title}`, doc.internal.pageSize.width / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });
    doc.text(`Total Registrations: ${registrations.length}`, doc.internal.pageSize.width / 2, 35, { align: 'center' });

    // Add event details section
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Event Details', 14, 45);

    // Create event details table
    const eventDetailsData = [
      ['Event ID', eventData.id],
      ['Category', eventData.categories?.name || 'N/A'],
      ['Organizing Club', eventData.clubs?.name || 'N/A'],
      ['Start Date', new Date(eventData.start_date).toLocaleDateString()],
      ['End Date', eventData.end_date ? new Date(eventData.end_date).toLocaleDateString() : 'N/A'],
      ['Location', eventData.location || 'N/A'],
      ['Status', eventData.status || 'N/A'],
      ['Registration Deadline', eventData.registration_deadline ? new Date(eventData.registration_deadline).toLocaleDateString() : 'N/A'],
      ['Participation Type', eventData.participation_type || 'Individual']
    ];

    if (eventData.participation_type === 'team') {
      eventDetailsData.push(['Min Team Size', eventData.min_participants || 'N/A']);
      eventDetailsData.push(['Max Team Size', eventData.max_participants || 'N/A']);
    }

    autoTable(doc, {
      startY: 50,
      head: [],
      body: eventDetailsData,
      theme: 'grid',
      headStyles: { fillColor: [110, 68, 255], textColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      }
    });

    // Add registrations section
    const currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Registrations', 14, currentY);

    // Prepare registrations data
    const registrationsTableData = registrations.map(registration => [
      registration.participant_name || '',
      registration.participant_email || '',
      registration.participant_phone || '',
      registration.participant_id || '',
      registration.additional_info?.department || '',
      registration.additional_info?.year || '',
      registration.additional_info?.team_type || 'individual',
      registration.status || '',
      new Date(registration.created_at).toLocaleDateString() || ''
    ]);

    // Create registrations table
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Name', 'Email', 'Phone', 'ID/Roll', 'Department', 'Year', 'Type', 'Status', 'Date']],
      body: registrationsTableData,
      theme: 'grid',
      headStyles: { fillColor: [110, 68, 255], textColor: [255, 255, 255] },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Name
        1: { cellWidth: 40 }, // Email
        2: { cellWidth: 20 }, // Phone
        3: { cellWidth: 20 }, // ID/Roll
        4: { cellWidth: 20 }, // Department
        5: { cellWidth: 10 }, // Year
        6: { cellWidth: 15 }, // Type
        7: { cellWidth: 15 }, // Status
        8: { cellWidth: 20 }  // Date
      }
    });

    // Add summary section
    const summaryY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Summary', 14, summaryY);

    // Create summary table
    const summaryData = [
      ['Total Registrations', registrations.length],
      ['Individual Registrations', registrations.filter(r => !r.additional_info?.team_type || r.additional_info?.team_type === 'individual').length],
      ['Team Registrations', registrations.filter(r => r.additional_info?.team_type === 'team').length]
    ];

    autoTable(doc, {
      startY: summaryY + 5,
      head: [],
      body: summaryData,
      theme: 'grid',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      }
    });

    // Add team members section if applicable
    let hasTeamMembers = false;
    registrations.forEach(registration => {
      if (registration.additional_info?.team_type === 'team' &&
          registration.additional_info?.team_members &&
          registration.additional_info.team_members.length > 0) {
        hasTeamMembers = true;
      }
    });

    if (hasTeamMembers) {
      // Add a new page for team members
      doc.addPage();

      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      doc.text(`Team Members - ${eventData.title}`, doc.internal.pageSize.width / 2, 15, { align: 'center' });

      // Prepare team members data
      const teamMembersData = [];

      registrations.forEach(registration => {
        if (registration.additional_info?.team_type === 'team' &&
            registration.additional_info?.team_members &&
            registration.additional_info.team_members.length > 0) {

          registration.additional_info.team_members.forEach(member => {
            teamMembersData.push([
              registration.participant_email || '',
              registration.participant_name || '',
              member.name || '',
              member.department || '',
              member.year || '',
              member.rollNumber || ''
            ]);
          });
        }
      });

      // Create team members table
      autoTable(doc, {
        startY: 25,
        head: [['Registration Email', 'Team Leader', 'Member Name', 'Department', 'Year', 'Roll Number']],
        body: teamMembersData,
        theme: 'grid',
        headStyles: { fillColor: [110, 68, 255], textColor: [255, 255, 255] },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        }
      });

      // Add team summary
      let totalTeamMembers = 0;
      registrations.forEach(registration => {
        if (registration.additional_info?.team_members) {
          totalTeamMembers += registration.additional_info.team_members.length;
        }
      });

      const teamSummaryY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text('Team Summary', 14, teamSummaryY);

      // Create team summary table
      const teamSummaryData = [
        ['Total Team Leaders', registrations.filter(r => r.additional_info?.team_type === 'team').length],
        ['Total Team Members', totalTeamMembers],
        ['Total Participants', registrations.filter(r => r.additional_info?.team_type === 'team').length + totalTeamMembers]
      ];

      autoTable(doc, {
        startY: teamSummaryY + 5,
        head: [],
        body: teamSummaryData,
        theme: 'grid',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' }
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        }
      });
    }

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} - Generated by NIT Silchar Event Management`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Generate PDF blob
    const pdfBlob = doc.output('blob');

    // Return the PDF file data
    return {
      success: true,
      pdfFile: {
        blob: pdfBlob,
        filename: `${safeEventTitle}_registrations_${timestamp}.pdf`
      }
    };
  } catch (error) {
    console.error('Error exporting registrations as PDF:', error);
    return { success: false, message: error.message || 'Failed to export registrations as PDF' };
  }
};

export default registrationService;
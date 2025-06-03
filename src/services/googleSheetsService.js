/**
 * Google Sheets Service
 * Handles communication with the Google Sheets backend service
 */

import logger from '../utils/logger';

// Backend service configuration
const BACKEND_BASE_URL = import.meta.env.VITE_SHEETS_BACKEND_URL || 'https://google-sheets-backend-five.vercel.app';
logger.log('🔧 Google Sheets Service using backend URL:', BACKEND_BASE_URL);
const API_PREFIX = '/api/v1';

class GoogleSheetsService {
  constructor() {
    // Remove trailing slash from BACKEND_BASE_URL if present
    const baseUrl = BACKEND_BASE_URL.endsWith('/') ? BACKEND_BASE_URL.slice(0, -1) : BACKEND_BASE_URL;
    this.baseUrl = `${baseUrl}${API_PREFIX}`;
    logger.log('Google Sheets Service initialized with base URL:', this.baseUrl);
  }

  /**
   * Create a new Google Sheet with event registration data
   */
  async createEventSheet(eventData, registrations, autoCreate = false) {
    try {
      // Validate inputs
      if (!eventData || !eventData.title) {
        throw new Error('Invalid event data: title is required');
      }

      if (!Array.isArray(registrations)) {
        throw new Error('Invalid registrations data: must be an array');
      }

      logger.log(`Creating Google Sheet for event: ${eventData.title} (auto-create: ${autoCreate})`);
      logger.log('Request URL:', `${this.baseUrl}/sheets/create`);

      // Enhanced debugging for the request payload
      logger.log('📊 Detailed Request Payload:');
      logger.log('Event Data:', JSON.stringify(eventData, null, 2));
      logger.log('Registrations count:', registrations.length);
      if (registrations.length > 0) {
        logger.log('Sample registration structure:', JSON.stringify(registrations[0], null, 2));

        // Check for custom fields in registrations
        const sampleReg = registrations[0];
        if (sampleReg.additional_info?.custom_fields) {
          logger.log('Custom fields in sample registration:', JSON.stringify(sampleReg.additional_info.custom_fields, null, 2));
        }

        // Check for payment fields
        if (sampleReg.payment_status || sampleReg.payment_amount || sampleReg.payment_screenshot_url) {
          logger.log('Payment fields in sample registration:', {
            payment_status: sampleReg.payment_status,
            payment_amount: sampleReg.payment_amount,
            payment_screenshot_url: sampleReg.payment_screenshot_url
          });
        }
      }

      const response = await fetch(`${this.baseUrl}/sheets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData,
          registrations,
          autoCreate
        })
      });

      if (!response.ok) {
        let errorMessage;
        let errorDetails = null;
        try {
          const errorData = await response.json();
          logger.error('❌ Backend Error Response:', JSON.stringify(errorData, null, 2));
          errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
          errorDetails = errorData.details || errorData.receivedData || null;

          // If it's a validation error, provide more specific information
          if (errorData.error === 'Validation error' && errorData.details) {
            logger.error('🔍 Validation Error Details:', errorData.details);
            errorMessage = `Validation failed: ${errorData.details.map(d => d.message).join(', ')}`;
          }
        } catch (parseError) {
          logger.error('❌ Failed to parse error response:', parseError);
          errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        }
        logger.error('❌ HTTP Error Response:', response.status, response.statusText);
        logger.error('❌ Error Details:', errorDetails);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      logger.log('Backend response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create Google Sheet');
      }

      logger.log('Google Sheet created successfully:', result.data);
      return {
        success: true,
        ...result.data,
        type: 'google_sheets'
      };

    } catch (error) {
      logger.error('Error creating Google Sheet:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to Google Sheets backend. Please check your internet connection and try again.`);
      }
      throw new Error(`Failed to create Google Sheet: ${error.message}`);
    }
  }

  /**
   * Update an existing Google Sheet with new registration data
   */
  async updateEventSheet(spreadsheetId, eventData, registrations) {
    try {
      logger.log(`Updating Google Sheet: ${spreadsheetId}`);

      const response = await fetch(`${this.baseUrl}/sheets/${spreadsheetId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData,
          registrations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update Google Sheet');
      }

      logger.log('Google Sheet updated successfully:', result.data);
      return {
        success: true,
        ...result.data,
        type: 'google_sheets'
      };

    } catch (error) {
      logger.error('Error updating Google Sheet:', error);
      throw new Error(`Failed to update Google Sheet: ${error.message}`);
    }
  }

  /**
   * Get information about a Google Sheet
   */
  async getSheetInfo(spreadsheetId) {
    try {
      logger.log(`Getting info for Google Sheet: ${spreadsheetId}`);

      const response = await fetch(`${this.baseUrl}/sheets/${spreadsheetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to get sheet information');
      }

      return {
        success: true,
        ...result.data
      };

    } catch (error) {
      logger.error('Error getting sheet info:', error);
      throw new Error(`Failed to get sheet information: ${error.message}`);
    }
  }

  /**
   * Delete a Google Sheet
   */
  async deleteSheet(spreadsheetId) {
    try {
      logger.log(`Deleting Google Sheet: ${spreadsheetId}`);

      const response = await fetch(`${this.baseUrl}/sheets/${spreadsheetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete Google Sheet');
      }

      return {
        success: true,
        ...result.data
      };

    } catch (error) {
      logger.error('Error deleting sheet:', error);
      throw new Error(`Failed to delete Google Sheet: ${error.message}`);
    }
  }

  /**
   * Check if the backend service is available
   */
  async checkBackendHealth() {
    try {
      logger.log('Checking backend health at:', `${this.baseUrl}/health`);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      logger.log('Health check response status:', response.status);

      if (!response.ok) {
        return { available: false, error: `HTTP error! status: ${response.status} - ${response.statusText}` };
      }

      const result = await response.json();
      logger.log('Health check result:', result);

      return {
        available: result.status === 'healthy',
        status: result.status,
        services: result.services
      };

    } catch (error) {
      logger.error('Backend health check failed:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Store Google Sheets link in event data
   */
  async storeSheetLinkInEvent(eventId, sheetData) {
    try {
      // Import eventService dynamically to avoid circular dependency
      const { default: eventService } = await import('./eventService.js');

      // Update event with Google Sheets information
      const updates = {
        google_sheets: {
          spreadsheetId: sheetData.spreadsheetId,
          shareableLink: sheetData.shareableLink,
          title: sheetData.filename,
          created_at: new Date().toISOString(),
          rowCount: sheetData.rowCount
        }
      };

      await eventService.updateEvent(eventId, updates);
      logger.log('Google Sheets link stored in event data successfully');

      return { success: true };
    } catch (error) {
      logger.error('Error storing Google Sheets link in event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-sync Google Sheet with updated data
   */
  async autoSyncSheet(spreadsheetId, eventData, registrations, updateType = 'registration') {
    try {
      logger.log(`🔄 Auto-syncing Google Sheet: ${spreadsheetId} (${updateType})`);

      const response = await fetch(`${this.baseUrl}/sheets/auto-sync/${spreadsheetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData,
          registrations,
          updateType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to auto-sync Google Sheet');
      }

      logger.log(`✅ Auto-sync successful: ${result.message}`);
      return {
        success: true,
        ...result.data,
        updateType,
        message: result.message
      };

    } catch (error) {
      logger.error('❌ Error auto-syncing Google Sheet:', error);
      return {
        success: false,
        error: error.message,
        updateType,
        spreadsheetId
      };
    }
  }

  /**
   * Export registrations to Google Sheets (main export function)
   */
  async exportRegistrationsToSheets(eventId, eventTitle, registrations, eventData) {
    try {
      // Check backend availability first
      const healthCheck = await this.checkBackendHealth();
      if (!healthCheck.available) {
        throw new Error(`Google Sheets backend is not available: ${healthCheck.error}`);
      }

      // Debug: Log the incoming event data
      logger.log('📊 Google Sheets Export - Event Data:', {
        eventId,
        eventTitle,
        customFieldsCount: eventData?.custom_fields?.length || 0,
        customFields: eventData?.custom_fields,
        hasPayment: !!eventData?.requires_payment,
        paymentAmount: eventData?.payment_amount
      });

      // Debug: Log sample registration data
      if (registrations.length > 0) {
        logger.log('📊 Sample Registration Data:', {
          participantName: registrations[0].participant_name,
          participantEmail: registrations[0].participant_email,
          hasAdditionalInfo: !!registrations[0].additional_info,
          additionalInfoKeys: registrations[0].additional_info ? Object.keys(registrations[0].additional_info) : [],
          hasCustomFields: !!registrations[0].additional_info?.custom_fields,
          customFieldsKeys: registrations[0].additional_info?.custom_fields ? Object.keys(registrations[0].additional_info.custom_fields) : [],
          hasPaymentInfo: !!(registrations[0].payment_status || registrations[0].payment_amount || registrations[0].payment_screenshot_url)
        });
      }

      // Prepare event data for the backend - ensure all required fields are present
      const formattedEventData = {
        id: eventId,
        title: eventTitle,
        participation_type: eventData?.participation_type || 'individual' // Include participation type for sheet structure determination
      };

      // Only add custom fields if they exist and are valid
      if (eventData?.custom_fields && Array.isArray(eventData.custom_fields) && eventData.custom_fields.length > 0) {
        // Validate custom fields structure
        const validCustomFields = eventData.custom_fields.filter(field =>
          field &&
          typeof field === 'object' &&
          field.id &&
          typeof field.id === 'string' &&
          field.label &&
          typeof field.label === 'string' &&
          field.type &&
          typeof field.type === 'string'
        );

        if (validCustomFields.length > 0) {
          formattedEventData.custom_fields = validCustomFields;
          logger.log('📊 Valid custom fields added:', validCustomFields.length);
        } else {
          logger.warn('⚠️ No valid custom fields found, skipping custom fields');
        }
      }

      // Only add payment info if it exists - simplified for Google Sheets
      if (eventData?.requires_payment) {
        // Convert payment requirement to boolean (handle "on", true, "true", etc.)
        const requiresPayment = eventData.requires_payment === true ||
                               eventData.requires_payment === "true" ||
                               eventData.requires_payment === "on" ||
                               eventData.requires_payment === 1;

        formattedEventData.requires_payment = requiresPayment;

        // Convert payment amount to number if it's a string
        let paymentAmount = null;
        if (eventData.payment_amount) {
          if (typeof eventData.payment_amount === 'string') {
            const parsed = parseFloat(eventData.payment_amount);
            paymentAmount = isNaN(parsed) ? null : parsed;
          } else if (typeof eventData.payment_amount === 'number') {
            paymentAmount = eventData.payment_amount;
          }
        }
        formattedEventData.payment_amount = paymentAmount;

        logger.log('📊 Payment info processed:', {
          originalRequiresPayment: eventData.requires_payment,
          convertedRequiresPayment: requiresPayment,
          originalPaymentAmount: eventData.payment_amount,
          convertedPaymentAmount: paymentAmount
        });
      }

      logger.log('📊 Formatted Event Data for Backend:', JSON.stringify(formattedEventData, null, 2));

      // Validate and clean registrations data
      const cleanedRegistrations = registrations.map((reg, index) => {
        // Ensure required fields are present
        if (!reg.participant_name || !reg.participant_email) {
          logger.error(`❌ Registration ${index + 1} missing required fields:`, {
            name: reg.participant_name,
            email: reg.participant_email
          });
          throw new Error(`Registration ${index + 1} is missing required participant name or email`);
        }

        // Create a cleaned registration object with proper field types
        const cleanedReg = {
          participant_name: String(reg.participant_name),
          participant_email: String(reg.participant_email),
          participant_phone: reg.participant_phone ? String(reg.participant_phone) : '',
          participant_student_id: reg.participant_student_id ? String(reg.participant_student_id) : '',
          participant_department: reg.participant_department ? String(reg.participant_department) : '',
          participant_year: reg.participant_year ? String(reg.participant_year) : '',
          registration_type: reg.registration_type || 'Individual',
          status: reg.status || 'Confirmed',
          created_at: reg.created_at || reg.registration_date || new Date().toISOString(),
          additional_info: reg.additional_info || null,
          attendance_status: reg.attendance_status || '',
          attendance_timestamp: reg.attendance_timestamp || ''
        };

        // Add payment fields if they exist
        if (reg.payment_status) cleanedReg.payment_status = String(reg.payment_status);
        if (reg.payment_amount) cleanedReg.payment_amount = reg.payment_amount;
        if (reg.payment_screenshot_url) cleanedReg.payment_screenshot_url = String(reg.payment_screenshot_url);

        return cleanedReg;
      });

      logger.log('📊 Cleaned registrations count:', cleanedRegistrations.length);

      // Create the Google Sheet
      const result = await this.createEventSheet(formattedEventData, cleanedRegistrations);

      // Generate WhatsApp sharing URL
      const whatsappMessage = encodeURIComponent(
        `🎉 *${eventTitle} - Event Registrations*\n\n` +
        `📊 Google Sheet with ${cleanedRegistrations.length} registrations is ready!\n\n` +
        `🔗 View/Edit: ${result.shareableLink}\n\n` +
        `✨ Anyone can edit this sheet without requesting access.`
      );
      const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

      const exportResult = {
        success: true,
        url: result.shareableLink,
        filename: result.title,
        type: 'google_sheets',
        spreadsheetId: result.spreadsheetId,
        message: 'Google Sheet created successfully. Anyone can edit this sheet without requesting access.',
        shareableLink: result.shareableLink,
        rowCount: result.rowCount,
        whatsappUrl,
        whatsappMessage: decodeURIComponent(whatsappMessage)
      };

      // Store the Google Sheets link in the event data
      try {
        await this.storeSheetLinkInEvent(eventId, exportResult);
        logger.log('Google Sheets link stored in event successfully');
      } catch (storeError) {
        logger.warn('Failed to store Google Sheets link in event:', storeError.message);
        // Don't fail the export if storing fails
      }

      return exportResult;

    } catch (error) {
      logger.error('Error exporting to Google Sheets:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to create Google Sheet: ${error.message}`
      };
    }
  }
}

// Create and export a singleton instance
const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService;

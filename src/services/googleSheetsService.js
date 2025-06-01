/**
 * Google Sheets Service
 * Handles communication with the Google Sheets backend service
 */

// Backend service configuration
const BACKEND_BASE_URL = import.meta.env.VITE_SHEETS_BACKEND_URL || 'https://google-sheets-backend-five.vercel.app';
console.log('🔧 Google Sheets Service using backend URL:', BACKEND_BASE_URL);
const API_PREFIX = '/api/v1';

class GoogleSheetsService {
  constructor() {
    // Remove trailing slash from BACKEND_BASE_URL if present
    const baseUrl = BACKEND_BASE_URL.endsWith('/') ? BACKEND_BASE_URL.slice(0, -1) : BACKEND_BASE_URL;
    this.baseUrl = `${baseUrl}${API_PREFIX}`;
    console.log('Google Sheets Service initialized with base URL:', this.baseUrl);
  }

  /**
   * Create a new Google Sheet with event registration data
   */
  async createEventSheet(eventData, registrations) {
    try {
      console.log(`Creating Google Sheet for event: ${eventData.title}`);
      console.log('Request URL:', `${this.baseUrl}/sheets/create`);
      console.log('Request payload:', { eventData, registrations });

      const response = await fetch(`${this.baseUrl}/sheets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData,
          registrations
        })
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        }
        console.error('HTTP Error Response:', response.status, response.statusText);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Backend response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create Google Sheet');
      }

      console.log('Google Sheet created successfully:', result.data);
      return {
        success: true,
        ...result.data,
        type: 'google_sheets'
      };

    } catch (error) {
      console.error('Error creating Google Sheet:', error);
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
      console.log(`Updating Google Sheet: ${spreadsheetId}`);

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

      console.log('Google Sheet updated successfully:', result.data);
      return {
        success: true,
        ...result.data,
        type: 'google_sheets'
      };

    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      throw new Error(`Failed to update Google Sheet: ${error.message}`);
    }
  }

  /**
   * Get information about a Google Sheet
   */
  async getSheetInfo(spreadsheetId) {
    try {
      console.log(`Getting info for Google Sheet: ${spreadsheetId}`);

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
      console.error('Error getting sheet info:', error);
      throw new Error(`Failed to get sheet information: ${error.message}`);
    }
  }

  /**
   * Delete a Google Sheet
   */
  async deleteSheet(spreadsheetId) {
    try {
      console.log(`Deleting Google Sheet: ${spreadsheetId}`);

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
      console.error('Error deleting sheet:', error);
      throw new Error(`Failed to delete Google Sheet: ${error.message}`);
    }
  }

  /**
   * Check if the backend service is available
   */
  async checkBackendHealth() {
    try {
      console.log('Checking backend health at:', `${this.baseUrl}/health`);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Health check response status:', response.status);

      if (!response.ok) {
        return { available: false, error: `HTTP error! status: ${response.status} - ${response.statusText}` };
      }

      const result = await response.json();
      console.log('Health check result:', result);

      return {
        available: result.status === 'healthy',
        status: result.status,
        services: result.services
      };

    } catch (error) {
      console.error('Backend health check failed:', error);
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
      console.log('Google Sheets link stored in event data successfully');

      return { success: true };
    } catch (error) {
      console.error('Error storing Google Sheets link in event:', error);
      return { success: false, error: error.message };
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
      console.log('📊 Google Sheets Export - Event Data:', {
        eventId,
        eventTitle,
        customFieldsCount: eventData?.custom_fields?.length || 0,
        customFields: eventData?.custom_fields,
        hasPayment: !!eventData?.requires_payment,
        paymentAmount: eventData?.payment_amount
      });

      // Prepare minimal event data for the backend to avoid 400 errors
      const formattedEventData = {
        id: eventId,
        title: eventTitle
      };

      // Only add custom fields if they exist
      if (eventData?.custom_fields && eventData.custom_fields.length > 0) {
        formattedEventData.custom_fields = eventData.custom_fields;
      }

      // Only add payment info if it exists
      if (eventData?.requires_payment) {
        formattedEventData.requires_payment = eventData.requires_payment;
        if (eventData.payment_amount) formattedEventData.payment_amount = eventData.payment_amount;
        if (eventData.payment_qr_code) formattedEventData.payment_qr_code = eventData.payment_qr_code;
        if (eventData.payment_upi_id) formattedEventData.payment_upi_id = eventData.payment_upi_id;
      }

      console.log('📊 Formatted Event Data for Backend:', formattedEventData);

      // Create the Google Sheet
      const result = await this.createEventSheet(formattedEventData, registrations);

      // Generate WhatsApp sharing URL
      const whatsappMessage = encodeURIComponent(
        `🎉 *${eventTitle} - Event Registrations*\n\n` +
        `📊 Google Sheet with ${registrations.length} registrations is ready!\n\n` +
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
        console.log('Google Sheets link stored in event successfully');
      } catch (storeError) {
        console.warn('Failed to store Google Sheets link in event:', storeError.message);
        // Don't fail the export if storing fails
      }

      return exportResult;

    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
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

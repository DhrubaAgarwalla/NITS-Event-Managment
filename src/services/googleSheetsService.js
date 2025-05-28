/**
 * Google Sheets Service
 * Handles communication with the Google Sheets backend service
 */

// Backend service configuration
const BACKEND_BASE_URL = import.meta.env.VITE_SHEETS_BACKEND_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

class GoogleSheetsService {
  constructor() {
    this.baseUrl = `${BACKEND_BASE_URL}${API_PREFIX}`;
  }

  /**
   * Create a new Google Sheet with event registration data
   */
  async createEventSheet(eventData, registrations) {
    try {
      console.log(`Creating Google Sheet for event: ${eventData.title}`);

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
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

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
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return { available: false, error: `HTTP error! status: ${response.status}` };
      }

      const result = await response.json();
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
   * Export registrations to Google Sheets (main export function)
   */
  async exportRegistrationsToSheets(eventId, eventTitle, registrations, eventData) {
    try {
      // Check backend availability first
      const healthCheck = await this.checkBackendHealth();
      if (!healthCheck.available) {
        throw new Error(`Google Sheets backend is not available: ${healthCheck.error}`);
      }

      // Prepare event data for the backend
      const formattedEventData = {
        id: eventId,
        title: eventTitle,
        custom_fields: eventData?.custom_fields || []
      };

      // Create the Google Sheet
      const result = await this.createEventSheet(formattedEventData, registrations);

      return {
        success: true,
        url: result.shareableLink,
        filename: result.title,
        type: 'google_sheets',
        spreadsheetId: result.spreadsheetId,
        message: 'Google Sheet created successfully. Anyone can edit this sheet without requesting access.',
        shareableLink: result.shareableLink,
        rowCount: result.rowCount
      };

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

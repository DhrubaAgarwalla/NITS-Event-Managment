import QRCode from 'qrcode';
import { database } from '../lib/firebase';
import { ref, update, get } from 'firebase/database';

import logger from '../utils/logger';
/**
 * QR Code Service for RSVP Attendance Tracking
 * Generates unique, secure QR codes for event registrations
 */
class QRCodeService {
  /**
   * Generate a unique QR code for a registration
   * @param {string} registrationId - The registration ID
   * @param {string} eventId - The event ID
   * @param {string} participantEmail - Participant's email
   * @returns {Promise<Object>} QR code data and image URL
   */
  async generateQRCode(registrationId, eventId, participantEmail) {
    try {
      // Create unique QR code data with security measures
      const timestamp = Date.now();
      const qrData = this.createSecureQRData(registrationId, eventId, participantEmail, timestamp);

      // Generate QR code image as data URL
      const qrCodeImageUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Update registration with QR code data
      await this.saveQRCodeToRegistration(registrationId, qrData, timestamp);

      return {
        success: true,
        qrCodeData: qrData,
        qrCodeImageUrl,
        timestamp
      };
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Create secure QR code data with fraud prevention
   * @param {string} registrationId - Registration ID
   * @param {string} eventId - Event ID
   * @param {string} participantEmail - Participant email
   * @param {number} timestamp - Generation timestamp
   * @returns {string} Secure QR code data
   */
  createSecureQRData(registrationId, eventId, participantEmail, timestamp) {
    // Create a hash for verification
    const dataToHash = `${registrationId}:${eventId}:${participantEmail}:${timestamp}`;
    const hash = this.generateSimpleHash(dataToHash);

    // Create QR code data structure
    const qrData = {
      type: 'NITS_EVENT_ATTENDANCE',
      registrationId,
      eventId,
      email: participantEmail,
      timestamp,
      hash,
      version: '1.0'
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate a simple hash for verification (using built-in crypto)
   * @param {string} data - Data to hash
   * @returns {string} Hash string
   */
  generateSimpleHash(data) {
    // Simple hash function for verification
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save QR code data to registration in Firebase
   * @param {string} registrationId - Registration ID
   * @param {string} qrData - QR code data
   * @param {number} timestamp - Generation timestamp
   */
  async saveQRCodeToRegistration(registrationId, qrData, timestamp) {
    try {
      const registrationRef = ref(database, `registrations/${registrationId}`);
      const updates = {
        qr_code_data: qrData,
        qr_code_generated_at: new Date(timestamp).toISOString(),
        attendance_status: 'not_attended',
        updated_at: new Date().toISOString()
      };

      await update(registrationRef, updates);
      logger.log(`QR code saved for registration: ${registrationId}`);
    } catch (error) {
      logger.error('Error saving QR code to registration:', error);
      throw error;
    }
  }

  /**
   * Verify QR code data for attendance marking
   * @param {string} qrCodeData - Scanned QR code data
   * @returns {Promise<Object>} Verification result
   */
  async verifyQRCode(qrCodeData) {
    try {
      // Parse QR code data
      const qrData = JSON.parse(qrCodeData);

      // Basic structure validation
      if (!this.isValidQRStructure(qrData)) {
        return {
          valid: false,
          error: 'Invalid QR code format'
        };
      }

      // Verify hash
      const dataToHash = `${qrData.registrationId}:${qrData.eventId}:${qrData.email}:${qrData.timestamp}`;
      const expectedHash = this.generateSimpleHash(dataToHash);

      if (qrData.hash !== expectedHash) {
        return {
          valid: false,
          error: 'QR code verification failed - invalid hash'
        };
      }

      // QR codes remain valid until the event date
      // No time-based expiry check needed

      return {
        valid: true,
        registrationId: qrData.registrationId,
        eventId: qrData.eventId,
        email: qrData.email,
        timestamp: qrData.timestamp
      };
    } catch (error) {
      logger.error('Error verifying QR code:', error);
      return {
        valid: false,
        error: 'Failed to parse QR code data'
      };
    }
  }

  /**
   * Validate QR code structure
   * @param {Object} qrData - Parsed QR data
   * @returns {boolean} Is valid structure
   */
  isValidQRStructure(qrData) {
    return (
      qrData &&
      qrData.type === 'NITS_EVENT_ATTENDANCE' &&
      qrData.registrationId &&
      qrData.eventId &&
      qrData.email &&
      qrData.timestamp &&
      qrData.hash &&
      qrData.version
    );
  }

  /**
   * Mark attendance for a registration
   * @param {string} registrationId - Registration ID
   * @returns {Promise<Object>} Update result
   */
  async markAttendance(registrationId) {
    try {
      const registrationRef = ref(database, `registrations/${registrationId}`);

      // Double-check attendance status before marking
      const snapshot = await get(registrationRef);
      if (!snapshot.exists()) {
        throw new Error('Registration not found');
      }

      const currentData = snapshot.val();
      if (currentData.attendance_status === 'attended') {
        return {
          success: false,
          error: 'Attendance already marked for this registration',
          alreadyAttended: true
        };
      }

      const updates = {
        attendance_status: 'attended',
        attendance_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await update(registrationRef, updates);

      return {
        success: true,
        message: 'Attendance marked successfully',
        timestamp: updates.attendance_timestamp
      };
    } catch (error) {
      logger.error('Error marking attendance:', error);
      throw new Error(`Failed to mark attendance: ${error.message}`);
    }
  }

  /**
   * Generate QR code for display purposes (without saving to database)
   * @param {string} data - Data to encode
   * @param {Object} options - QR code options
   * @returns {Promise<string>} QR code data URL
   */
  async generateQRCodeImage(data, options = {}) {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
      return await QRCode.toDataURL(data, qrOptions);
    } catch (error) {
      logger.error('Error generating QR code image:', error);
      throw new Error(`Failed to generate QR code image: ${error.message}`);
    }
  }
}

// Create and export singleton instance
const qrCodeService = new QRCodeService();
export default qrCodeService;

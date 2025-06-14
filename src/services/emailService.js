/**
 * Email Service for RSVP Attendance Tracking
 * Sends QR codes and event notifications using Gmail API with Firebase
 */

import logger from '../utils/logger';

class EmailService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_SHEETS_BACKEND_URL || 'https://google-sheets-backend-five.vercel.app';
    logger.log('🔧 EmailService initialized with backend URL:', this.backendUrl);
  }

  /**
   * Send QR code email to participant after registration
   * @param {Object} emailData - Email data object
   * @returns {Promise<Object>} Send result
   */
  async sendQRCodeEmail(emailData) {
    try {
      logger.log('📧 EmailService: Starting QR code email send process...');
      logger.log('📧 Backend URL:', this.backendUrl);

      const {
        participantEmail,
        participantName,
        eventTitle,
        eventDate,
        eventLocation,
        qrCodeImageUrl,
        registrationId,
        eventId
      } = emailData;

      logger.log('📧 Email data received:', {
        participantEmail,
        participantName,
        eventTitle,
        hasQRCode: !!qrCodeImageUrl,
        registrationId
      });

      // Validate required data
      if (!participantEmail || !participantName || !eventTitle || !qrCodeImageUrl) {
        throw new Error('Missing required email data');
      }

      // Validate QR code format
      if (!qrCodeImageUrl.startsWith('data:image/')) {
        throw new Error('Invalid QR code image format - must be a valid data URL');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(participantEmail)) {
        throw new Error('Invalid email address format');
      }

      // Prepare email content
      const emailContent = this.generateQRCodeEmailHTML({
        participantName,
        eventTitle,
        eventDate,
        eventLocation,
        qrCodeImageUrl,
        registrationId
      });

      logger.log('📧 Email content generated, length:', emailContent.length);

      // Prepare request payload
      const requestPayload = {
        to: participantEmail,
        subject: `🎫 Your QR Code for ${eventTitle} - NITS Event Manager`,
        html: emailContent,
        attachments: [
          {
            filename: `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_qr_code.png`,
            content: qrCodeImageUrl.split(',')[1], // Remove data:image/png;base64, prefix
            encoding: 'base64',
            cid: 'qr_code_image'
          }
        ]
      };

      logger.log('📧 Sending request to:', `${this.backendUrl}/api/v1/send-email`);

      // Send email via backend service
      const response = await fetch(`${this.backendUrl}/api/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      logger.log('📧 Response status:', response.status);
      logger.log('📧 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          const errorText = await response.text();
          logger.error('📧 Failed to parse error response:', parseError);
          logger.error('📧 Raw error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
        }

        logger.error('📧 Email sending failed:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to send email`);
      }

      const result = await response.json();
      logger.log('📧 Email sent successfully:', result);

      return {
        success: true,
        messageId: result.messageId,
        message: 'QR code email sent successfully'
      };
    } catch (error) {
      logger.error('📧 Error sending QR code email:', error);
      logger.error('📧 Error stack:', error.stack);

      return {
        success: false,
        error: error.message || 'Failed to send QR code email',
        details: {
          backendUrl: this.backendUrl,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      };
    }
  }

  /**
   * Generate HTML content for QR code email
   * @param {Object} data - Email template data
   * @returns {string} HTML email content
   */
  generateQRCodeEmailHTML(data) {
    const { participantName, eventTitle, eventDate, eventLocation, registrationId } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Event QR Code</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 16px;
        }
        .qr-section {
            text-align: center;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
        }
        .qr-code {
            max-width: 200px;
            height: auto;
            border: 3px solid #007bff;
            border-radius: 8px;
            padding: 10px;
            background: white;
        }
        .event-details {
            background: #e3f2fd;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .event-details h3 {
            margin-top: 0;
            color: #007bff;
        }
        .detail-item {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .detail-icon {
            width: 20px;
            margin-right: 10px;
            color: #007bff;
        }
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .instructions h4 {
            color: #856404;
            margin-top: 0;
        }
        .instructions ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #666;
            font-size: 14px;
        }
        .registration-id {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 14px;
            color: #495057;
            display: inline-block;
            margin: 5px 0;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Event Registration Confirmed!</h1>
            <p>NIT Silchar Event Management System</p>
        </div>

        <p>Dear <strong>${participantName}</strong>,</p>

        <p>Thank you for registering for <strong>${eventTitle}</strong>! Your registration has been confirmed and your unique QR code is ready.</p>

        <div class="event-details">
            <h3>📅 Event Details</h3>
            <div class="detail-item">
                <span class="detail-icon">🎯</span>
                <strong>Event:</strong> ${eventTitle}
            </div>
            <div class="detail-item">
                <span class="detail-icon">📅</span>
                <strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
            </div>
            <div class="detail-item">
                <span class="detail-icon">📍</span>
                <strong>Location:</strong> ${eventLocation}
            </div>
            <div class="detail-item">
                <span class="detail-icon">🆔</span>
                <strong>Registration ID:</strong> <span class="registration-id">${registrationId}</span>
            </div>
        </div>

        <div class="qr-section">
            <h3>📱 Your Attendance QR Code</h3>
            <p>Present this QR code at the event for attendance marking:</p>
            <img src="cid:qr_code_image" alt="Event QR Code" class="qr-code">
            <p><small>Save this image to your phone for easy access</small></p>
        </div>

        <div class="instructions">
            <h4>📋 Important Instructions</h4>
            <ul>
                <li><strong>Save this email</strong> or download the QR code image to your phone</li>
                <li><strong>Arrive on time</strong> - QR codes will be scanned at the event entrance</li>
                <li><strong>Bring a backup</strong> - You can also show your registration ID if needed</li>
                <li><strong>Contact support</strong> if you face any issues with your QR code</li>
                <li><strong>QR code is valid until the event date</strong> - keep it safe!</li>
            </ul>
        </div>

        <p>We're excited to see you at the event! If you have any questions or need assistance, please don't hesitate to contact the event organizers.</p>

        <div class="footer">
            <p><strong>NIT Silchar Event Management System</strong></p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Send attendance confirmation email
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendAttendanceConfirmation(emailData) {
    try {
      const {
        participantEmail,
        participantName,
        eventTitle,
        attendanceTimestamp
      } = emailData;

      const emailContent = this.generateAttendanceConfirmationHTML({
        participantName,
        eventTitle,
        attendanceTimestamp
      });

      const response = await fetch(`${this.backendUrl}/api/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: participantEmail,
          subject: `✅ Attendance Confirmed - ${eventTitle}`,
          html: emailContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messageId,
        message: 'Attendance confirmation email sent successfully'
      };
    } catch (error) {
      logger.error('Error sending attendance confirmation email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send attendance confirmation email'
      };
    }
  }

  /**
   * Generate HTML for attendance confirmation email
   * @param {Object} data - Email data
   * @returns {string} HTML content
   */
  generateAttendanceConfirmationHTML(data) {
    const { participantName, eventTitle, attendanceTimestamp } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Confirmed</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #28a745;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #28a745;
            margin: 0;
            font-size: 28px;
        }
        .success-icon {
            font-size: 48px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Attendance Confirmed!</h1>
        </div>

        <p>Dear <strong>${participantName}</strong>,</p>

        <p>Your attendance for <strong>${eventTitle}</strong> has been successfully recorded!</p>

        <p><strong>Attendance Time:</strong> ${new Date(attendanceTimestamp).toLocaleString()}</p>

        <p>Thank you for participating in the event. We hope you have a great experience!</p>

        <div class="footer">
            <p><strong>NIT Silchar Event Management System</strong></p>
            <p>This is an automated confirmation email.</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;

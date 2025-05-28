import React from 'react';

const GoogleSheetsSuccessDialog = ({
  result,
  onClose,
  onOpenSheet,
  onCopyLink,
  onShareWhatsApp
}) => {
  if (!result) return null;

  // Debug: Log the result to console
  console.log('GoogleSheetsSuccessDialog result:', result);

  const handleOpenSheet = () => {
    onOpenSheet(result.shareableLink);
    onClose();
  };

  const handleCopyLink = async () => {
    await onCopyLink(result.shareableLink);
    onClose();
  };

  const handleShareWhatsApp = () => {
    console.log('WhatsApp URL:', result.whatsappUrl);
    console.log('WhatsApp Message:', result.whatsappMessage);

    if (result.whatsappUrl) {
      onShareWhatsApp(result.whatsappUrl);
    } else {
      // Fallback: generate WhatsApp URL if not provided
      const whatsappMessage = encodeURIComponent(
        `🎉 *${result.filename} - Event Registrations*\n\n` +
        `📊 Google Sheet with ${result.rowCount} registrations is ready!\n\n` +
        `🔗 View/Edit: ${result.shareableLink}\n\n` +
        `✨ Anyone can edit this sheet without requesting access.`
      );
      const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
      console.log('Generated fallback WhatsApp URL:', whatsappUrl);
      onShareWhatsApp(whatsappUrl);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Success Icon */}
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          ✅
        </div>

        {/* Title */}
        <h2 style={{
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          fontSize: '1.5rem'
        }}>
          Google Sheet Created Successfully!
        </h2>

        {/* Sheet Info */}
        <div style={{
          backgroundColor: 'var(--dark-bg)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'left',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <strong>📊 Title:</strong> {result.filename}
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <strong>📈 Registrations:</strong> {result.rowCount} rows
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <strong>🔗 Access:</strong> Anyone can edit without permission
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {/* Open Sheet Button */}
          <button
            onClick={handleOpenSheet}
            style={{
              backgroundColor: '#4285F4',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#3367D6'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4285F4'}
          >
            📋 Open Google Sheet
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            style={{
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1DA851'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#25D366'}
          >
            <span style={{ fontSize: '1.2rem' }}>📱</span> Share via WhatsApp
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            📋 Copy Link
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #dee2e6',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.borderColor = '#adb5bd';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#dee2e6';
          }}
        >
          Close
        </button>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            textAlign: 'left',
            border: '1px solid rgba(255, 193, 7, 0.3)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Debug Info:</strong>
            <div style={{ marginTop: '0.5rem', fontFamily: 'monospace' }}>
              <div style={{ color: 'var(--text-primary)' }}>WhatsApp URL: {result.whatsappUrl || 'Not available'}</div>
              <div style={{ color: 'var(--text-primary)' }}>Shareable Link: {result.shareableLink || 'Not available'}</div>
            </div>
          </div>
        )}

        {/* WhatsApp Message Preview */}
        {result.whatsappMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(37, 211, 102, 0.1)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            textAlign: 'left',
            border: '1px solid rgba(37, 211, 102, 0.3)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>WhatsApp Message Preview:</strong>
            <div style={{
              marginTop: '0.5rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-line',
              color: 'var(--text-primary)'
            }}>
              {result.whatsappMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsSuccessDialog;

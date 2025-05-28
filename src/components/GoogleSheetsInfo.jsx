import React from 'react';

const GoogleSheetsInfo = ({ event }) => {
  if (!event?.google_sheets) {
    return null;
  }

  const { google_sheets } = event;

  const handleOpenSheet = () => {
    window.open(google_sheets.shareableLink, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(google_sheets.shareableLink);
      alert('Google Sheet link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = google_sheets.shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Google Sheet link copied to clipboard!');
    }
  };

  const handleShareWhatsApp = () => {
    const whatsappMessage = encodeURIComponent(
      `🎉 *${event.title} - Event Registrations*\n\n` +
      `📊 Google Sheet with ${google_sheets.rowCount} registrations is ready!\n\n` +
      `🔗 View/Edit: ${google_sheets.shareableLink}\n\n` +
      `✨ Anyone can edit this sheet without requesting access.`
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--dark-surface)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1rem',
      border: '1px solid rgba(66, 133, 244, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.2rem' }}>📋</span>
        <h4 style={{ 
          margin: 0, 
          color: '#4285F4',
          fontSize: '1.1rem'
        }}>
          Google Sheets Export
        </h4>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <p style={{ 
            margin: '0 0 0.25rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.8rem' 
          }}>
            SHEET TITLE
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            {google_sheets.title}
          </p>
        </div>
        <div>
          <p style={{ 
            margin: '0 0 0.25rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.8rem' 
          }}>
            CREATED
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            {formatDate(google_sheets.created_at)}
          </p>
        </div>
        <div>
          <p style={{ 
            margin: '0 0 0.25rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.8rem' 
          }}>
            REGISTRATIONS
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            {google_sheets.rowCount} rows
          </p>
        </div>
        <div>
          <p style={{ 
            margin: '0 0 0.25rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.8rem' 
          }}>
            ACCESS
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#22c55e' }}>
            Public (Anyone can edit)
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleOpenSheet}
          style={{
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#3367D6'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4285F4'}
        >
          📋 Open Sheet
        </button>

        <button
          onClick={handleShareWhatsApp}
          style={{
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1DA851'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#25D366'}
        >
          📱 Share via WhatsApp
        </button>

        <button
          onClick={handleCopyLink}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          📋 Copy Link
        </button>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        borderRadius: '6px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <strong>💡 Tip:</strong> This Google Sheet is automatically updated when new registrations are exported. 
        Anyone with the link can view and edit the sheet without requesting access.
      </div>
    </div>
  );
};

export default GoogleSheetsInfo;

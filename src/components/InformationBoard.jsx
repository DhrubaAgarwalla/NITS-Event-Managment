/**
 * Information Board Component
 * Displays live updates from club admins during events
 */

import React, { useState, useEffect, useRef } from 'react';
import informationBoardService from '../services/informationBoardService';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import './InformationBoard.css';

const InformationBoard = ({ eventId, isClubAdmin = false, clubId = null }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUpdate, setNewUpdate] = useState('');
  const [updateType, setUpdateType] = useState('info');
  const [isPosting, setIsPosting] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const { user, isAdmin, club } = useAuth();
  const updatesContainerRef = useRef(null);

  // Check if user can post updates
  const canPostUpdates = isClubAdmin || isAdmin || (club && club.id === clubId);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);

    // Set up real-time listener for updates
    const unsubscribe = informationBoardService.listenToUpdates(
      eventId,
      (updatesData) => {
        setUpdates(updatesData);
        setLoading(false);
        setError(null);
        // Removed auto-scroll - let users read at their own pace
      },
      100 // Get last 100 updates
    );

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  const scrollToLatest = () => {
    if (updatesContainerRef.current) {
      updatesContainerRef.current.scrollTop = 0; // Scroll to top since newest updates are first
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();

    if (!newUpdate.trim() || !canPostUpdates) return;

    setIsPosting(true);
    setError(null);

    try {
      const updateData = {
        message: newUpdate.trim(),
        type: updateType,
        isPinned: false
      };

      const adminName = user?.displayName || club?.name || 'Admin';
      const adminId = user?.uid || club?.id;

      await informationBoardService.postUpdate(
        eventId,
        updateData,
        adminId,
        adminName
      );

      setNewUpdate('');
      setShowPostForm(false);
      logger.log('Information board update posted successfully');

    } catch (err) {
      logger.error('Error posting update:', err);
      setError(err.message || 'Failed to post update');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePinToggle = async (updateId, currentPinStatus) => {
    if (!canPostUpdates) return;

    try {
      await informationBoardService.togglePinUpdate(eventId, updateId, !currentPinStatus);
      logger.log(`Update ${currentPinStatus ? 'unpinned' : 'pinned'} successfully`);
    } catch (err) {
      logger.error('Error toggling pin status:', err);
      setError('Failed to update pin status');
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!canPostUpdates) return;

    if (!window.confirm('Are you sure you want to delete this update?')) return;

    try {
      await informationBoardService.deleteUpdate(eventId, updateId, user?.uid || club?.id);
      logger.log('Update deleted successfully');
    } catch (err) {
      logger.error('Error deleting update:', err);
      setError('Failed to delete update');
    }
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'schedule': return '⏰';
      case 'important': return '🚨';
      default: return 'ℹ️';
    }
  };

  const getUpdateTypeClass = (type) => {
    switch (type) {
      case 'announcement': return 'update-announcement';
      case 'schedule': return 'update-schedule';
      case 'important': return 'update-important';
      default: return 'update-info';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="information-board loading">
        <div className="loading-spinner"></div>
        <p>Loading updates...</p>
      </div>
    );
  }

  return (
    <div className="information-board">
      <div className="board-header">
        <h3>📢 Live Event Updates</h3>
        <div className="header-actions">
          {updates.length > 3 && (
            <button
              className="scroll-to-latest-btn"
              onClick={scrollToLatest}
              title="Jump to latest updates"
            >
              ⬆️ Latest
            </button>
          )}
          {canPostUpdates && (
            <button
              className="post-update-btn"
              onClick={() => setShowPostForm(!showPostForm)}
            >
              {showPostForm ? '✕ Cancel' : '+ Post Update'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showPostForm && canPostUpdates && (
        <form className="post-update-form" onSubmit={handlePostUpdate}>
          <div className="form-group">
            <select
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value)}
              className="update-type-select"
            >
              <option value="info">ℹ️ Information</option>
              <option value="announcement">📢 Announcement</option>
              <option value="schedule">⏰ Schedule Update</option>
              <option value="important">🚨 Important</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Enter your update message..."
              maxLength={500}
              rows={3}
              required
            />
            <div className="char-count">
              {newUpdate.length}/500
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isPosting || !newUpdate.trim()}
              className="post-btn"
            >
              {isPosting ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      <div className="updates-container" ref={updatesContainerRef}>
        {updates.length === 0 ? (
          <div className="no-updates">
            <p>No updates yet. Check back for live event information!</p>
          </div>
        ) : (
          <>
            {/* Pinned updates first */}
            {updates.filter(update => update.is_pinned).map((update) => (
              <div
                key={update.id}
                className={`update-item pinned ${getUpdateTypeClass(update.type)}`}
              >
                <div className="update-header">
                  <span className="update-icon">{getUpdateIcon(update.type)}</span>
                  <span className="update-meta">
                    <strong>{update.posted_by_name}</strong>
                    <span className="timestamp">{formatTimestamp(update.timestamp)}</span>
                    <span className="pinned-badge">📌 Pinned</span>
                  </span>
                  {canPostUpdates && (
                    <div className="update-actions">
                      <button
                        onClick={() => handlePinToggle(update.id, update.is_pinned)}
                        className="action-btn unpin-btn"
                        title="Unpin update"
                      >
                        📌
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="action-btn delete-btn"
                        title="Delete update"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                <div className="update-message">
                  {update.message}
                </div>
              </div>
            ))}

            {/* Regular updates */}
            {updates.filter(update => !update.is_pinned).map((update) => (
              <div
                key={update.id}
                className={`update-item ${getUpdateTypeClass(update.type)}`}
              >
                <div className="update-header">
                  <span className="update-icon">{getUpdateIcon(update.type)}</span>
                  <span className="update-meta">
                    <strong>{update.posted_by_name}</strong>
                    <span className="timestamp">{formatTimestamp(update.timestamp)}</span>
                    {update.is_edited && <span className="edited-badge">(edited)</span>}
                  </span>
                  {canPostUpdates && (
                    <div className="update-actions">
                      <button
                        onClick={() => handlePinToggle(update.id, update.is_pinned)}
                        className="action-btn pin-btn"
                        title="Pin update"
                      >
                        📌
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="action-btn delete-btn"
                        title="Delete update"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                <div className="update-message">
                  {update.message}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {updates.length > 0 && (
        <div className="board-footer">
          <small>
            {updates.length} update{updates.length !== 1 ? 's' : ''} •
            Updates refresh automatically
          </small>
        </div>
      )}
    </div>
  );
};

export default InformationBoard;

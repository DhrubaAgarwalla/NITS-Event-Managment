/**
 * Event Chat Component
 * Real-time anonymous chat for events
 */

import React, { useState, useEffect, useRef } from 'react';
import eventChatService from '../services/eventChatService';
import anonymousUserService from '../services/anonymousUserService';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import './EventChat.css';

const EventChat = ({ eventId, isClubAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [anonymousSession, setAnonymousSession] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [customNickname, setCustomNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
  const { isAdmin } = useAuth();
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Check if user can moderate
  const canModerate = isClubAdmin || isAdmin;

  useEffect(() => {
    if (!eventId) return;

    initializeChat();
  }, [eventId]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Get anonymous session
      const session = await anonymousUserService.getAnonymousSession(eventId);
      setAnonymousSession(session);

      // Show nickname selection for new users
      if (session.isNewSession) {
        setShowNicknameModal(true);
      }

      // Set up real-time listener for messages
      const unsubscribe = eventChatService.listenToMessages(
        eventId,
        (messagesData) => {
          setMessages(messagesData);
          setLoading(false);
          setError(null);

          // Auto-scroll to latest message (only the chat container)
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        },
        100 // Get last 100 messages
      );

      // Get active users count
      const usersCount = await anonymousUserService.getActiveUsersCount(eventId);
      setActiveUsers(usersCount);

      return () => {
        unsubscribe();
      };

    } catch (err) {
      logger.error('Error initializing chat:', err);
      setError('Failed to load chat');
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    // Scroll only the messages container, not the entire page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending || !anonymousSession) return;

    setIsSending(true);
    setError(null);

    try {
      await eventChatService.sendMessage(eventId, newMessage.trim());
      setNewMessage('');
      chatInputRef.current?.focus();

    } catch (err) {
      logger.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleReaction = async (messageId, reactionType) => {
    try {
      await eventChatService.addReaction(eventId, messageId, reactionType);
    } catch (err) {
      logger.error('Error adding reaction:', err);
      setError('Failed to add reaction');
    }
  };

  const handleReportMessage = async (messageId) => {
    if (!window.confirm('Report this message as inappropriate?')) return;

    try {
      await eventChatService.reportMessage(eventId, messageId);
      logger.log('Message reported successfully');
    } catch (err) {
      logger.error('Error reporting message:', err);
      setError('Failed to report message');
    }
  };

  const handleModerateMessage = async (messageId, isModerated) => {
    if (!canModerate) return;

    try {
      await eventChatService.moderateMessage(eventId, messageId, isModerated);
      logger.log(`Message ${isModerated ? 'hidden' : 'restored'} successfully`);
    } catch (err) {
      logger.error('Error moderating message:', err);
      setError('Failed to moderate message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!canModerate) return;

    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await eventChatService.deleteMessage(eventId, messageId);
      logger.log('Message deleted successfully');
    } catch (err) {
      logger.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const handleNicknameSubmit = async (e) => {
    e.preventDefault();

    if (!customNickname.trim()) {
      setNicknameError('Please enter a nickname');
      return;
    }

    setIsUpdatingNickname(true);
    setNicknameError('');

    try {
      if (anonymousSession) {
        await anonymousUserService.updateNickname(
          eventId,
          anonymousSession.userHash,
          customNickname.trim()
        );

        // Update local session
        setAnonymousSession(prev => ({
          ...prev,
          nickname: customNickname.trim()
        }));

        setShowNicknameModal(false);
        setCustomNickname('');
        logger.log('Nickname updated successfully');
      }
    } catch (err) {
      logger.error('Error updating nickname:', err);
      setNicknameError(err.message || 'Failed to update nickname');
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  const handleSkipNickname = () => {
    setShowNicknameModal(false);
    setCustomNickname('');
    setNicknameError('');
  };

  const handleChangeNickname = () => {
    setCustomNickname(anonymousSession?.nickname || '');
    setShowNicknameModal(true);
    setNicknameError('');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = (avatarSeed) => {
    return anonymousUserService.generateAvatarUrl(avatarSeed);
  };

  const isMyMessage = (userHash) => {
    return anonymousSession && userHash === anonymousSession.userHash;
  };

  if (loading) {
    return (
      <div className="event-chat loading">
        <div className="loading-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="event-chat">
      <div className="chat-header">
        <h3>💬 Event Chat</h3>
        <div className="chat-info">
          <span className="active-users">👥 {activeUsers} active</span>
          {anonymousSession && (
            <div className="current-user">
              <span>You: <strong>{anonymousSession.nickname}</strong></span>
              <button
                onClick={handleChangeNickname}
                className="change-nickname-btn"
                title="Change nickname"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
            <small>💡 You're chatting anonymously as <strong>{anonymousSession?.nickname}</strong></small>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${isMyMessage(message.user_hash) ? 'my-message' : ''}`}
            >
              <div className="message-avatar">
                <img
                  src={getAvatarUrl(message.user_hash)}
                  alt={message.nickname}
                  className="avatar"
                />
              </div>

              <div className="message-content">
                <div className="message-header">
                  <span className="nickname">{message.nickname}</span>
                  <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                  {canModerate && (
                    <div className="admin-actions">
                      <button
                        onClick={() => handleModerateMessage(message.id, true)}
                        className="moderate-btn"
                        title="Hide message"
                      >
                        👁️‍🗨️
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="delete-btn"
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="message-text">
                  {message.message}
                </div>

                <div className="message-actions">
                  <div className="reactions">
                    <button
                      onClick={() => handleReaction(message.id, 'thumbs_up')}
                      className="reaction-btn"
                    >
                      👍 {message.reactions?.thumbs_up || 0}
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, 'heart')}
                      className="reaction-btn"
                    >
                      ❤️ {message.reactions?.heart || 0}
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, 'laugh')}
                      className="reaction-btn"
                    >
                      😂 {message.reactions?.laugh || 0}
                    </button>
                    <button
                      onClick={() => handleReaction(message.id, 'thinking')}
                      className="reaction-btn"
                    >
                      🤔 {message.reactions?.thinking || 0}
                    </button>
                  </div>

                  {!isMyMessage(message.user_hash) && (
                    <button
                      onClick={() => handleReportMessage(message.id)}
                      className="report-btn"
                      title="Report message"
                    >
                      🚩
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            ref={chatInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={anonymousSession?.isMuted ?
              "You are muted and cannot send messages" :
              "Type your message..."
            }
            maxLength={300}
            disabled={isSending || anonymousSession?.isMuted}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim() || anonymousSession?.isMuted}
            className="send-btn"
          >
            {isSending ? '⏳' : '📤'}
          </button>
        </div>

        <div className="input-info">
          <span className="char-count">{newMessage.length}/300</span>
          <small>💡 Anonymous chat • Be respectful</small>
        </div>
      </form>

      {messages.length > 0 && (
        <div className="chat-footer">
          <small>
            {messages.length} message{messages.length !== 1 ? 's' : ''} •
            Real-time updates
          </small>
        </div>
      )}

      {/* Nickname Selection Modal */}
      {showNicknameModal && (
        <div className="nickname-modal-overlay">
          <div className="nickname-modal">
            <h3>Choose Your Chat Nickname</h3>
            <p>Pick a nickname to use in this event's chat. You can change it later.</p>

            <form onSubmit={handleNicknameSubmit}>
              <div className="nickname-input-group">
                <input
                  type="text"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  placeholder={anonymousSession?.nickname || "Enter your nickname..."}
                  maxLength={20}
                  autoFocus
                />
                <div className="nickname-char-count">
                  {customNickname.length}/20
                </div>
              </div>

              {nicknameError && (
                <div className="nickname-error">
                  {nicknameError}
                </div>
              )}

              <div className="nickname-modal-actions">
                <button
                  type="button"
                  onClick={handleSkipNickname}
                  className="skip-btn"
                >
                  Use Random: {anonymousSession?.nickname}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingNickname || !customNickname.trim()}
                  className="save-nickname-btn"
                >
                  {isUpdatingNickname ? 'Saving...' : 'Save Nickname'}
                </button>
              </div>
            </form>

            <div className="nickname-tips">
              <small>
                💡 Tips: Use 3-20 characters, letters, numbers, spaces, _ and - allowed
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChat;

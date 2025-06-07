/**
 * Event Chat Service
 * Manages real-time anonymous chat for events
 */

import { ref, push, get, query, orderByChild, limitToLast, onValue, off, set, remove, serverTimestamp } from 'firebase/database';
import { database } from '../lib/firebase';
import logger from '../utils/logger';
import anonymousUserService from './anonymousUserService';

class EventChatService {
  constructor() {
    this.listeners = new Map(); // Track active listeners for cleanup
    this.rateLimitMap = new Map(); // Rate limiting per user
    this.RATE_LIMIT_MESSAGES = 5; // Max messages per minute
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
  }

  /**
   * Send a chat message
   */
  async sendMessage(eventId, message, userIdentifier = null) {
    try {
      // Get or create anonymous session
      const session = await anonymousUserService.getAnonymousSession(eventId, userIdentifier);
      
      // Check if user is muted
      if (session.isMuted) {
        throw new Error('You are currently muted and cannot send messages');
      }

      // Rate limiting check
      if (!this.checkRateLimit(session.userHash)) {
        throw new Error('You are sending messages too quickly. Please wait a moment.');
      }

      // Validate message
      const validation = this.validateMessage(message);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create message object
      const chatMessage = {
        message: message.trim(),
        nickname: session.nickname,
        user_hash: session.userHash,
        timestamp: new Date().toISOString(),
        message_type: 'text',
        reactions: {
          thumbs_up: 0,
          heart: 0,
          laugh: 0,
          thinking: 0
        },
        is_moderated: false,
        reported_count: 0,
        created_at: new Date().toISOString()
      };

      // Send message to Firebase
      const chatRef = ref(database, `event_chat/${eventId}`);
      const newMessageRef = await push(chatRef, chatMessage);

      // Update user's message count
      await anonymousUserService.incrementMessageCount(eventId, session.userHash);

      logger.log('Chat message sent:', {
        eventId,
        messageId: newMessageRef.key,
        nickname: session.nickname,
        messageLength: message.length
      });

      return {
        success: true,
        messageId: newMessageRef.key,
        message: chatMessage,
        session
      };

    } catch (error) {
      logger.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Get chat messages for an event
   */
  async getMessages(eventId, limit = 50) {
    try {
      const chatRef = ref(database, `event_chat/${eventId}`);
      const messagesQuery = query(
        chatRef,
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const snapshot = await get(messagesQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const messages = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        if (!message.is_moderated) { // Only show non-moderated messages
          messages.push({
            id: childSnapshot.key,
            ...message
          });
        }
      });

      // Sort by timestamp (oldest first for chat display)
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      logger.log(`Retrieved ${messages.length} chat messages for event ${eventId}`);
      return messages;

    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time chat messages
   */
  listenToMessages(eventId, callback, limit = 50) {
    try {
      const chatRef = ref(database, `event_chat/${eventId}`);
      const messagesQuery = query(
        chatRef,
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const unsubscribe = onValue(messagesQuery, (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const messages = [];
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (!message.is_moderated) { // Only show non-moderated messages
            messages.push({
              id: childSnapshot.key,
              ...message
            });
          }
        });

        // Sort by timestamp (oldest first for chat display)
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        callback(messages);
      });

      // Store listener for cleanup
      const listenerId = `chat_${eventId}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);

      logger.log(`Started listening to chat messages for event ${eventId}`);
      
      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
        logger.log(`Stopped listening to chat messages for event ${eventId}`);
      };

    } catch (error) {
      logger.error('Error setting up chat listener:', error);
      throw error;
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(eventId, messageId, reactionType, userIdentifier = null) {
    try {
      const session = await anonymousUserService.getAnonymousSession(eventId, userIdentifier);
      
      const validReactions = ['thumbs_up', 'heart', 'laugh', 'thinking'];
      if (!validReactions.includes(reactionType)) {
        throw new Error('Invalid reaction type');
      }

      const reactionRef = ref(database, `event_chat/${eventId}/${messageId}/reactions/${reactionType}`);
      const snapshot = await get(reactionRef);
      
      const currentCount = snapshot.exists() ? snapshot.val() : 0;
      await set(reactionRef, currentCount + 1);

      logger.log(`Reaction added: ${reactionType} to message ${messageId} by ${session.nickname}`);
      return true;

    } catch (error) {
      logger.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Report a message
   */
  async reportMessage(eventId, messageId, userIdentifier = null) {
    try {
      const session = await anonymousUserService.getAnonymousSession(eventId, userIdentifier);
      
      const reportCountRef = ref(database, `event_chat/${eventId}/${messageId}/reported_count`);
      const snapshot = await get(reportCountRef);
      
      const currentCount = snapshot.exists() ? snapshot.val() : 0;
      const newCount = currentCount + 1;
      
      await set(reportCountRef, newCount);

      // Auto-moderate if too many reports
      if (newCount >= 3) {
        await this.moderateMessage(eventId, messageId, true);
        logger.log(`Message ${messageId} auto-moderated due to reports`);
      }

      logger.log(`Message ${messageId} reported by ${session.nickname}. Total reports: ${newCount}`);
      return true;

    } catch (error) {
      logger.error('Error reporting message:', error);
      throw error;
    }
  }

  /**
   * Moderate a message (admin function)
   */
  async moderateMessage(eventId, messageId, isModerated) {
    try {
      const moderationRef = ref(database, `event_chat/${eventId}/${messageId}/is_moderated`);
      await set(moderationRef, isModerated);

      if (isModerated) {
        await set(ref(database, `event_chat/${eventId}/${messageId}/moderated_at`), new Date().toISOString());
      }

      logger.log(`Message ${messageId} ${isModerated ? 'moderated' : 'unmoderated'} in event ${eventId}`);
      return true;

    } catch (error) {
      logger.error('Error moderating message:', error);
      return false;
    }
  }

  /**
   * Delete a message (admin function)
   */
  async deleteMessage(eventId, messageId) {
    try {
      const messageRef = ref(database, `event_chat/${eventId}/${messageId}`);
      await remove(messageRef);

      logger.log(`Message ${messageId} deleted from event ${eventId}`);
      return true;

    } catch (error) {
      logger.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(eventId) {
    try {
      const chatRef = ref(database, `event_chat/${eventId}`);
      const snapshot = await get(chatRef);

      if (!snapshot.exists()) {
        return {
          totalMessages: 0,
          activeUsers: 0,
          moderatedMessages: 0,
          lastMessage: null
        };
      }

      const stats = {
        totalMessages: 0,
        activeUsers: new Set(),
        moderatedMessages: 0,
        lastMessage: null
      };

      let latestTimestamp = null;

      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        stats.totalMessages++;
        stats.activeUsers.add(message.user_hash);
        
        if (message.is_moderated) {
          stats.moderatedMessages++;
        }

        const messageTime = new Date(message.timestamp);
        if (!latestTimestamp || messageTime > latestTimestamp) {
          latestTimestamp = messageTime;
          stats.lastMessage = message.timestamp;
        }
      });

      return {
        totalMessages: stats.totalMessages,
        activeUsers: stats.activeUsers.size,
        moderatedMessages: stats.moderatedMessages,
        lastMessage: stats.lastMessage
      };

    } catch (error) {
      logger.error('Error getting chat statistics:', error);
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(userHash) {
    const now = Date.now();
    const userRateData = this.rateLimitMap.get(userHash) || { messages: [], lastReset: now };

    // Clean old messages outside the window
    userRateData.messages = userRateData.messages.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW
    );

    // Check if user has exceeded rate limit
    if (userRateData.messages.length >= this.RATE_LIMIT_MESSAGES) {
      return false;
    }

    // Add current message timestamp
    userRateData.messages.push(now);
    this.rateLimitMap.set(userHash, userRateData);

    return true;
  }

  /**
   * Validate message content
   */
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Message is required and must be a string' };
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (trimmedMessage.length > 300) {
      return { valid: false, error: 'Message must be 300 characters or less' };
    }

    // Basic profanity filter (you can expand this)
    const inappropriateWords = ['spam', 'admin', 'moderator'];
    const lowerMessage = trimmedMessage.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (lowerMessage.includes(word)) {
        return { valid: false, error: 'Message contains inappropriate content' };
      }
    }

    return { valid: true };
  }

  /**
   * Clear chat for an event (admin function)
   */
  async clearChat(eventId) {
    try {
      const chatRef = ref(database, `event_chat/${eventId}`);
      await remove(chatRef);

      logger.log(`Chat cleared for event ${eventId}`);
      return true;

    } catch (error) {
      logger.error('Error clearing chat:', error);
      return false;
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    logger.log('Cleaned up all chat listeners');
  }
}

export default new EventChatService();

/**
 * Anonymous User Service
 * Manages anonymous user identities for event chat
 */

import { ref, get, set, push } from 'firebase/database';
import { database } from '../lib/firebase';
import logger from '../utils/logger';

class AnonymousUserService {
  constructor() {
    this.nicknamePrefixes = [
      'Tech', 'Code', 'Event', 'Smart', 'Quick', 'Bright', 'Cool', 'Fast',
      'Sharp', 'Swift', 'Bold', 'Wise', 'Elite', 'Pro', 'Star', 'Ace'
    ];

    this.nicknameSuffixes = [
      'Ninja', 'Master', 'Guru', 'Expert', 'Wizard', 'Hero', 'Champion', 'Legend',
      'Genius', 'Warrior', 'Hunter', 'Seeker', 'Explorer', 'Pioneer', 'Innovator', 'Creator'
    ];
  }

  /**
   * Get or create anonymous session for user in specific event
   */
  async getAnonymousSession(eventId, userIdentifier = null, customNickname = null) {
    try {
      // Use browser fingerprint or generate random identifier
      const identifier = userIdentifier || this.generateBrowserFingerprint();
      const userHash = this.generateUserHash(identifier, eventId);

      // Check if session already exists
      const sessionRef = ref(database, `anonymous_sessions/${eventId}/${userHash}`);
      const sessionSnapshot = await get(sessionRef);

      if (sessionSnapshot.exists()) {
        const session = sessionSnapshot.val();

        // Update last active timestamp
        await set(ref(database, `anonymous_sessions/${eventId}/${userHash}/last_active`),
          new Date().toISOString());

        logger.log('Retrieved existing anonymous session:', session.nickname);
        return {
          userHash,
          nickname: session.nickname,
          avatarSeed: session.avatar_seed,
          messageCount: session.message_count || 0,
          isMuted: session.is_muted || false,
          isNewSession: false
        };
      }

      // Create new anonymous session - use custom nickname if provided
      const nickname = customNickname && this.validateNickname(customNickname) ?
        customNickname : this.generateNickname();
      const avatarSeed = this.generateAvatarSeed();

      const newSession = {
        user_hash: userHash,
        nickname: nickname,
        avatar_seed: avatarSeed,
        last_active: new Date().toISOString(),
        message_count: 0,
        is_muted: false,
        is_custom_nickname: !!customNickname,
        created_at: new Date().toISOString()
      };

      await set(sessionRef, newSession);

      logger.log('Created new anonymous session:', nickname);
      return {
        userHash,
        nickname,
        avatarSeed,
        messageCount: 0,
        isMuted: false,
        isNewSession: true
      };

    } catch (error) {
      logger.error('Error managing anonymous session:', error);
      throw error;
    }
  }

  /**
   * Update nickname for existing session
   */
  async updateNickname(eventId, userHash, newNickname) {
    try {
      if (!this.validateNickname(newNickname)) {
        throw new Error('Invalid nickname. Use 3-20 characters, letters, numbers, and underscores only.');
      }

      // Check if nickname is already taken in this event
      const isTaken = await this.isNicknameTaken(eventId, newNickname, userHash);
      if (isTaken) {
        throw new Error('This nickname is already taken. Please choose another one.');
      }

      const sessionRef = ref(database, `anonymous_sessions/${eventId}/${userHash}`);
      const sessionSnapshot = await get(sessionRef);

      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }

      // Update nickname
      await set(ref(database, `anonymous_sessions/${eventId}/${userHash}/nickname`), newNickname);
      await set(ref(database, `anonymous_sessions/${eventId}/${userHash}/is_custom_nickname`), true);
      await set(ref(database, `anonymous_sessions/${eventId}/${userHash}/nickname_updated_at`), new Date().toISOString());

      logger.log(`Nickname updated to: ${newNickname}`);
      return true;

    } catch (error) {
      logger.error('Error updating nickname:', error);
      throw error;
    }
  }

  /**
   * Check if nickname is already taken in the event
   */
  async isNicknameTaken(eventId, nickname, excludeUserHash = null) {
    try {
      const sessionsRef = ref(database, `anonymous_sessions/${eventId}`);
      const snapshot = await get(sessionsRef);

      if (!snapshot.exists()) return false;

      const sessions = snapshot.val();
      const lowerNickname = nickname.toLowerCase();

      for (const [sessionId, session] of Object.entries(sessions)) {
        if (excludeUserHash && sessionId === excludeUserHash) continue;

        if (session.nickname && session.nickname.toLowerCase() === lowerNickname) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking nickname availability:', error);
      return false;
    }
  }

  /**
   * Generate consistent user hash for anonymity
   */
  generateUserHash(identifier, eventId) {
    // Simple hash function for consistent anonymous identity
    let hash = 0;
    const str = identifier + eventId + 'salt_2024';

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Generate browser fingerprint for consistent identity
   */
  generateBrowserFingerprint() {
    // Create a simple browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Anonymous user fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // If fingerprinting fails, use localStorage or generate random
    if (!fingerprint || fingerprint.length < 50) {
      let stored = localStorage.getItem('anonymous_user_id');
      if (!stored) {
        stored = 'anon_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('anonymous_user_id', stored);
      }
      return stored;
    }

    return fingerprint;
  }

  /**
   * Generate random nickname
   */
  generateNickname() {
    const prefix = this.nicknamePrefixes[Math.floor(Math.random() * this.nicknamePrefixes.length)];
    const suffix = this.nicknameSuffixes[Math.floor(Math.random() * this.nicknameSuffixes.length)];
    const number = Math.floor(Math.random() * 999) + 1;

    return `${prefix}${suffix}${number}`;
  }

  /**
   * Generate avatar seed for consistent avatar
   */
  generateAvatarSeed() {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Update message count for user
   */
  async incrementMessageCount(eventId, userHash) {
    try {
      const sessionRef = ref(database, `anonymous_sessions/${eventId}/${userHash}`);
      const sessionSnapshot = await get(sessionRef);

      if (sessionSnapshot.exists()) {
        const currentCount = sessionSnapshot.val().message_count || 0;
        await set(ref(database, `anonymous_sessions/${eventId}/${userHash}/message_count`),
          currentCount + 1);
      }
    } catch (error) {
      logger.error('Error updating message count:', error);
    }
  }

  /**
   * Check if user is muted
   */
  async isUserMuted(eventId, userHash) {
    try {
      const sessionRef = ref(database, `anonymous_sessions/${eventId}/${userHash}/is_muted`);
      const snapshot = await get(sessionRef);
      return snapshot.exists() ? snapshot.val() : false;
    } catch (error) {
      logger.error('Error checking mute status:', error);
      return false;
    }
  }

  /**
   * Mute/unmute user (admin function)
   */
  async setUserMuteStatus(eventId, userHash, isMuted) {
    try {
      const sessionRef = ref(database, `anonymous_sessions/${eventId}/${userHash}/is_muted`);
      await set(sessionRef, isMuted);

      logger.log(`User ${userHash} ${isMuted ? 'muted' : 'unmuted'} in event ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Error setting mute status:', error);
      return false;
    }
  }

  /**
   * Get active users count for event
   */
  async getActiveUsersCount(eventId) {
    try {
      const sessionsRef = ref(database, `anonymous_sessions/${eventId}`);
      const snapshot = await get(sessionsRef);

      if (!snapshot.exists()) return 0;

      const sessions = snapshot.val();
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      let activeCount = 0;
      Object.values(sessions).forEach(session => {
        const lastActive = new Date(session.last_active);
        if (lastActive > fiveMinutesAgo) {
          activeCount++;
        }
      });

      return activeCount;
    } catch (error) {
      logger.error('Error getting active users count:', error);
      return 0;
    }
  }

  /**
   * Clean up old sessions (run periodically)
   */
  async cleanupOldSessions(eventId, hoursOld = 24) {
    try {
      const sessionsRef = ref(database, `anonymous_sessions/${eventId}`);
      const snapshot = await get(sessionsRef);

      if (!snapshot.exists()) return;

      const sessions = snapshot.val();
      const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

      const updates = {};
      Object.entries(sessions).forEach(([sessionId, session]) => {
        const lastActive = new Date(session.last_active);
        if (lastActive < cutoffTime) {
          updates[`anonymous_sessions/${eventId}/${sessionId}`] = null;
        }
      });

      if (Object.keys(updates).length > 0) {
        await set(ref(database), updates);
        logger.log(`Cleaned up ${Object.keys(updates).length} old sessions for event ${eventId}`);
      }
    } catch (error) {
      logger.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Generate avatar URL using DiceBear API
   */
  generateAvatarUrl(avatarSeed) {
    // Using DiceBear API for consistent avatars
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  }

  /**
   * Validate nickname for custom nicknames
   */
  validateNickname(nickname) {
    if (!nickname || typeof nickname !== 'string') return false;

    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 20) return false;

    // Allow letters, numbers, spaces, underscores, and hyphens
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) return false;

    // Check for inappropriate words (basic filter)
    const inappropriate = ['admin', 'moderator', 'official', 'staff', 'system', 'bot', 'null', 'undefined'];
    const lowerNickname = trimmed.toLowerCase();

    return !inappropriate.some(word => lowerNickname.includes(word));
  }

  /**
   * Get suggested nicknames if user's choice is taken
   */
  getSuggestedNicknames(baseName) {
    const suggestions = [];
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${baseName}${i}`);
      suggestions.push(`${baseName}_${i}`);
    }

    // Add some creative variations
    const suffixes = ['Pro', 'Star', 'Cool', 'Fast', 'Smart'];
    suffixes.forEach(suffix => {
      suggestions.push(`${baseName}${suffix}`);
    });

    return suggestions.slice(0, 8); // Return max 8 suggestions
  }
}

export default new AnonymousUserService();

/**
 * Data Processing Service
 * Handles data validation, transformation, and feature engineering
 */

import { EventEmitter } from 'events';
import logger from '../../utils/logger.js';
import { PIPELINE_CONFIG } from '../config/pipeline-config.js';

class DataProcessor extends EventEmitter {
  constructor(config = PIPELINE_CONFIG) {
    super();
    this.config = config;
    this.processingStats = {
      recordsProcessed: 0,
      validationErrors: 0,
      transformationErrors: 0,
      featuresGenerated: 0
    };
  }

  /**
   * Process a batch of records
   */
  async processBatch(batch) {
    try {
      logger.log(`Processing batch of ${batch.records.length} records from ${batch.source}`);

      const processedRecords = [];
      
      for (const record of batch.records) {
        try {
          // Step 1: Validate record
          const validationResult = await this.validateRecord(record);
          if (!validationResult.isValid) {
            logger.error('Record validation failed', validationResult.errors);
            this.processingStats.validationErrors++;
            
            if (this.config.processing.validation.skipInvalidRecords) {
              continue;
            }
          }

          // Step 2: Transform record
          const transformedRecord = await this.transformRecord(record);

          // Step 3: Engineer features
          const enrichedRecord = await this.engineerFeatures(transformedRecord);

          processedRecords.push(enrichedRecord);
          this.processingStats.recordsProcessed++;

        } catch (error) {
          logger.error('Error processing individual record', error);
          this.processingStats.transformationErrors++;
        }
      }

      // Emit processed batch
      this.emit('batch_processed', {
        source: batch.source,
        originalCount: batch.records.length,
        processedCount: processedRecords.length,
        records: processedRecords,
        timestamp: new Date().toISOString()
      });

      return processedRecords;

    } catch (error) {
      logger.error('Error processing batch', error);
      throw error;
    }
  }

  /**
   * Validate a single record
   */
  async validateRecord(record) {
    const errors = [];
    const rules = this.config.processing.validation.validationRules;

    // Check required fields
    for (const field of rules.required) {
      if (!record[field] || record[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    if (record.participant_email && !rules.email.test(record.participant_email)) {
      errors.push('Invalid email format');
    }

    // Validate phone format (if present)
    if (record.participant_phone && !rules.phone.test(record.participant_phone)) {
      errors.push('Invalid phone format');
    }

    // Validate event dates
    if (record.start_date) {
      const startDate = new Date(record.start_date);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start_date format');
      }
    }

    // Business logic validations
    if (record.participation_type === 'team' && !record.team_name) {
      errors.push('Team name required for team participation');
    }

    if (record.requires_payment && !record.payment_amount) {
      errors.push('Payment amount required when payment is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform record to standardized format
   */
  async transformRecord(record) {
    const transformed = { ...record };

    try {
      // Normalize text fields
      if (this.config.processing.transformation.normalizeText) {
        if (transformed.participant_name) {
          transformed.participant_name = this.normalizeText(transformed.participant_name);
        }
        if (transformed.title) {
          transformed.title = this.normalizeText(transformed.title);
        }
      }

      // Standardize dates
      if (this.config.processing.transformation.dateFormat === 'ISO') {
        if (transformed.start_date) {
          transformed.start_date = new Date(transformed.start_date).toISOString();
        }
        if (transformed.end_date) {
          transformed.end_date = new Date(transformed.end_date).toISOString();
        }
        if (transformed.created_at) {
          transformed.created_at = new Date(transformed.created_at).toISOString();
        }
      }

      // Normalize email
      if (transformed.participant_email) {
        transformed.participant_email = transformed.participant_email.toLowerCase().trim();
      }

      // Parse custom fields
      if (transformed.custom_field_responses && typeof transformed.custom_field_responses === 'string') {
        try {
          transformed.custom_field_responses = JSON.parse(transformed.custom_field_responses);
        } catch (e) {
          logger.error('Failed to parse custom_field_responses', e);
        }
      }

      // Add processing metadata
      transformed._processed_at = new Date().toISOString();
      transformed._processor_version = '1.0.0';

      return transformed;

    } catch (error) {
      logger.error('Error transforming record', error);
      throw error;
    }
  }

  /**
   * Engineer features for ML models
   */
  async engineerFeatures(record) {
    if (!this.config.processing.featureEngineering.enabled) {
      return record;
    }

    const features = { ...record };

    try {
      // Time-based features
      if (record.created_at) {
        const createdDate = new Date(record.created_at);
        features.registration_hour = createdDate.getHours();
        features.registration_day_of_week = createdDate.getDay();
        features.registration_month = createdDate.getMonth() + 1;
      }

      if (record.start_date) {
        const eventDate = new Date(record.start_date);
        features.event_hour = eventDate.getHours();
        features.event_day_of_week = eventDate.getDay();
        features.event_month = eventDate.getMonth() + 1;
        
        // Days until event
        if (record.created_at) {
          const registrationDate = new Date(record.created_at);
          features.days_until_event = Math.ceil((eventDate - registrationDate) / (1000 * 60 * 60 * 24));
        }
      }

      // Text features
      if (record.participant_email) {
        features.email_domain = record.participant_email.split('@')[1];
        features.email_length = record.participant_email.length;
      }

      if (record.participant_name) {
        features.name_length = record.participant_name.length;
        features.name_word_count = record.participant_name.split(' ').length;
      }

      // Event features
      if (record.title) {
        features.title_length = record.title.length;
        features.title_word_count = record.title.split(' ').length;
      }

      // Participation features
      features.is_team_participation = record.participation_type === 'team' ? 1 : 0;
      features.requires_payment_flag = record.requires_payment ? 1 : 0;
      
      if (record.team_members && Array.isArray(record.team_members)) {
        features.team_size = record.team_members.length;
      }

      // Payment features
      if (record.payment_amount) {
        features.payment_amount_numeric = parseFloat(record.payment_amount);
      }

      // Engagement features (would be calculated from historical data)
      features.user_engagement_score = await this.calculateEngagementScore(record);
      
      this.processingStats.featuresGenerated++;

      return features;

    } catch (error) {
      logger.error('Error engineering features', error);
      return record; // Return original record if feature engineering fails
    }
  }

  /**
   * Calculate user engagement score
   */
  async calculateEngagementScore(record) {
    // This would typically query historical data
    // For now, return a placeholder score
    try {
      let score = 0.5; // Base score

      // Increase score for team participation
      if (record.participation_type === 'team') {
        score += 0.1;
      }

      // Increase score for early registration
      if (record.days_until_event > 7) {
        score += 0.2;
      }

      // Increase score for payment completion
      if (record.payment_status === 'verified') {
        score += 0.2;
      }

      return Math.min(score, 1.0); // Cap at 1.0

    } catch (error) {
      logger.error('Error calculating engagement score', error);
      return 0.5; // Default score
    }
  }

  /**
   * Normalize text by removing extra spaces and standardizing case
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return { ...this.processingStats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.processingStats = {
      recordsProcessed: 0,
      validationErrors: 0,
      transformationErrors: 0,
      featuresGenerated: 0
    };
  }

  /**
   * Health check
   */
  healthCheck() {
    const errorRate = this.processingStats.validationErrors / 
                     Math.max(this.processingStats.recordsProcessed, 1);
    
    return {
      status: errorRate < 0.1 ? 'healthy' : 'degraded',
      errorRate,
      totalProcessed: this.processingStats.recordsProcessed,
      featuresGenerated: this.processingStats.featuresGenerated
    };
  }
}

export default DataProcessor;

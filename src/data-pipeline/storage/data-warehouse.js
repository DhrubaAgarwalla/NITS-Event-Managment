/**
 * Data Warehouse Service
 * Handles structured data storage for analytics and ML
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger.js';
import { PIPELINE_CONFIG } from '../config/pipeline-config.js';

class DataWarehouse {
  constructor(config = PIPELINE_CONFIG) {
    this.config = config;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the data warehouse
   */
  async initialize() {
    try {
      logger.log('Initializing Data Warehouse');

      // Ensure data directory exists
      const dbPath = this.config.storage.dataWarehouse.path;
      const dbDir = path.dirname(dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // Open database connection
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      logger.log('Data Warehouse initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Data Warehouse', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const tables = {
      // Dimension Tables
      dim_events: `
        CREATE TABLE IF NOT EXISTS dim_events (
          event_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          club_id TEXT,
          club_name TEXT,
          category_id TEXT,
          category_name TEXT,
          start_date TEXT,
          end_date TEXT,
          location TEXT,
          max_participants INTEGER,
          participation_type TEXT,
          requires_payment BOOLEAN,
          payment_amount REAL,
          status TEXT,
          created_at TEXT,
          updated_at TEXT,
          _processed_at TEXT
        )
      `,

      dim_users: `
        CREATE TABLE IF NOT EXISTS dim_users (
          user_id TEXT PRIMARY KEY,
          participant_name TEXT,
          participant_email TEXT UNIQUE,
          participant_phone TEXT,
          email_domain TEXT,
          first_registration_date TEXT,
          total_registrations INTEGER DEFAULT 0,
          total_attendance INTEGER DEFAULT 0,
          engagement_score REAL DEFAULT 0.5,
          created_at TEXT,
          updated_at TEXT
        )
      `,

      // Fact Tables
      fact_registrations: `
        CREATE TABLE IF NOT EXISTS fact_registrations (
          registration_id TEXT PRIMARY KEY,
          event_id TEXT,
          user_id TEXT,
          participation_type TEXT,
          team_name TEXT,
          team_size INTEGER,
          payment_status TEXT,
          payment_amount REAL,
          registration_hour INTEGER,
          registration_day_of_week INTEGER,
          days_until_event INTEGER,
          custom_fields_json TEXT,
          created_at TEXT,
          _processed_at TEXT,
          FOREIGN KEY (event_id) REFERENCES dim_events (event_id),
          FOREIGN KEY (user_id) REFERENCES dim_users (user_id)
        )
      `,

      fact_attendance: `
        CREATE TABLE IF NOT EXISTS fact_attendance (
          attendance_id TEXT PRIMARY KEY,
          registration_id TEXT,
          event_id TEXT,
          user_id TEXT,
          attendance_status TEXT,
          marked_at TEXT,
          qr_scan_method BOOLEAN DEFAULT FALSE,
          attendance_hour INTEGER,
          attendance_day_of_week INTEGER,
          created_at TEXT,
          FOREIGN KEY (registration_id) REFERENCES fact_registrations (registration_id),
          FOREIGN KEY (event_id) REFERENCES dim_events (event_id),
          FOREIGN KEY (user_id) REFERENCES dim_users (user_id)
        )
      `,

      // Aggregation Tables
      agg_event_metrics: `
        CREATE TABLE IF NOT EXISTS agg_event_metrics (
          metric_id TEXT PRIMARY KEY,
          event_id TEXT,
          metric_date TEXT,
          total_registrations INTEGER DEFAULT 0,
          total_attendance INTEGER DEFAULT 0,
          attendance_rate REAL DEFAULT 0,
          revenue REAL DEFAULT 0,
          avg_registration_time REAL,
          team_participation_rate REAL,
          created_at TEXT,
          FOREIGN KEY (event_id) REFERENCES dim_events (event_id)
        )
      `,

      agg_daily_metrics: `
        CREATE TABLE IF NOT EXISTS agg_daily_metrics (
          date TEXT PRIMARY KEY,
          total_events INTEGER DEFAULT 0,
          total_registrations INTEGER DEFAULT 0,
          total_attendance INTEGER DEFAULT 0,
          total_revenue REAL DEFAULT 0,
          avg_attendance_rate REAL DEFAULT 0,
          created_at TEXT
        )
      `
    };

    for (const [tableName, createSQL] of Object.entries(tables)) {
      try {
        await this.db.exec(createSQL);
        logger.log(`Created table: ${tableName}`);
      } catch (error) {
        logger.error(`Failed to create table ${tableName}`, error);
        throw error;
      }
    }

    // Create indexes
    await this.createIndexes();
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_events_club_id ON dim_events (club_id)',
      'CREATE INDEX IF NOT EXISTS idx_events_category_id ON dim_events (category_id)',
      'CREATE INDEX IF NOT EXISTS idx_events_start_date ON dim_events (start_date)',
      'CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON fact_registrations (event_id)',
      'CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON fact_registrations (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON fact_registrations (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON fact_attendance (event_id)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON fact_attendance (marked_at)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON dim_users (participant_email)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.db.exec(indexSQL);
      } catch (error) {
        logger.error('Failed to create index', error);
      }
    }
  }

  /**
   * Store processed records
   */
  async storeRecords(records, tableName) {
    if (!this.isInitialized) {
      throw new Error('Data Warehouse not initialized');
    }

    try {
      await this.db.exec('BEGIN TRANSACTION');

      for (const record of records) {
        await this.storeRecord(record, tableName);
      }

      await this.db.exec('COMMIT');
      logger.log(`Stored ${records.length} records in ${tableName}`);

    } catch (error) {
      await this.db.exec('ROLLBACK');
      logger.error(`Failed to store records in ${tableName}`, error);
      throw error;
    }
  }

  /**
   * Store a single record
   */
  async storeRecord(record, tableName) {
    const mappedRecord = this.mapRecordToTable(record, tableName);
    
    if (!mappedRecord) {
      return; // Skip if record doesn't map to this table
    }

    const columns = Object.keys(mappedRecord);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(mappedRecord);

    const sql = `
      INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    await this.db.run(sql, values);
  }

  /**
   * Map record to appropriate table structure
   */
  mapRecordToTable(record, tableName) {
    switch (tableName) {
      case 'dim_events':
        if (record._collection === 'events') {
          return {
            event_id: record.id,
            title: record.title,
            description: record.description,
            club_id: record.club_id,
            club_name: record.club_name,
            category_id: record.category_id,
            start_date: record.start_date,
            end_date: record.end_date,
            location: record.location,
            max_participants: record.max_participants,
            participation_type: record.participation_type,
            requires_payment: record.requires_payment ? 1 : 0,
            payment_amount: record.payment_amount,
            status: record.status,
            created_at: record.created_at,
            updated_at: record.updated_at,
            _processed_at: record._processed_at
          };
        }
        break;

      case 'fact_registrations':
        if (record._collection === 'registrations') {
          return {
            registration_id: record.id,
            event_id: record.event_id,
            user_id: record.participant_email, // Using email as user ID
            participation_type: record.participation_type,
            team_name: record.team_name,
            team_size: record.team_size,
            payment_status: record.payment_status,
            payment_amount: record.payment_amount,
            registration_hour: record.registration_hour,
            registration_day_of_week: record.registration_day_of_week,
            days_until_event: record.days_until_event,
            custom_fields_json: JSON.stringify(record.custom_field_responses || {}),
            created_at: record.created_at,
            _processed_at: record._processed_at
          };
        }
        break;

      case 'dim_users':
        if (record._collection === 'registrations' && record.participant_email) {
          return {
            user_id: record.participant_email,
            participant_name: record.participant_name,
            participant_email: record.participant_email,
            participant_phone: record.participant_phone,
            email_domain: record.email_domain,
            engagement_score: record.user_engagement_score || 0.5,
            created_at: record.created_at,
            updated_at: record._processed_at
          };
        }
        break;
    }

    return null;
  }

  /**
   * Query data for analytics
   */
  async query(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Data Warehouse not initialized');
    }

    try {
      return await this.db.all(sql, params);
    } catch (error) {
      logger.error('Query failed', error);
      throw error;
    }
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId) {
    const sql = `
      SELECT 
        e.title,
        e.start_date,
        COUNT(r.registration_id) as total_registrations,
        COUNT(a.attendance_id) as total_attendance,
        ROUND(COUNT(a.attendance_id) * 100.0 / COUNT(r.registration_id), 2) as attendance_rate,
        SUM(r.payment_amount) as total_revenue
      FROM dim_events e
      LEFT JOIN fact_registrations r ON e.event_id = r.event_id
      LEFT JOIN fact_attendance a ON r.registration_id = a.registration_id
      WHERE e.event_id = ?
      GROUP BY e.event_id
    `;

    const result = await this.query(sql, [eventId]);
    return result[0] || null;
  }

  /**
   * Get registration trends
   */
  async getRegistrationTrends(days = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations
      FROM fact_registrations
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return await this.query(sql);
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
      logger.log('Data Warehouse connection closed');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { status: 'not_initialized' };
      }

      // Test query
      await this.query('SELECT 1');
      
      return { 
        status: 'healthy',
        initialized: this.isInitialized
      };
    } catch (error) {
      return { 
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default DataWarehouse;

// server/data/database.js - Complete Database Management System
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor(config) {
    this.config = {
      path: config.path || './data/doctor.db',
      verbose: config.verbose || false,
      busyTimeout: config.busyTimeout || 30000,
      enableWAL: config.enableWAL !== false,
      enableForeignKeys: config.enableForeignKeys !== false,
      backupEnabled: config.backupEnabled !== false,
      backupInterval: config.backupInterval || 86400000, // 24 hours
      backupRetention: config.backupRetention || 7,
      backupDirectory: config.backupDirectory || './data/backups',
      ...config
    };

    this.db = null;
    this.isConnected = false;
    this.backupTimer = null;
    this.connectionPromise = null;
    
    console.log('📊 Database Manager initializing...');
    console.log(`   Database path: ${this.config.path}`);
  }

  async initialize() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  async connect() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.config.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Ensure backup directory exists
      if (this.config.backupEnabled && !fs.existsSync(this.config.backupDirectory)) {
        fs.mkdirSync(this.config.backupDirectory, { recursive: true });
      }

      // Create database connection
      this.db = new sqlite3.Database(this.config.path, (error) => {
        if (error) {
          console.error('❌ Database connection failed:', error);
          throw error;
        }
      });

      // Configure database settings
      await this.configureDatabase();
      
      // Create tables
      await this.createTables();
      
      // Set up automatic backups
      if (this.config.backupEnabled) {
        this.setupAutomaticBackups();
      }

      this.isConnected = true;
      console.log('✅ Database connection established');
      
      return this.db;

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async configureDatabase() {
    return new Promise((resolve, reject) => {
      const configurations = [];

      // Set busy timeout
      configurations.push(`PRAGMA busy_timeout = ${this.config.busyTimeout}`);
      
      // Enable foreign keys
      if (this.config.enableForeignKeys) {
        configurations.push('PRAGMA foreign_keys = ON');
      }

      // Enable WAL mode for better performance
      if (this.config.enableWAL) {
        configurations.push('PRAGMA journal_mode = WAL');
      }

      // Additional performance optimizations
      configurations.push('PRAGMA synchronous = NORMAL');
      configurations.push('PRAGMA cache_size = 10000');
      configurations.push('PRAGMA temp_store = MEMORY');

      let completed = 0;
      const total = configurations.length;

      configurations.forEach(config => {
        this.db.run(config, (error) => {
          if (error) {
            console.error(`Database configuration failed: ${config}`, error);
            reject(error);
            return;
          }
          
          completed++;
          if (completed === total) {
            console.log('⚙️ Database configuration complete');
            resolve();
          }
        });
      });
    });
  }

  async createTables() {
    console.log('📋 Creating database tables...');

    const tables = [
      // User progress tracking
      `CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        lesson_number INTEGER NOT NULL,
        topic TEXT NOT NULL,
        score REAL NOT NULL,
        answer TEXT,
        completion_time INTEGER,
        attempts INTEGER DEFAULT 1,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_number)
      )`,

      // User settings
      `CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        humor_level INTEGER DEFAULT 7,
        comics_enabled BOOLEAN DEFAULT 1,
        character_rotation BOOLEAN DEFAULT 1,
        preferred_examples TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Comic generation records
      `CREATE TABLE IF NOT EXISTS comic_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        lesson_number INTEGER NOT NULL,
        comic_prompt TEXT,
        comic_url TEXT,
        characters_used TEXT,
        generation_success BOOLEAN DEFAULT 0,
        fallback_used BOOLEAN DEFAULT 0,
        api_provider TEXT,
        generation_time INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // System events and logs
      `CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        session_id TEXT,
        user_id TEXT
      )`,

      // Performance metrics
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        metric_value REAL NOT NULL,
        context TEXT,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Character rotation history
      `CREATE TABLE IF NOT EXISTS character_rotation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_number INTEGER NOT NULL,
        primary_character TEXT NOT NULL,
        secondary_character TEXT,
        rotation_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Session tracking
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_end DATETIME,
        lessons_completed INTEGER DEFAULT 0,
        total_score REAL DEFAULT 0,
        session_duration INTEGER
      )`
    ];

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_progress_user_lesson ON user_progress(user_id, lesson_number)',
      'CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed_at)',
      'CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity)',
      'CREATE INDEX IF NOT EXISTS idx_comic_records_user_lesson ON comic_records(user_id, lesson_number)',
      'CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id, metric_type)',
      'CREATE INDEX IF NOT EXISTS idx_character_rotation_lesson ON character_rotation_history(lesson_number)'
    ];

    try {
      // Create tables
      for (const tableSQL of tables) {
        await this.run(tableSQL);
      }

      // Create indexes
      for (const indexSQL of indexes) {
        await this.run(indexSQL);
      }

      console.log('✅ Database tables and indexes created');

    } catch (error) {
      console.error('❌ Table creation failed:', error);
      throw error;
    }
  }

  // Promisified database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(error) {
        if (error) {
          reject(error);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) {
          reject(error);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // User progress methods
  async saveUserProgress(userId, lessonNumber, score, answer, completionTime, attempts = 1) {
    const sql = `
      INSERT OR REPLACE INTO user_progress 
      (user_id, lesson_number, topic, score, answer, completion_time, attempts)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Get lesson topic from curriculum
    const { getCurriculumData } = require('./curriculum');
    const curriculum = getCurriculumData();
    const lesson = curriculum.lessons.find(l => l.number === lessonNumber);
    const topic = lesson ? lesson.topic : `Lesson ${lessonNumber}`;

    return this.run(sql, [userId, lessonNumber, topic, score, answer, completionTime, attempts]);
  }

  async getUserProgress(userId) {
    const sql = `
      SELECT * FROM user_progress 
      WHERE user_id = ? 
      ORDER BY lesson_number ASC
    `;
    return this.all(sql, [userId]);
  }

  async getLessonProgress(userId, lessonNumber) {
    const sql = `
      SELECT * FROM user_progress 
      WHERE user_id = ? AND lesson_number = ?
    `;
    return this.get(sql, [userId, lessonNumber]);
  }

  // User settings methods
  async getUserSettings(userId) {
    let settings = await this.get(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (!settings) {
      // Create default settings
      await this.run(`
        INSERT INTO user_settings (user_id, humor_level, comics_enabled, character_rotation)
        VALUES (?, ?, ?, ?)
      `, [userId, 7, 1, 1]);

      settings = await this.get(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [userId]
      );
    }

    return {
      humorLevel: settings.humor_level,
      comicsEnabled: !!settings.comics_enabled,
      characterRotation: !!settings.character_rotation,
      preferredExamples: settings.preferred_examples
    };
  }

  async updateUserSettings(userId, settings) {
    const sql = `
      INSERT OR REPLACE INTO user_settings 
      (user_id, humor_level, comics_enabled, character_rotation, preferred_examples, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    return this.run(sql, [
      userId,
      settings.humorLevel || 7,
      settings.comicsEnabled ? 1 : 0,
      settings.characterRotation ? 1 : 0,
      settings.preferredExamples || null
    ]);
  }

  // Comic records methods
  async saveComicRecord(userId, comicData) {
    const sql = `
      INSERT INTO comic_records 
      (user_id, lesson_number, comic_prompt, comic_url, characters_used, 
       generation_success, fallback_used, api_provider, generation_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return this.run(sql, [
      userId,
      comicData.lessonNumber,
      comicData.comicPrompt || null,
      comicData.comicUrl || null,
      comicData.charactersUsed || null,
      comicData.generationSuccess ? 1 : 0,
      comicData.fallbackUsed ? 1 : 0,
      comicData.apiProvider || null,
      comicData.generationTime || null
    ]);
  }

  async getComicHistory(userId, limit = 10) {
    const sql = `
      SELECT * FROM comic_records 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return this.all(sql, [userId, limit]);
  }

  // Event logging methods
  async logEvent(severity, category, message, data = {}) {
    const sql = `
      INSERT INTO system_events (severity, category, message, data, session_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    return this.run(sql, [
      severity,
      category,
      message,
      JSON.stringify(data),
      process.pid.toString() // Use process ID as session identifier
    ]);
  }

  async getRecentEvents(hours = 24, severity = null) {
    let sql = `
      SELECT * FROM system_events 
      WHERE timestamp > datetime('now', '-${hours} hours')
    `;
    const params = [];

    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    sql += ' ORDER BY timestamp DESC LIMIT 1000';
    
    return this.all(sql, params);
  }

  // Performance metrics methods
  async recordPerformanceMetric(userId, metricType, value, context = null) {
    const sql = `
      INSERT INTO performance_metrics (user_id, metric_type, metric_value, context)
      VALUES (?, ?, ?, ?)
    `;

    return this.run(sql, [userId, metricType, value, context]);
  }

  async getPerformanceMetrics(userId, metricType = null, days = 30) {
    let sql = `
      SELECT * FROM performance_metrics 
      WHERE user_id = ? AND recorded_at > datetime('now', '-${days} days')
    `;
    const params = [userId];

    if (metricType) {
      sql += ' AND metric_type = ?';
      params.push(metricType);
    }

    sql += ' ORDER BY recorded_at DESC';
    
    return this.all(sql, params);
  }

  // Character rotation methods
  async saveCharacterRotation(lessonNumber, primaryCharacter, secondaryCharacter, reason) {
    const sql = `
      INSERT INTO character_rotation_history 
      (lesson_number, primary_character, secondary_character, rotation_reason)
      VALUES (?, ?, ?, ?)
    `;

    return this.run(sql, [lessonNumber, primaryCharacter, secondaryCharacter, reason]);
  }

  async getCharacterRotationHistory(limit = 50) {
    const sql = `
      SELECT * FROM character_rotation_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    return this.all(sql, [limit]);
  }

  // Analytics and reporting methods
  async generateStatusReport(userId) {
    const [progress, settings, recentActivity] = await Promise.all([
      this.getUserProgress(userId),
      this.getUserSettings(userId),
      this.getRecentEvents(24)
    ]);

    // Calculate statistics
    const totalLessons = progress.length;
    const averageScore = totalLessons > 0 
      ? progress.reduce((sum, p) => sum + p.score, 0) / totalLessons 
      : 0;
    
    const completionRate = (totalLessons / 60) * 100;
    
    // Phase progress
    const phases = {
      phase1: progress.filter(p => p.lesson_number <= 15).length,
      phase2: progress.filter(p => p.lesson_number > 15 && p.lesson_number <= 30).length,
      phase3: progress.filter(p => p.lesson_number > 30 && p.lesson_number <= 45).length,
      phase4: progress.filter(p => p.lesson_number > 45).length
    };

    return {
      userId,
      totalLessons,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      phaseProgress: phases,
      recentActivity: recentActivity.length,
      settings,
      lastActivity: progress.length > 0 
        ? progress[progress.length - 1].completed_at 
        : null,
      generatedAt: new Date().toISOString()
    };
  }

  // Database maintenance
  async vacuum() {
    console.log('🧹 Performing database maintenance...');
    await this.run('VACUUM');
    console.log('✅ Database vacuum completed');
  }

  async analyze() {
    console.log('📊 Analyzing database statistics...');
    await this.run('ANALYZE');
    console.log('✅ Database analysis completed');
  }

  async getDatabaseSize() {
    const stats = fs.statSync(this.config.path);
    return {
      bytes: stats.size,
      megabytes: Math.round(stats.size / (1024 * 1024) * 100) / 100,
      lastModified: stats.mtime
    };
  }

  // Backup management
  setupAutomaticBackups() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanOldBackups();
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }, this.config.backupInterval);

    console.log(`🔄 Automatic backups scheduled every ${this.config.backupInterval / 3600000} hours`);
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupDirectory, `doctor-backup-${timestamp}.db`);

    return new Promise((resolve, reject) => {
      const sourceDb = new sqlite3.Database(this.config.path, sqlite3.OPEN_READONLY);
      const targetDb = new sqlite3.Database(backupPath);

      sourceDb.backup(targetDb, (error) => {
        sourceDb.close();
        targetDb.close();

        if (error) {
          console.error('Backup failed:', error);
          reject(error);
        } else {
          console.log(`💾 Database backup created: ${backupPath}`);
          resolve(backupPath);
        }
      });
    });
  }

  async cleanOldBackups() {
    const backupDir = this.config.backupDirectory;
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('doctor-backup-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    const filesToDelete = files.slice(this.config.backupRetention);

    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Old backup deleted: ${file.name}`);
      } catch (error) {
        console.error(`Failed to delete backup ${file.name}:`, error);
      }
    }

    if (filesToDelete.length > 0) {
      console.log(`🧹 Cleaned ${filesToDelete.length} old backups`);
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.get('SELECT 1 as test');
      if (result && result.test === 1) {
        return {
          status: 'healthy',
          connected: this.isConnected,
          path: this.config.path,
          size: await this.getDatabaseSize(),
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Database test query failed');
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Graceful shutdown
  async close() {
    console.log('📊 Closing database connection...');
    
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((error) => {
          if (error) {
            console.error('Database close error:', error);
          } else {
            console.log('✅ Database connection closed');
          }
          this.isConnected = false;
          resolve();
        });
      });
    }
  }
}

// Factory function
async function initializeDatabase(config = {}) {
  const dbManager = new DatabaseManager(config);
  await dbManager.initialize();
  return dbManager;
}

module.exports = {
  DatabaseManager,
  initializeDatabase
};
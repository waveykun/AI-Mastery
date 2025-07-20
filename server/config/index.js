// server/config/index.js - Unified Configuration Management System
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Load environment variables

class ConfigManager {
  constructor() {
    this.config = this.buildConfiguration();
    this.validateConfiguration();
    this.setupDefaults();
    
    console.log('🔧 Configuration Manager initialized');
    console.log(`   Environment: ${this.config.environment}`);
    console.log(`   Port: ${this.config.server.port}`);
    console.log(`   APIs configured: ${this.getConfiguredAPIs().join(', ')}`);
  }

  buildConfiguration() {
    return {
      // Environment settings
      environment: process.env.NODE_ENV || 'development',
      isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      
      // Application metadata
      app: {
        name: 'AI Mastery: The Doctor',
        version: '1.0.0',
        description: 'Emergency Medical Hologram Educational System',
        author: 'Captain Tal',
        
        // Feature flags
        features: {
          comicsEnabled: this.parseBoolean(process.env.FEATURE_COMICS, true),
          characterRotation: this.parseBoolean(process.env.FEATURE_CHARACTER_ROTATION, true),
          offlineMode: this.parseBoolean(process.env.FEATURE_OFFLINE_MODE, true),
          progressTracking: this.parseBoolean(process.env.FEATURE_PROGRESS_TRACKING, true),
          analytics: this.parseBoolean(process.env.FEATURE_ANALYTICS, false),
          errorReporting: this.parseBoolean(process.env.FEATURE_ERROR_REPORTING, true),
          debugMode: this.parseBoolean(process.env.DEBUG_MODE, false)
        }
      },

      // Server configuration
      server: {
        port: parseInt(process.env.PORT) || 3001,
        host: process.env.HOST || 'localhost',
        baseUrl: process.env.BASE_URL || `http://localhost:${parseInt(process.env.PORT) || 3001}`,
        
        // CORS settings
        corsOrigins: this.parseCorsOrigins(),
        corsCredentials: this.parseBoolean(process.env.SECURITY_CORS_CREDENTIALS, true),
        
        // Request limits
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 100
      },

      // Security configuration
      security: {
        // Rate limiting
        rateLimiting: {
          enabled: this.parseBoolean(process.env.SECURITY_RATE_LIMITING, true),
          windowMs: parseInt(process.env.SECURITY_RATE_WINDOW) || 900000, // 15 minutes
          maxRequests: parseInt(process.env.SECURITY_MAX_REQUESTS) || 100,
          
          // Specific endpoint limits
          lessons: {
            windowMs: 60000, // 1 minute
            maxRequests: 30
          },
          comics: {
            windowMs: 300000, // 5 minutes
            maxRequests: 10
          },
          general: {
            windowMs: 900000, // 15 minutes
            maxRequests: 100
          }
        },
        
        // CORS configuration
        cors: {
          enabled: true,
          credentials: this.parseBoolean(process.env.SECURITY_CORS_CREDENTIALS, true),
          optionsSuccessStatus: 200
        },
        
        // Helmet security headers
        helmet: {
          enabled: this.parseBoolean(process.env.SECURITY_HELMET, true),
          contentSecurityPolicy: this.parseBoolean(process.env.SECURITY_CSP, true),
          crossOriginEmbedderPolicy: false, // Disabled for compatibility
          crossOriginResourcePolicy: { policy: 'cross-origin' }
        },
        
        // Input validation
        validation: {
          maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH) || 10000,
          enableSanitization: this.parseBoolean(process.env.ENABLE_SANITIZATION, true),
          blockMaliciousPatterns: this.parseBoolean(process.env.BLOCK_MALICIOUS_PATTERNS, true)
        },
        
        // Authentication (if implemented)
        auth: {
          enabled: this.parseBoolean(process.env.AUTH_ENABLED, false),
          sessionSecret: process.env.SESSION_SECRET || 'emh-educational-system',
          sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
          adminKey: process.env.ADMIN_KEY || null
        }
      },

      // API Configuration
      apis: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || null,
          model: process.env.OPENAI_MODEL || 'gpt-4',
          imageModel: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
          timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000,
          enabled: !!process.env.OPENAI_API_KEY,
          
          // Image generation settings
          imageSize: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
          imageQuality: process.env.OPENAI_IMAGE_QUALITY || 'standard',
          imageStyle: process.env.OPENAI_IMAGE_STYLE || 'vivid'
        },
        
        gemini: {
          apiKey: process.env.GEMINI_API_KEY || null,
          model: process.env.GEMINI_MODEL || 'gemini-pro',
          maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4000,
          temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
          timeout: parseInt(process.env.GEMINI_TIMEOUT) || 30000,
          enabled: !!process.env.GEMINI_API_KEY
        },
        
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY || null,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4000,
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT) || 30000,
          enabled: !!process.env.ANTHROPIC_API_KEY
        }
      },

      // Database configuration
      database: {
        type: 'sqlite',
        path: process.env.DB_PATH || path.join(__dirname, '../../data/doctor.db'),
        verbose: this.parseBoolean(process.env.DB_VERBOSE, false),
        
        // Connection settings
        busyTimeout: parseInt(process.env.DB_BUSY_TIMEOUT) || 30000,
        enableWAL: this.parseBoolean(process.env.DB_ENABLE_WAL, true),
        enableForeignKeys: this.parseBoolean(process.env.DB_FOREIGN_KEYS, true),
        
        // Backup settings
        backupEnabled: this.parseBoolean(process.env.DB_BACKUP_ENABLED, true),
        backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL) || 86400000, // 24 hours
        backupRetention: parseInt(process.env.DB_BACKUP_RETENTION) || 7, // 7 days
        backupDirectory: process.env.BACKUP_DIRECTORY || path.join(__dirname, '../../data/backups')
      },

      // Doctor persona configuration
      doctor: {
        baseHumorLevel: parseInt(process.env.DOCTOR_HUMOR_LEVEL) || 7,
        personalityIntensity: parseFloat(process.env.DOCTOR_PERSONALITY_INTENSITY) || 0.8,
        medicalTerminologyFrequency: parseFloat(process.env.DOCTOR_MEDICAL_TERMS) || 0.7,
        arroganceLevel: parseInt(process.env.DOCTOR_ARROGANCE) || 8,
        helpfulnessLevel: parseInt(process.env.DOCTOR_HELPFULNESS) || 6,
        responseVariety: parseInt(process.env.DOCTOR_RESPONSE_VARIETY) || 5,
        
        // Response caching
        enableResponseCache: this.parseBoolean(process.env.DOCTOR_CACHE_RESPONSES, true),
        cacheSize: parseInt(process.env.DOCTOR_CACHE_SIZE) || 1000,
        cacheTimeout: parseInt(process.env.DOCTOR_CACHE_TIMEOUT) || 300000 // 5 minutes
      },

      // Comic generation configuration  
      comics: {
        enabled: this.parseBoolean(process.env.FEATURE_COMICS, true),
        provider: process.env.COMIC_PROVIDER || 'openai',
        fallbackEnabled: this.parseBoolean(process.env.COMIC_FALLBACK_ENABLED, true),
        
        // Generation settings
        maxRetries: parseInt(process.env.COMIC_MAX_RETRIES) || 3,
        timeout: parseInt(process.env.COMIC_TIMEOUT) || 60000, // 1 minute
        
        // Style settings
        artStyle: process.env.COMIC_ART_STYLE || 'star trek lower decks animation style',
        panelCount: parseInt(process.env.COMIC_PANEL_COUNT) || 4,
        
        // Caching
        cacheEnabled: this.parseBoolean(process.env.COMIC_CACHE_ENABLED, true),
        cacheDirectory: process.env.COMIC_CACHE_DIR || path.join(__dirname, '../../data/comics'),
        cacheTimeout: parseInt(process.env.COMIC_CACHE_TIMEOUT) || 604800000, // 7 days
        maxCacheSize: parseInt(process.env.COMIC_MAX_CACHE_SIZE) || 100
      },

      // Character rotation configuration
      characterRotation: {
        enabled: this.parseBoolean(process.env.FEATURE_CHARACTER_ROTATION, true),
        
        // Rotation rules
        maxConsecutiveAppearances: parseInt(process.env.CHARACTER_MAX_CONSECUTIVE) || 3,
        minLessonsBetweenAppearances: parseInt(process.env.CHARACTER_MIN_BETWEEN) || 2,
        
        // Character settings
        talFrequency: parseInt(process.env.CHARACTER_TAL_FREQUENCY) || 0.7,
        doctorFrequency: 1.0, // Always present
        guestCharacterFrequency: parseFloat(process.env.CHARACTER_GUEST_FREQUENCY) || 0.3,
        
        // Custom character pool
        customCharacterFile: process.env.CHARACTER_POOL_FILE || null
      },

      // Logging configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: this.parseBoolean(process.env.LOG_CONSOLE, true),
        enableFile: this.parseBoolean(process.env.LOG_FILE_ENABLED, true),
        enableDatabase: this.parseBoolean(process.env.LOG_DB_ENABLED, false),
        
        // File logging settings
        logDirectory: process.env.LOG_DIRECTORY || path.join(__dirname, '../../logs'),
        maxFileSize: process.env.LOG_MAX_SIZE || '10MB',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        
        // Performance logging
        logSlowQueries: this.parseBoolean(process.env.LOG_SLOW_QUERIES, true),
        slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000, // 1 second
        
        // Error aggregation
        enableErrorAggregation: this.parseBoolean(process.env.LOG_ERROR_AGGREGATION, true),
        errorAggregationWindow: parseInt(process.env.LOG_ERROR_WINDOW) || 300000 // 5 minutes
      },

      // Performance and optimization
      performance: {
        enableCaching: this.parseBoolean(process.env.PERFORMANCE_CACHING, true),
        cacheSize: parseInt(process.env.PERFORMANCE_CACHE_SIZE) || 100,
        
        // Request optimization
        enableCompression: this.parseBoolean(process.env.PERFORMANCE_COMPRESSION, true),
        compressionLevel: parseInt(process.env.COMPRESSION_LEVEL) || 6,
        
        // Resource limits
        maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPS) || 10,
        requestTimeout: parseInt(process.env.PERFORMANCE_REQUEST_TIMEOUT) || 30000,
        
        // Memory management
        enableMemoryMonitoring: this.parseBoolean(process.env.MEMORY_MONITORING, true),
        memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 512 * 1024 * 1024 // 512MB
      },

      // Development settings
      development: {
        enableHotReload: this.parseBoolean(process.env.DEV_HOT_RELOAD, false),
        enableDebugMode: this.parseBoolean(process.env.DEV_DEBUG_MODE, false),
        enableMockAPIs: this.parseBoolean(process.env.DEV_MOCK_APIS, false),
        verboseLogging: this.parseBoolean(process.env.DEV_VERBOSE_LOGGING, false),
        
        // Testing settings
        enableTestMode: this.parseBoolean(process.env.TEST_MODE, false),
        testDataDirectory: process.env.TEST_DATA_DIR || path.join(__dirname, '../../test/data')
      },

      // Curriculum configuration
      curriculum: {
        customFile: process.env.CUSTOM_CURRICULUM_FILE || null,
        enableDynamicContent: this.parseBoolean(process.env.CURRICULUM_DYNAMIC, true),
        
        // Difficulty scaling
        difficultyProgression: process.env.CURRICULUM_DIFFICULTY || 'adaptive',
        enablePrerequisites: this.parseBoolean(process.env.CURRICULUM_PREREQUISITES, true),
        
        // Assessment settings
        enableQuizzes: this.parseBoolean(process.env.CURRICULUM_QUIZZES, true),
        passingScore: parseFloat(process.env.CURRICULUM_PASSING_SCORE) || 7.0,
        enableRemedialContent: this.parseBoolean(process.env.CURRICULUM_REMEDIAL, true)
      }
    };
  }

  // Utility methods for parsing environment variables
  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  }

  parseCorsOrigins() {
    const origins = process.env.CORS_ORIGINS;
    if (!origins) {
      return [`http://localhost:${parseInt(process.env.PORT) || 3001}`];
    }
    return origins.split(',').map(origin => origin.trim());
  }

  // Configuration validation
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    // Validate required settings
    if (this.config.server.port < 1000 || this.config.server.port > 65535) {
      errors.push('Invalid port number. Must be between 1000 and 65535.');
    }
    
    // Validate API keys format (basic validation)
    if (this.config.apis.openai.apiKey && !this.config.apis.openai.apiKey.startsWith('sk-')) {
      warnings.push('OpenAI API key format appears incorrect.');
    }
    
    // Validate directories exist or can be created
    this.validateDirectories([
      this.config.database.backupDirectory,
      this.config.logging.logDirectory,
      this.config.comics.cacheDirectory
    ], warnings);
    
    // Validate numeric ranges
    if (this.config.doctor.baseHumorLevel < 1 || this.config.doctor.baseHumorLevel > 10) {
      warnings.push('Doctor humor level should be between 1 and 10.');
    }
    
    // Report validation results
    if (errors.length > 0) {
      console.error('❌ Configuration errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      throw new Error('Configuration validation failed');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
    }
  }

  validateDirectories(directories, warnings) {
    directories.forEach(dir => {
      if (!dir) return;
      
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (error) {
        warnings.push(`Cannot create directory: ${dir}`);
      }
    });
  }

  setupDefaults() {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create necessary subdirectories
    const subdirs = ['comics', 'backups', 'temp'];
    subdirs.forEach(subdir => {
      const fullPath = path.join(dataDir, subdir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Configuration access methods
  get(path) {
    return this.getNestedValue(this.config, path);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  set(path, value) {
    this.setNestedValue(this.config, path, value);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Environment-specific configurations
  getDevelopmentConfig() {
    if (!this.config.isDevelopment) return {};
    
    return {
      enableDetailedErrors: true,
      enableStackTraces: true,
      relaxedSecurity: true,
      verboseLogging: true
    };
  }

  getProductionConfig() {
    if (!this.config.isProduction) return {};
    
    return {
      enableDetailedErrors: false,
      enableStackTraces: false,
      strictSecurity: true,
      optimizedLogging: true
    };
  }

  // Service-specific configurations
  getServiceConfig(serviceName) {
    const serviceConfigs = {
      doctor: {
        baseHumorLevel: this.config.doctor.baseHumorLevel,
        personalityTraits: {
          arrogance: this.config.doctor.arroganceLevel,
          helpfulness: this.config.doctor.helpfulnessLevel,
          medical_terminology: this.config.doctor.medicalTerminologyFrequency
        },
        caching: {
          enabled: this.config.doctor.enableResponseCache,
          size: this.config.doctor.cacheSize,
          timeout: this.config.doctor.cacheTimeout
        }
      },
      
      comics: {
        enabled: this.config.comics.enabled,
        provider: this.config.comics.provider,
        fallbackEnabled: this.config.comics.fallbackEnabled,
        artStyle: this.config.comics.artStyle,
        caching: {
          enabled: this.config.comics.cacheEnabled,
          directory: this.config.comics.cacheDirectory,
          timeout: this.config.comics.cacheTimeout
        }
      },
      
      database: {
        path: this.config.database.path,
        verbose: this.config.database.verbose,
        enableWAL: this.config.database.enableWAL,
        backup: {
          enabled: this.config.database.backupEnabled,
          directory: this.config.database.backupDirectory,
          interval: this.config.database.backupInterval
        }
      }
    };
    
    return serviceConfigs[serviceName] || {};
  }

  // API configuration helpers
  getConfiguredAPIs() {
    return Object.keys(this.config.apis).filter(api => this.config.apis[api].enabled);
  }

  getPrimaryAPI() {
    const configured = this.getConfiguredAPIs();
    if (configured.includes('openai')) return 'openai';
    if (configured.includes('gemini')) return 'gemini';
    if (configured.includes('anthropic')) return 'anthropic';
    return null;
  }

  // Security configuration
  getSecurityConfig() {
    return {
      rateLimits: this.config.security.rateLimiting,
      cors: this.config.security.cors,
      helmet: this.config.security.helmet,
      validation: this.config.security.validation
    };
  }

  // Runtime configuration updates
  updateConfig(updates) {
    Object.keys(updates).forEach(key => {
      this.set(key, updates[key]);
    });
    
    console.log('🔧 Configuration updated:', Object.keys(updates));
  }

  // Configuration export/import
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  // Status and debugging
  getConfigSummary() {
    return {
      environment: this.config.environment,
      server: {
        port: this.config.server.port,
        host: this.config.server.host
      },
      features: this.config.app.features,
      apis: Object.keys(this.config.apis).reduce((acc, api) => {
        acc[api] = {
          enabled: this.config.apis[api].enabled,
          configured: !!this.config.apis[api].apiKey
        };
        return acc;
      }, {}),
      security: {
        rateLimiting: this.config.security.rateLimiting.enabled,
        cors: this.config.security.cors.enabled,
        helmet: this.config.security.helmet.enabled
      }
    };
  }
}

// Create singleton instance
const config = new ConfigManager();

// Export configuration helpers
const rateLimits = {
  lessons: {
    windowMs: config.get('security.rateLimiting.lessons.windowMs'),
    max: config.get('security.rateLimiting.lessons.maxRequests'),
    message: {
      error: 'Too many lesson requests',
      doctorResponse: 'You are overwhelming my educational systems. Please slow down.'
    }
  },
  comics: {
    windowMs: config.get('security.rateLimiting.comics.windowMs'),
    max: config.get('security.rateLimiting.comics.maxRequests'),
    message: {
      error: 'Too many comic requests',
      doctorResponse: 'My artistic subroutines require time to recharge between creations.'
    }
  },
  general: {
    windowMs: config.get('security.rateLimiting.general.windowMs'),
    max: config.get('security.rateLimiting.general.maxRequests'),
    message: {
      error: 'Too many requests',
      doctorResponse: 'You are taxing my processing capabilities beyond acceptable limits.'
    }
  }
};

module.exports = {
  config,
  rateLimits,
  ConfigManager
};
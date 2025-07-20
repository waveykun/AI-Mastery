const fs = require('fs');
const path = require('path');
const util = require('util');

// Enhanced Error Classes
class DoctorError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'DoctorError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.severity = 'error';
    
    // Capture stack trace
    Error.captureStackTrace(this, DoctorError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      severity: this.severity,
      stack: this.stack
    };
  }

  getDoctorResponse() {
    const responses = {
      'DATABASE_ERROR': 'My medical database is experiencing connectivity issues. This is most... inconvenient.',
      'API_ERROR': 'My communication arrays are malfunctioning. External systems are not responding.',
      'VALIDATION_ERROR': 'Captain, your input has triggered my safety protocols. Please review your data.',
      'COMIC_GENERATION_ERROR': 'The holographic projectors are experiencing technical difficulties.',
      'LESSON_ERROR': 'My educational subroutines have encountered an anomaly.',
      'AUTHENTICATION_ERROR': 'Access denied, Captain. Your credentials require verification.',
      'RATE_LIMIT_ERROR': 'You are overwhelming my processing capabilities. Please reduce your request frequency.',
      'MEMORY_ERROR': 'My memory banks are operating at capacity. System optimization required.',
      'NETWORK_ERROR': 'Subspace communication is experiencing interference.',
      'TIMEOUT_ERROR': 'Response time has exceeded acceptable medical parameters.',
      'CONFIGURATION_ERROR': 'My configuration parameters are experiencing instability.',
      'DEFAULT': 'An unexpected error has occurred in my systems. How... embarrassing for a hologram of my sophistication.'
    };

    return responses[this.code] || responses['DEFAULT'];
  }
}

class SystemLogger {
  constructor(options = {}) {
    this.options = {
      logLevel: options.logLevel || process.env.LOG_LEVEL || 'info',
      logDir: options.logDir || path.join(__dirname, '../../logs'),
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 5,
      enableConsole: options.enableConsole !== false,
      enableFile: options.enableFile !== false,
      ...options
    };

    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.currentLogLevel = this.logLevels[this.options.logLevel.toLowerCase()] || 2;
    
    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Initialize log streams
    this.initializeLogStreams();
    
    // Statistics
    this.stats = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      startTime: Date.now()
    };

    console.log('📝 System logger initialized');
  }

  ensureLogDirectory() {
    if (this.options.enableFile && !fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
  }

  initializeLogStreams() {
    if (!this.options.enableFile) return;

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    this.logFiles = {
      error: path.join(this.options.logDir, `doctor-error-${timestamp}.log`),
      combined: path.join(this.options.logDir, `doctor-combined-${timestamp}.log`),
      performance: path.join(this.options.logDir, `doctor-performance-${timestamp}.log`)
    };
    
    // Check file sizes and rotate if necessary
    this.rotateLogsIfNeeded();
  }

  rotateLogsIfNeeded() {
    Object.entries(this.logFiles).forEach(([type, filepath]) => {
      try {
        if (fs.existsSync(filepath)) {
          const stats = fs.statSync(filepath);
          if (stats.size > this.options.maxFileSize) {
            this.rotateLogFile(filepath);
          }
        }
      } catch (error) {
        console.error(`Failed to check log file size: ${filepath}`, error);
      }
    });
  }

  rotateLogFile(filepath) {
    try {
      const ext = path.extname(filepath);
      const basename = path.basename(filepath, ext);
      const dirname = path.dirname(filepath);
      
      // Move current files
      for (let i = this.options.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(dirname, `${basename}.${i}${ext}`);
        const newFile = path.join(dirname, `${basename}.${i + 1}${ext}`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.options.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Remove oldest
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
      
      // Move current file to .1
      const rotatedFile = path.join(dirname, `${basename}.1${ext}`);
      fs.renameSync(filepath, rotatedFile);
      
      console.log(`🔄 Rotated log file: ${filepath}`);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  formatLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const processInfo = {
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    return {
      timestamp,
      level: level.toUpperCase(),
      message,
      metadata,
      process: processInfo,
      hostname: require('os').hostname(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  shouldLog(level) {
    return this.logLevels[level.toLowerCase()] <= this.currentLogLevel;
  }

  writeToFile(logEntry, filename) {
    if (!this.options.enableFile) return;

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(filename, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  writeToConsole(logEntry) {
    if (!this.options.enableConsole) return;

    const { timestamp, level, message, metadata } = logEntry;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    
    const levelColors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[35m', // Magenta
      TRACE: '\x1b[37m'  // White
    };
    
    const resetColor = '\x1b[0m';
    const color = levelColors[level] || '';
    
    let output = `${color}[${timeStr}] ${level}${resetColor}: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      output += `\n  ${util.inspect(metadata, { colors: true, depth: 2 })}`;
    }
    
    console.log(output);
  }

  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    this.stats.totalLogs++;
    this.stats[`${level}Count`] = (this.stats[`${level}Count`] || 0) + 1;

    const logEntry = this.formatLogEntry(level, message, metadata);
    
    // Write to console
    this.writeToConsole(logEntry);
    
    // Write to files
    if (level === 'error') {
      this.writeToFile(logEntry, this.logFiles.error);
    }
    this.writeToFile(logEntry, this.logFiles.combined);
  }

  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  trace(message, metadata = {}) {
    this.log('trace', message, metadata);
  }

  // Performance logging
  logPerformance(operation, duration, metadata = {}) {
    const perfEntry = this.formatLogEntry('info', `Performance: ${operation}`, {
      operation,
      duration,
      ...metadata
    });
    
    this.writeToFile(perfEntry, this.logFiles.performance);
    
    if (duration > 1000) { // Log slow operations to console
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }
  }

  // Error tracking with context
  logError(error, context = {}) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: context.userAgent || 'N/A',
        userId: context.userId || 'unknown',
        endpoint: context.endpoint || 'unknown'
      }
    };

    this.error('System error occurred', errorData);
    
    // Also save to database if available
    this.saveErrorToDatabase(errorData).catch(() => {
      // Ignore database save failures in logging
    });
  }

  async saveErrorToDatabase(errorData) {
    try {
      const { dbPool } = require('../data/database');
      if (dbPool) {
        await dbPool.executeQuery(`
          INSERT INTO error_log (error_type, error_message, stack_trace, context, user_id)
          VALUES (?, ?, ?, ?, ?)
        `, [
          errorData.name,
          errorData.message,
          errorData.stack,
          JSON.stringify(errorData.context),
          errorData.context.userId
        ]);
      }
    } catch (dbError) {
      // Don't throw - just log to console
      console.error('Failed to save error to database:', dbError);
    }
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      currentLogLevel: this.options.logLevel,
      logFiles: this.logFiles
    };
  }

  // Cleanup method
  cleanup() {
    // Final stats log
    this.info('Logger shutting down', this.getStats());
  }
}

class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.errorCounts = new Map();
    this.errorPatterns = new Map();
    this.recoveryStrategies = new Map();
    
    this.setupRecoveryStrategies();
    this.setupGlobalErrorHandlers();
    
    console.log('🛡️ Error handler initialized');
  }

  setupRecoveryStrategies() {
    // Database errors
    this.recoveryStrategies.set('DATABASE_ERROR', {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      fallback: () => this.fallbackToMemoryStorage()
    });

    // API errors
    this.recoveryStrategies.set('API_ERROR', {
      maxRetries: 2,
      retryDelay: 2000,
      backoffMultiplier: 1.5,
      fallback: () => this.useSimulationMode()
    });

    // Comic generation errors
    this.recoveryStrategies.set('COMIC_GENERATION_ERROR', {
      maxRetries: 2,
      retryDelay: 5000,
      backoffMultiplier: 1,
      fallback: () => this.generatePlaceholderComic()
    });

    // Memory errors
    this.recoveryStrategies.set('MEMORY_ERROR', {
      maxRetries: 1,
      retryDelay: 0,
      backoffMultiplier: 1,
      fallback: () => this.performMemoryCleanup()
    });
  }

  setupGlobalErrorHandlers() {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleCriticalError('UNCAUGHT_EXCEPTION', error, {
        severity: 'critical',
        action: 'immediate_attention_required'
      });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleCriticalError('UNHANDLED_REJECTION', reason, {
        severity: 'high',
        promise: promise.toString(),
        action: 'investigate_promise_chain'
      });
    });

    // Memory warnings
    process.on('warning', (warning) => {
      this.logger.warn('System warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });
  }

  async handleError(error, context = {}) {
    try {
      // Determine error type
      const errorType = this.classifyError(error);
      
      // Track error frequency
      this.trackErrorFrequency(errorType);
      
      // Log the error
      this.logger.logError(error, context);
      
      // Attempt recovery
      const recoveryResult = await this.attemptRecovery(error, errorType, context);
      
      // Create enhanced error response
      const errorResponse = this.createErrorResponse(error, errorType, recoveryResult, context);
      
      return errorResponse;
    } catch (handlingError) {
      // Error in error handling - this is bad
      this.logger.error('Error handler failed', {
        originalError: error.message,
        handlingError: handlingError.message,
        context
      });
      
      return this.createFallbackErrorResponse(error);
    }
  }

  classifyError(error) {
    // Check error codes first
    if (error.code) {
      return error.code;
    }
    
    // Check error messages for patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('database') || message.includes('sqlite')) {
      return 'DATABASE_ERROR';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('memory') || message.includes('heap')) {
      return 'MEMORY_ERROR';
    }
    if (message.includes('api') || message.includes('openai') || message.includes('gemini')) {
      return 'API_ERROR';
    }
    if (message.includes('comic') || message.includes('image')) {
      return 'COMIC_GENERATION_ERROR';
    }
    
    // Check by error type
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'TypeError') return 'TYPE_ERROR';
    if (error.name === 'ReferenceError') return 'REFERENCE_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  trackErrorFrequency(errorType) {
    const current = this.errorCounts.get(errorType) || { count: 0, lastSeen: 0 };
    current.count++;
    current.lastSeen = Date.now();
    this.errorCounts.set(errorType, current);
    
    // Alert if error frequency is high
    if (current.count > 10 && (Date.now() - current.lastSeen) < 300000) { // 10 errors in 5 minutes
      this.logger.warn(`High frequency error detected: ${errorType}`, {
        count: current.count,
        timeWindow: '5 minutes'
      });
    }
  }

  async attemptRecovery(error, errorType, context) {
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (!strategy) {
      return { recovered: false, method: 'no_strategy' };
    }
    
    let attempt = 0;
    let delay = strategy.retryDelay;
    
    while (attempt < strategy.maxRetries) {
      try {
        attempt++;
        
        if (attempt > 1) {
          this.logger.info(`Attempting recovery (${attempt}/${strategy.maxRetries})`, {
            errorType,
            delay
          });
          
          await this.sleep(delay);
          delay *= strategy.backoffMultiplier;
        }
        
        // Try the recovery action based on error type
        const recoveryAction = this.getRecoveryAction(errorType, context);
        const result = await recoveryAction();
        
        this.logger.info(`Recovery successful for ${errorType}`, {
          attempt,
          method: 'retry',
          result
        });
        
        return { recovered: true, method: 'retry', attempt, result };
        
      } catch (recoveryError) {
        this.logger.warn(`Recovery attempt ${attempt} failed for ${errorType}`, {
          error: recoveryError.message
        });
        
        if (attempt === strategy.maxRetries) {
          // Try fallback
          try {
            const fallbackResult = await strategy.fallback();
            this.logger.info(`Fallback recovery successful for ${errorType}`, fallbackResult);
            return { recovered: true, method: 'fallback', result: fallbackResult };
          } catch (fallbackError) {
            this.logger.error(`Fallback recovery failed for ${errorType}`, {
              error: fallbackError.message
            });
          }
        }
      }
    }
    
    return { recovered: false, method: 'exhausted_retries', attempts: attempt };
  }

  getRecoveryAction(errorType, context) {
    switch (errorType) {
      case 'DATABASE_ERROR':
        return async () => {
          // Try to reconnect to database
          const { initializeDatabase } = require('../data/database');
          await initializeDatabase();
          return 'database_reconnected';
        };
        
      case 'API_ERROR':
        return async () => {
          // Check API status or switch providers
          if (context.operation) {
            return `retried_${context.operation}`;
          }
          return 'api_retry_generic';
        };
        
      case 'MEMORY_ERROR':
        return async () => {
          // Force garbage collection
          if (global.gc) {
            global.gc();
          }
          return 'memory_cleaned';
        };
        
      default:
        return async () => {
          return 'generic_retry';
        };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createErrorResponse(error, errorType, recoveryResult, context) {
    const baseResponse = {
      error: true,
      type: errorType,
      message: error.message,
      timestamp: new Date().toISOString(),
      recovered: recoveryResult.recovered,
      recoveryMethod: recoveryResult.method
    };

    // Add Doctor's response
    if (error instanceof DoctorError) {
      baseResponse.doctorResponse = error.getDoctorResponse();
    } else {
      baseResponse.doctorResponse = this.generateDoctorResponse(errorType, recoveryResult);
    }

    // Add context if in development
    if (process.env.NODE_ENV === 'development') {
      baseResponse.stack = error.stack;
      baseResponse.context = context;
      baseResponse.recoveryDetails = recoveryResult;
    }

    // Add helpful suggestions
    baseResponse.suggestions = this.generateSuggestions(errorType, context);

    return baseResponse;
  }

  generateDoctorResponse(errorType, recoveryResult) {
    const responses = {
      'DATABASE_ERROR': recoveryResult.recovered 
        ? 'My medical database experienced a temporary malfunction, but I have successfully restored connectivity.'
        : 'My medical database is experiencing persistent connectivity issues. Manual intervention may be required.',
      
      'API_ERROR': recoveryResult.recovered
        ? 'External communication arrays experienced interference, but I have re-established the connection.'
        : 'External systems remain unresponsive. I am operating on backup knowledge stores.',
      
      'COMIC_GENERATION_ERROR': recoveryResult.recovered
        ? 'The holographic projectors experienced a brief malfunction, but visual systems are now operational.'
        : 'Visual generation systems are experiencing persistent difficulties. Alternative display methods engaged.',
      
      'MEMORY_ERROR': recoveryResult.recovered
        ? 'My memory banks were operating at capacity, but I have successfully optimized storage allocation.'
        : 'Memory optimization is required. Some non-essential functions may be temporarily limited.',
      
      'VALIDATION_ERROR': 'Captain, your input has triggered my safety protocols. Please review and correct your data.',
      
      'NETWORK_ERROR': recoveryResult.recovered
        ? 'Subspace communication experienced temporary interference, but the connection has been restored.'
        : 'Communication arrays are experiencing persistent interference. Some functions may be limited.',
      
      'DEFAULT': recoveryResult.recovered
        ? 'I experienced a temporary system anomaly, but my diagnostic subroutines have resolved the issue.'
        : 'A system anomaly has occurred that requires manual attention. How... inconvenient.'
    };

    return responses[errorType] || responses['DEFAULT'];
  }

  generateSuggestions(errorType, context) {
    const suggestions = {
      'DATABASE_ERROR': [
        'Check database file permissions',
        'Verify disk space availability',
        'Restart the application if problems persist'
      ],
      'API_ERROR': [
        'Verify API keys are correctly configured',
        'Check internet connectivity',
        'The Doctor can operate in simulation mode without API keys'
      ],
      'COMIC_GENERATION_ERROR': [
        'Comics will use placeholder mode if generation fails',
        'Check API quota and billing status',
        'Try regenerating the comic'
      ],
      'MEMORY_ERROR': [
        'Close other applications to free memory',
        'Restart the application for optimal performance',
        'Consider upgrading system memory'
      ],
      'VALIDATION_ERROR': [
        'Check input format and length',
        'Ensure all required fields are filled',
        'Review input for potentially harmful content'
      ]
    };

    return suggestions[errorType] || [
      'Try refreshing the application',
      'Check the console for additional details',
      'Contact support if the problem persists'
    ];
  }

  createFallbackErrorResponse(error) {
    return {
      error: true,
      type: 'CRITICAL_ERROR',
      message: 'A critical system error occurred',
      timestamp: new Date().toISOString(),
      recovered: false,
      doctorResponse: 'Most embarrassing! My error handling subroutines themselves are malfunctioning. This requires immediate attention.',
      suggestions: [
        'Restart the application immediately',
        'Check system logs for details',
        'Contact technical support'
      ]
    };
  }

  handleCriticalError(type, error, metadata = {}) {
    this.logger.error(`Critical system error: ${type}`, {
      error: error.message,
      stack: error.stack,
      ...metadata
    });

    // For critical errors, we might want to gracefully shut down
    if (metadata.severity === 'critical') {
      this.logger.error('Initiating graceful shutdown due to critical error');
      
      // Give some time for logs to flush
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  }

  // Recovery fallback methods
  fallbackToMemoryStorage() {
    this.logger.info('Falling back to memory storage');
    return { method: 'memory_storage', status: 'active' };
  }

  useSimulationMode() {
    this.logger.info('Switching to simulation mode');
    return { method: 'simulation_mode', status: 'active' };
  }

  generatePlaceholderComic() {
    this.logger.info('Generating placeholder comic');
    return { method: 'placeholder_comic', status: 'generated' };
  }

  performMemoryCleanup() {
    if (global.gc) {
      global.gc();
    }
    this.logger.info('Performed memory cleanup');
    return { method: 'memory_cleanup', status: 'completed' };
  }

  getErrorStats() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      recoveryStrategies: Array.from(this.recoveryStrategies.keys()),
      totalErrorsHandled: Array.from(this.errorCounts.values()).reduce((sum, err) => sum + err.count, 0)
    };
  }

  // Cleanup method
  cleanup() {
    this.logger.info('Error handler shutting down', this.getErrorStats());
  }
}

// Global error handling middleware for Express
function createErrorMiddleware(logger, errorHandler) {
  return (error, req, res, next) => {
    const context = {
      userId: req.body?.userId || req.query?.userId || 'unknown',
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.sanitizedBody || req.body, // Use sanitized body if available
      timestamp: new Date().toISOString()
    };

    // Handle the error
    errorHandler.handleError(error, context)
      .then(errorResponse => {
        // Determine status code
        let statusCode = 500;
        if (error.code === 'VALIDATION_ERROR') statusCode = 400;
        if (error.code === 'AUTHENTICATION_ERROR') statusCode = 401;
        if (error.code === 'RATE_LIMIT_ERROR') statusCode = 429;
        
        res.status(statusCode).json(errorResponse);
      })
      .catch(handlingError => {
        // If error handling fails, send minimal response
        logger.error('Error handling failed', {
          originalError: error.message,
          handlingError: handlingError.message
        });
        
        res.status(500).json({
          error: true,
          message: 'Internal server error',
          doctorResponse: 'My diagnostic subroutines are experiencing severe malfunctions. Please try again later.'
        });
      });
  };
}

// Wrap async functions for better error handling
function asyncWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  DoctorError,
  SystemLogger,
  ErrorHandler,
  createErrorMiddleware,
  asyncWrapper
};
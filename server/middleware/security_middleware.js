// server/middleware/security_middleware.js - Comprehensive Security Middleware
const rateLimit = require('express-rate-limit');

class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

class SecurityManager {
  constructor(config = {}) {
    this.config = {
      enableInputValidation: true,
      enableRateLimiting: true,
      enableSanitization: true,
      blockMaliciousPatterns: true,
      maxInputLength: 10000,
      ...config
    };

    this.blockedPatterns = this.initializeBlockedPatterns();
    this.suspiciousActivityLog = new Map();
    
    console.log('🛡️ Security Manager initialized');
    console.log(`   Input validation: ${this.config.enableInputValidation ? 'enabled' : 'disabled'}`);
    console.log(`   Rate limiting: ${this.config.enableRateLimiting ? 'enabled' : 'disabled'}`);
  }

  initializeBlockedPatterns() {
    return [
      // SQL Injection patterns
      {
        pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        type: 'sql_injection',
        severity: 'high'
      },
      {
        pattern: /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1|'|"|\-\-|\/\*|\*\/)/gi,
        type: 'sql_injection',
        severity: 'high'
      },
      
      // XSS patterns
      {
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        type: 'xss',
        severity: 'high'
      },
      {
        pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        type: 'xss',
        severity: 'high'
      },
      {
        pattern: /javascript:|data:|vbscript:|onclick|onload|onerror/gi,
        type: 'xss',
        severity: 'medium'
      },
      
      // Command injection patterns
      {
        pattern: /(\||;|&|`|\$\(|\${)/g,
        type: 'command_injection',
        severity: 'high'
      },
      {
        pattern: /(rm\s|del\s|format\s|cat\s|type\s)/gi,
        type: 'command_injection',
        severity: 'medium'
      },
      
      // Path traversal patterns
      {
        pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
        type: 'path_traversal',
        severity: 'high'
      },
      
      // Common attack patterns
      {
        pattern: /(%3C|%3E|%22|%27|%3B|%28|%29)/gi,
        type: 'encoding_attack',
        severity: 'medium'
      },
      {
        pattern: /(base64|eval\(|setTimeout\(|setInterval\()/gi,
        type: 'code_execution',
        severity: 'medium'
      },
      
      // Excessive repetition (potential DoS)
      {
        pattern: /(.)\1{50,}/g,
        type: 'dos_attempt',
        severity: 'medium'
      }
    ];
  }

  createSecurityMiddleware() {
    return (req, res, next) => {
      try {
        // Apply security checks
        this.validateRequest(req);
        this.sanitizeInput(req);
        this.checkSuspiciousActivity(req);
        
        next();
      } catch (error) {
        this.handleSecurityViolation(error, req, res);
      }
    };
  }

  validateRequest(req) {
    if (!this.config.enableInputValidation) return;

    // Check request size
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > this.config.maxInputLength) {
      throw new ValidationError('Request payload too large', 'PAYLOAD_TOO_LARGE');
    }

    // Validate critical headers
    this.validateHeaders(req);

    // Validate query parameters
    this.validateQueryParams(req);

    // Validate request body
    this.validateRequestBody(req);
  }

  validateHeaders(req) {
    const userAgent = req.get('User-Agent');
    
    // Block empty or suspicious user agents
    if (!userAgent || userAgent.length < 5) {
      throw new ValidationError('Invalid User-Agent header', 'INVALID_USER_AGENT');
    }

    // Block known malicious user agents
    const maliciousAgents = [
      'sqlmap',
      'nikto',
      'burp',
      'nessus',
      'masscan',
      'nmap'
    ];

    if (maliciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      throw new ValidationError('Blocked user agent', 'BLOCKED_USER_AGENT');
    }
  }

  validateQueryParams(req) {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      
      if (typeof value === 'string') {
        this.checkForMaliciousPatterns(value, `query.${key}`);
        
        if (value.length > 1000) {
          throw new ValidationError(`Query parameter '${key}' too long`, 'PARAM_TOO_LONG');
        }
      }
    });
  }

  validateRequestBody(req) {
    if (!req.body) return;

    // Check body size
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length > this.config.maxInputLength) {
      throw new ValidationError('Request body too large', 'BODY_TOO_LARGE');
    }

    // Recursively check all string values
    this.validateObjectRecursively(req.body, 'body');
  }

  validateObjectRecursively(obj, path = '') {
    if (typeof obj === 'string') {
      this.checkForMaliciousPatterns(obj, path);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.validateObjectRecursively(item, `${path}[${index}]`);
      });
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        this.validateObjectRecursively(obj[key], `${path}.${key}`);
      });
    }
  }

  checkForMaliciousPatterns(value, field) {
    if (!this.config.blockMaliciousPatterns || typeof value !== 'string') return;

    for (const patternInfo of this.blockedPatterns) {
      if (patternInfo.pattern.test(value)) {
        this.logSecurityEvent({
          type: patternInfo.type,
          severity: patternInfo.severity,
          field: field,
          value: value.substring(0, 100), // Log first 100 chars only
          pattern: patternInfo.pattern.source
        });

        if (patternInfo.severity === 'high') {
          throw new ValidationError(
            `Potentially malicious content detected in ${field}`,
            'MALICIOUS_CONTENT'
          );
        }
      }
    }
  }

  sanitizeInput(req) {
    if (!this.config.enableSanitization) return;

    // Sanitize query parameters
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = this.sanitizeString(req.query[key]);
      }
    });

    // Sanitize request body
    if (req.body) {
      req.body = this.sanitizeObjectRecursively(req.body);
    }
  }

  sanitizeObjectRecursively(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectRecursively(item));
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = this.sanitizeObjectRecursively(obj[key]);
      });
      return sanitized;
    }
    return obj;
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return str;

    return str
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim()
      // Remove control characters (except common ones like \n, \r, \t)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  checkSuspiciousActivity(req) {
    const clientIP = this.getClientIP(req);
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    
    if (!this.suspiciousActivityLog.has(clientIP)) {
      this.suspiciousActivityLog.set(clientIP, {
        requests: [],
        violations: 0,
        lastViolation: 0
      });
    }

    const activity = this.suspiciousActivityLog.get(clientIP);
    
    // Clean old requests
    activity.requests = activity.requests.filter(timestamp => now - timestamp < windowMs);
    
    // Add current request
    activity.requests.push(now);
    
    // Check for rapid requests (potential DoS)
    if (activity.requests.length > 100) {
      throw new ValidationError('Too many requests', 'RATE_LIMIT_EXCEEDED');
    }

    // Check for recent violations
    if (activity.violations > 5 && now - activity.lastViolation < 300000) { // 5 minutes
      throw new ValidationError('Temporary block due to violations', 'TEMPORARY_BLOCK');
    }
  }

  getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
  }

  logSecurityEvent(event) {
    const timestamp = new Date().toISOString();
    console.warn(`🚨 Security Event [${timestamp}]:`, event);

    // Update violation count for IP
    const clientIP = event.clientIP || 'unknown';
    if (this.suspiciousActivityLog.has(clientIP)) {
      const activity = this.suspiciousActivityLog.get(clientIP);
      activity.violations++;
      activity.lastViolation = Date.now();
    }
  }

  handleSecurityViolation(error, req, res) {
    const clientIP = this.getClientIP(req);
    
    this.logSecurityEvent({
      error: error.message,
      code: error.code,
      clientIP: clientIP,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Determine response based on error type
    let statusCode = 400;
    let message = 'Invalid request';

    switch (error.code) {
      case 'PAYLOAD_TOO_LARGE':
      case 'BODY_TOO_LARGE':
        statusCode = 413;
        message = 'Request payload too large';
        break;
      case 'RATE_LIMIT_EXCEEDED':
        statusCode = 429;
        message = 'Too many requests';
        break;
      case 'TEMPORARY_BLOCK':
        statusCode = 429;
        message = 'Temporary access restriction';
        break;
      case 'MALICIOUS_CONTENT':
        statusCode = 400;
        message = 'Request contains invalid content';
        break;
      case 'BLOCKED_USER_AGENT':
        statusCode = 403;
        message = 'Access denied';
        break;
      default:
        statusCode = 400;
        message = 'Invalid request';
    }

    res.status(statusCode).json({
      error: message,
      code: error.code,
      doctorResponse: this.getDoctorSecurityResponse(error.code),
      timestamp: new Date().toISOString()
    });
  }

  getDoctorSecurityResponse(errorCode) {
    const responses = {
      'PAYLOAD_TOO_LARGE': 'Your request is too large for my systems to process. Please reduce the size.',
      'RATE_LIMIT_EXCEEDED': 'You are making requests too rapidly. Please slow down.',
      'MALICIOUS_CONTENT': 'I cannot process requests containing suspicious content.',
      'BLOCKED_USER_AGENT': 'Your client is not authorized to access my systems.',
      'TEMPORARY_BLOCK': 'Access temporarily restricted due to security violations.',
      default: 'Your request could not be processed due to security restrictions.'
    };

    return responses[errorCode] || responses.default;
  }

  // Rate limiting configurations
  static createRateLimiters() {
    return {
      general: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
          error: 'Too many requests',
          doctorResponse: 'You are overwhelming my systems. Please slow down.',
          retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false
      }),

      lessons: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 30, // limit each IP to 30 lesson requests per minute
        message: {
          error: 'Too many lesson requests',
          doctorResponse: 'Educational material requests are limited. Please wait before requesting more lessons.',
          retryAfter: '1 minute'
        }
      }),

      comics: rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // limit each IP to 10 comic generations per 5 minutes
        message: {
          error: 'Too many comic requests',
          doctorResponse: 'Comic generation is resource-intensive. Please wait before requesting more visual aids.',
          retryAfter: '5 minutes'
        }
      }),

      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 auth requests per 15 minutes
        message: {
          error: 'Too many authentication attempts',
          doctorResponse: 'Too many authentication attempts. Please wait before trying again.',
          retryAfter: '15 minutes'
        }
      })
    };
  }

  // Security headers middleware
  static createSecurityHeaders() {
    return (req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions policy
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      next();
    };
  }

  // Content sanitization for responses
  static sanitizeResponse(data) {
    if (typeof data === 'string') {
      return data
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    return data;
  }

  // Cleanup method
  cleanup() {
    this.suspiciousActivityLog.clear();
    console.log('🛡️ Security Manager cleanup completed');
  }
}

module.exports = {
  SecurityManager,
  ValidationError
};
// preload.js - Electron Security Bridge
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Security: Only expose specific, safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window management
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // App information
  getVersion: () => ipcRenderer.invoke('app-get-version'),
  getPlatform: () => ipcRenderer.invoke('app-get-platform'),
  
  // Development tools (only in dev mode)
  openDevTools: () => {
    if (process.env.NODE_ENV === 'development') {
      ipcRenderer.invoke('window-open-devtools');
    }
  }
});

// Expose secure API for the AI Mastery application
contextBridge.exposeInMainWorld('AIMasteryAPI', {
  // Server communication
  server: {
    getStatus: () => fetch('/api/status').then(r => r.json()),
    getHealth: () => fetch('/health').then(r => r.json())
  },
  
  // Lesson management
  lessons: {
    submit: (answer, lessonNumber) => 
      fetch('/api/lessons/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, lessonNumber })
      }).then(r => r.json()),
    
    getProgress: () => 
      fetch('/api/progress').then(r => r.json()),
    
    getLesson: (number) => 
      fetch(`/api/lessons/${number}`).then(r => r.json())
  },
  
  // Comic management
  comics: {
    generate: (lessonNumber, context) =>
      fetch('/api/comics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonNumber, userContext: context })
      }).then(r => r.json())
  },
  
  // Settings management
  settings: {
    get: () => fetch('/api/settings').then(r => r.json()),
    
    update: (settings) =>
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      }).then(r => r.json())
  },
  
  // Reports and status
  reports: {
    getStatus: () => fetch('/api/reports/status').then(r => r.json()),
    getProgress: () => fetch('/api/reports/progress').then(r => r.json())
  },
  
  // Character rotation
  characters: {
    getRotationStatus: () => fetch('/api/characters/rotation-status').then(r => r.json()),
    getCharacterInfo: (name) => fetch(`/api/characters/info/${name}`).then(r => r.json())
  }
});

// Safe file system access for reading user uploads
contextBridge.exposeInMainWorld('fs', {
  readFile: async (filepath, options = {}) => {
    // Security: Validate file path to prevent directory traversal
    const normalizedPath = path.normalize(filepath);
    
    // Only allow reading from safe directories
    const allowedPaths = [
      process.cwd(),
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'assets'),
      path.join(process.cwd(), 'uploads')
    ];
    
    const isAllowed = allowedPaths.some(allowedPath => 
      normalizedPath.startsWith(allowedPath)
    );
    
    if (!isAllowed) {
      throw new Error('Access denied: File path not allowed');
    }
    
    try {
      if (options.encoding) {
        return fs.readFileSync(normalizedPath, options.encoding);
      } else {
        const buffer = fs.readFileSync(normalizedPath);
        return new Uint8Array(buffer);
      }
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }
});

// Doctor-specific utilities
contextBridge.exposeInMainWorld('DoctorUtils', {
  // Audio feedback (if implemented)
  playSound: (soundName) => {
    console.log(`🔊 Playing sound: ${soundName}`);
    // Could implement actual audio feedback here
  },
  
  // Notifications
  showNotification: (title, body, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, ...options });
    }
  },
  
  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  },
  
  // Performance monitoring
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  },
  
  // Diagnostic information
  getDiagnostics: () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    timestamp: new Date().toISOString()
  })
});

// Security utilities
contextBridge.exposeInMainWorld('SecurityUtils', {
  // Safe HTML sanitization (basic)
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return '';
    
    // Basic XSS prevention
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  // Validate lesson number
  validateLessonNumber: (num) => {
    const lessonNum = parseInt(num);
    return !isNaN(lessonNum) && lessonNum >= 1 && lessonNum <= 60;
  },
  
  // Validate user input length
  validateInputLength: (input, maxLength = 10000) => {
    return typeof input === 'string' && input.length <= maxLength;
  }
});

// Theme and UI utilities
contextBridge.exposeInMainWorld('UIUtils', {
  // Dark/Light mode detection
  getThemePreference: () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  // Accessibility helpers
  announceToScreenReader: (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },
  
  // Focus management
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    return {
      first: firstElement,
      last: lastElement,
      all: Array.from(focusableElements)
    };
  }
});

// Development utilities (only available in development mode)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('DevUtils', {
    log: (...args) => console.log('[DEV]', ...args),
    warn: (...args) => console.warn('[DEV]', ...args),
    error: (...args) => console.error('[DEV]', ...args),
    
    // Performance timing
    time: (label) => console.time(`[DEV] ${label}`),
    timeEnd: (label) => console.timeEnd(`[DEV] ${label}`),
    
    // Memory usage
    getMemoryInfo: () => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
      }
      return null;
    },
    
    // Debugging helpers
    inspectElement: (selector) => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`[DEV] Element: ${selector}`, {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          attributes: Array.from(element.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          })),
          styles: window.getComputedStyle(element)
        });
      } else {
        console.warn(`[DEV] Element not found: ${selector}`);
      }
    }
  });
}

// Error handling for the preload script
window.addEventListener('error', (event) => {
  console.error('[PRELOAD] Unhandled error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[PRELOAD] Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
});

// Log successful initialization
console.log('🔒 Security bridge initialized successfully');
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Node version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);

// Add a ready state indicator
window.addEventListener('DOMContentLoaded', () => {
  console.log('🎭 AI Mastery: The Doctor - Preload script ready');
  
  // Set global ready flag
  window.AIMasteryReady = true;
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('AIMasteryPreloadReady', {
    detail: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  }));
});
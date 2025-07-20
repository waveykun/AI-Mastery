// server/server.js - AI Mastery: The Doctor - Main Server (Definitive Corrected Version)
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// DOCTOR'S ORDERS: Correctly requiring all system components from their proper locations.
const { config } = require('./config/index');
const { SecurityManager } = require('./middleware/security_middleware');
const { initializeDatabase } = require('./data/database');
const { ErrorHandler, SystemLogger, createErrorMiddleware } = require('./utils/errorHandler');

// Import services
const DoctorPersona = require('./services/DoctorPersona');
const ComicService = require('./services/ComicService');
const LessonController = require('./services/LessonController');
const CharacterRotation = require('./services/CharacterRotation');

// Import modular API routers
const lessonRoutes = require('./routes/lessons');
const comicRoutes = require('./routes/comics');
const progressRoutes = require('./routes/progress');
const reportRoutes = require('./routes/reports');

class AIMasteryServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.services = {};
    this.isShuttingDown = false;
    
    this.logger = new SystemLogger({
        logDir: config.get('logging.logDirectory'),
        logLevel: config.get('logging.level')
    });
    this.errorHandler = new ErrorHandler(this.logger);
    
    this.securityManager = new SecurityManager(config.getSecurityConfig());
    
    console.log('🚀 AI Mastery: The Doctor server initializing...');
  }

  async initialize() {
    try {
      await this.initializeDatabase();
      await this.initializeServices();
      this.configureMiddleware();
      this.setupRoutes();
      this.configureErrorHandling();
      this.setupShutdownHandlers();
      
      console.log('✅ Server initialization complete');
      return true;
      
    } catch (error) {
        this.errorHandler.handleCriticalError('SERVER_INITIALIZATION', error);
        throw error;
    }
  }

  async initializeDatabase() {
    console.log('📊 Initializing database...');
    this.services.database = await initializeDatabase(config.get('database'));
    console.log('✅ Database initialization complete');
  }

  async initializeServices() {
    console.log('🔧 Initializing services...');
    this.services.doctorPersona = new DoctorPersona(config.get('doctor'));
    this.services.characterRotation = new CharacterRotation(config.get('characterRotation'));
    this.services.comicService = new ComicService({ ...config.get('comics'), openai: config.get('apis.openai') });
    this.services.lessonController = new LessonController(
        this.services.doctorPersona,
        this.services.comicService,
        this.services.characterRotation,
        this.services.database
    );
    console.log('✅ All services initialized successfully');
  }

  configureMiddleware() {
    console.log('🛡️ Configuring middleware...');
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({ origin: config.get('server.corsOrigins') }));
    this.app.use(express.json({ limit: config.get('server.maxRequestSize') }));
    
    this.app.use((req, res, next) => {
        req.app.locals.services = this.services;
        req.app.locals.config = config;
        req.app.locals.logger = this.logger;
        next();
    });
    console.log('✅ Middleware configuration complete');
  }

  setupRoutes() {
    console.log('🛣️ Setting up routes...');
    this.app.get('/health', (req, res) => res.json({ status: 'healthy', doctorStatus: 'operational' }));
    
    this.app.use('/api/lessons', lessonRoutes);
    this.app.use('/api/comics', comicRoutes);
    this.app.use('/api/progress', progressRoutes);
    this.app.use('/api/reports', reportRoutes);
    console.log('📡 API routes configured');
    
    this.app.use(express.static(path.join(__dirname, '..', 'frontend')));
    
    this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    });
    console.log('✅ Routes setup complete');
  }
  
  configureErrorHandling() {
    const errorMiddleware = createErrorMiddleware(this.logger, this.errorHandler);
    this.app.use(errorMiddleware);
    console.log('🩺 Advanced error handling protocols are active.');
  }

  setupShutdownHandlers() {
     const gracefulShutdown = async (signal) => {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
        if (this.server) this.server.close(() => console.log('HTTP server closed.'));
        if (this.services.database) await this.services.database.close();
        this.logger.info('Server shutdown complete.');
        process.exit(0);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  start() {
    this.initialize().then(() => {
        const port = config.get('server.port');
        const host = config.get('server.host');
        this.server = this.app.listen(port, host, () => {
            console.log(`\n🎭 AI Mastery: The Doctor is ready for service at http://${host}:${port}`);
            console.log('   "Please state the nature of your educational emergency."\n');
        });
    }).catch(error => {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    });
  }
} // DOCTOR'S ORDERS: This was the missing closing brace. It has been re-implanted.

if (require.main === module) {
  const server = new AIMasteryServer();
  server.start();
}

module.exports = AIMasteryServer;
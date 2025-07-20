// server/routes/api_routes_comics.js
const express = require('express');
const router = express.Router();
// DOCTOR'S ORDERS: Corrected the path to go up one level, then down into the middleware directory.
const { ValidationError } = require('../middleware/security_middleware');


// Generate comic for lesson
router.post('/generate', async (req, res) => {
  try {
    const { lessonNumber, userContext = {} } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    
    // Validate input
    if (!lessonNumber) {
      throw new ValidationError('Missing lesson number', 'MISSING_LESSON');
    }
    
    const lessonNum = parseInt(lessonNumber);
    if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 60) {
      throw new ValidationError('Invalid lesson number', 'INVALID_LESSON');
    }
    
    console.log(`🎨 Generating comic for lesson ${lessonNum} (user: ${userId})`);
    
    // Get services from app locals
    const { comicService, characterRotation, lessonController } = req.app.locals.services;
    const { getCurriculumData } = require('../data/curriculum');
    
    // Get lesson information
    const curriculum = getCurriculumData();
    const lessonInfo = curriculum.lessons.find(l => l.number === lessonNum);
    
    if (!lessonInfo) {
      throw new ValidationError('Lesson not found', 'LESSON_NOT_FOUND');
    }
    
    // Select characters for this lesson
    const characters = characterRotation.selectCharactersForLesson(lessonNum, lessonInfo, userContext);
    
    // Generate the comic
    const comic = await comicService.generateLessonComic(lessonInfo, characters, {
      userId,
      ...userContext
    });
    
    // Save comic record to database
    if (req.app.locals.services.database) {
      await req.app.locals.services.database.saveComicRecord(userId, {
        lessonNumber: lessonNum,
        comicPrompt: comic.prompt_used || 'Generated prompt',
        comicUrl: comic.image_url,
        charactersUsed: comic.characters_featured?.join(', ') || '',
        generationSuccess: comic.success,
        fallbackUsed: comic.fallback_used,
        apiProvider: comic.provider
      });
    }
    
    // Log successful generation
    await req.app.locals.services.database.logEvent('info', 'comics',
      `Comic generated for lesson ${lessonNum}`, {
        userId,
        success: comic.success,
        provider: comic.provider,
        fallbackUsed: comic.fallback_used
      }
    );
    
    console.log(`✅ Comic generated for lesson ${lessonNum} - Provider: ${comic.provider}, Success: ${comic.success}`);
    
    res.json({
      success: true,
      lessonNumber: lessonNum,
      comic: comic,
      characters: characters,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Comic generation failed:', error);
    
    // Record failed attempt
    req.security?.recordFailure('comic_generation');
    
    // Log error to database
    if (req.app.locals.services.database) {
      req.app.locals.services.database.logEvent('error', 'comics',
        'Comic generation failed', {
          error: error.message,
          userId: req.session?.userId || 'unknown',
          lessonNumber: req.body.lessonNumber
        }
      ).catch(logErr => console.error('Failed to log error:', logErr));
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Invalid request',
        code: error.code,
        doctorResponse: 'My artistic subroutines cannot process that request. Please check your parameters.'
      });
    }
    
    res.status(500).json({
      error: 'Comic generation failed',
      doctorResponse: 'My holographic imaging systems are experiencing difficulties. A fallback comic will be provided.',
      fallback: {
        success: false,
        fallback_used: true,
        description: `Comic about lesson ${req.body.lessonNumber || 'unknown'} - Generation temporarily unavailable`
      }
    });
  }
});

// Get comic history for user
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || req.session?.userId || 'captain_tal';
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    
    console.log(`📚 Fetching comic history for user: ${userId}`);
    
    const { database } = req.app.locals.services;
    const comicHistory = await database.getComicHistory(userId, limit);
    
    res.json({
      success: true,
      userId,
      comics: comicHistory,
      total: comicHistory.length
    });
    
  } catch (error) {
    console.error('Failed to fetch comic history:', error);
    
    res.status(500).json({
      error: 'Failed to fetch comic history',
      doctorResponse: 'My memory banks are experiencing access difficulties.'
    });
  }
});

// Get comic by ID
router.get('/:comicId', async (req, res) => {
  try {
    const comicId = parseInt(req.params.comicId);
    
    if (isNaN(comicId)) {
      throw new ValidationError('Invalid comic ID', 'INVALID_ID');
    }
    
    const { database } = req.app.locals.services;
    const comics = await database.query(
      'SELECT * FROM comic_history WHERE id = ?',
      [comicId]
    );
    
    if (comics.length === 0) {
      return res.status(404).json({
        error: 'Comic not found',
        doctorResponse: 'That particular artistic creation is not in my database.'
      });
    }
    
    const comic = comics[0];
    
    res.json({
      success: true,
      comic: {
        id: comic.id,
        lessonNumber: comic.lesson_number,
        comicUrl: comic.comic_url,
        charactersUsed: comic.characters_used,
        generationSuccess: comic.generation_success,
        fallbackUsed: comic.fallback_used,
        createdAt: comic.created_at,
        provider: comic.api_provider
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch comic:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch comic',
      doctorResponse: 'Error accessing my artistic archives.'
    });
  }
});

// Comic service status
router.get('/status', async (req, res) => {
  try {
    const { comicService } = req.app.locals.services;
    const status = comicService.getStatus();
    
    res.json({
      success: true,
      status: status,
      doctorResponse: status.enabled ? 
        'My artistic subroutines are operating within normal parameters.' :
        'My artistic capabilities are currently offline.'
    });
    
  } catch (error) {
    console.error('Failed to get comic service status:', error);
    
    res.status(500).json({
      error: 'Status check failed',
      doctorResponse: 'Unable to perform diagnostic on artistic systems.'
    });
  }
});

// Update comic service configuration (admin only)
router.post('/config', async (req, res) => {
  try {
    const { enabled, provider, fallbackEnabled } = req.body;
    
    // Basic validation
    if (typeof enabled !== 'undefined' && typeof enabled !== 'boolean') {
      throw new ValidationError('Invalid enabled value', 'INVALID_CONFIG');
    }
    
    if (provider && !['openai', 'gemini', 'anthropic'].includes(provider)) {
      throw new ValidationError('Invalid provider', 'INVALID_PROVIDER');
    }
    
    const { comicService } = req.app.locals.services;
    
    // Update configuration
    const updates = {};
    if (typeof enabled !== 'undefined') updates.enabled = enabled;
    if (provider) updates.provider = provider;
    if (typeof fallbackEnabled !== 'undefined') updates.fallbackEnabled = fallbackEnabled;
    
    comicService.updateConfig(updates);
    
    // Log configuration change
    await req.app.locals.services.database.logEvent('info', 'comics',
      'Comic service configuration updated', {
        updates,
        userId: req.session?.userId || 'unknown'
      }
    );
    
    console.log('🔧 Comic service configuration updated:', updates);
    
    res.json({
      success: true,
      message: 'Configuration updated',
      newStatus: comicService.getStatus(),
      doctorResponse: 'My artistic parameters have been successfully recalibrated.'
    });
    
  } catch (error) {
    console.error('Failed to update comic config:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Configuration update failed',
      doctorResponse: 'Unable to modify my artistic subroutines at this time.'
    });
  }
});

// Clear comic cache (admin only)
router.post('/cache/clear', async (req, res) => {
  try {
    const { comicService } = req.app.locals.services;
    
    comicService.clearCache();
    
    // Log cache clear
    await req.app.locals.services.database.logEvent('info', 'comics',
      'Comic cache cleared', {
        userId: req.session?.userId || 'unknown'
      }
    );
    
    console.log('🗑️ Comic cache cleared');
    
    res.json({
      success: true,
      message: 'Cache cleared',
      doctorResponse: 'My artistic memory banks have been purged and refreshed.'
    });
    
  } catch (error) {
    console.error('Failed to clear comic cache:', error);
    
    res.status(500).json({
      error: 'Cache clear failed',
      doctorResponse: 'Unable to purge my artistic memory at this time.'
    });
  }
});

// Test comic generation (development only)
router.post('/test', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        error: 'Test endpoint only available in development',
        doctorResponse: 'Testing protocols are restricted to development environments.'
      });
    }
    
    const { lessonNumber = 1 } = req.body;
    const lessonNum = parseInt(lessonNumber);
    
    const { comicService, characterRotation } = req.app.locals.services;
    const { getCurriculumData } = require('../data/curriculum');
    
    const curriculum = getCurriculumData();
    const lessonInfo = curriculum.lessons.find(l => l.number === lessonNum) || curriculum.lessons[0];
    
    const characters = characterRotation.selectCharactersForLesson(lessonNum, lessonInfo);
    
    const testComic = await comicService.testGeneration(lessonInfo, characters);
    
    console.log('🧪 Test comic generation completed');
    
    res.json({
      success: true,
      test: true,
      comic: testComic,
      characters: characters,
      lessonInfo: {
        number: lessonInfo.number,
        topic: lessonInfo.topic,
        phase: lessonInfo.phase
      }
    });
    
  } catch (error) {
    console.error('Test comic generation failed:', error);
    
    res.status(500).json({
      error: 'Test generation failed',
      doctorResponse: 'My diagnostic artistic protocols have encountered an error.'
    });
  }
});

module.exports = router;
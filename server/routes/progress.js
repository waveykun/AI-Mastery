// server/routes/api_routes_progress.js
const express = require('express');
const router = express.Router();
// DOCTOR'S ORDERS: Corrected the path to go up one level, then down into the middleware directory.
const { ValidationError } = require('../middleware/security_middleware');


// Get user progress
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || req.session?.userId || 'captain_tal';
    
    console.log(`📊 Fetching progress for user: ${userId}`);
    
    const { database } = req.app.locals.services;
    
    // Get comprehensive progress data
    const [progress, metrics, settings] = await Promise.all([
      database.getUserProgress(userId),
      database.getPerformanceMetrics(userId),
      database.getUserSettings(userId)
    ]);
    
    // Calculate additional statistics
    const stats = calculateProgressStats(progress);
    
    res.json({
      success: true,
      userId,
      progress: progress,
      metrics: metrics,
      settings: settings,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    
    res.status(500).json({
      error: 'Failed to fetch progress',
      doctorResponse: 'Unable to access your medical records... I mean, educational progress.'
    });
  }
});

// Get progress for specific lesson
router.get('/lesson/:lessonNumber', async (req, res) => {
  try {
    const lessonNumber = parseInt(req.params.lessonNumber);
    const userId = req.query.userId || req.session?.userId || 'captain_tal';
    
    if (isNaN(lessonNumber) || lessonNumber < 1 || lessonNumber > 60) {
      throw new ValidationError('Invalid lesson number', 'INVALID_LESSON');
    }
    
    const { database } = req.app.locals.services;
    
    const progress = await database.query(`
      SELECT * FROM user_progress 
      WHERE user_id = ? AND lesson_number = ?
    `, [userId, lessonNumber]);
    
    res.json({
      success: true,
      userId,
      lessonNumber,
      progress: progress[0] || null,
      completed: progress.length > 0
    });
    
  } catch (error) {
    console.error('Failed to fetch lesson progress:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch lesson progress',
      doctorResponse: 'Unable to locate that specific educational record.'
    });
  }
});

// Update user progress manually
router.post('/update', async (req, res) => {
  try {
    const { lessonNumber, score, notes } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    
    // Validate input
    if (!lessonNumber || score === undefined) {
      throw new ValidationError('Missing required fields', 'MISSING_FIELDS');
    }
    
    const lessonNum = parseInt(lessonNumber);
    const scoreNum = parseFloat(score);
    
    if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 60) {
      throw new ValidationError('Invalid lesson number', 'INVALID_LESSON');
    }
    
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      throw new ValidationError('Invalid score (must be 0-10)', 'INVALID_SCORE');
    }
    
    const { database } = req.app.locals.services;
    
    // Update progress
    await database.saveUserProgress(userId, {
      lessonNumber: lessonNum,
      score: scoreNum,
      notes: notes || 'Manual update',
      timeSpent: 0
    });
    
    // Recalculate performance metrics
    await database.updatePerformanceMetrics(userId);
    
    // Log the update
    await database.logEvent('info', 'progress',
      `Progress updated for lesson ${lessonNum}`, {
        userId,
        score: scoreNum,
        manual: true
      }
    );
    
    console.log(`📝 Progress updated for user ${userId}, lesson ${lessonNum}: ${scoreNum}`);
    
    res.json({
      success: true,
      userId,
      lessonNumber: lessonNum,
      score: scoreNum,
      message: 'Progress updated successfully',
      doctorResponse: 'Your educational records have been updated accordingly.'
    });
    
  } catch (error) {
    console.error('Failed to update progress:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Failed to update progress',
      doctorResponse: 'Unable to modify your educational records at this time.'
    });
  }
});

// Reset user progress
router.post('/reset', async (req, res) => {
  try {
    const { resetType = 'all', lessonNumber } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    
    const { database } = req.app.locals.services;
    
    if (resetType === 'lesson' && lessonNumber) {
      // Reset specific lesson
      const lessonNum = parseInt(lessonNumber);
      if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 60) {
        throw new ValidationError('Invalid lesson number', 'INVALID_LESSON');
      }
      
      await database.run(`
        DELETE FROM user_progress WHERE user_id = ? AND lesson_number = ?
      `, [userId, lessonNum]);
      
      console.log(`🔄 Reset progress for user ${userId}, lesson ${lessonNum}`);
      
      res.json({
        success: true,
        resetType: 'lesson',
        lessonNumber: lessonNum,
        message: 'Lesson progress reset',
        doctorResponse: `Lesson ${lessonNum} progress has been cleared from your records.`
      });
      
    } else if (resetType === 'all') {
      // Reset all progress
      await database.run(`DELETE FROM user_progress WHERE user_id = ?`, [userId]);
      await database.run(`DELETE FROM quiz_history WHERE user_id = ?`, [userId]);
      await database.run(`DELETE FROM performance_metrics WHERE user_id = ?`, [userId]);
      
      console.log(`🔄 Reset all progress for user ${userId}`);
      
      res.json({
        success: true,
        resetType: 'all',
        message: 'All progress reset',
        doctorResponse: 'Your complete educational history has been purged. Starting fresh, Captain.'
      });
      
    } else {
      throw new ValidationError('Invalid reset type', 'INVALID_RESET_TYPE');
    }
    
    // Log the reset
    await database.logEvent('info', 'progress',
      `Progress reset: ${resetType}`, {
        userId,
        resetType,
        lessonNumber: lessonNumber || null
      }
    );
    
  } catch (error) {
    console.error('Failed to reset progress:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Failed to reset progress',
      doctorResponse: 'Unable to purge your educational records at this time.'
    });
  }
});

// Get progress statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId || req.session?.userId || 'captain_tal';
    
    const { database } = req.app.locals.services;
    
    // Get detailed statistics
    const [progress, quizHistory, comicHistory] = await Promise.all([
      database.getUserProgress(userId),
      database.getQuizHistory(userId),
      database.getComicHistory(userId)
    ]);
    
    const stats = {
      overall: calculateProgressStats(progress),
      quiz: calculateQuizStats(quizHistory),
      comics: calculateComicStats(comicHistory),
      trends: calculateTrends(progress),
      recommendations: generateRecommendations(progress, quizHistory)
    };
    
    res.json({
      success: true,
      userId,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to calculate statistics:', error);
    
    res.status(500).json({
      error: 'Failed to calculate statistics',
      doctorResponse: 'My analytical subroutines are experiencing difficulties.'
    });
  }
});

// Export progress data
router.get('/export', async (req, res) => {
  try {
    const userId = req.query.userId || req.session?.userId || 'captain_tal';
    const format = req.query.format || 'json';
    
    if (!['json', 'csv'].includes(format)) {
      throw new ValidationError('Invalid export format', 'INVALID_FORMAT');
    }
    
    const { database } = req.app.locals.services;
    
    // Get all user data
    const [progress, quizHistory, comicHistory, metrics, settings] = await Promise.all([
      database.getUserProgress(userId),
      database.getQuizHistory(userId),
      database.getComicHistory(userId),
      database.getPerformanceMetrics(userId),
      database.getUserSettings(userId)
    ]);
    
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      progress,
      quizHistory,
      comicHistory,
      metrics,
      settings,
      statistics: calculateProgressStats(progress)
    };
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ai-mastery-progress-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      const csv = convertProgressToCSV(progress);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ai-mastery-progress-${userId}-${Date.now()}.csv"`);
      res.send(csv);
    }
    
    // Log the export
    await database.logEvent('info', 'progress',
      `Progress exported in ${format} format`, {
        userId,
        format,
        recordCount: progress.length
      }
    );
    
    console.log(`📤 Progress exported for user ${userId} in ${format} format`);
    
  } catch (error) {
    console.error('Failed to export progress:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Failed to export progress',
      doctorResponse: 'Unable to compile your educational records for export.'
    });
  }
});

// Update user settings
router.post('/settings', async (req, res) => {
  try {
    const { humorLevel, comicsEnabled, characterRotation, preferredExamples } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    
    // Validate settings
    const settings = {};
    
    if (humorLevel !== undefined) {
      const humor = parseInt(humorLevel);
      if (isNaN(humor) || humor < 1 || humor > 10) {
        throw new ValidationError('Invalid humor level (1-10)', 'INVALID_HUMOR');
      }
      settings.humorLevel = humor;
    }
    
    if (comicsEnabled !== undefined) {
      settings.comicsEnabled = !!comicsEnabled;
    }
    
    if (characterRotation !== undefined) {
      settings.characterRotation = !!characterRotation;
    }
    
    if (preferredExamples !== undefined) {
      if (!['startrek', 'dota2', 'anime'].includes(preferredExamples)) {
        throw new ValidationError('Invalid preferred examples', 'INVALID_EXAMPLES');
      }
      settings.preferredExamples = preferredExamples;
    }
    
    const { database } = req.app.locals.services;
    
    // Update settings
    await database.updateUserSettings(userId, settings);
    
    // Log the change
    await database.logEvent('info', 'progress',
      'User settings updated', {
        userId,
        settings
      }
    );
    
    console.log(`⚙️ Settings updated for user ${userId}:`, settings);
    
    res.json({
      success: true,
      userId,
      updatedSettings: settings,
      message: 'Settings updated successfully',
      doctorResponse: 'Your preferences have been updated in my medical... educational database.'
    });
    
  } catch (error) {
    console.error('Failed to update settings:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({
      error: 'Failed to update settings',
      doctorResponse: 'Unable to modify your preference settings at this time.'
    });
  }
});

// Helper functions
function calculateProgressStats(progress) {
  if (!progress || progress.length === 0) {
    return {
      totalLessons: 0,
      averageScore: 0,
      completionRate: 0,
      totalTimeSpent: 0,
      phase1Complete: 0,
      phase2Complete: 0,
      phase3Complete: 0,
      phase4Complete: 0
    };
  }
  
  const totalLessons = progress.length;
  const averageScore = progress.reduce((sum, p) => sum + p.score, 0) / totalLessons;
  const completionRate = (totalLessons / 60) * 100;
  const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
  
  // Calculate phase completion
  const phase1Complete = progress.filter(p => p.lesson_number <= 15).length;
  const phase2Complete = progress.filter(p => p.lesson_number > 15 && p.lesson_number <= 30).length;
  const phase3Complete = progress.filter(p => p.lesson_number > 30 && p.lesson_number <= 45).length;
  const phase4Complete = progress.filter(p => p.lesson_number > 45).length;
  
  return {
    totalLessons,
    averageScore: Math.round(averageScore * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    totalTimeSpent: Math.round(totalTimeSpent / 60000), // Convert to minutes
    phase1Complete,
    phase2Complete,
    phase3Complete,
    phase4Complete,
    recentAverage: calculateRecentAverage(progress),
    bestScore: Math.max(...progress.map(p => p.score)),
    worstScore: Math.min(...progress.map(p => p.score))
  };
}

function calculateRecentAverage(progress) {
  if (progress.length === 0) return 0;
  const recent = progress.slice(-5);
  return Math.round((recent.reduce((sum, p) => sum + p.score, 0) / recent.length) * 100) / 100;
}

function calculateQuizStats(quizHistory) {
  if (!quizHistory || quizHistory.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      correctAnswers: 0,
      incorrectAnswers: 0
    };
  }
  
  const totalQuizzes = quizHistory.length;
  const correctAnswers = quizHistory.filter(q => q.is_correct).length;
  const incorrectAnswers = totalQuizzes - correctAnswers;
  const averageScore = quizHistory.reduce((sum, q) => sum + q.score, 0) / totalQuizzes;
  
  return {
    totalQuizzes,
    averageScore: Math.round(averageScore * 100) / 100,
    correctAnswers,
    incorrectAnswers,
    accuracy: Math.round((correctAnswers / totalQuizzes) * 100)
  };
}

function calculateComicStats(comicHistory) {
  if (!comicHistory || comicHistory.length === 0) {
    return {
      totalComics: 0,
      successfulGenerations: 0,
      fallbackUsed: 0
    };
  }
  
  const totalComics = comicHistory.length;
  const successfulGenerations = comicHistory.filter(c => c.generation_success).length;
  const fallbackUsed = comicHistory.filter(c => c.fallback_used).length;
  
  return {
    totalComics,
    successfulGenerations,
    fallbackUsed,
    successRate: Math.round((successfulGenerations / totalComics) * 100)
  };
}

function calculateTrends(progress) {
  if (progress.length < 5) return { trend: 'insufficient_data' };
  
  const recent = progress.slice(-5).map(p => p.score);
  const earlier = progress.slice(-10, -5).map(p => p.score);
  
  if (earlier.length === 0) return { trend: 'baseline' };
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  
  const difference = recentAvg - earlierAvg;
  
  return {
    trend: difference > 0.5 ? 'improving' : difference < -0.5 ? 'declining' : 'stable',
    difference: Math.round(difference * 100) / 100,
    recentAverage: Math.round(recentAvg * 100) / 100,
    earlierAverage: Math.round(earlierAvg * 100) / 100
  };
}

function generateRecommendations(progress, quizHistory) {
  const recommendations = [];
  
  if (progress.length === 0) {
    recommendations.push("Start with Lesson 1 to begin your AI mastery journey");
    return recommendations;
  }
  
  const avgScore = progress.reduce((sum, p) => sum + p.score, 0) / progress.length;
  
  if (avgScore < 6.0) {
    recommendations.push("Consider reviewing fundamental concepts before advancing");
    recommendations.push("Take more time with each lesson to ensure understanding");
  }
  
  if (avgScore > 8.0) {
    recommendations.push("Excellent progress! Consider exploring advanced topics");
    recommendations.push("You're ready for more challenging lessons");
  }
  
  const recent = progress.slice(-3);
  if (recent.length >= 3 && recent.every(p => p.score < 6.0)) {
    recommendations.push("Consider taking a break and reviewing previous lessons");
  }
  
  return recommendations;
}

function convertProgressToCSV(progress) {
  const headers = ['Lesson Number', 'Score', 'Completed At', 'Time Spent (minutes)', 'Notes'];
  const rows = progress.map(p => [
    p.lesson_number,
    p.score,
    p.completed_at,
    Math.round((p.time_spent || 0) / 60000),
    (p.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;
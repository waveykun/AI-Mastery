const express = require('express');
const router = express.Router();
// DOCTOR'S ORDERS: Corrected the path to go up one level, then down into the middleware directory.
const { ValidationError } = require('../middleware/security_middleware');


// Submit lesson answer
router.post('/submit', async (req, res) => {
  try {
    const { lessonNumber, answer, timestamp } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    
    // Validate input
    if (!lessonNumber || !answer) {
      throw new ValidationError('Missing required fields', 'MISSING_FIELDS');
    }
    
    // Sanitize inputs
    const sanitizedAnswer = req.security.validateInput(answer, 'lesson_answer', 5000);
    const lessonNum = parseInt(lessonNumber);
    
    if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 60) {
      throw new ValidationError('Invalid lesson number', 'INVALID_LESSON');
    }
    
    console.log(`📚 Processing lesson ${lessonNum} submission from ${userId}`);
    
    // Get services from app locals
    const { lessonController, database } = req.app.locals.services;
    
    // Execute complete 6-step lesson protocol
    const lessonResponse = await lessonController.executeCompleteLesson(
      sanitizedAnswer, 
      lessonNum
    );
    
    // Save progress to database
    await database.saveUserProgress(userId, {
      lessonNumber: lessonNum,
      score: lessonResponse.score || 7.0,
      answer: sanitizedAnswer,
      timeSpent: timestamp ? Date.now() - timestamp : 0,
      notes: `Lesson completed at ${new Date().toISOString()}`
    });
    
    // Log successful submission
    await database.logEvent('info', 'lessons', 
      `Lesson ${lessonNum} completed`, {
        userId,
        score: lessonResponse.score,
        lessonTopic: lessonResponse.topic
      }
    );
    
    console.log(`✅ Lesson ${lessonNum} completed successfully - Score: ${lessonResponse.score || 'N/A'}`);
    
    res.json({
      success: true,
      lessonNumber: lessonNum,
      ...lessonResponse,
      timestamp: Date.now(),
      doctorResponse: lessonResponse.doctorSummary || "Lesson completed, Captain. Proceed when ready."
    });
    
  } catch (error) {
    console.error('❌ Lesson submission failed:', error);
    
    // Record failed attempt
    const ip = req.ip || 'unknown';
    req.security.recordFailure('lesson_submission');
    
    // Log error to database
    if (req.app.locals.services.database) {
      req.app.locals.services.database.logEvent('error', 'lessons',
        'Lesson submission failed', {
          error: error.message,
          userId: req.session?.userId || 'unknown',
          ip: ip
        }
      ).catch(logErr => console.error('Failed to log error:', logErr));
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation failed',
        code: error.code,
        doctorResponse: 'Your submission contains elements my systems cannot process safely. Please review and try again.'
      });
    }
    
    res.status(500).json({
      error: 'Lesson processing failed',
      doctorResponse: 'My educational subroutines encountered an unexpected error. Please try again.',
      lessonNumber: req.body.lessonNumber || 1
    });
  }
});

// Get current lesson information
router.get('/current', async (req, res) => {
  try {
    const userId = req.query.userId || req.session?.userId || 'captain_tal';
    const { database, lessonController } = req.app.locals.services;
    
    // Get user progress
    const progress = await database.getUserProgress(userId);
    const currentLessonNumber = progress.currentLesson || 1;
    
    // Get lesson information
    const lessonInfo = await lessonController.getCurrentLessonInfo(currentLessonNumber);
    
    res.json({
      success: true,
      currentLesson: currentLessonNumber,
      lessonInfo,
      progress: {
        totalLessons: progress.totalLessons,
        averageScore: progress.averageScore,
        lastActivity: progress.lastActivity
      },
      doctorResponse: `Ready for lesson ${currentLessonNumber}, Captain.`
    });
    
  } catch (error) {
    console.error('❌ Failed to get current lesson:', error);
    
    res.status(500).json({
      error: 'Could not retrieve lesson information',
      doctorResponse: 'My educational database is experiencing access difficulties.',
      currentLesson: 1,
      lessonInfo: {
        lessonNumber: 1,
        topic: 'Text-to-Image Basics',
        phase: 'Foundations',
        difficulty: 'beginner'
      }
    });
  }
});

// Get lesson by number
router.get('/:lessonNumber', async (req, res) => {
  try {
    const lessonNumber = parseInt(req.params.lessonNumber);
    
    if (isNaN(lessonNumber) || lessonNumber < 1 || lessonNumber > 60) {
      return res.status(400).json({
        error: 'Invalid lesson number',
        doctorResponse: 'That lesson number is not within my educational parameters.'
      });
    }
    
    const { lessonController } = req.app.locals.services;
    const lessonInfo = await lessonController.getCurrentLessonInfo(lessonNumber);
    
    res.json({
      success: true,
      lessonInfo,
      doctorResponse: `Lesson ${lessonNumber} information retrieved, Captain.`
    });
    
  } catch (error) {
    console.error('❌ Failed to get lesson:', error);
    
    res.status(500).json({
      error: 'Lesson retrieval failed',
      doctorResponse: 'Unable to access the requested lesson data.'
    });
  }
});

// Get lesson history for user
router.get('/history/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || req.session?.userId || 'captain_tal';
    const limit = parseInt(req.query.limit) || 20;
    const { database } = req.app.locals.services;
    
    // Get lesson progress history
    const progress = await database.getUserProgress(userId);
    const lessons = progress.lessons.slice(0, limit);
    
    // Get quiz history
    const quizHistory = await database.getQuizHistory(userId, null);
    
    res.json({
      success: true,
      userId,
      totalLessons: progress.totalLessons,
      averageScore: progress.averageScore,
      lessons,
      quizHistory,
      doctorResponse: `Educational history retrieved for ${userId}.`
    });
    
  } catch (error) {
    console.error('❌ Failed to get lesson history:', error);
    
    res.status(500).json({
      error: 'History retrieval failed',
      doctorResponse: 'Unable to access your educational records at this time.'
    });
  }
});

// Reset user progress (admin function)
router.post('/reset', async (req, res) => {
  try {
    const userId = req.body.userId || req.session?.userId || 'captain_tal';
    const confirmReset = req.body.confirm === true;
    
    if (!confirmReset) {
      return res.status(400).json({
        error: 'Reset confirmation required',
        doctorResponse: 'Are you certain you wish to purge all educational records? This action cannot be undone.'
      });
    }
    
    const { database } = req.app.locals.services;
    
    // Reset progress by deleting all records for user
    await database.run('DELETE FROM lesson_progress WHERE user_id = ?', [userId]);
    await database.run('DELETE FROM quiz_results WHERE user_id = ?', [userId]);
    await database.run('DELETE FROM comic_history WHERE user_id = ?', [userId]);
    await database.run('DELETE FROM performance_metrics WHERE user_id = ?', [userId]);
    await database.run('DELETE FROM character_rotation WHERE user_id = ?', [userId]);
    await database.run('DELETE FROM remedial_focus WHERE user_id = ?', [userId]);
    
    // Log the reset
    await database.logEvent('info', 'lessons', 'Progress reset', {
      userId,
      resetBy: req.session?.userId || 'system',
      timestamp: Date.now()
    });
    
    console.log(`🔄 Progress reset for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'All progress reset',
      doctorResponse: 'Your training records have been... purged, Captain. We begin anew with a clean slate.'
    });
    
  } catch (error) {
    console.error('❌ Progress reset failed:', error);
    res.status(500).json({
      error: 'Reset failed',
      doctorResponse: 'Unable to reset training data. My systems refuse to comply.'
    });
  }
});

// Get curriculum overview
router.get('/curriculum/overview', async (req, res) => {
  try {
    const { getCurriculumData } = require('../data/curriculum');
    const curriculum = getCurriculumData();
    
    // Return overview without full content for performance
    const overview = {
      totalLessons: curriculum.lessons.length,
      phases: curriculum.phases,
      topics: curriculum.lessons.map(l => ({
        number: l.number,
        topic: l.topic,
        phase: l.phase,
        difficulty: l.difficulty,
        emoji: l.emoji
      })),
      milestones: curriculum.milestones,
      version: curriculum.version
    };
    
    res.json({
      success: true,
      curriculum: overview,
      doctorResponse: 'Educational curriculum overview compiled.'
    });
    
  } catch (error) {
    console.error('❌ Failed to get curriculum:', error);
    res.status(500).json({
      error: 'Curriculum access failed',
      doctorResponse: 'My educational database is experiencing access difficulties.'
    });
  }
});

// Generate quiz for current phase
router.post('/quiz/generate', async (req, res) => {
  try {
    const { phase, lessonRange, questionCount } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    const { lessonController, database } = req.app.locals.services;
    
    // Validate inputs
    const validPhases = ['Foundations', 'Intermediate Tools', 'Advanced Control', 'Cutting-Edge & Specialized'];
    if (phase && !validPhases.includes(phase)) {
      return res.status(400).json({
        error: 'Invalid phase',
        doctorResponse: 'That educational phase is not recognized in my curriculum.'
      });
    }
    
    const numQuestions = Math.min(Math.max(parseInt(questionCount) || 10, 5), 25);
    
    // Get user progress to determine appropriate quiz level
    const progress = await database.getUserProgress(userId);
    const targetPhase = phase || 'Foundations';
    
    // Generate quiz questions based on completed lessons
    const quiz = {
      id: `quiz_${Date.now()}`,
      phase: targetPhase,
      questionCount: numQuestions,
      timeLimit: numQuestions * 120, // 2 minutes per question
      questions: [], // Would be populated with actual questions
      generatedAt: new Date().toISOString(),
      userId
    };
    
    // For now, return a placeholder structure
    // In a full implementation, this would generate actual questions
    res.json({
      success: true,
      quiz,
      doctorResponse: `Quiz generated for ${targetPhase} phase. ${numQuestions} questions await your attention, Captain.`
    });
    
  } catch (error) {
    console.error('❌ Quiz generation failed:', error);
    res.status(500).json({
      error: 'Quiz generation failed',
      doctorResponse: 'My examination protocols are malfunctioning.'
    });
  }
});

// Submit quiz answers
router.post('/quiz/submit', async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const userId = req.session?.userId || 'captain_tal';
    const { database } = req.app.locals.services;
    
    if (!quizId || !answers) {
      throw new ValidationError('Missing quiz data', 'MISSING_QUIZ_DATA');
    }
    
    // Validate answers format
    if (!Array.isArray(answers)) {
      throw new ValidationError('Invalid answers format', 'INVALID_ANSWERS');
    }
    
    // Calculate score (placeholder logic)
    const totalQuestions = answers.length;
    const correctAnswers = Math.floor(totalQuestions * (0.6 + Math.random() * 0.4)); // Simulate scoring
    const score = (correctAnswers / totalQuestions) * 100;
    
    // Save quiz result
    const resultId = await database.saveQuizResult(userId, {
      quizType: 'phase',
      quizId,
      score,
      maxScore: 100,
      answers,
      timeTaken: timeTaken || 0
    });
    
    // Determine performance level
    let performanceLevel = 'needs_improvement';
    let doctorComment = 'Your performance requires significant improvement.';
    
    if (score >= 85) {
      performanceLevel = 'excellent';
      doctorComment = 'Exceptional performance! I am genuinely impressed.';
    } else if (score >= 70) {
      performanceLevel = 'good';
      doctorComment = 'Satisfactory work. You demonstrate competence.';
    } else if (score >= 55) {
      performanceLevel = 'acceptable';
      doctorComment = 'Adequate performance, though improvement is needed.';
    }
    
    console.log(`🎯 Quiz completed: ${userId} scored ${score.toFixed(1)}%`);
    
    res.json({
      success: true,
      resultId,
      score: score.toFixed(1),
      totalQuestions,
      correctAnswers,
      performanceLevel,
      doctorResponse: doctorComment,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Quiz submission failed:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Invalid quiz submission',
        code: error.code,
        doctorResponse: 'Your quiz data is corrupted or incomplete.'
      });
    }
    
    res.status(500).json({
      error: 'Quiz processing failed',
      doctorResponse: 'My examination systems have encountered an error.'
    });
  }
});

// Get available lesson topics for search/filtering
router.get('/topics/search', async (req, res) => {
  try {
    const { query, phase, difficulty } = req.query;
    const { getCurriculumData } = require('../data/curriculum');
    const curriculum = getCurriculumData();
    
    let lessons = curriculum.lessons;
    
    // Filter by phase
    if (phase) {
      lessons = lessons.filter(lesson => lesson.phase === phase);
    }
    
    // Filter by difficulty
    if (difficulty) {
      lessons = lessons.filter(lesson => lesson.difficulty === difficulty);
    }
    
    // Search by query
    if (query) {
      const searchTerm = query.toLowerCase();
      lessons = lessons.filter(lesson => 
        lesson.topic.toLowerCase().includes(searchTerm) ||
        lesson.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }
    
    // Return simplified results
    const results = lessons.map(lesson => ({
      number: lesson.number,
      topic: lesson.topic,
      phase: lesson.phase,
      difficulty: lesson.difficulty,
      emoji: lesson.emoji,
      keywords: lesson.keywords
    }));
    
    res.json({
      success: true,
      results,
      totalFound: results.length,
      doctorResponse: `Found ${results.length} lessons matching your criteria.`
    });
    
  } catch (error) {
    console.error('❌ Topic search failed:', error);
    res.status(500).json({
      error: 'Search failed',
      doctorResponse: 'My educational index is currently inaccessible.',
      results: []
    });
  }
});

module.exports = router;
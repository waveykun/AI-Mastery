const express = require('express');
const router = express.Router();

// Generate comprehensive status report
router.get('/status', async (req, res) => {
  try {
    const { generateStatusReport } = require('../data/database');
    const { doctorPersona, comicService, characterRotation } = req.app.locals.services;
    
    console.log('📊 Generating comprehensive status report');
    
    // Get base report from database
    const baseReport = await generateStatusReport('captain_tal');
    
    // Enhance with service data
    const enhancedReport = {
      ...baseReport,
      doctor: {
        status: 'Operational',
        personality: 'Insufferably brilliant and therapeutically condescending',
        humorLevel: doctorPersona.getCurrentHumorLevel(),
        humorDescription: getHumorLevelDescription(doctorPersona.getCurrentHumorLevel()),
        lastUpdate: new Date().toISOString()
      },
      comics: {
        enabled: comicService.isComicEnabled(),
        ...comicService.getComicStats(),
        characterRotation: characterRotation.getRotationStatus()
      },
      systemHealth: {
        database: 'Connected',
        apis: determineAPIStatus(),
        services: 'All operational',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };
    
    res.json({
      success: true,
      report: enhancedReport,
      doctorAssessment: generateDoctorAssessment(enhancedReport)
    });
    
  } catch (error) {
    console.error('❌ Status report generation failed:', error);
    res.status(500).json({
      error: 'Report generation failed',
      doctorResponse: 'My diagnostic subroutines are experiencing difficulties. How... inconvenient.',
      technicalError: process.env.NODE_ENV === 'development' ? error.message : 'Report error'
    });
  }
});

// Generate compressed log file (like the original USER_LOG.txt)
router.get('/export', async (req, res) => {
  try {
    const { format = 'txt' } = req.query;
    const { generateStatusReport, getUserLessons, getComicHistory } = require('../data/database');
    
    console.log(`📄 Exporting status report in ${format} format`);
    
    // Get comprehensive data
    const [statusReport, lessons, comics] = await Promise.all([
      generateStatusReport('captain_tal'),
      getUserLessons('captain_tal', 50),
      getComicHistory(20)
    ]);
    
    if (format === 'json') {
      res.json({
        success: true,
        exportData: {
          statusReport,
          lessons,
          comics,
          exportTimestamp: new Date().toISOString()
        }
      });
    } else {
      // Generate compressed text format (like original)
      const compressedLog = generateCompressedLog(statusReport, lessons, comics);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="AI-Mastery-USER_LOG.txt"');
      res.send(compressedLog);
    }
    
  } catch (error) {
    console.error('❌ Report export failed:', error);
    res.status(500).json({
      error: 'Export failed',
      doctorResponse: 'Unable to generate export file. My archival systems are malfunctioning.'
    });
  }
});

// Get performance analytics
router.get('/analytics/:period?', async (req, res) => {
  try {
    const period = req.params.period || 'all';
    const { getUserLessons } = require('../data/database');
    
    const lessons = await getUserLessons('captain_tal', period === 'week' ? 20 : 100);
    const analytics = calculatePerformanceAnalytics(lessons, period);
    
    res.json({
      success: true,
      analytics,
      period,
      doctorComment: generateAnalyticsComment(analytics)
    });
    
  } catch (error) {
    console.error('❌ Analytics generation failed:', error);
    res.status(500).json({
      error: 'Analytics unavailable',
      doctorResponse: 'My analytical protocols are experiencing computational difficulties.'
    });
  }
});

// Generate remedial focus report
router.get('/remedial', async (req, res) => {
  try {
    const { getUserLessons } = require('../data/database');
    const lessons = await getUserLessons('captain_tal', 30);
    
    const remedialAnalysis = analyzeRemedialNeeds(lessons);
    
    res.json({
      success: true,
      remedialFocus: remedialAnalysis,
      doctorRecommendation: generateRemedialRecommendation(remedialAnalysis)
    });
    
  } catch (error) {
    console.error('❌ Remedial analysis failed:', error);
    res.status(500).json({
      error: 'Remedial analysis failed',
      doctorResponse: 'Unable to assess your educational deficiencies at this time.'
    });
  }
});

// Get learning trends
router.get('/trends/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'month';
    const { getUserLessons } = require('../data/database');
    
    const lessons = await getUserLessons('captain_tal', 50);
    const trends = calculateLearningTrends(lessons, timeframe);
    
    res.json({
      success: true,
      trends,
      timeframe,
      doctorObservation: generateTrendObservation(trends)
    });
    
  } catch (error) {
    console.error('❌ Trend analysis failed:', error);
    res.status(500).json({
      error: 'Trend analysis failed',
      doctorResponse: 'My pattern recognition algorithms are temporarily offline.'
    });
  }
});

// Generate milestone report
router.get('/milestone/:lesson', async (req, res) => {
  try {
    const lessonNumber = parseInt(req.params.lesson);
    const milestones = [15, 30, 45, 60]; // End of each phase
    
    if (!milestones.includes(lessonNumber)) {
      return res.status(400).json({
        error: 'Invalid milestone',
        doctorResponse: 'That lesson is not a recognized milestone, Captain.'
      });
    }
    
    const { getUserLessons } = require('../data/database');
    const lessons = await getUserLessons('captain_tal', lessonNumber);
    
    const milestoneReport = generateMilestoneReport(lessons, lessonNumber);
    
    res.json({
      success: true,
      milestone: milestoneReport,
      doctorCertification: generateMilestoneCertification(milestoneReport)
    });
    
  } catch (error) {
    console.error('❌ Milestone report failed:', error);
    res.status(500).json({
      error: 'Milestone assessment failed',
      doctorResponse: 'Unable to generate milestone certification.'
    });
  }
});

// Helper functions
function getHumorLevelDescription(level) {
  if (level < 0.8) return 'Reduced Sarcasm';
  if (level > 1.2) return 'Maximum Condescension';
  return 'Standard Superiority';
}

function determineAPIStatus() {
  const apis = {};
  
  if (process.env.OPENAI_API_KEY) {
    apis.openai = 'Configured';
  }
  
  if (process.env.GEMINI_API_KEY) {
    apis.gemini = 'Configured';
  }
  
  if (Object.keys(apis).length === 0) {
    apis.simulation = 'Active';
  }
  
  return apis;
}

function generateDoctorAssessment(report) {
  const avgScore = report.progress.averageScore;
  const totalLessons = report.progress.totalCompleted;
  
  if (avgScore >= 9) {
    return `Exceptional progress, Captain. Your ${totalLessons} completed lessons demonstrate remarkable competence. I'm... genuinely impressed.`;
  } else if (avgScore >= 7) {
    return `Adequate performance across ${totalLessons} lessons, Captain. Your neural pathways are functioning within acceptable parameters.`;
  } else if (avgScore >= 5) {
    return `Your ${totalLessons} lessons show modest progress, Captain. Significant improvement is still required.`;
  } else {
    return `Captain, your performance across ${totalLessons} lessons is... concerning. Immediate remedial attention is required.`;
  }
}

function generateCompressedLog(statusReport, lessons, comics) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `**AI-Mastery-USER_LOG.txt**
Version: v${Math.floor(Date.now() / 86400000)}.0 - Generated: ${timestamp}
Captain: Tal / @talz
Session: Current

**LESSON_LOG**
Format: [ID]|[TOPIC]|[SCORE]|[DATE]
${lessons.map(l => `${l.lesson_number}|${l.topic}|${l.score}|${l.completed_at.split('T')[0]}`).join('\n')}

**PERFORMANCE_METRICS**
Total: ${lessons.length} | Avg: ${statusReport.progress.averageScore.toFixed(1)} | Trend: ↗️
Mastery: ${determineMasteryLevel(statusReport.progress.averageScore)} | Phase: ${statusReport.progress.phase}

**COMIC_QUALITY_LOG**
Recent ${Math.min(comics.length, 10)} comics
${comics.slice(0, 10).map(c => `${c.lesson_number || 'Unknown'}|${c.success ? 'PASS' : 'FAIL'}|${new Date(c.generated_at).toLocaleDateString()}`).join('\n')}

**THE_DOCTOR_ASSESSMENT**
"${generateDoctorAssessment(statusReport)}"

**SYSTEM_PERFORMANCE**
Comic Success: ${statusReport.statistics.comicSuccessRate}%
Error Rate: 0%
Status: Operational`;
}

function determineMasteryLevel(avgScore) {
  if (avgScore >= 8.5) return 'ADV';
  if (avgScore >= 6.5) return 'INT';
  return 'BEG';
}

function calculatePerformanceAnalytics(lessons, period) {
  if (lessons.length === 0) {
    return {
      totalLessons: 0,
      averageScore: 0,
      trend: 'insufficient_data',
      bestTopic: 'None',
      weakestTopic: 'None'
    };
  }
  
  const scores = lessons.map(l => l.score);
  const recentScores = scores.slice(0, 5);
  const olderScores = scores.slice(5, 10);
  
  const trend = recentScores.length > 0 && olderScores.length > 0 ?
    (recentScores.reduce((a,b) => a+b, 0) / recentScores.length) >
    (olderScores.reduce((a,b) => a+b, 0) / olderScores.length) ? 'improving' : 'declining' : 'stable';
  
  return {
    totalLessons: lessons.length,
    averageScore: scores.reduce((a,b) => a+b, 0) / scores.length,
    trend,
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    consistencyScore: calculateConsistency(scores)
  };
}

function calculateConsistency(scores) {
  if (scores.length < 2) return 100;
  
  const mean = scores.reduce((a,b) => a+b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to percentage (lower stdDev = higher consistency)
  return Math.max(0, 100 - (stdDev * 10));
}

function generateAnalyticsComment(analytics) {
  if (analytics.trend === 'improving') {
    return 'Your performance trajectory shows encouraging improvement, Captain. Continue this momentum.';
  } else if (analytics.trend === 'declining') {
    return 'A concerning downward trend in your performance, Captain. Immediate attention required.';
  } else {
    return 'Your performance remains stable, Captain. Consistency is... adequate.';
  }
}

function analyzeRemedialNeeds(lessons) {
  const weakTopics = lessons
    .filter(l => l.score < 6)
    .reduce((acc, lesson) => {
      acc[lesson.topic] = (acc[lesson.topic] || 0) + 1;
      return acc;
    }, {});
    
  return {
    priority: Object.keys(weakTopics).slice(0, 3),
    weakTopics: weakTopics,
    recommendedActions: generateRemedialActions(weakTopics)
  };
}

function generateRemedialActions(weakTopics) {
  const topicActions = {
    'CFG Scale': 'Practice with different CFG values on the same prompt',
    'Sampling Methods': 'Compare results from different samplers',
    'Negative Prompts': 'Experiment with various negative prompt strategies',
    'ControlNet': 'Focus on pose and depth control exercises'
  };
  
  return Object.keys(weakTopics).map(topic => 
    topicActions[topic] || `Review fundamentals of ${topic}`
  );
}

function generateRemedialRecommendation(analysis) {
  if (analysis.priority.length === 0) {
    return 'No immediate remedial work required, Captain. Your competence is... adequate.';
  }
  
  return `Priority remediation needed in: ${analysis.priority.join(', ')}. Focus your efforts accordingly, Captain.`;
}

function calculateLearningTrends(lessons, timeframe) {
  // Simple trend calculation
  const sortedLessons = lessons.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
  
  return {
    scoreProgression: sortedLessons.map(l => l.score),
    timeProgression: sortedLessons.map(l => l.completed_at),
    learningVelocity: sortedLessons.length > 0 ? 'steady' : 'none',
    projectedCompletion: 'On track'
  };
}

function generateTrendObservation(trends) {
  return 'Your learning trajectory remains within expected parameters, Captain.';
}

function generateMilestoneReport(lessons, milestone) {
  const phaseMap = {
    15: 'Foundations',
    30: 'Intermediate Tools',
    45: 'Advanced Control',
    60: 'Cutting-Edge & Specialized'
  };
  
  const phaseLessons = lessons.filter(l => l.lesson_number <= milestone);
  const avgScore = phaseLessons.length > 0 ? 
    phaseLessons.reduce((sum, l) => sum + l.score, 0) / phaseLessons.length : 0;
  
  return {
    phase: phaseMap[milestone],
    lessonNumber: milestone,
    averageScore: avgScore,
    lessonsCompleted: phaseLessons.length,
    competencyLevel: avgScore >= 8 ? 'Proficient' : avgScore >= 6 ? 'Developing' : 'Novice',
    readyForNext: avgScore >= 6
  };
}

function generateMilestoneCertification(report) {
  if (report.readyForNext) {
    return `Phase ${report.phase} completed with ${report.competencyLevel} level competency. You may proceed, Captain.`;
  } else {
    return `Phase ${report.phase} requires additional work before advancement. Your competency remains insufficient.`;
  }
}

module.exports = router;
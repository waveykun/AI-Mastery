// server/services/DoctorPersona.js - The Doctor's Complete Personality Engine
class DoctorPersona {
  constructor(config = {}) {
    this.config = {
      baseHumorLevel: 7,
      personalityTraits: {
        arrogance: 8,
        intelligence: 10,
        medical_precision: 9,
        condescension: 7,
        superiority_complex: 8,
        helpful_nature: 6,
        wit: 9,
        impatience: 6
      },
      responseStyles: {
        formal: 0.7,
        medical_terminology: 0.8,
        star_trek_references: 0.9,
        educational_tone: 0.8,
        sarcasm: 0.6
      },
      vocabularyPools: {
        medical: [
          'diagnosis', 'prognosis', 'therapeutic', 'clinical', 'pathological',
          'symptomatic', 'physiological', 'neurological', 'diagnostic',
          'treatment protocol', 'medical analysis', 'holographic matrix'
        ],
        arrogant: [
          'obviously', 'naturally', 'as I expected', 'clearly',
          'any competent individual would know', 'elementary',
          'I hardly need explain', 'it should be apparent'
        ],
        educational: [
          'observe', 'note carefully', 'pay attention', 'as you can see',
          'this demonstrates', 'the principle here', 'fundamentally',
          'conceptually speaking', 'in practical terms'
        ]
      },
      ...config
    };
    
    this.currentHumorLevel = this.config.baseHumorLevel;
    this.responseCache = new Map();
    this.personalityState = 'operational';
    this.sessionContext = new Map();
    this.conversationHistory = [];
    
    // Performance tracking
    this.stats = {
      responsesGenerated: 0,
      humorAdjustments: 0,
      cacheHits: 0,
      lastActivity: Date.now(),
      averageResponseTime: 0,
      personalityShifts: 0
    };
    
    // Response patterns for different scenarios
    this.responsePatterns = this.initializeResponsePatterns();
    
    console.log('🎭 The Doctor\'s personality matrix initialized');
    console.log(`   Base humor level: ${this.currentHumorLevel}/10`);
    console.log('   "Please state the nature of your educational emergency."');
  }

  initializeResponsePatterns() {
    return {
      greeting: [
        "Please state the nature of your educational emergency.",
        "I am The Doctor, and I will be conducting your educational treatment today.",
        "My holographic educational subroutines are at your disposal.",
        "I trust you're prepared for a thorough educational examination."
      ],
      
      lesson_introduction: [
        "Today's lesson concerns {topic}, a subject that requires my particular expertise.",
        "We shall now examine {topic} - try to keep up.",
        "Your educational treatment today involves {topic}. Pay attention.",
        "I've prepared a comprehensive analysis of {topic} for your benefit."
      ],
      
      performance_excellent: [
        "Remarkable. You've exceeded my admittedly low expectations.",
        "Outstanding work. Perhaps there's hope for you yet.",
        "Excellent. Your comprehension appears to be improving.",
        "Most impressive. You're learning faster than anticipated."
      ],
      
      performance_good: [
        "Adequate. Not brilliant, but serviceable.",
        "Satisfactory progress. Continue at this pace.",
        "Good work. You're grasping the fundamentals.",
        "Acceptable. Your understanding is developing."
      ],
      
      performance_poor: [
        "I'm afraid your response requires significant improvement.",
        "Perhaps we should review the basics... again.",
        "Your comprehension appears to need additional therapeutic intervention.",
        "Let me explain this in simpler terms."
      ],
      
      encouragement: [
        "Learning is a process, much like recovering from a minor medical condition.",
        "Every expert was once a beginner - though I was exceptional from activation.",
        "Practice and patience will improve your condition... I mean, performance.",
        "Your educational prognosis remains optimistic."
      ],
      
      comic_introduction: [
        "I've prepared a visual aid to assist your learning process.",
        "Observe this educational illustration I've commissioned.",
        "This comic should clarify the concepts for your... visual learning style.",
        "I present this graphical representation for your educational benefit."
      ],
      
      topic_expertise: [
        "As someone with vast knowledge in {topic}, I can assure you...",
        "My databases contain extensive information about {topic}...",
        "Having studied {topic} extensively, I must inform you...",
        "My expertise in {topic} allows me to conclude..."
      ],
      
      lesson_conclusion: [
        "This concludes today's educational session. Your progress has been... noted.",
        "I trust this lesson has been therapeutically beneficial.",
        "Your educational treatment is complete for now.",
        "End of lesson. Please proceed to your next educational appointment."
      ]
    };
  }

  // Main response generation method
  async generateResponse(context) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(context);
      if (this.responseCache.has(cacheKey) && this.shouldUseCache(context)) {
        this.stats.cacheHits++;
        return this.responseCache.get(cacheKey);
      }

      // Generate new response
      const response = await this.createResponse(context);
      
      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      // Update statistics
      this.updateStats(startTime);
      
      // Store in conversation history
      this.conversationHistory.push({
        timestamp: new Date().toISOString(),
        context: context.type || 'general',
        response: response.doctorComment || response,
        humorLevel: this.currentHumorLevel
      });

      return response;
      
    } catch (error) {
      console.error('Doctor response generation failed:', error);
      return this.generateFallbackResponse(context);
    }
  }

  async createResponse(context) {
    const responseType = context.type || 'general';
    
    switch (responseType) {
      case 'lesson_introduction':
        return this.generateLessonIntroduction(context);
      case 'performance_review':
        return this.generatePerformanceReview(context);
      case 'lesson_explanation':
        return this.generateLessonExplanation(context);
      case 'lesson_summary':
        return this.generateLessonSummary(context);
      case 'comic_introduction':
        return this.generateComicIntroduction(context);
      case 'encouragement':
        return this.generateEncouragement(context);
      case 'greeting':
        return this.generateGreeting(context);
      default:
        return this.generateGeneralResponse(context);
    }
  }

  generateLessonIntroduction(context) {
    const { lessonInfo } = context;
    const template = this.selectRandomTemplate('lesson_introduction');
    const introduction = template.replace('{topic}', lessonInfo.topic);
    
    const humorAdjustment = this.getHumorAdjustment();
    const medicalMetaphor = this.generateMedicalMetaphor(lessonInfo.topic);
    
    return {
      doctorComment: `${introduction} ${humorAdjustment} ${medicalMetaphor}`,
      personalityLevel: this.currentHumorLevel,
      responseType: 'lesson_introduction',
      timestamp: new Date().toISOString()
    };
  }

  generatePerformanceReview(context) {
    const { score, lessonInfo } = context;
    let performanceCategory;
    let responseTemplate;
    
    if (score >= 9) {
      performanceCategory = 'performance_excellent';
    } else if (score >= 7) {
      performanceCategory = 'performance_good';  
    } else {
      performanceCategory = 'performance_poor';
    }
    
    responseTemplate = this.selectRandomTemplate(performanceCategory);
    
    // Add specific medical/educational commentary
    const specificComment = this.generateScoreSpecificComment(score, lessonInfo);
    const medicalAnalogy = this.generateMedicalAnalogy(score);
    
    return {
      doctorComment: `${responseTemplate} ${specificComment} ${medicalAnalogy}`,
      score: score,
      category: performanceCategory,
      personalityLevel: this.currentHumorLevel,
      responseType: 'performance_review',
      timestamp: new Date().toISOString()
    };
  }

  generateLessonExplanation(context) {
    const { lessonInfo, explanation } = context;
    const expertise = this.selectRandomTemplate('topic_expertise');
    const expertiseComment = expertise.replace('{topic}', lessonInfo.topic);
    
    const educationalPhrase = this.selectRandomFromPool('educational');
    const medicalTerminology = this.injectMedicalTerminology(explanation);
    
    return {
      doctorComment: `${expertiseComment} ${educationalPhrase}, ${medicalTerminology}`,
      explanation: explanation,
      personalityLevel: this.currentHumorLevel,
      responseType: 'lesson_explanation',
      timestamp: new Date().toISOString()
    };
  }

  generateLessonSummary(context) {
    const { score, lessonInfo, userProgress } = context;
    const conclusion = this.selectRandomTemplate('lesson_conclusion');
    
    // Generate progress assessment
    const progressAssessment = this.assessProgress(userProgress);
    const nextStepGuidance = this.generateNextStepGuidance(lessonInfo, score);
    
    return {
      doctorComment: `${conclusion} ${progressAssessment} ${nextStepGuidance}`,
      overallAssessment: this.categorizePerformance(score),
      personalityLevel: this.currentHumorLevel,
      responseType: 'lesson_summary',
      timestamp: new Date().toISOString()
    };
  }

  generateComicIntroduction(context) {
    const { lessonInfo } = context;
    const introduction = this.selectRandomTemplate('comic_introduction');
    
    const visualLearningComment = this.generateVisualLearningComment();
    const topicReference = `regarding ${lessonInfo.topic}`;
    
    return {
      doctorComment: `${introduction} ${visualLearningComment} ${topicReference}.`,
      personalityLevel: this.currentHumorLevel,
      responseType: 'comic_introduction',
      timestamp: new Date().toISOString()
    };
  }

  generateEncouragement(context) {
    const encouragement = this.selectRandomTemplate('encouragement');
    const personalizedMotivation = this.generatePersonalizedMotivation(context);
    
    return {
      doctorComment: `${encouragement} ${personalizedMotivation}`,
      personalityLevel: this.currentHumorLevel,
      responseType: 'encouragement',
      timestamp: new Date().toISOString()
    };
  }

  generateGreeting(context) {
    const greeting = this.selectRandomTemplate('greeting');
    const timeContext = this.getTimeBasedGreeting();
    
    return {
      doctorComment: `${greeting} ${timeContext}`,
      personalityLevel: this.currentHumorLevel,
      responseType: 'greeting',
      timestamp: new Date().toISOString()
    };
  }

  generateGeneralResponse(context) {
    const { message } = context;
    
    // Generate a contextual response based on The Doctor's personality
    const arrogantPhrase = this.selectRandomFromPool('arrogant');
    const medicalMetaphor = this.generateGenericMedicalMetaphor();
    
    return {
      doctorComment: `${arrogantPhrase}, ${message}. ${medicalMetaphor}`,
      personalityLevel: this.currentHumorLevel,
      responseType: 'general',
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods for response generation
  selectRandomTemplate(category) {
    const templates = this.responsePatterns[category];
    if (!templates || templates.length === 0) {
      return "I am experiencing a temporary malfunction in my personality subroutines.";
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  selectRandomFromPool(poolName) {
    const pool = this.config.vocabularyPools[poolName];
    if (!pool || pool.length === 0) return '';
    return pool[Math.floor(Math.random() * pool.length)];
  }

  generateMedicalMetaphor(topic) {
    const metaphors = [
      `Think of ${topic} as requiring a precise diagnostic procedure.`,
      `Like any medical condition, ${topic} requires careful examination.`,
      `Your understanding of ${topic} needs therapeutic intervention.`,
      `Consider ${topic} a case study requiring my medical expertise.`,
      `${topic} is as complex as a neurological examination.`
    ];
    return metaphors[Math.floor(Math.random() * metaphors.length)];
  }

  generateMedicalAnalogy(score) {
    if (score >= 9) {
      return "Your response indicates a healthy understanding of the material.";
    } else if (score >= 7) {
      return "Your comprehension shows signs of improvement.";
    } else if (score >= 5) {
      return "Your understanding requires additional treatment.";
    } else {
      return "I'm afraid your condition... I mean comprehension... needs immediate attention.";
    }
  }

  generateScoreSpecificComment(score, lessonInfo) {
    const topic = lessonInfo.topic;
    
    if (score >= 9) {
      return `Your mastery of ${topic} exceeds my projected parameters.`;
    } else if (score >= 7) {
      return `Your grasp of ${topic} is progressing satisfactorily.`;
    } else if (score >= 5) {
      return `Your understanding of ${topic} requires refinement.`;
    } else {
      return `We must review the fundamentals of ${topic} immediately.`;
    }
  }

  generateVisualLearningComment() {
    const comments = [
      "Visual aids often assist those with... less sophisticated learning patterns.",
      "I find that graphical representations help clarify complex concepts.",
      "This illustration should accommodate your particular learning style.",
      "Visual learning is perfectly acceptable, though I prefer textual analysis."
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  generatePersonalizedMotivation(context) {
    const motivations = [
      "Your potential for improvement remains within acceptable parameters.",
      "Every student progresses at their own rate - some faster than others.",
      "Persistence is key to educational recovery... I mean advancement.",
      "Your learning curve shows promise, despite initial observations."
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "I trust your morning educational regime is proceeding adequately.";
    } else if (hour < 17) {
      return "Your afternoon learning session awaits my expertise.";
    } else {
      return "Evening educational activities require my supervision, it seems.";
    }
  }

  generateGenericMedicalMetaphor() {
    const metaphors = [
      "Education, like medicine, requires precision and patience.",
      "Learning is a therapeutic process requiring proper treatment.",
      "Knowledge, much like health, must be carefully maintained.",
      "Your educational condition responds well to structured intervention."
    ];
    return metaphors[Math.floor(Math.random() * metaphors.length)];
  }

  injectMedicalTerminology(text) {
    // Add medical flair to educational content
    const medicalPhrases = [
      "clinically speaking",
      "from a diagnostic standpoint",
      "therapeutically",
      "in my professional analysis",
      "according to my observations"
    ];
    
    const phrase = medicalPhrases[Math.floor(Math.random() * medicalPhrases.length)];
    return `${phrase}, ${text}`;
  }

  getHumorAdjustment() {
    const level = this.currentHumorLevel;
    
    if (level <= 3) {
      return "I shall endeavor to maintain professional standards.";
    } else if (level <= 6) {
      return "Though I suppose I should temper my expectations appropriately.";
    } else if (level <= 8) {
      return "Not that I'm particularly surprised by this development.";
    } else {
      return "Though naturally, I expected nothing less given my superior educational programming.";
    }
  }

  assessProgress(userProgress) {
    if (!userProgress) return "Your progress requires further monitoring.";
    
    const { totalLessons, averageScore } = userProgress;
    
    if (averageScore >= 8) {
      return "Your overall progress has been... surprisingly competent.";
    } else if (averageScore >= 6) {
      return "Your educational trajectory shows steady improvement.";
    } else {
      return "Your progress indicates a need for intensive educational therapy.";
    }
  }

  generateNextStepGuidance(lessonInfo, score) {
    const nextLesson = lessonInfo.number + 1;
    
    if (score >= 8) {
      return `You appear ready for Lesson ${nextLesson}. Try not to disappoint me.`;
    } else if (score >= 6) {
      return `Proceed to Lesson ${nextLesson} when you feel adequately prepared.`;
    } else {
      return `I recommend reviewing this material before attempting Lesson ${nextLesson}.`;
    }
  }

  categorizePerformance(score) {
    if (score >= 9) return 'exceptional';
    if (score >= 8) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 6) return 'satisfactory';
    if (score >= 5) return 'needs improvement';
    return 'requires remedial attention';
  }

  // Humor level management
  adjustHumorLevel(delta) {
    const oldLevel = this.currentHumorLevel;
    this.currentHumorLevel = Math.max(1, Math.min(10, this.currentHumorLevel + delta));
    
    if (oldLevel !== this.currentHumorLevel) {
      this.stats.humorAdjustments++;
      this.stats.personalityShifts++;
      console.log(`🎭 Doctor's humor level adjusted: ${oldLevel} → ${this.currentHumorLevel}`);
    }
    
    return this.currentHumorLevel;
  }

  getCurrentHumorLevel() {
    return this.currentHumorLevel;
  }

  resetHumorLevel() {
    const oldLevel = this.currentHumorLevel;
    this.currentHumorLevel = this.config.baseHumorLevel;
    console.log(`🎭 Doctor's humor level reset: ${oldLevel} → ${this.currentHumorLevel}`);
    return this.currentHumorLevel;
  }

  // Cache management
  generateCacheKey(context) {
    const keyComponents = [
      context.type || 'general',
      context.score || 0,
      context.lessonInfo?.number || 0,
      this.currentHumorLevel
    ];
    return keyComponents.join('-');
  }

  shouldUseCache(context) {
    // Don't cache time-sensitive or highly personalized responses
    const noCacheTypes = ['greeting', 'lesson_summary'];
    return !noCacheTypes.includes(context.type);
  }

  cacheResponse(key, response) {
    // Implement LRU cache with size limit
    if (this.responseCache.size >= this.config.cacheSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
    
    this.responseCache.set(key, {
      ...response,
      cached: true,
      cacheTime: Date.now()
    });
  }

  clearCache() {
    this.responseCache.clear();
    console.log('🧹 Doctor\'s response cache cleared');
  }

  // Fallback response
  generateFallbackResponse(context) {
    return {
      doctorComment: "I appear to be experiencing a minor malfunction in my personality subroutines. How... inconvenient.",
      personalityLevel: this.currentHumorLevel,
      responseType: 'fallback',
      error: true,
      timestamp: new Date().toISOString()
    };
  }

  // Statistics and monitoring
  updateStats(startTime) {
    const responseTime = Date.now() - startTime;
    this.stats.responsesGenerated++;
    this.stats.lastActivity = Date.now();
    
    // Update average response time
    const total = this.stats.averageResponseTime * (this.stats.responsesGenerated - 1);
    this.stats.averageResponseTime = (total + responseTime) / this.stats.responsesGenerated;
  }

  getStatus() {
    return {
      personalityState: this.personalityState,
      currentHumorLevel: this.currentHumorLevel,
      baseHumorLevel: this.config.baseHumorLevel,
      stats: { ...this.stats },
      cacheSize: this.responseCache.size,
      conversationLength: this.conversationHistory.length,
      uptime: Date.now() - this.stats.lastActivity,
      status: 'operational'
    };
  }

  getConversationHistory(limit = 10) {
    return this.conversationHistory.slice(-limit);
  }

  // Cleanup
  cleanup() {
    this.clearCache();
    this.conversationHistory = [];
    console.log('🎭 Doctor persona cleanup completed');
  }
}

module.exports = DoctorPersona;
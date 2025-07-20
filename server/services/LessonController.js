// server/services/LessonController.js - Enhanced 6-Step Lesson Protocol
const { getCurriculumData } = require('../data/curriculum');

class LessonController {
  constructor(doctorPersona, comicService, characterRotation = null, database = null) {
    this.doctorPersona = doctorPersona;
    this.comicService = comicService;
    this.characterRotation = characterRotation;
    this.database = database;
    
    this.currentUser = 'captain_tal';
    this.lessonStates = new Map();
    this.activeGenerations = new Map();
    
    // Cache curriculum data for performance
    this.curriculumCache = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Lesson protocol configuration
    this.protocolConfig = {
      enableStepDelay: false, // For real-time response
      enableProgressiveDisclosure: true,
      enablePersonalization: true,
      enableComicIntegration: true,
      scoreThresholds: {
        exceptional: 9.0,
        excellent: 8.0,
        good: 7.0,
        satisfactory: 6.0,
        needsImprovement: 5.0
      }
    };
    
    console.log('📚 Enhanced Lesson Controller initialized with 6-step protocol');
  }

  getCachedCurriculum() {
    const now = Date.now();
    if (!this.curriculumCache || !this.cacheTimestamp || (now - this.cacheTimestamp > this.cacheTimeout)) {
      this.curriculumCache = getCurriculumData();
      this.cacheTimestamp = now;
      console.log('📚 Curriculum data cached for performance');
    }
    return this.curriculumCache;
  }

  async executeCompleteLesson(userAnswer, lessonNumber = null) {
    try {
      console.log(`📚 Executing complete lesson protocol for answer: "${userAnswer.substring(0, 50)}..."`);
      
      // Get current lesson context
      const lessonContext = await this.buildLessonContext(userAnswer, lessonNumber);
      
      // Execute all 6 steps in sequence
      const lessonResponse = {
        lessonNumber: lessonContext.lessonNumber,
        topic: lessonContext.topic,
        phase: lessonContext.phase,
        timestamp: new Date().toISOString(),
        steps: {},
        score: 0,
        doctorSummary: ''
      };

      console.log(`🔄 Starting 6-step protocol for lesson ${lessonContext.lessonNumber}`);

      // STEP 1: Performance Review & Scoring
      lessonResponse.steps.step1_performance_review = await this.executeStep1_PerformanceReview(userAnswer, lessonContext);
      lessonResponse.score = lessonResponse.steps.step1_performance_review.score;
      
      // STEP 2: Topic Announcement  
      lessonResponse.steps.step2_topic_announcement = await this.executeStep2_TopicAnnouncement(lessonContext);
      
      // STEP 3: Explanation & Pro Tip
      lessonResponse.steps.step3_explanation = await this.executeStep3_Explanation(lessonContext);
      
      // STEP 4: Personalized Example
      lessonResponse.steps.step4_personalized_example = await this.executeStep4_PersonalizedExample(lessonContext);
      
      // STEP 5: Challenge Question
      lessonResponse.steps.step5_challenge_question = await this.executeStep5_ChallengeQuestion(lessonContext);
      
      // STEP 6: Educational Comic Generation
      lessonResponse.steps.step6_comic = await this.executeStep6_ComicGeneration(lessonContext);
      
      // Generate Doctor's summary response
      lessonResponse.doctorSummary = await this.generateDoctorSummary(lessonResponse, lessonContext);
      lessonResponse.doctorResponse = lessonResponse.doctorSummary;
      
      // Save lesson state
      this.saveLessonState(lessonContext.lessonNumber, lessonResponse);
      
      console.log(`✅ 6-step protocol completed for lesson ${lessonContext.lessonNumber} - Score: ${lessonResponse.score}`);
      
      return lessonResponse;
      
    } catch (error) {
      console.error('❌ Complete lesson execution failed:', error);
      return this.createFallbackResponse(error, lessonNumber);
    }
  }

  async buildLessonContext(userAnswer, lessonNumber) {
    const curriculum = this.getCachedCurriculum();
    const currentLessonNumber = lessonNumber || this.inferLessonNumber(userAnswer);
    
    // Get lesson information
    const lessonInfo = curriculum.lessons.find(l => l.number === currentLessonNumber) || curriculum.lessons[0];
    
    // Get user progress context
    const userProgress = await this.getUserProgressContext();
    
    // Get character selection
    const characters = this.characterRotation ? 
      this.characterRotation.selectCharactersForLesson(currentLessonNumber, lessonInfo) :
      this.getDefaultCharacters();
    
    return {
      lessonNumber: currentLessonNumber,
      lessonInfo: lessonInfo,
      topic: lessonInfo.topic,
      phase: lessonInfo.phase,
      difficulty: lessonInfo.difficulty,
      userAnswer: userAnswer,
      userProgress: userProgress,
      characters: characters,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    };
  }

  async getUserProgressContext() {
    if (!this.database) return { progress: [], averageScore: 7.0, recentScores: [] };
    
    try {
      const progress = await this.database.getUserProgress(this.currentUser);
      const averageScore = progress.length > 0 ? 
        progress.reduce((sum, p) => sum + p.score, 0) / progress.length : 7.0;
      const recentScores = progress.slice(-5).map(p => p.score);
      
      return {
        progress,
        averageScore,
        recentScores,
        totalLessons: progress.length,
        lastLesson: progress.length > 0 ? Math.max(...progress.map(p => p.lesson_number)) : 0
      };
    } catch (error) {
      console.warn('Failed to get user progress context:', error);
      return { progress: [], averageScore: 7.0, recentScores: [] };
    }
  }

  getDefaultCharacters() {
    return [
      { name: 'The Doctor', role: 'instructor', personality: 'medical, precise, educational' },
      { name: 'Captain Tal', role: 'student', personality: 'curious, determined, learning' }
    ];
  }

  // STEP 1: Performance Review & Scoring
  async executeStep1_PerformanceReview(userAnswer, context) {
    try {
      console.log('📊 Step 1: Performance Review & Scoring');
      
      // Analyze answer quality
      const analysis = this.analyzeAnswerQuality(userAnswer, context);
      
      // Generate Doctor's performance review
      const doctorReview = await this.doctorPersona.generateResponse({
        type: 'performance_review',
        userAnswer: userAnswer,
        score: analysis.score,
        lessonInfo: context.lessonInfo,
        previousScore: context.userProgress.recentScores.slice(-1)[0]
      });
      
      return {
        score: analysis.score,
        analysis: analysis,
        feedback: doctorReview.review || this.generateDefaultFeedback(analysis.score),
        improvement: doctorReview.encouragement || '',
        categories: analysis.categories,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Step 1 failed:', error);
      return this.createFallbackStep1();
    }
  }

  analyzeAnswerQuality(userAnswer, context) {
    // Sophisticated answer analysis
    const analysis = {
      score: 7.0,
      categories: {
        depth: 0,
        accuracy: 0,
        engagement: 0,
        understanding: 0
      },
      strengths: [],
      improvements: []
    };
    
    const answer = userAnswer.toLowerCase().trim();
    const wordCount = answer.split(/\s+/).length;
    
    // Depth Analysis (0-10)
    if (wordCount > 50) analysis.categories.depth += 3;
    else if (wordCount > 20) analysis.categories.depth += 2;
    else if (wordCount > 5) analysis.categories.depth += 1;
    
    if (answer.includes('because') || answer.includes('therefore') || answer.includes('however')) {
      analysis.categories.depth += 2;
    }
    
    // Engagement Analysis (0-10)
    if (answer.includes('?') || answer.includes('what') || answer.includes('how') || answer.includes('why')) {
      analysis.categories.engagement += 2;
      analysis.strengths.push('Shows curiosity and asks questions');
    }
    
    if (answer.includes('think') || answer.includes('believe') || answer.includes('consider')) {
      analysis.categories.engagement += 1;
      analysis.strengths.push('Demonstrates thoughtful consideration');
    }
    
    // Understanding Analysis (0-10)
    const topicKeywords = this.getTopicKeywords(context.topic);
    const mentionedKeywords = topicKeywords.filter(keyword => 
      answer.includes(keyword.toLowerCase())
    );
    
    analysis.categories.understanding = Math.min(10, mentionedKeywords.length * 2);
    
    if (mentionedKeywords.length > 0) {
      analysis.strengths.push(`References relevant concepts: ${mentionedKeywords.join(', ')}`);
    }
    
    // Accuracy Analysis (baseline)
    analysis.categories.accuracy = 6; // Default baseline, would be enhanced with NLP
    
    // Calculate overall score
    const categoryScores = Object.values(analysis.categories);
    analysis.score = Math.min(10, Math.max(1, 
      categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
    ));
    
    // Generate improvement suggestions
    if (analysis.categories.depth < 5) {
      analysis.improvements.push('Provide more detailed explanations');
    }
    if (analysis.categories.engagement < 5) {
      analysis.improvements.push('Ask more questions and show curiosity');
    }
    if (analysis.categories.understanding < 5) {
      analysis.improvements.push('Reference more topic-specific concepts');
    }
    
    return analysis;
  }

  getTopicKeywords(topic) {
    // Topic-specific keyword mapping
    const keywordMap = {
      'Text-to-Image Basics': ['prompt', 'image', 'generation', 'ai', 'model'],
      'CFG Scale': ['cfg', 'scale', 'guidance', 'creativity', 'adherence'],
      'Sampling Methods': ['sampling', 'euler', 'dpm', 'steps', 'quality'],
      'Prompting': ['prompt', 'description', 'keywords', 'style', 'detail'],
      'Resolution': ['resolution', 'pixels', 'size', 'aspect', 'ratio'],
      'ControlNet': ['controlnet', 'control', 'pose', 'depth', 'edge'],
      'LoRA': ['lora', 'adaptation', 'training', 'style', 'character']
    };
    
    // Find keywords for the topic
    for (const [key, keywords] of Object.entries(keywordMap)) {
      if (topic.toLowerCase().includes(key.toLowerCase())) {
        return keywords;
      }
    }
    
    // Default keywords
    return ['stable', 'diffusion', 'image', 'ai', 'generation'];
  }

  generateDefaultFeedback(score) {
    if (score >= 9) return "Exceptional understanding demonstrated. Your response shows mastery of the concepts.";
    if (score >= 8) return "Excellent work. Your response indicates strong comprehension.";
    if (score >= 7) return "Good response. You're grasping the key concepts well.";
    if (score >= 6) return "Satisfactory answer. There's room for deeper understanding.";
    if (score >= 5) return "Your response shows some understanding, but needs development.";
    return "Your response indicates significant gaps in understanding that we'll address.";
  }

  createFallbackStep1() {
    return {
      score: 7.0,
      analysis: { categories: { depth: 6, accuracy: 7, engagement: 7, understanding: 7 } },
      feedback: "Your response has been noted. Let's proceed with the lesson.",
      improvement: "Continue engaging with the material.",
      categories: { depth: 6, accuracy: 7, engagement: 7, understanding: 7 },
      timestamp: new Date().toISOString()
    };
  }

  // STEP 2: Topic Announcement
  async executeStep2_TopicAnnouncement(context) {
    try {
      console.log('📚 Step 2: Topic Announcement');
      
      const doctorResponse = await this.doctorPersona.generateResponse({
        type: 'lesson_introduction',
        lessonInfo: context.lessonInfo
      });
      
      return {
        announcement: doctorResponse.introduction || this.generateDefaultAnnouncement(context),
        context: this.generateTopicContext(context.lessonInfo),
        objectives: context.lessonInfo.objectives || [],
        difficulty: context.lessonInfo.difficulty,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Step 2 failed:', error);
      return this.createFallbackStep2(context);
    }
  }

  generateDefaultAnnouncement(context) {
    return `Today we're examining ${context.topic}. Consider this lesson ${context.lessonNumber} as a specialized treatment protocol for ${context.phase.toLowerCase()}-level understanding.`;
  }

  generateTopicContext(lessonInfo) {
    return `This ${lessonInfo.difficulty} lesson covers essential concepts in ${lessonInfo.topic}. Understanding these principles is crucial for your progression in the ${lessonInfo.phase} phase.`;
  }

  createFallbackStep2(context) {
    return {
      announcement: this.generateDefaultAnnouncement(context),
      context: this.generateTopicContext(context.lessonInfo),
      objectives: [],
      difficulty: context.difficulty,
      timestamp: new Date().toISOString()
    };
  }

  // STEP 3: Explanation & Pro Tip
  async executeStep3_Explanation(context) {
    try {
      console.log('🔬 Step 3: Explanation & Pro Tip');
      
      const doctorResponse = await this.doctorPersona.generateResponse({
        type: 'explanation',
        lessonInfo: context.lessonInfo
      });
      
      return {
        explanation: doctorResponse.explanation || this.generateDefaultExplanation(context),
        proTip: doctorResponse.proTip || this.generateProTip(context),
        medicalAnalogy: doctorResponse.medicalAnalogy || '',
        keyPoints: this.extractKeyPoints(context.lessonInfo),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Step 3 failed:', error);
      return this.createFallbackStep3(context);
    }
  }

  generateDefaultExplanation(context) {
    const explanations = {
      'Text-to-Image Basics': 'Text-to-image generation converts written descriptions into visual content using artificial intelligence. The process involves encoding text prompts and decoding them into pixel representations.',
      'CFG Scale': 'CFG (Classifier-Free Guidance) Scale controls how strictly the AI follows your prompt. Higher values mean closer adherence to your description, while lower values allow more creative interpretation.',
      'Sampling Methods': 'Sampling methods determine how the AI generates images step by step. Different samplers produce varying quality, speed, and artistic effects.',
      'Prompting': 'Effective prompting is the art of describing your desired image clearly and specifically. Good prompts include subject, style, composition, and quality indicators.',
      'ControlNet': 'ControlNet provides precise control over image generation by using additional input conditions like poses, depth maps, or edge detection to guide the creation process.'
    };
    
    for (const [key, explanation] of Object.entries(explanations)) {
      if (context.topic.includes(key)) {
        return explanation;
      }
    }
    
    return `${context.topic} is a fundamental concept in AI image generation that requires understanding of both technical principles and practical application.`;
  }

  generateProTip(context) {
    const proTips = {
      'Text-to-Image': 'Start with simple, clear descriptions and gradually add detail. Quality over quantity in your prompts.',
      'CFG Scale': 'Most images work best with CFG values between 5-15. Start at 7 and adjust based on results.',
      'Sampling': 'Euler and DPM++ samplers are excellent starting points. Experiment with step counts between 20-50.',
      'Prompting': 'Use parentheses (like this) to emphasize important elements, and negative prompts to exclude unwanted content.',
      'ControlNet': 'Combine ControlNet with good prompts for maximum control. Don\'t rely on control inputs alone.'
    };
    
    for (const [key, tip] of Object.entries(proTips)) {
      if (context.topic.includes(key)) {
        return tip;
      }
    }
    
    return 'Practice and experimentation are key to mastering this concept. Start simple and build complexity gradually.';
  }

  extractKeyPoints(lessonInfo) {
    return lessonInfo.keywords || [
      'Understanding core concepts',
      'Practical application',
      'Common best practices',
      'Troubleshooting approaches'
    ];
  }

  createFallbackStep3(context) {
    return {
      explanation: this.generateDefaultExplanation(context),
      proTip: this.generateProTip(context),
      medicalAnalogy: '',
      keyPoints: this.extractKeyPoints(context.lessonInfo),
      timestamp: new Date().toISOString()
    };
  }

  // STEP 4: Personalized Example
  async executeStep4_PersonalizedExample(context) {
    try {
      console.log('🎯 Step 4: Personalized Example');
      
      const doctorResponse = await this.doctorPersona.generateResponse({
        type: 'personalized_example',
        lessonInfo: context.lessonInfo,
        characters: context.characters,
        userProgress: context.userProgress
      });
      
      return {
        example: doctorResponse.example || this.generateExample(context),
        characters: context.characters.map(c => c.name),
        scenario: this.buildScenario(context),
        analogies: this.generateAnalogies(context),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Step 4 failed:', error);
      return this.createFallbackStep4(context);
    }
  }

  generateExample(context) {
    const character = context.characters[1] || context.characters[0];
    const examples = {
      'Text-to-Image': `Imagine ${character.name} wants to create an image of a starship. Instead of saying "ship," they write "sleek Federation starship in space, detailed hull, stars in background, high quality, cinematic lighting." The detailed description helps the AI understand exactly what's needed.`,
      'CFG Scale': `${character.name} generates the same starship prompt with different CFG values. At CFG 3, they get a creative but loose interpretation. At CFG 7, a balanced result. At CFG 15, strict adherence to every word, but potentially over-processed.`,
      'Sampling': `The ship's computer uses different algorithms to process the same data. ${character.name} finds that Euler sampling gives clean results quickly, while DPM++ samplers provide higher quality with more processing time.`,
      'ControlNet': `${character.name} has a sketch of their ideal bridge layout. Using ControlNet with edge detection, they can ensure the generated bridge follows their exact floor plan while adding realistic details.`
    };
    
    for (const [key, example] of Object.entries(examples)) {
      if (context.topic.includes(key)) {
        return example;
      }
    }
    
    return `${character.name} approaches ${context.topic} systematically, starting with basic principles and building to advanced applications through practice and experimentation.`;
  }

  buildScenario(context) {
    const primaryChar = context.characters[0] || { name: 'The Doctor', role: 'instructor' };
    const studentChar = context.characters[1] || { name: 'Captain Tal', role: 'student' };
    
    return {
      setting: 'USS Cerritos bridge or corridors',
      instructor: primaryChar.name,
      student: studentChar.name,
      challenge: `Understanding ${context.topic} concepts`,
      approach: `${primaryChar.name} guides ${studentChar.name} through practical applications`
    };
  }

  generateAnalogies(context) {
    return context.lessonInfo.analogies || [
      `Like medical diagnosis - systematic analysis leads to accurate results`,
      `Similar to starship operations - each system has specific functions and optimal settings`
    ];
  }

  createFallbackStep4(context) {
    return {
      example: this.generateExample(context),
      characters: context.characters.map(c => c.name),
      scenario: this.buildScenario(context),
      analogies: this.generateAnalogies(context),
      timestamp: new Date().toISOString()
    };
  }

  // STEP 5: Challenge Question
  async executeStep5_ChallengeQuestion(context) {
    try {
      console.log('❓ Step 5: Challenge Question');
      
      const question = this.generateChallengeQuestion(context);
      
      return {
        question: question.text,
        type: question.type,
        hints: question.hints,
        expectedPoints: question.expectedPoints,
        difficulty: question.difficulty,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Step 5 failed:', error);
      return this.createFallbackStep5(context);
    }
  }

  generateChallengeQuestion(context) {
    const questions = {
      'Text-to-Image Basics': {
        text: "You want to create an image of a futuristic laboratory. Write a detailed prompt that would help an AI understand your vision, including style, lighting, and specific elements you want to see.",
        type: "practical_application",
        hints: ["Include the main subject", "Describe the style or mood", "Mention lighting conditions", "Add quality indicators"],
        expectedPoints: ["Subject description", "Style specification", "Environmental details", "Quality terms"],
        difficulty: "beginner"
      },
      'CFG Scale': {
        text: "Your image generation is producing results that either ignore parts of your prompt or look over-processed. Explain how you would adjust the CFG scale to solve these issues and why.",
        type: "problem_solving",
        hints: ["Consider what CFG scale controls", "Think about the relationship between prompt adherence and quality", "Remember the typical range of useful values"],
        expectedPoints: ["Understanding of CFG function", "Problem identification", "Solution strategy", "Reasoning"],
        difficulty: "intermediate"
      }
    };
    
    for (const [key, question] of Object.entries(questions)) {
      if (context.topic.includes(key)) {
        return question;
      }
    }
    
    // Default question
    return {
      text: `Based on what you've learned about ${context.topic}, describe a practical scenario where you would apply these concepts and explain your approach.`,
      type: "application",
      hints: ["Think of a real-world use case", "Consider the key principles", "Explain your reasoning"],
      expectedPoints: ["Practical scenario", "Concept application", "Clear reasoning"],
      difficulty: context.difficulty
    };
  }

  createFallbackStep5(context) {
    return {
      question: `How would you apply ${context.topic} concepts in a practical situation?`,
      type: "application",
      hints: ["Consider real-world applications", "Think about the core principles"],
      expectedPoints: ["Practical understanding", "Clear explanation"],
      difficulty: context.difficulty,
      timestamp: new Date().toISOString()
    };
  }

  // STEP 6: Educational Comic Generation
  async executeStep6_ComicGeneration(context) {
    try {
      console.log('🎭 Step 6: Educational Comic Generation');
      
      if (!this.comicService || !this.comicService.config.enabled) {
        return this.createFallbackStep6(context);
      }
      
      // Generate comic asynchronously if not already in progress
      const comicKey = `lesson_${context.lessonNumber}`;
      
      if (this.activeGenerations.has(comicKey)) {
        // Return existing generation promise
        return await this.activeGenerations.get(comicKey);
      }
      
      // Start new comic generation
      const comicPromise = this.generateComicWithFallback(context);
      this.activeGenerations.set(comicKey, comicPromise);
      
      try {
        const result = await comicPromise;
        return result;
      } finally {
        this.activeGenerations.delete(comicKey);
      }
      
    } catch (error) {
      console.error('Step 6 failed:', error);
      return this.createFallbackStep6(context);
    }
  }

  async generateComicWithFallback(context) {
    try {
      // Generate comic with timeout
      const comicPromise = this.comicService.generateLessonComic(
        context.lessonInfo,
        context.characters,
        { userId: this.currentUser, sessionId: context.sessionId }
      );
      
      // Set timeout for comic generation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Comic generation timeout')), 30000);
      });
      
      const comic = await Promise.race([comicPromise, timeoutPromise]);
      
      return {
        comic: comic,
        generated: true,
        fallback_used: comic.fallback_used || false,
        generation_time: Date.now() - context.timestamp,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.warn('Comic generation failed, using fallback:', error);
      return this.createFallbackStep6(context);
    }
  }

  createFallbackStep6(context) {
    // Create text-based comic panels
    const fallbackComic = {
      success: false,
      fallback_used: true,
      description: `Educational comic about ${context.topic}`,
      panels: this.generateFallbackPanels(context),
      characters_featured: context.characters.map(c => c.name),
      lesson_number: context.lessonNumber,
      lesson_topic: context.topic
    };
    
    return {
      comic: fallbackComic,
      generated: false,
      fallback_used: true,
      generation_time: 0,
      timestamp: new Date().toISOString()
    };
  }

  generateFallbackPanels(context) {
    const instructor = context.characters[0] || { name: 'The Doctor' };
    const student = context.characters[1] || { name: 'Captain Tal' };
    
    return [
      {
        panel: 1,
        scene: `${instructor.name} presenting ${context.topic} on a LCARS display`,
        dialogue: [`"Today we're learning about ${context.topic}"`],
        focus: "Topic introduction"
      },
      {
        panel: 2,
        scene: `${student.name} looking curious and asking a question`,
        dialogue: [`"How does this work in practice?"`],
        focus: "Student engagement"
      },
      {
        panel: 3,
        scene: `${instructor.name} demonstrating with holographic examples`,
        dialogue: [`"Let me show you the key principles..."`],
        focus: "Practical demonstration"
      },
      {
        panel: 4,
        scene: `Both characters with ${student.name} showing understanding`,
        dialogue: [`"Now I understand! Thanks, ${instructor.name}!"`],
        focus: "Learning achievement"
      }
    ];
  }

  // Final Summary Generation
  async generateDoctorSummary(lessonResponse, context) {
    try {
      const summary = await this.doctorPersona.generateResponse({
        type: 'lesson_summary',
        score: lessonResponse.score,
        lessonInfo: context.lessonInfo,
        userProgress: context.userProgress
      });
      
      return summary.doctorComment || this.generateDefaultSummary(lessonResponse, context);
      
    } catch (error) {
      console.warn('Failed to generate Doctor summary:', error);
      return this.generateDefaultSummary(lessonResponse, context);
    }
  }

  generateDefaultSummary(lessonResponse, context) {
    const score = lessonResponse.score;
    const topic = context.topic;
    
    if (score >= 8) {
      return `Excellent work on ${topic}, Captain. Your understanding is progressing admirably. Ready for the next challenge?`;
    } else if (score >= 6) {
      return `Good progress on ${topic}. Your cognitive patterns are adapting well to the material. Continue this approach.`;
    } else {
      return `Your work on ${topic} shows effort, but requires additional attention. Don't worry - even the finest officers need practice.`;
    }
  }

  // Utility Methods
  inferLessonNumber(userAnswer) {
    // Simple inference based on user's current progress
    // In a real implementation, this would be more sophisticated
    return 1; // Default to lesson 1
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  saveLessonState(lessonNumber, lessonResponse) {
    this.lessonStates.set(lessonNumber, {
      ...lessonResponse,
      saved_at: Date.now()
    });
    
    // Keep only recent lesson states
    if (this.lessonStates.size > 10) {
      const oldestKey = Array.from(this.lessonStates.keys())[0];
      this.lessonStates.delete(oldestKey);
    }
  }

  createFallbackResponse(error, lessonNumber) {
    console.error('Creating fallback response due to error:', error);
    
    return {
      lessonNumber: lessonNumber || 1,
      topic: 'Educational Content',
      phase: 'Foundations',
      timestamp: new Date().toISOString(),
      steps: {
        step1_performance_review: {
          score: 7.0,
          feedback: 'Your response has been noted.',
          timestamp: new Date().toISOString()
        }
      },
      score: 7.0,
      doctorSummary: 'My systems encountered a temporary difficulty, but we can continue with your education.',
      doctorResponse: 'My educational protocols experienced a minor glitch. Please try again, Captain.',
      fallback: true,
      error: error.message
    };
  }

  // Management and Status Methods
  getStatus() {
    return {
      initialized: true,
      activeLessons: this.lessonStates.size,
      activeGenerations: this.activeGenerations.size,
      cacheStatus: {
        cached: !!this.curriculumCache,
        age: this.cacheTimestamp ? Date.now() - this.cacheTimestamp : 0
      },
      protocolConfig: this.protocolConfig
    };
  }

  updateConfig(newConfig) {
    this.protocolConfig = { ...this.protocolConfig, ...newConfig };
    console.log('🔧 Lesson controller configuration updated');
  }

  // Cleanup method
  cleanup() {
    this.lessonStates.clear();
    this.activeGenerations.clear();
    this.curriculumCache = null;
    console.log('🧹 Lesson controller cleanup completed');
  }
}

module.exports = LessonController;
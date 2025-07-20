// server/services/ComicService.js - Complete Comic Generation Service
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ComicService {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      cacheEnabled: true,
      cacheDirectory: config.cacheDirectory || './data/comics',
      cacheMaxAge: config.cacheMaxAge || 604800000, // 7 days
      fallbackEnabled: true,
      autoGenerate: true,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    this.apiProviders = {
      openai: {
        enabled: !!config.openai?.apiKey,
        apiKey: config.openai?.apiKey,
        model: config.openai?.imageModel || 'dall-e-3',
        size: config.openai?.imageSize || '1024x1024',
        quality: config.openai?.imageQuality || 'standard',
        style: config.openai?.imageStyle || 'vivid'
      }
    };

    this.stats = {
      comicsGenerated: 0,
      cacheHits: 0,
      fallbacksUsed: 0,
      errors: 0,
      lastGeneration: null,
      averageGenerationTime: 0
    };

    this.activeGenerations = new Map();
    this.comicPromptTemplates = this.initializePromptTemplates();
    
    this.setupCacheDirectory();
    console.log('🎨 Comic Service initialized');
    console.log(`   Cache enabled: ${this.config.cacheEnabled}`);
    console.log(`   API providers: ${Object.keys(this.apiProviders).filter(p => this.apiProviders[p].enabled).join(', ')}`);
  }

  initializePromptTemplates() {
    return {
      basic: {
        starTrek: `Create a Star Trek Lower Decks style comic strip about {topic}. The comic should feature The Doctor (Emergency Medical Hologram) from Star Trek Voyager teaching {studentName} about {topic}. Make it educational but entertaining, with The Doctor's characteristic arrogance and wit. Include 4 panels showing: 1) Introduction of the topic, 2) Explanation, 3) Student asking questions, 4) Doctor's conclusion. Art style should be colorful, cartoon-like, and similar to Star Trek Lower Decks animation.`,
        
        educational: `Design an educational comic strip about {topic} featuring Star Trek characters. The Doctor (EMH) is teaching Captain {studentName} about {topic}. The art should be in Star Trek Lower Decks animation style - vibrant colors, simplified character designs, expressive faces. Show 4 panels: 1) Doctor presenting the topic on a LCARS display, 2) Demonstrating key concepts, 3) Student engagement/questions, 4) Understanding achieved. Include speech bubbles with The Doctor's characteristic medical metaphors and slight condescension.`,
        
        humorous: `Create a funny Star Trek educational comic about {topic}. The Doctor (holographic character) is attempting to teach {studentName} about {topic} but keeps making medical analogies. Art style: Star Trek Lower Decks cartoon aesthetic with bright colors and exaggerated expressions. 4-panel layout: 1) Doctor's dramatic introduction, 2) Overly complex medical explanation, 3) Student's confused reaction, 4) Doctor simplifying (reluctantly). Include LCARS interface elements and Star Trek technology in background.`
      },
      
      advanced: {
        technical: `Generate a technical education comic strip in Star Trek Lower Decks animation style. The Doctor (EMH from Voyager) is teaching advanced {topic} concepts to {studentName}. Include holographic displays, technical diagrams, and Star Trek technology. 4 panels showing progressive learning: complex introduction, detailed explanation with visuals, practical application, and mastery demonstration. Maintain The Doctor's personality: brilliant, slightly arrogant, but ultimately helpful.`,
        
        practical: `Create a practical demonstration comic about {topic} using Star Trek characters and Lower Decks art style. The Doctor guides {studentName} through hands-on learning. Show realistic problem-solving and application of {topic} concepts. Include holographic simulations, LCARS interfaces, and futuristic educational tools. 4-panel progression: problem presentation, solution development, implementation, and successful outcome.`
      }
    };
  }

  setupCacheDirectory() {
    if (this.config.cacheEnabled && !fs.existsSync(this.config.cacheDirectory)) {
      fs.mkdirSync(this.config.cacheDirectory, { recursive: true });
      console.log(`📁 Comic cache directory created: ${this.config.cacheDirectory}`);
    }
  }

  async generateLessonComic(lessonInfo, characters, userContext = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🎨 Generating comic for lesson ${lessonInfo.number}: ${lessonInfo.topic}`);
      
      // Check if already generating for this lesson
      const generationKey = `lesson-${lessonInfo.number}`;
      if (this.activeGenerations.has(generationKey)) {
        console.log('⏳ Comic generation already in progress for this lesson');
        return await this.activeGenerations.get(generationKey);
      }

      // Start generation process
      const generationPromise = this.performComicGeneration(lessonInfo, characters, userContext);
      this.activeGenerations.set(generationKey, generationPromise);
      
      try {
        const result = await generationPromise;
        this.updateStats(startTime, result.success);
        return result;
      } finally {
        this.activeGenerations.delete(generationKey);
      }

    } catch (error) {
      console.error('Comic generation failed:', error);
      this.stats.errors++;
      return this.createFallbackComic(lessonInfo, characters);
    }
  }

  async performComicGeneration(lessonInfo, characters, userContext) {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cachedComic = await this.getCachedComic(lessonInfo);
      if (cachedComic) {
        console.log('📚 Using cached comic');
        this.stats.cacheHits++;
        return cachedComic;
      }
    }

    // Generate prompt
    const prompt = this.buildComicPrompt(lessonInfo, characters, userContext);
    
    // Try API generation
    if (this.isComicEnabled()) {
      const apiResult = await this.generateWithAPI(prompt, lessonInfo);
      if (apiResult.success) {
        // Cache successful generation
        if (this.config.cacheEnabled) {
          await this.cacheComic(lessonInfo, apiResult);
        }
        return apiResult;
      }
    }

    // Fallback to text-based comic
    console.log('🎭 Using fallback text-based comic');
    this.stats.fallbacksUsed++;
    return this.createFallbackComic(lessonInfo, characters, prompt);
  }

  buildComicPrompt(lessonInfo, characters, userContext) {
    const primaryCharacter = characters[0] || { name: 'The Doctor' };
    const studentCharacter = characters[1] || { name: 'Captain Tal' };
    
    // Select prompt template based on lesson difficulty and phase
    let templateCategory = 'basic';
    let templateType = 'starTrek';
    
    if (lessonInfo.difficulty === 'advanced' || lessonInfo.number > 45) {
      templateCategory = 'advanced';
      templateType = lessonInfo.phase === 'Cutting-Edge' ? 'technical' : 'practical';
    } else if (lessonInfo.phase === 'Intermediate Tools' || lessonInfo.phase === 'Advanced Control') {
      templateType = 'educational';
    } else if (userContext.preferredStyle === 'humorous') {
      templateType = 'humorous';
    }

    const template = this.comicPromptTemplates[templateCategory][templateType];
    
    // Replace placeholders
    const prompt = template
      .replace(/\{topic\}/g, lessonInfo.topic)
      .replace(/\{studentName\}/g, studentCharacter.name)
      .replace(/\{phase\}/g, lessonInfo.phase)
      .replace(/\{difficulty\}/g, lessonInfo.difficulty);

    // Add lesson-specific context
    const contextualAdditions = this.addContextualDetails(lessonInfo, userContext);
    
    return `${prompt} ${contextualAdditions}`;
  }

  addContextualDetails(lessonInfo, userContext) {
    const details = [];
    
    // Add lesson-specific visual elements
    if (lessonInfo.topic.toLowerCase().includes('controlnet')) {
      details.push('Include visual examples of image control and guidance systems.');
    } else if (lessonInfo.topic.toLowerCase().includes('prompt')) {
      details.push('Show text prompts and resulting images in holographic displays.');
    } else if (lessonInfo.topic.toLowerCase().includes('model')) {
      details.push('Include futuristic AI model interfaces and neural network visualizations.');
    }

    // Add character-specific elements
    if (userContext.preferredExamples) {
      details.push(`Include references to ${userContext.preferredExamples} as practical examples.`);
    }

    // Add phase-specific elements
    if (lessonInfo.phase === 'Foundations') {
      details.push('Keep visuals simple and foundational, suitable for beginners.');
    } else if (lessonInfo.phase === 'Cutting-Edge') {
      details.push('Include advanced, cutting-edge technology and complex interfaces.');
    }

    return details.join(' ');
  }

  async generateWithAPI(prompt, lessonInfo) {
    // Try OpenAI DALL-E first
    if (this.apiProviders.openai.enabled) {
      return await this.generateWithOpenAI(prompt, lessonInfo);
    }

    // No available APIs
    return { success: false, reason: 'no_api_available' };
  }

  async generateWithOpenAI(prompt, lessonInfo) {
    try {
      console.log('🤖 Generating comic with OpenAI DALL-E...');
      
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: this.apiProviders.openai.model,
          prompt: prompt,
          n: 1,
          size: this.apiProviders.openai.size,
          quality: this.apiProviders.openai.quality,
          style: this.apiProviders.openai.style
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiProviders.openai.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.config.timeout
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        const imageUrl = response.data.data[0].url;
        
        return {
          success: true,
          image_url: imageUrl,
          prompt_used: prompt,
          provider: 'openai',
          model: this.apiProviders.openai.model,
          lesson_number: lessonInfo.number,
          lesson_topic: lessonInfo.topic,
          generated_at: new Date().toISOString(),
          fallback_used: false
        };
      } else {
        throw new Error('Invalid response format from OpenAI');
      }

    } catch (error) {
      console.error('OpenAI comic generation failed:', error.message);
      return { success: false, reason: 'api_error', error: error.message };
    }
  }

  createFallbackComic(lessonInfo, characters, originalPrompt = null) {
    const primaryCharacter = characters[0] || { name: 'The Doctor' };
    const studentCharacter = characters[1] || { name: 'Captain Tal' };
    
    const fallbackComic = {
      success: false,
      fallback_used: true,
      lesson_number: lessonInfo.number,
      lesson_topic: lessonInfo.topic,
      description: `Educational comic about ${lessonInfo.topic}`,
      characters_featured: [primaryCharacter.name, studentCharacter.name],
      panels: this.generateFallbackPanels(lessonInfo, primaryCharacter, studentCharacter),
      prompt_used: originalPrompt,
      generated_at: new Date().toISOString(),
      provider: 'fallback'
    };

    this.stats.fallbacksUsed++;
    return fallbackComic;
  }

  generateFallbackPanels(lessonInfo, instructor, student) {
    const topic = lessonInfo.topic;
    const instructorName = instructor.name;
    const studentName = student.name;

    return [
      {
        panel: 1,
        scene: `${instructorName} standing next to a large LCARS display showing "${topic}"`,
        dialogue: [
          `"Today we shall examine ${topic}, a subject requiring my particular expertise."`
        ],
        focus: "Topic introduction",
        visual_description: `${instructorName} in a confident pose next to futuristic display technology`
      },
      {
        panel: 2,
        scene: `${instructorName} gesturing at holographic examples while ${studentName} observes attentively`,
        dialogue: [
          `"Observe these key principles of ${topic}."`,
          `"The methodology is quite straightforward... for those with adequate intelligence."`
        ],
        focus: "Concept explanation",
        visual_description: "Holographic demonstrations and technical diagrams floating in the air"
      },
      {
        panel: 3,
        scene: `${studentName} raising a hand with a questioning expression`,
        dialogue: [
          `"How does this apply in practical situations?"`,
          `"An astute question. Allow me to elaborate..."`
        ],
        focus: "Student engagement",
        visual_description: `${studentName} showing genuine curiosity and engagement`
      },
      {
        panel: 4,
        scene: `Both characters with ${studentName} showing understanding and ${instructorName} looking satisfied`,
        dialogue: [
          `"Now I understand the principles of ${topic}!"`,
          `"Naturally. My teaching methods are quite effective."`
        ],
        focus: "Learning achievement",
        visual_description: "Both characters in a collaborative learning environment with successful outcomes visible"
      }
    ];
  }

  // Cache management
  async getCachedComic(lessonInfo) {
    if (!this.config.cacheEnabled) return null;

    const cacheKey = this.generateCacheKey(lessonInfo);
    const cacheFile = path.join(this.config.cacheDirectory, `${cacheKey}.json`);

    if (!fs.existsSync(cacheFile)) return null;

    try {
      const stats = fs.statSync(cacheFile);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > this.config.cacheMaxAge) {
        fs.unlinkSync(cacheFile);
        return null;
      }

      const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return { ...cachedData, cached: true };

    } catch (error) {
      console.error('Failed to read cached comic:', error);
      return null;
    }
  }

  async cacheComic(lessonInfo, comicData) {
    if (!this.config.cacheEnabled) return;

    const cacheKey = this.generateCacheKey(lessonInfo);
    const cacheFile = path.join(this.config.cacheDirectory, `${cacheKey}.json`);

    try {
      const cacheData = {
        ...comicData,
        cached_at: new Date().toISOString()
      };

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Comic cached: ${cacheKey}`);

    } catch (error) {
      console.error('Failed to cache comic:', error);
    }
  }

  generateCacheKey(lessonInfo) {
    const keyComponents = [
      'lesson',
      lessonInfo.number,
      lessonInfo.topic.replace(/[^a-zA-Z0-9]/g, '_'),
      lessonInfo.difficulty
    ];
    
    return keyComponents.join('-').toLowerCase();
  }

  async cleanCache() {
    if (!this.config.cacheEnabled) return;

    const cacheDir = this.config.cacheDirectory;
    if (!fs.existsSync(cacheDir)) return;

    const files = fs.readdirSync(cacheDir);
    let deletedCount = 0;
    let deletedSize = 0;

    for (const file of files) {
      const filePath = path.join(cacheDir, file);
      const stats = fs.statSync(filePath);
      const age = Date.now() - stats.mtime.getTime();

      if (age > this.config.cacheMaxAge) {
        deletedSize += stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    console.log(`🧹 Comic cache cleaned: ${deletedCount} files removed, ${deletedSize} bytes freed`);
    return { deletedCount, deletedSize };
  }

  // Status and utilities
  isComicEnabled() {
    return this.config.enabled && Object.values(this.apiProviders).some(provider => provider.enabled);
  }

  updateStats(startTime, success) {
    const generationTime = Date.now() - startTime;
    this.stats.lastGeneration = new Date().toISOString();
    
    if (success) {
      this.stats.comicsGenerated++;
      
      // Update average generation time
      const total = this.stats.averageGenerationTime * (this.stats.comicsGenerated - 1);
      this.stats.averageGenerationTime = (total + generationTime) / this.stats.comicsGenerated;
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      isOperational: this.isComicEnabled(),
      apiProviders: Object.keys(this.apiProviders).reduce((acc, provider) => {
        acc[provider] = {
          enabled: this.apiProviders[provider].enabled,
          configured: !!this.apiProviders[provider].apiKey
        };
        return acc;
      }, {}),
      cacheEnabled: this.config.cacheEnabled,
      stats: { ...this.stats },
      activeGenerations: this.activeGenerations.size
    };
  }

  getComicStats() {
    return { ...this.stats };
  }

  // Comic quality assessment
  assessComicQuality(comicData) {
    const quality = {
      score: 0,
      factors: [],
      recommendations: []
    };

    // Check if it's a real generated image
    if (comicData.image_url && !comicData.fallback_used) {
      quality.score += 40;
      quality.factors.push('Generated image available');
    } else {
      quality.factors.push('Using fallback text-based comic');
      quality.recommendations.push('Configure API keys for image generation');
    }

    // Check prompt quality
    if (comicData.prompt_used && comicData.prompt_used.length > 100) {
      quality.score += 20;
      quality.factors.push('Detailed prompt provided');
    }

    // Check character integration
    if (comicData.characters_featured && comicData.characters_featured.length > 1) {
      quality.score += 20;
      quality.factors.push('Multiple characters featured');
    }

    // Check educational content
    if (comicData.panels && comicData.panels.length === 4) {
      quality.score += 20;
      quality.factors.push('Complete 4-panel structure');
    }

    return quality;
  }

  // Cleanup
  cleanup() {
    this.activeGenerations.clear();
    console.log('🎨 Comic Service cleanup completed');
  }
}

module.exports = ComicService;
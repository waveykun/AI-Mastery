// server/services/CharacterRotation.js

class CharacterRotation {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      maxConsecutive: config.maxConsecutive || 2,
      talFrequency: config.talFrequency || 3, // Captain Tal appears every 3 lessons
      ...config
    };

    this.characterPool = this.initializeCharacterPool();
    this.rotationHistory = [];
    this.lastUsedCharacters = new Map();
    this.consecutiveUsage = new Map();
    
    console.log(`🔄 Character rotation initialized - Pool size: ${this.characterPool.length}`);
  }

  initializeCharacterPool() {
    return [
      // Primary Characters (Always Available)
      {
        name: 'The Doctor',
        series: 'Voyager',
        role: 'instructor',
        personality: 'medical, precise, occasionally arrogant, witty',
        appearance_frequency: 100, // Always appears
        uniform: 'Voyager medical',
        traits: ['holographic', 'medical_expert', 'sarcastic', 'educational'],
        voice_pattern: 'formal, medical terminology, dry humor',
        teaching_style: 'medical analogies, step-by-step, patient but condescending'
      },
      {
        name: 'Captain Tal',
        series: 'Original',
        role: 'student',
        personality: 'curious, determined, quick learner, asks good questions',
        appearance_frequency: 33, // Every 3rd lesson
        uniform: 'Command red',
        traits: ['leadership', 'curious', 'determined', 'growing'],
        voice_pattern: 'direct, inquisitive, confident',
        teaching_style: 'learns by example, asks clarifying questions'
      },

      // Lower Decks Characters (High Frequency)
      {
        name: 'Mariner',
        series: 'Lower Decks',
        role: 'skeptical_student',
        personality: 'rebellious, witty, secretly competent, questions authority',
        appearance_frequency: 15,
        uniform: 'Lower Decks gold',
        traits: ['rebellious', 'witty', 'competent', 'irreverent'],
        voice_pattern: 'casual, sarcastic, references pop culture',
        teaching_style: 'learns through trial and error, challenges assumptions'
      },
      {
        name: 'Boimler',
        series: 'Lower Decks',
        role: 'eager_student',
        personality: 'rule-following, anxious, eager to please, detail-oriented',
        appearance_frequency: 15,
        uniform: 'Lower Decks purple',
        traits: ['rule_following', 'anxious', 'detail_oriented', 'eager'],
        voice_pattern: 'nervous, precise, references regulations',
        teaching_style: 'takes detailed notes, follows instructions exactly'
      },
      {
        name: 'Tendi',
        series: 'Lower Decks',
        role: 'assistant_instructor',
        personality: 'enthusiastic, helpful, medical background, optimistic',
        appearance_frequency: 12,
        uniform: 'Lower Decks teal',
        traits: ['medical', 'enthusiastic', 'helpful', 'positive'],
        voice_pattern: 'energetic, supportive, medical references',
        teaching_style: 'encourages others, breaks down complex concepts'
      },
      {
        name: 'Rutherford',
        series: 'Lower Decks',
        role: 'technical_expert',
        personality: 'engineering-focused, methodical, friendly, problem-solver',
        appearance_frequency: 12,
        uniform: 'Lower Decks gold',
        traits: ['engineering', 'methodical', 'friendly', 'technical'],
        voice_pattern: 'technical, explanatory, enthusiastic about details',
        teaching_style: 'explains technical concepts, uses engineering analogies'
      },

      // Classic TNG Characters (Medium Frequency)
      {
        name: 'Data',
        series: 'TNG',
        role: 'analytical_instructor',
        personality: 'logical, precise, curious about humanity, literal',
        appearance_frequency: 10,
        uniform: 'TNG gold',
        traits: ['android', 'logical', 'precise', 'curious'],
        voice_pattern: 'formal, logical, literal interpretations',
        teaching_style: 'systematic, logical progression, precise definitions'
      },
      {
        name: 'Geordi',
        series: 'TNG',
        role: 'technical_mentor',
        personality: 'engineering-focused, patient teacher, problem-solver',
        appearance_frequency: 8,
        uniform: 'TNG gold',
        traits: ['engineering', 'patient', 'technical', 'friendly'],
        voice_pattern: 'technical but accessible, encouraging',
        teaching_style: 'hands-on learning, technical explanations made simple'
      },
      {
        name: 'Troi',
        series: 'TNG',
        role: 'supportive_counselor',
        personality: 'empathetic, supportive, focuses on emotional aspects',
        appearance_frequency: 6,
        uniform: 'TNG teal',
        traits: ['empathetic', 'counselor', 'supportive', 'intuitive'],
        voice_pattern: 'gentle, supportive, emotionally aware',
        teaching_style: 'focuses on confidence building, addresses learning anxiety'
      },

      // Voyager Characters (Medium Frequency)
      {
        name: 'Janeway',
        series: 'Voyager',
        role: 'commanding_instructor',
        personality: 'authoritative, scientific, decisive, protective of crew',
        appearance_frequency: 8,
        uniform: 'Voyager red',
        traits: ['leadership', 'scientific', 'decisive', 'protective'],
        voice_pattern: 'authoritative, scientific references, decisive',
        teaching_style: 'command presence, clear objectives, scientific method'
      },
      {
        name: 'Torres',
        series: 'Voyager',
        role: 'challenging_instructor',
        personality: 'direct, impatient with mistakes, technically brilliant',
        appearance_frequency: 6,
        uniform: 'Voyager gold',
        traits: ['engineering', 'direct', 'impatient', 'brilliant'],
        voice_pattern: 'direct, technical, occasionally frustrated',
        teaching_style: 'no-nonsense, expects quick learning, practical applications'
      },
      {
        name: 'Seven',
        series: 'Voyager',
        role: 'efficiency_expert',
        personality: 'precise, efficient, perfectionist, direct',
        appearance_frequency: 6,
        uniform: 'Voyager silver',
        traits: ['precise', 'efficient', 'perfectionist', 'analytical'],
        voice_pattern: 'formal, precise, efficiency-focused',
        teaching_style: 'optimal methods, precision required, efficient learning'
      },

      // Classic TOS Characters (Lower Frequency)
      {
        name: 'Spock',
        series: 'TOS',
        role: 'logical_instructor',
        personality: 'purely logical, patient with illogical students, precise',
        appearance_frequency: 5,
        uniform: 'TOS blue',
        traits: ['vulcan', 'logical', 'patient', 'precise'],
        voice_pattern: 'formal, logical, emotionally detached',
        teaching_style: 'pure logic, step-by-step reasoning, patience with human limitations'
      },
      {
        name: 'Scotty',
        series: 'TOS',
        role: 'practical_engineer',
        personality: 'practical, enthusiastic about technology, Scottish accent',
        appearance_frequency: 4,
        uniform: 'TOS red',
        traits: ['engineering', 'practical', 'enthusiastic', 'experienced'],
        voice_pattern: 'Scottish accent, technical enthusiasm, practical wisdom',
        teaching_style: 'hands-on learning, practical applications, experience-based'
      },

      // DS9 Characters (Lower Frequency)
      {
        name: 'Dax',
        series: 'DS9',
        role: 'experienced_mentor',
        personality: 'wise, playful, multiple lifetimes of experience',
        appearance_frequency: 4,
        uniform: 'DS9 blue',
        traits: ['wise', 'experienced', 'playful', 'multi_lifetime'],
        voice_pattern: 'wise, playful, references past experiences',
        teaching_style: 'wisdom from experience, playful approach, long-term perspective'
      },
      {
        name: 'Bashir',
        series: 'DS9',
        role: 'medical_consultant',
        personality: 'medical expertise, eager, sometimes overconfident',
        appearance_frequency: 3,
        uniform: 'DS9 teal',
        traits: ['medical', 'eager', 'confident', 'detailed'],
        voice_pattern: 'medical precision, confident, detailed explanations',
        teaching_style: 'medical approach to learning, detailed analysis'
      }
    ];
  }

  selectCharactersForLesson(lessonNumber, lessonInfo, userPreferences = {}) {
    if (!this.config.enabled) {
      return this.getDefaultCharacters();
    }

    try {
      const selectedCharacters = [];
      
      // Always include The Doctor as primary instructor
      const doctor = this.getCharacterByName('The Doctor');
      selectedCharacters.push(doctor);

      // Determine if Captain Tal should appear (every 3rd lesson)
      const shouldIncludeTal = lessonNumber % this.config.talFrequency === 0;
      
      if (shouldIncludeTal) {
        const tal = this.getCharacterByName('Captain Tal');
        selectedCharacters.push(tal);
      } else {
        // Select a rotating secondary character
        const secondaryCharacter = this.selectSecondaryCharacter(lessonNumber, lessonInfo, userPreferences);
        selectedCharacters.push(secondaryCharacter);
      }

      // Record the selection
      this.recordCharacterUsage(lessonNumber, selectedCharacters);

      console.log(`👥 Selected characters for lesson ${lessonNumber}: ${selectedCharacters.map(c => c.name).join(', ')}`);
      
      return selectedCharacters;

    } catch (error) {
      console.error('Character selection failed:', error);
      return this.getDefaultCharacters();
    }
  }

  selectSecondaryCharacter(lessonNumber, lessonInfo, userPreferences) {
    const availableCharacters = this.getAvailableSecondaryCharacters(lessonNumber, lessonInfo);
    
    // Filter based on lesson requirements
    const filteredCharacters = this.filterCharactersByLesson(availableCharacters, lessonInfo);
    
    // Apply rotation rules
    const rotationFiltered = this.applyRotationRules(filteredCharacters, lessonNumber);
    
    // Select based on weighted probability
    const selected = this.selectByWeight(rotationFiltered, lessonInfo);
    
    return selected || this.getCharacterByName('Boimler'); // Fallback
  }

  getAvailableSecondaryCharacters(lessonNumber, lessonInfo) {
    return this.characterPool.filter(character => 
      character.name !== 'The Doctor' && 
      character.name !== 'Captain Tal'
    );
  }

  filterCharactersByLesson(characters, lessonInfo) {
    // Filter characters based on lesson phase and difficulty
    return characters.filter(character => {
      // Higher frequency characters for beginner lessons
      if (lessonInfo.difficulty === 'beginner') {
        return character.appearance_frequency >= 10;
      }
      
      // Technical characters for advanced lessons
      if (lessonInfo.difficulty === 'advanced') {
        return character.traits.includes('engineering') || 
               character.traits.includes('technical') ||
               character.traits.includes('analytical');
      }
      
      // Medical characters for certain topics
      if (lessonInfo.topic.toLowerCase().includes('quality') || 
          lessonInfo.topic.toLowerCase().includes('optimization')) {
        return character.traits.includes('medical') || 
               character.traits.includes('precise');
      }
      
      return true; // No specific filtering
    });
  }

  applyRotationRules(characters, lessonNumber) {
    return characters.filter(character => {
      const consecutiveUse = this.consecutiveUsage.get(character.name) || 0;
      
      // Prevent overuse of any single character
      if (consecutiveUse >= this.config.maxConsecutive) {
        return false;
      }
      
      // Ensure minimum gap between appearances for lower-frequency characters
      const lastUsed = this.lastUsedCharacters.get(character.name);
      if (lastUsed && character.appearance_frequency < 10) {
        const gapRequired = Math.floor(20 / character.appearance_frequency);
        if (lessonNumber - lastUsed < gapRequired) {
          return false;
        }
      }
      
      return true;
    });
  }

  selectByWeight(characters, lessonInfo) {
    if (characters.length === 0) return null;
    
    // Calculate weights based on appearance frequency and relevance
    const weights = characters.map(character => {
      let weight = character.appearance_frequency;
      
      // Boost weight for relevant characters
      if (lessonInfo.phase === 'Foundations' && character.traits.includes('eager')) {
        weight *= 1.5;
      }
      
      if (lessonInfo.phase === 'Advanced Control' && character.traits.includes('technical')) {
        weight *= 1.5;
      }
      
      return { character, weight };
    });
    
    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { character, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return character;
      }
    }
    
    // Fallback to first character
    return characters[0];
  }

  recordCharacterUsage(lessonNumber, characters) {
    characters.forEach(character => {
      // Update last used lesson
      this.lastUsedCharacters.set(character.name, lessonNumber);
      
      // Update consecutive usage
      const previousConsecutive = this.consecutiveUsage.get(character.name) || 0;
      const lastLesson = this.getLastLessonForCharacter(character.name);
      
      if (lastLesson === lessonNumber - 1) {
        this.consecutiveUsage.set(character.name, previousConsecutive + 1);
      } else {
        this.consecutiveUsage.set(character.name, 1);
      }
    });
    
    // Add to rotation history
    this.rotationHistory.push({
      lessonNumber,
      characters: characters.map(c => c.name),
      timestamp: new Date().toISOString()
    });
    
    // Keep history limited
    if (this.rotationHistory.length > 100) {
      this.rotationHistory = this.rotationHistory.slice(-50);
    }
  }

  getLastLessonForCharacter(characterName) {
    for (let i = this.rotationHistory.length - 1; i >= 0; i--) {
      if (this.rotationHistory[i].characters.includes(characterName)) {
        return this.rotationHistory[i].lessonNumber;
      }
    }
    return 0;
  }

  getCharacterByName(name) {
    const character = this.characterPool.find(c => c.name === name);
    if (!character) {
      console.warn(`Character ${name} not found, using default`);
      return this.characterPool[0]; // Return The Doctor as fallback
    }
    return { ...character }; // Return a copy to avoid mutations
  }

  getDefaultCharacters() {
    return [
      this.getCharacterByName('The Doctor'),
      this.getCharacterByName('Captain Tal')
    ];
  }

  // Character information methods
  getCharacterInfo(characterName) {
    const character = this.getCharacterByName(characterName);
    if (character) {
      return {
        name: character.name,
        series: character.series,
        role: character.role,
        personality: character.personality,
        traits: character.traits,
        voice_pattern: character.voice_pattern,
        teaching_style: character.teaching_style
      };
    }
    return null;
  }

  getCharacterPool() {
    return this.characterPool.map(character => ({
      name: character.name,
      series: character.series,
      role: character.role,
      appearance_frequency: character.appearance_frequency
    }));
  }

  getRotationHistory(limit = 20) {
    return this.rotationHistory.slice(-limit);
  }

  getCharacterUsageStats() {
    const stats = {};
    
    this.characterPool.forEach(character => {
      const appearances = this.rotationHistory.filter(entry => 
        entry.characters.includes(character.name)
      ).length;
      
      stats[character.name] = {
        total_appearances: appearances,
        last_used: this.lastUsedCharacters.get(character.name) || 0,
        consecutive_uses: this.consecutiveUsage.get(character.name) || 0,
        appearance_frequency: character.appearance_frequency
      };
    });
    
    return stats;
  }

  // Configuration methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Character rotation configuration updated');
  }

  setEnabled(enabled) {
    this.config.enabled = enabled;
    console.log(`🔄 Character rotation ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Reset and management
  resetRotation() {
    this.rotationHistory = [];
    this.lastUsedCharacters.clear();
    this.consecutiveUsage.clear();
    console.log('🔄 Character rotation history reset');
  }

  // Status and debugging
  getStatus() {
    return {
      enabled: this.config.enabled,
      total_characters: this.characterPool.length,
      rotation_history_size: this.rotationHistory.length,
      recent_rotations: this.getRotationHistory(5),
      character_usage: this.getCharacterUsageStats()
    };
  }

  showStatus() {
    const status = this.getStatus();
    console.log('🔄 Character Rotation Status:');
    console.log(`   Enabled: ${status.enabled}`);
    console.log(`   Total Characters: ${status.total_characters}`);
    console.log(`   Recent Rotations: ${status.recent_rotations.length}`);
    
    if (status.recent_rotations.length > 0) {
      console.log('   Last 5 lessons:');
      status.recent_rotations.forEach(rotation => {
        console.log(`     Lesson ${rotation.lessonNumber}: ${rotation.characters.join(', ')}`);
      });
    }
  }

  // Testing method
  testCharacterSelection(lessonNumber, lessonInfo) {
    console.log(`🧪 Testing character selection for lesson ${lessonNumber}`);
    const characters = this.selectCharactersForLesson(lessonNumber, lessonInfo);
    console.log(`Selected: ${characters.map(c => c.name).join(', ')}`);
    return characters;
  }
}

module.exports = CharacterRotation;
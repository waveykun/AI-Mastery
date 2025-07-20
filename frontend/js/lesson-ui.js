// frontend/js/lesson-ui.js - Enhanced Lesson User Interface
class LessonUI {
  constructor(app) {
    this.app = app;
    this.currentLesson = null;
    this.lessonProgress = {
      stepsCompleted: 0,
      interactions: [],
      startTime: null,
      attempts: 0
    };
    
    this.stepDelay = 800; // Delay between steps in milliseconds
    this.enableAnimations = true;
    this.keyboardShortcuts = true;
    this.lessonKeyHandler = null;
    
    console.log('📚 Enhanced Lesson UI initialized');
  }

  async displayLesson(lesson) {
    this.currentLesson = lesson;
    this.resetLessonProgress();
    
    console.log(`📖 Displaying lesson ${lesson.number}: ${lesson.topic}`);
    
    // Clear previous content
    this.clearPreviousContent();
    
    // Update lesson header with animation
    this.updateLessonHeader(lesson);
    
    // Display lesson content progressively
    await this.displayLessonContent(lesson);
    
    // Setup lesson-specific interactions
    this.setupLessonInteractions();
    
    // Focus on answer area
    this.focusAnswerArea();
  }

  resetLessonProgress() {
    this.lessonProgress = {
      stepsCompleted: 0,
      interactions: [],
      startTime: Date.now(),
      attempts: 0
    };
  }

  updateLessonHeader(lesson) {
    // Animate lesson number change
    if (this.app.elements.lessonNumber) {
      this.animateTextChange(this.app.elements.lessonNumber, `Lesson ${lesson.number}`);
    }
    
    // Animate title change
    if (this.app.elements.lessonTitle) {
      this.animateTextChange(this.app.elements.lessonTitle, lesson.topic);
    }
    
    // Update badges
    if (this.app.elements.lessonPhase) {
      this.app.elements.lessonPhase.textContent = lesson.phase;
      this.app.elements.lessonPhase.className = `lesson-badge phase phase-${lesson.phase.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    if (this.app.elements.lessonDifficulty) {
      this.app.elements.lessonDifficulty.textContent = lesson.difficulty;
      this.app.elements.lessonDifficulty.className = `lesson-badge difficulty difficulty-${lesson.difficulty}`;
    }
  }

  async displayLessonContent(lesson) {
    const container = this.app.elements.lessonContent;
    if (!container) return;
    
    // Create content sections
    const sections = this.createContentSections(lesson);
    
    // Display sections with progressive animation
    for (let i = 0; i < sections.length; i++) {
      if (this.enableAnimations) {
        await this.delay(this.stepDelay);
      }
      
      const section = sections[i];
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      container.appendChild(section);
      
      // Animate in
      requestAnimationFrame(() => {
        section.style.transition = 'all 0.5s ease';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      });
      
      this.updateLessonProgressStats();
    }
  }

  createContentSections(lesson) {
    const sections = [];
    const content = lesson.content;
    
    // Objectives section
    if (content.objectives) {
      sections.push(this.createObjectivesSection(content.objectives));
    }
    
    // Main explanation
    if (content.explanation) {
      sections.push(this.createExplanationSection(content.explanation));
    }
    
    // Key concepts
    if (content.key_concepts) {
      sections.push(this.createKeyConceptsSection(content.key_concepts));
    }
    
    // Examples
    if (content.examples) {
      sections.push(this.createExamplesSection(content.examples));
    }
    
    // Pro tips
    if (content.pro_tips) {
      sections.push(this.createProTipsSection(content.pro_tips));
    }
    
    // Common mistakes
    if (content.common_mistakes) {
      sections.push(this.createCommonMistakesSection(content.common_mistakes));
    }
    
    // Prerequisites
    if (content.prerequisites) {
      sections.push(this.createPrerequisitesSection(content.prerequisites));
    }
    
    return sections;
  }

  createObjectivesSection(objectives) {
    const section = document.createElement('div');
    section.className = 'lesson-section objectives-section';
    section.innerHTML = `
      <h3>🎯 Learning Objectives</h3>
      <ul class="objectives-list">
        ${objectives.map(obj => `<li class="objective-item">${this.escapeHtml(obj)}</li>`).join('')}
      </ul>
    `;
    return section;
  }

  createExplanationSection(explanation) {
    const section = document.createElement('div');
    section.className = 'lesson-section explanation-section';
    section.innerHTML = `
      <h3>📖 Explanation</h3>
      <div class="explanation-content">
        ${this.formatText(explanation)}
      </div>
    `;
    return section;
  }

  createKeyConceptsSection(concepts) {
    const section = document.createElement('div');
    section.className = 'lesson-section concepts-section';
    section.innerHTML = `
      <h3>🔑 Key Concepts</h3>
      <div class="concepts-grid">
        ${concepts.map(concept => `
          <div class="concept-item">
            <span class="concept-highlight">${this.escapeHtml(concept)}</span>
          </div>
        `).join('')}
      </div>
    `;
    return section;
  }

  createExamplesSection(examples) {
    const section = document.createElement('div');
    section.className = 'lesson-section examples-section';
    section.innerHTML = `
      <h3>💡 Examples</h3>
      <div class="examples-list">
        ${examples.map((example, index) => `
          <div class="example-item">
            <div class="example-number">${index + 1}</div>
            <div class="example-content">${this.formatText(example)}</div>
          </div>
        `).join('')}
      </div>
    `;
    return section;
  }

  createProTipsSection(tips) {
    const section = document.createElement('div');
    section.className = 'lesson-section tips-section';
    section.innerHTML = `
      <h3>⭐ Pro Tips</h3>
      <div class="tips-list">
        ${tips.map(tip => `
          <div class="tip-item">
            <span class="tip-icon">💡</span>
            <span class="tip-text">${this.formatText(tip)}</span>
          </div>
        `).join('')}
      </div>
    `;
    return section;
  }

  createCommonMistakesSection(mistakes) {
    const section = document.createElement('div');
    section.className = 'lesson-section mistakes-section';
    section.innerHTML = `
      <h3>⚠️ Common Mistakes</h3>
      <div class="mistakes-list">
        ${mistakes.map(mistake => `
          <div class="mistake-item">
            <span class="mistake-icon">❌</span>
            <span class="mistake-text">${this.formatText(mistake)}</span>
          </div>
        `).join('')}
      </div>
    `;
    return section;
  }

  createPrerequisitesSection(prerequisites) {
    const section = document.createElement('div');
    section.className = 'lesson-section prerequisites-section';
    section.innerHTML = `
      <h3>📋 Prerequisites</h3>
      <div class="prerequisites-info">
        <p>Before starting this lesson, make sure you have completed:</p>
        <ul class="prerequisites-list">
          ${prerequisites.map(prereq => `
            <li class="prerequisite-item">
              <span class="prereq-link" data-lesson="${prereq}">${prereq}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    
    // Add click handlers for prerequisite links
    section.addEventListener('click', (e) => {
      if (e.target.classList.contains('prereq-link')) {
        const lessonRef = e.target.dataset.lesson;
        this.handlePrerequisiteClick(lessonRef);
      }
    });
    
    return section;
  }

  setupLessonInteractions() {
    // Setup enhanced answer input
    this.setupAnswerInput();
    
    // Setup keyboard shortcuts
    this.setupLessonKeyboardShortcuts();
    
    // Setup progress tracking
    this.setupProgressTracking();
    
    // Setup hints system
    this.setupHintsSystem();
  }

  setupAnswerInput() {
    const answerInput = this.app.elements.userAnswer;
    if (!answerInput) return;
    
    // Clear previous answer
    answerInput.value = '';
    
    // Load saved draft if available
    this.loadAnswerDraft();
    
    // Character counter
    this.setupCharacterCounter();
    
    // Auto-expand textarea
    this.setupAutoExpand();
    
    // Smart suggestions (if implemented)
    this.setupSmartSuggestions();
  }

  setupCharacterCounter() {
    const answerInput = this.app.elements.userAnswer;
    if (!answerInput) return;
    
    // Create counter element
    let counter = document.querySelector('.character-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'character-counter';
      answerInput.parentNode.insertBefore(counter, answerInput.nextSibling);
    }
    
    const updateCounter = () => {
      const length = answerInput.value.length;
      const maxLength = 5000; // Reasonable limit
      counter.textContent = `${length} characters`;
      
      if (length > maxLength * 0.9) {
        counter.classList.add('warning');
      } else {
        counter.classList.remove('warning');
      }
    };
    
    answerInput.addEventListener('input', updateCounter);
    updateCounter();
  }

  setupAutoExpand() {
    const answerInput = this.app.elements.userAnswer;
    if (!answerInput) return;
    
    const autoExpand = () => {
      answerInput.style.height = 'auto';
      answerInput.style.height = Math.min(answerInput.scrollHeight, 400) + 'px';
    };
    
    answerInput.addEventListener('input', autoExpand);
    autoExpand();
  }

  setupSmartSuggestions() {
    // Placeholder for future smart suggestions feature
    // Could include common prompt patterns, technical terms, etc.
  }

  setupLessonKeyboardShortcuts() {
    if (!this.keyboardShortcuts) return;
    
    this.lessonKeyHandler = (e) => {
      // Only handle if not typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch(e.key) {
        case 'h':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.requestHint();
          }
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.skipLesson();
          }
          break;
        case 'n':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.nextLesson();
          }
          break;
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.previousLesson();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', this.lessonKeyHandler);
  }

  setupProgressTracking() {
    // Track time spent on lesson
    this.progressTracker = setInterval(() => {
      this.lessonProgress.interactions.push({
        timestamp: Date.now(),
        type: 'time_checkpoint'
      });
    }, 30000); // Every 30 seconds
    
    // Track scroll progress
    this.setupScrollTracking();
  }

  setupScrollTracking() {
    const container = this.app.elements.lessonContent;
    if (!container) return;
    
    let lastScrollPosition = 0;
    
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset;
      const direction = scrollPosition > lastScrollPosition ? 'down' : 'up';
      
      this.lessonProgress.interactions.push({
        timestamp: Date.now(),
        type: 'scroll',
        direction: direction,
        position: scrollPosition
      });
      
      lastScrollPosition = scrollPosition;
    };
    
    window.addEventListener('scroll', this.debounce(handleScroll, 1000));
  }

  setupHintsSystem() {
    // Create hints data based on lesson content
    this.generateContextualHints();
  }

  generateContextualHints() {
    if (!this.currentLesson) return;
    
    const lesson = this.currentLesson;
    const hints = [];
    
    // Generate hints based on lesson content
    if (lesson.content.key_concepts) {
      hints.push(`Focus on these key concepts: ${lesson.content.key_concepts.slice(0, 2).join(', ')}`);
    }
    
    if (lesson.content.examples) {
      hints.push(`Consider the examples provided, especially the first one`);
    }
    
    if (lesson.phase === 'Foundations') {
      hints.push(`Remember, this is a foundational concept - focus on understanding the basics`);
    } else if (lesson.phase === 'Advanced Control') {
      hints.push(`This is an advanced topic - think about practical applications and edge cases`);
    }
    
    // Phase-specific hints
    if (lesson.difficulty === 'beginner') {
      hints.push(`Don't overthink it - focus on the fundamental principles`);
    } else if (lesson.difficulty === 'advanced') {
      hints.push(`Consider how this relates to previous lessons and real-world scenarios`);
    }
    
    this.contextualHints = hints;
  }

  // Enhanced response display
  async displayLessonResponse(data) {
    const container = this.app.elements.lessonContent;
    if (!container) return;
    
    // Create response container
    const responseContainer = document.createElement('div');
    responseContainer.className = 'lesson-response-container';
    
    // Display steps progressively
    if (data.steps) {
      await this.displayResponseSteps(responseContainer, data.steps);
    }
    
    // Display comic if available
    if (data.comic) {
      await this.displayResponseComic(responseContainer, data.comic);
    }
    
    // Add to lesson content
    container.appendChild(responseContainer);
    
    // Scroll to response
    responseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async displayResponseSteps(container, steps) {
    const stepOrder = [
      'step1_performance_review',
      'step2_topic_announcement', 
      'step3_explanation',
      'step4_personalized_example',
      'step5_practice_exercise',
      'step6_visual_aid'
    ];
    
    for (const stepKey of stepOrder) {
      if (steps[stepKey]) {
        await this.displayResponseStep(container, stepKey, steps[stepKey]);
        if (this.enableAnimations) {
          await this.delay(this.stepDelay);
        }
      }
    }
  }

  async displayResponseStep(container, stepKey, stepData) {
    const stepElement = document.createElement('div');
    stepElement.className = `response-step ${stepKey.replace(/_/g, '-')}`;
    
    // Create step content based on type
    switch (stepKey) {
      case 'step1_performance_review':
        stepElement.innerHTML = this.createPerformanceReviewHTML(stepData);
        break;
      case 'step2_topic_announcement':
        stepElement.innerHTML = this.createTopicAnnouncementHTML(stepData);
        break;
      case 'step3_explanation':
        stepElement.innerHTML = this.createExplanationHTML(stepData);
        break;
      case 'step4_personalized_example':
        stepElement.innerHTML = this.createPersonalizedExampleHTML(stepData);
        break;
      case 'step5_practice_exercise':
        stepElement.innerHTML = this.createPracticeExerciseHTML(stepData);
        break;
      case 'step6_visual_aid':
        stepElement.innerHTML = this.createVisualAidHTML(stepData);
        break;
    }
    
    // Animate in
    stepElement.style.opacity = '0';
    stepElement.style.transform = 'translateY(20px)';
    container.appendChild(stepElement);
    
    requestAnimationFrame(() => {
      stepElement.style.transition = 'all 0.5s ease';
      stepElement.style.opacity = '1';
      stepElement.style.transform = 'translateY(0)';
    });
  }

  createPerformanceReviewHTML(data) {
    const score = data.score || 0;
    const scoreClass = score >= 8 ? 'excellent' : score >= 6 ? 'good' : 'needs-improvement';
    
    return `
      <div class="performance-review">
        <h4>📊 Performance Review</h4>
        <div class="score-display ${scoreClass}">
          <div class="score-number">${score.toFixed(1)}</div>
          <div class="score-label">/ 10</div>
        </div>
        <div class="doctor-feedback">${this.escapeHtml(data.doctorComment || '')}</div>
      </div>
    `;
  }

  createTopicAnnouncementHTML(data) {
    return `
      <div class="topic-announcement">
        <h4>📢 Topic Focus</h4>
        <div class="announcement-content">${this.escapeHtml(data.doctorComment || '')}</div>
      </div>
    `;
  }

  createExplanationHTML(data) {
    return `
      <div class="explanation-response">
        <h4>📖 The Doctor's Explanation</h4>
        <div class="explanation-text">${this.formatText(data.explanation || data.doctorComment || '')}</div>
      </div>
    `;
  }

  createPersonalizedExampleHTML(data) {
    return `
      <div class="personalized-example">
        <h4>💡 Personalized Example</h4>
        <div class="example-content">${this.formatText(data.example || data.doctorComment || '')}</div>
      </div>
    `;
  }

  createPracticeExerciseHTML(data) {
    return `
      <div class="practice-exercise">
        <h4>🎯 Practice Exercise</h4>
        <div class="exercise-content">${this.formatText(data.exercise || data.doctorComment || '')}</div>
      </div>
    `;
  }

  createVisualAidHTML(data) {
    if (data.comic && data.comic.image_url) {
      return `
        <div class="visual-aid">
          <h4>🎭 Visual Learning Aid</h4>
          <div class="comic-preview">
            <img src="${data.comic.image_url}" alt="Educational Comic" class="comic-preview-image">
            <button class="view-comic-button" onclick="window.AIMasteryApp?.showComic(${JSON.stringify(data.comic).replace(/"/g, '&quot;')})">
              📖 View Full Comic
            </button>
          </div>
        </div>
      `;
    } else if (data.comic && data.comic.panels) {
      return `
        <div class="visual-aid">
          <h4>🎭 Visual Learning Aid</h4>
          <div class="comic-fallback-preview">
            ${data.comic.panels.slice(0, 2).map((panel, i) => `
              <div class="panel-preview">
                <strong>Panel ${i + 1}:</strong> ${panel.scene}
              </div>
            `).join('')}
            ${data.comic.panels.length > 2 ? `<div class="more-panels">... and ${data.comic.panels.length - 2} more panels</div>` : ''}
            <button class="view-comic-button" onclick="window.AIMasteryApp?.showComic(${JSON.stringify(data.comic).replace(/"/g, '&quot;')})">
              📖 Read Full Comic
            </button>
          </div>
        </div>
      `;
    } else {
      return '<p>Visual aid content temporarily unavailable.</p>';
    }
  }

  // Utility Methods
  animateTextChange(element, newText) {
    if (!element || !this.enableAnimations) {
      if (element) element.textContent = newText;
      return;
    }
    
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.textContent = newText;
      element.style.opacity = '1';
    }, 300);
  }

  formatText(text) {
    if (!text) return '';
    
    // Convert newlines to paragraphs
    return text.split('\n\n').map(paragraph => 
      `<p>${this.escapeHtml(paragraph.trim())}</p>`
    ).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Event Handlers
  async requestHint() {
    if (this.contextualHints && this.contextualHints.length > 0) {
      const hint = this.contextualHints[Math.floor(Math.random() * this.contextualHints.length)];
      this.app.updateDoctorResponse(`Hint: ${hint}`, 'hint');
    } else {
      await this.app.requestHint();
    }
  }

  skipLesson() {
    this.app.skipLesson();
  }

  nextLesson() {
    this.app.nextLesson();
  }

  previousLesson() {
    this.app.previousLesson();
  }

  handlePrerequisiteClick(lessonRef) {
    // Extract lesson number from reference
    const match = lessonRef.match(/\d+/);
    if (match) {
      const lessonNumber = parseInt(match[0]);
      this.app.loadLesson(lessonNumber);
    }
  }

  focusAnswerArea() {
    if (this.app.elements.userAnswer) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        this.app.elements.userAnswer.focus();
      }, 500);
    }
  }

  loadAnswerDraft() {
    if (!this.currentLesson) return;
    
    const saved = localStorage.getItem(`lesson_${this.currentLesson.number}_answer`);
    if (saved && this.app.elements.userAnswer) {
      this.app.elements.userAnswer.value = saved;
    }
  }

  clearPreviousContent() {
    const contentContainer = this.app.elements.lessonContent;
    if (contentContainer) {
      contentContainer.innerHTML = '';
    }
  }

  updateLessonProgressStats() {
    this.lessonProgress.stepsCompleted++;
    this.lessonProgress.interactions.push({
      timestamp: Date.now(),
      type: 'lesson_content_viewed'
    });
  }

  // Enhanced answer submission
  async submitAnswerWithTracking() {
    this.lessonProgress.attempts++;
    this.lessonProgress.interactions.push({
      timestamp: Date.now(),
      type: 'answer_submitted',
      attempt: this.lessonProgress.attempts
    });
    
    // Call the main app's submit method
    await this.app.submitAnswer();
  }

  // Configuration methods
  setAnimationsEnabled(enabled) {
    this.enableAnimations = enabled;
    console.log(`📚 Lesson animations ${enabled ? 'enabled' : 'disabled'}`);
  }

  setKeyboardShortcuts(enabled) {
    this.keyboardShortcuts = enabled;
    if (!enabled && this.lessonKeyHandler) {
      document.removeEventListener('keydown', this.lessonKeyHandler);
      this.lessonKeyHandler = null;
    }
    console.log(`⌨️ Lesson keyboard shortcuts ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Cleanup when lesson is closed
  cleanupLesson() {
    // Remove keyboard shortcuts
    if (this.lessonKeyHandler) {
      document.removeEventListener('keydown', this.lessonKeyHandler);
      this.lessonKeyHandler = null;
    }
    
    // Clear progress tracker
    if (this.progressTracker) {
      clearInterval(this.progressTracker);
      this.progressTracker = null;
    }
    
    // Clear lesson data
    this.currentLesson = null;
    this.contextualHints = [];
    
    console.log('🧹 Lesson UI cleaned up');
  }

  // Get lesson statistics
  getLessonStats() {
    if (!this.lessonProgress.startTime) return null;
    
    const duration = Date.now() - this.lessonProgress.startTime;
    
    return {
      duration: duration,
      stepsCompleted: this.lessonProgress.stepsCompleted,
      interactions: this.lessonProgress.interactions.length,
      attempts: this.lessonProgress.attempts,
      lesson: this.currentLesson?.number || null
    };
  }
}

// Make available globally for other components
window.LessonUI = LessonUI;
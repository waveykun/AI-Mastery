// frontend/js/app.js - AI Mastery: The Doctor - Main Application
class AIMasteryApp {
  constructor() {
    this.state = {
      currentLesson: null,
      user: 'captain_tal',
      isLoading: false,
      doctorStatus: 'operational',
      settings: {
        humorLevel: 7,
        comicsEnabled: true,
        characterRotation: true,
        preferredExamples: ''
      }
    };

    this.config = {
      apiBaseUrl: '/api',
      comicsEnabled: true,
      autoSave: true,
      debugMode: false
    };

    this.elements = {};
    this.lessonUI = null;
    this.comicViewer = null;
    this.currentNotification = null;

    console.log('🎭 AI Mastery: The Doctor initializing...');
  }

// DOCTOR'S ORDERS: This is the new, more robust initialize function.
// It will prevent one failed network request from halting the entire application startup.
async initialize() {
    try {
      this.showLoadingStatus('Initializing application components...');
      this.findElements();
      this.setupEventListeners();

      this.showLoadingStatus('Loading user settings...');
      try {
        await this.loadUserSettings();
      } catch (e) {
        console.warn('Could not load user settings, using defaults.', e.message);
        this.showWarning('Could not load user settings, using defaults.');
      }

      this.showLoadingStatus('Checking server status...');
      try {
        await this.checkServerStatus();
      } catch (e) {
        console.error('Server status check failed.', e.message);
        this.showError('Server connection failed. Operating in limited mode.');
      }

      this.showLoadingStatus('Loading progress data...');
      try {
        await this.loadProgressData();
      } catch (e) {
        console.warn('Could not load progress data.', e.message);
      }
      
      this.showLoadingStatus('Initializing UI components...');
      this.initializeComponents();
      
      this.showLoadingStatus('Activating The Doctor...');
      await this.activateDoctor();
      
      this.hideLoadingScreen();
      console.log('✅ AI Mastery: The Doctor ready for service');
      
    } catch (error) {
      console.error('❌ Application initialization failed catastrophically:', error);
      this.showError('A critical error occurred during startup. Please restart.');
    }
}

  async waitForPreloadReady() {
    return new Promise((resolve) => {
      if (window.AIMasteryReady) {
        resolve();
      } else {
        window.addEventListener('AIMasteryPreloadReady', resolve, { once: true });
      }
    });
  }

  showLoadingStatus(message) {
    const statusElement = document.querySelector('.loading-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
    console.log(`🔄 ${message}`);
  }

  findElements() {
    // Main app elements
    this.elements = {
      // Core containers
      loadingScreen: document.getElementById('loadingScreen'),
      app: document.getElementById('app'),
      mainContent: document.querySelector('.main-content'),
      
      // Header controls
      statusButton: document.getElementById('statusButton'),
      settingsButton: document.getElementById('settingsButton'),
      helpButton: document.getElementById('helpButton'),
      
      // Doctor interface
      doctorInterface: document.querySelector('.doctor-interface'),
      doctorResponse: document.getElementById('doctorResponse'),
      doctorStatus: document.getElementById('doctorStatus'),
      
      // Dashboard elements
      startLearningButton: document.getElementById('startLearningButton'),
      nextLessonButton: document.getElementById('nextLessonButton'),
      
      // Progress overview
      completedLessons: document.getElementById('completedLessons'),
      averageScore: document.getElementById('averageScore'),
      completionRate: document.getElementById('completionRate'),
      phase1Progress: document.getElementById('phase1Progress'),
      phase2Progress: document.getElementById('phase2Progress'),
      phase3Progress: document.getElementById('phase3Progress'),
      phase4Progress: document.getElementById('phase4Progress'),
      phase1Count: document.getElementById('phase1Count'),
      phase2Count: document.getElementById('phase2Count'),
      phase3Count: document.getElementById('phase3Count'),
      phase4Count: document.getElementById('phase4Count'),
      
      // Lesson interface
      lessonSection: document.getElementById('lessonSection'),
      lessonTitle: document.getElementById('lessonTitle'),
      lessonPhase: document.getElementById('lessonPhase'),
      lessonDifficulty: document.getElementById('lessonDifficulty'),
      lessonNumber: document.getElementById('lessonNumber'),
      lessonContent: document.getElementById('lessonContent'),
      userAnswer: document.getElementById('userAnswer'),
      submitAnswerButton: document.getElementById('submitAnswerButton'),
      hintButton: document.getElementById('hintButton'),
      skipButton: document.getElementById('skipButton'),
      prevLessonButton: document.getElementById('prevLessonButton'),
      nextLessonButtonTop: document.getElementById('nextLessonButtonTop'),
      closeLessonButton: document.getElementById('closeLessonButton'),
      
      // Comic section
      comicSection: document.getElementById('comicSection'),
      comicContent: document.getElementById('comicContent'),
      closeComicButton: document.getElementById('closeComicButton'),
      
      // Modals
      settingsModal: document.getElementById('settingsModal'),
      statusModal: document.getElementById('statusModal'),
      helpModal: document.getElementById('helpModal'),
      
      // Settings modal elements
      humorSlider: document.getElementById('humorSlider'),
      humorValue: document.getElementById('humorValue'),
      comicsEnabled: document.getElementById('comicsEnabled'),
      characterRotation: document.getElementById('characterRotation'),
      preferredExamples: document.getElementById('preferredExamples'),
      saveSettingsButton: document.getElementById('saveSettingsButton'),
      
      // Status modal elements
      refreshStatusButton: document.getElementById('refreshStatusButton'),
      statusContent: document.getElementById('statusContent')
    };

    // Log missing critical elements
    const criticalElements = ['app', 'doctorResponse', 'startLearningButton'];
    const missingElements = criticalElements.filter(id => !this.elements[id]);
    
    if (missingElements.length > 0) {
      console.warn('⚠️ Missing critical elements:', missingElements);
    }
  }

  setupEventListeners() {
    // Header controls
    this.addClickListener('statusButton', () => this.showStatusModal());
    this.addClickListener('settingsButton', () => this.showSettingsModal());
    this.addClickListener('helpButton', () => this.showHelpModal());
    
    // Dashboard controls
    this.addClickListener('startLearningButton', () => this.startNextLesson());
    this.addClickListener('nextLessonButton', () => this.startNextLesson());
    
    // Lesson controls
    this.addClickListener('submitAnswerButton', () => this.submitAnswer());
    this.addClickListener('hintButton', () => this.requestHint());
    this.addClickListener('skipButton', () => this.skipLesson());
    this.addClickListener('prevLessonButton', () => this.previousLesson());
    this.addClickListener('nextLessonButtonTop', () => this.nextLesson());
    this.addClickListener('closeLessonButton', () => this.closeLesson());
    
    // Comic controls
    this.addClickListener('closeComicButton', () => this.closeComic());
    
    // Settings controls
    this.addClickListener('saveSettingsButton', () => this.saveSettings());
    
    if (this.elements.humorSlider) {
      this.elements.humorSlider.addEventListener('input', (e) => {
        if (this.elements.humorValue) {
          this.elements.humorValue.textContent = e.target.value;
        }
      });
    }
    
    // Status controls
    this.addClickListener('refreshStatusButton', () => this.refreshStatus());
    
    // Modal controls
    this.setupModalEventListeners();
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Auto-save for lesson answers
    if (this.elements.userAnswer) {
      this.elements.userAnswer.addEventListener('input', this.debounce(() => {
        this.autoSaveAnswer();
      }, 1000));
    }
  }

  addClickListener(elementKey, handler) {
    const element = this.elements[elementKey];
    if (element) {
      element.addEventListener('click', handler);
    }
  }

  setupModalEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target);
      }
    });
    
    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
    
    // Close button handlers
    document.querySelectorAll('.modal-close').forEach(button => {
      button.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl/Cmd + Enter to submit answer
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (this.state.currentLesson) {
          this.submitAnswer();
        }
      }
      
      // S key for settings
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.showSettingsModal();
      }
      
      // H key for help
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.showHelpModal();
      }
      
      // Space to start learning (when not in lesson)
      if (e.key === ' ' && !this.state.currentLesson) {
        e.preventDefault();
        this.startNextLesson();
      }
    });
  }

  initializeComponents() {
    // Initialize lesson UI if available
    if (typeof LessonUI !== 'undefined') {
      this.lessonUI = new LessonUI(this);
    }
    
    // Initialize comic viewer if available
    if (typeof ComicViewer !== 'undefined') {
      this.comicViewer = new ComicViewer(this);
    }
  }

  async loadUserSettings() {
    try {
      if (!window.AIMasteryAPI) {
        console.warn('API not available, using default settings');
        return;
      }

      const response = await window.AIMasteryAPI.settings.get();
      
      if (response.success && response.settings) {
        this.state.settings = { ...this.state.settings, ...response.settings };
        this.applySettings();
        console.log('⚙️ User settings loaded');
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      this.showWarning('Using default settings');
    }
  }

  applySettings() {
    const { settings } = this.state;
    
    // Apply humor level
    if (this.elements.humorSlider) {
      this.elements.humorSlider.value = settings.humorLevel;
    }
    if (this.elements.humorValue) {
      this.elements.humorValue.textContent = settings.humorLevel;
    }
    
    // Apply comics setting
    if (this.elements.comicsEnabled) {
      this.elements.comicsEnabled.checked = settings.comicsEnabled;
    }
    this.config.comicsEnabled = settings.comicsEnabled;
    
    // Apply character rotation setting
    if (this.elements.characterRotation) {
      this.elements.characterRotation.checked = settings.characterRotation;
    }
    
    // Apply preferred examples
    if (this.elements.preferredExamples) {
      this.elements.preferredExamples.value = settings.preferredExamples || '';
    }
  }

  async checkServerStatus() {
    try {
      if (!window.AIMasteryAPI) {
        throw new Error('API not available');
      }

      const response = await window.AIMasteryAPI.server.getStatus();
      
      if (response.success) {
        this.state.doctorStatus = 'operational';
        this.updateDoctorStatus('operational');
      } else {
        throw new Error('Server status check failed');
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      this.state.doctorStatus = 'offline';
      this.updateDoctorStatus('offline');
      this.showWarning('The Doctor\'s systems are running in simulation mode');
    }
  }

  updateDoctorStatus(status) {
    if (!this.elements.doctorStatus) return;
    
    const statusMessages = {
      operational: 'Operational',
      offline: 'Simulation Mode',
      error: 'System Error'
    };
    
    this.elements.doctorStatus.textContent = statusMessages[status] || status;
    this.elements.doctorStatus.className = `doctor-status ${status}`;
  }

  async loadProgressData() {
    try {
      if (!window.AIMasteryAPI) {
        this.showDefaultProgress();
        return;
      }

      const response = await window.AIMasteryAPI.reports.getProgress();
      
      if (response.success && response.progress) {
        this.updateProgressDisplay(response.progress);
      } else {
        this.showDefaultProgress();
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
      this.showDefaultProgress();
    }
  }

  showDefaultProgress() {
    this.updateProgressDisplay({
      totalLessons: 0,
      averageScore: 0,
      completionRate: 0,
      phase1Complete: 0,
      phase2Complete: 0,
      phase3Complete: 0,
      phase4Complete: 0
    });
  }

  updateProgressDisplay(progress) {
    // Update main stats
    if (this.elements.completedLessons) {
      this.elements.completedLessons.textContent = progress.totalLessons || 0;
    }
    
    if (this.elements.averageScore) {
      this.elements.averageScore.textContent = (progress.averageScore || 0).toFixed(1);
    }
    
    if (this.elements.completionRate) {
      this.elements.completionRate.textContent = `${(progress.completionRate || 0).toFixed(0)}%`;
    }
    
    // Update phase progress
    this.updatePhaseProgress(1, progress.phase1Complete || 0, 15);
    this.updatePhaseProgress(2, progress.phase2Complete || 0, 15);
    this.updatePhaseProgress(3, progress.phase3Complete || 0, 15);
    this.updatePhaseProgress(4, progress.phase4Complete || 0, 15);
  }

  updatePhaseProgress(phase, completed, total) {
    const progressBar = this.elements[`phase${phase}Progress`];
    const counter = this.elements[`phase${phase}Count`];
    
    if (progressBar) {
      const percentage = (completed / total) * 100;
      const progressFill = progressBar.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = `${percentage}%`;
      }
    }
    
    if (counter) {
      counter.textContent = `${completed}/${total}`;
    }
  }

  async activateDoctor() {
    const greetings = [
      "Please state the nature of your educational emergency.",
      "I am The Doctor, and I will be conducting your educational treatment today.",
      "My holographic educational subroutines are at your disposal.",
      "I trust you're prepared for a thorough educational examination."
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    this.updateDoctorResponse(greeting);
  }

  updateDoctorResponse(message, type = 'default') {
    if (!this.elements.doctorResponse) return;
    
    this.elements.doctorResponse.innerHTML = `
      <div class="doctor-message ${type}">
        <span class="doctor-avatar">⚕️</span>
        <div class="message-content">${this.escapeHtml(message)}</div>
      </div>
    `;
    
    // Animate the response
    this.elements.doctorResponse.style.animation = 'none';
    setTimeout(() => {
      this.elements.doctorResponse.style.animation = 'slideInFromTop 0.5s ease';
    }, 10);
  }

  hideLoadingScreen() {
    if (this.elements.loadingScreen && this.elements.app) {
      this.elements.loadingScreen.style.display = 'none';
      this.elements.app.style.display = 'block';
    }
  }

  // Lesson Management
  async startNextLesson() {
    try {
      if (this.state.isLoading) return;
      
      this.state.isLoading = true;
      this.showLoading('Finding your next lesson...');
      
      // Determine next lesson number
      const nextLessonNumber = await this.getNextLessonNumber();
      
      if (nextLessonNumber) {
        await this.loadLesson(nextLessonNumber);
      } else {
        this.showSuccess('Congratulations! You\'ve completed all available lessons.');
      }
      
    } catch (error) {
      console.error('Failed to start next lesson:', error);
      this.showError('Failed to start the next lesson. Please try again.');
    } finally {
      this.state.isLoading = false;
      this.hideLoading();
    }
  }

  async getNextLessonNumber() {
    // Logic to determine the next lesson
    // This could be based on progress, user preferences, etc.
    
    if (!window.AIMasteryAPI) {
      return 1; // Default to lesson 1 in simulation mode
    }
    
    try {
      const response = await window.AIMasteryAPI.lessons.getProgress();
      if (response.success && response.progress) {
        const completedLessons = response.progress.length;
        return Math.min(completedLessons + 1, 60);
      }
    } catch (error) {
      console.error('Failed to get progress:', error);
    }
    
    return 1; // Default fallback
  }

  async loadLesson(lessonNumber) {
    try {
      this.showLoading(`Loading Lesson ${lessonNumber}...`);
      
      if (!window.AIMasteryAPI) {
        // Simulation mode
        this.loadSimulationLesson(lessonNumber);
        return;
      }
      
      const response = await window.AIMasteryAPI.lessons.getLesson(lessonNumber);
      
      if (response.success && response.lesson) {
        this.displayLesson(response.lesson);
        this.state.currentLesson = lessonNumber;
      } else {
        throw new Error('Failed to load lesson data');
      }
      
    } catch (error) {
      console.error(`Failed to load lesson ${lessonNumber}:`, error);
      this.showError(`Failed to load Lesson ${lessonNumber}`);
    } finally {
      this.hideLoading();
    }
  }

  loadSimulationLesson(lessonNumber) {
    // Fallback lesson for when API is not available
    const simulationLesson = {
      number: lessonNumber,
      topic: `Sample Topic ${lessonNumber}`,
      phase: 'Foundations',
      difficulty: 'beginner',
      content: {
        explanation: `This is a simulation of Lesson ${lessonNumber}. The actual lesson content would be loaded from the server when The Doctor's systems are fully operational.`,
        examples: ['Example 1: Basic concept demonstration', 'Example 2: Practical application'],
        key_points: ['Understanding the fundamentals', 'Practical application', 'Best practices']
      }
    };
    
    this.displayLesson(simulationLesson);
    this.state.currentLesson = lessonNumber;
    this.updateDoctorResponse(`Welcome to Lesson ${lessonNumber}. I'm operating in simulation mode, but my educational expertise remains undiminished.`);
  }

  displayLesson(lesson) {
    if (!this.elements.lessonSection) return;
    
    // Update lesson header
    if (this.elements.lessonNumber) {
      this.elements.lessonNumber.textContent = `Lesson ${lesson.number}`;
    }
    
    if (this.elements.lessonTitle) {
      this.elements.lessonTitle.textContent = lesson.topic;
    }
    
    if (this.elements.lessonPhase) {
      this.elements.lessonPhase.textContent = lesson.phase;
    }
    
    if (this.elements.lessonDifficulty) {
      this.elements.lessonDifficulty.textContent = lesson.difficulty;
    }
    
    // Update lesson content
    if (this.elements.lessonContent) {
      this.elements.lessonContent.innerHTML = this.formatLessonContent(lesson.content);
    }
    
    // Clear previous answer
    if (this.elements.userAnswer) {
      this.elements.userAnswer.value = '';
    }
    
    // Show lesson section
    this.elements.lessonSection.style.display = 'block';
    
    // Scroll to lesson
    this.elements.lessonSection.scrollIntoView({ behavior: 'smooth' });
    
    // Use lesson UI if available
    if (this.lessonUI) {
      this.lessonUI.displayLesson(lesson);
    }
  }

  formatLessonContent(content) {
    if (!content) return '<p>Loading lesson content...</p>';
    
    let html = '';
    
    if (content.explanation) {
      html += `<h3>Explanation</h3><p>${this.escapeHtml(content.explanation)}</p>`;
    }
    
    if (content.examples && content.examples.length > 0) {
      html += '<h3>Examples</h3><ul>';
      content.examples.forEach(example => {
        html += `<li>${this.escapeHtml(example)}</li>`;
      });
      html += '</ul>';
    }
    
    if (content.key_points && content.key_points.length > 0) {
      html += '<h3>Key Points</h3><ul>';
      content.key_points.forEach(point => {
        html += `<li>${this.escapeHtml(point)}</li>`;
      });
      html += '</ul>';
    }
    
    return html;
  }

  async submitAnswer() {
    if (!this.elements.userAnswer || this.state.isLoading) return;
    
    const answer = this.elements.userAnswer.value.trim();
    if (!answer) {
      this.showWarning('Please provide an answer before submitting.');
      return;
    }
    
    try {
      this.state.isLoading = true;
      this.showLoading('The Doctor is reviewing your answer...');
      
      if (!window.AIMasteryAPI) {
        this.handleSimulationSubmission(answer);
        return;
      }
      
      const response = await window.AIMasteryAPI.lessons.submit(answer, this.state.currentLesson);
      
      if (response.success) {
        this.handleLessonResponse(response);
      } else {
        throw new Error(response.error || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Answer submission failed:', error);
      this.showError('Failed to submit answer. Please try again.');
    } finally {
      this.state.isLoading = false;
      this.hideLoading();
    }
  }

  handleSimulationSubmission(answer) {
    // Simulate Doctor's response in offline mode
    const score = Math.random() * 4 + 6; // Random score between 6-10
    
    const responses = [
      `Your answer demonstrates ${score >= 8 ? 'excellent' : 'adequate'} understanding of the material.`,
      `I've analyzed your response. Your comprehension is ${score >= 7 ? 'progressing satisfactorily' : 'requiring additional attention'}.`,
      `${score >= 9 ? 'Outstanding work' : 'Acceptable effort'}. Your educational treatment is proceeding as expected.`
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    this.updateDoctorResponse(response);
    
    // Show success message
    this.showSuccess(`Answer submitted successfully! Score: ${score.toFixed(1)}/10`);
    
    setTimeout(() => {
      this.state.isLoading = false;
      this.hideLoading();
    }, 1000);
  }

  handleLessonResponse(response) {
    const { score, doctorResponse, comic } = response;
    
    // Update Doctor's response
    if (doctorResponse) {
      this.updateDoctorResponse(doctorResponse, 'response');
    }
    
    // Show score
    if (score) {
      this.showSuccess(`Lesson completed! Score: ${score}/10`);
    }
    
    // Show comic if available and enabled
    if (comic && this.config.comicsEnabled) {
      setTimeout(() => {
        this.showComic(comic);
      }, 1000);
    }
    
    // Update progress
    this.loadProgressData();
  }

  async requestHint() {
    if (!this.state.currentLesson) return;
    
    const hints = [
      "Consider the fundamental principles we've discussed.",
      "Think about the practical applications of this concept.",
      "Remember the key relationships between the components.",
      "Focus on the underlying mechanisms at work.",
      "Consider how this relates to previous lessons."
    ];
    
    const hint = hints[Math.floor(Math.random() * hints.length)];
    this.updateDoctorResponse(`Hint: ${hint}`, 'hint');
  }

  skipLesson() {
    if (!confirm('Are you certain you wish to skip this educational module? The Doctor finds this... inadvisable.')) {
      return;
    }
    
    this.updateDoctorResponse('Your decision to skip this lesson has been noted in your medical... educational record.');
    this.nextLesson();
  }

  previousLesson() {
    if (this.state.currentLesson && this.state.currentLesson > 1) {
      this.loadLesson(this.state.currentLesson - 1);
    }
  }

  nextLesson() {
    if (this.state.currentLesson && this.state.currentLesson < 60) {
      this.loadLesson(this.state.currentLesson + 1);
    } else {
      this.startNextLesson();
    }
  }

  closeLesson() {
    if (this.elements.lessonSection) {
      this.elements.lessonSection.style.display = 'none';
    }
    this.state.currentLesson = null;
    this.updateDoctorResponse('Lesson closed. Ready for your next educational challenge.');
  }

  autoSaveAnswer() {
    if (!this.config.autoSave || !this.elements.userAnswer) return;
    
    const answer = this.elements.userAnswer.value;
    localStorage.setItem(`lesson_${this.state.currentLesson}_answer`, answer);
  }

  // Comic Methods
  async showComic(comicData) {
    if (!this.elements.comicSection || !this.config.comicsEnabled) {
      return;
    }
    
    try {
      this.elements.comicSection.style.display = 'block';
      
      if (comicData.image_url) {
        // Show actual generated comic
        this.elements.comicContent.innerHTML = `
          <div class="comic-image-container">
            <img src="${comicData.image_url}" alt="Educational Comic" class="comic-image" />
            <p class="comic-description">${this.escapeHtml(comicData.description || '')}</p>
          </div>
        `;
      } else {
        // Show fallback text-based comic
        this.elements.comicContent.innerHTML = this.formatFallbackComic(comicData);
      }
      
      // Use comic viewer if available
      if (this.comicViewer) {
        this.comicViewer.displayComic(comicData);
      }
      
    } catch (error) {
      console.error('Failed to show comic:', error);
    }
  }

  formatFallbackComic(comicData) {
    let html = '<div class="comic-fallback">';
    html += `<p class="comic-description">${this.escapeHtml(comicData.description || 'Educational comic about the current lesson')}</p>`;
    
    if (comicData.panels) {
      html += '<div class="comic-panels">';
      comicData.panels.forEach((panel, index) => {
        html += `
          <div class="comic-panel">
            <div class="panel-number">Panel ${index + 1}</div>
            <div class="panel-scene">${this.escapeHtml(panel.scene || '')}</div>
            ${panel.dialogue ? panel.dialogue.map(d => `<div class="dialogue">"${this.escapeHtml(d)}"</div>`).join('') : ''}
          </div>
        `;
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }

  closeComic() {
    if (this.elements.comicSection) {
      this.elements.comicSection.style.display = 'none';
    }
  }

  // Modal Management
  showSettingsModal() {
    const modal = this.elements.settingsModal;
    if (modal) {
      this.applySettings(); // Ensure current settings are shown
      this.showModal(modal);
    }
  }

  showStatusModal() {
    const modal = this.elements.statusModal;
    if (modal) {
      this.showModal(modal);
      this.refreshStatus();
    }
  }

  showHelpModal() {
    const modal = this.elements.helpModal;
    if (modal) {
      this.showModal(modal);
    }
  }

  showModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus first focusable element
    const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      this.closeModal(modal);
    });
  }

  async saveSettings() {
    try {
      const newSettings = {
        humorLevel: parseInt(this.elements.humorSlider?.value || 7),
        comicsEnabled: this.elements.comicsEnabled?.checked ?? true,
        characterRotation: this.elements.characterRotation?.checked ?? true,
        preferredExamples: this.elements.preferredExamples?.value || ''
      };
      
      this.state.settings = { ...this.state.settings, ...newSettings };
      this.config.comicsEnabled = newSettings.comicsEnabled;
      
      if (window.AIMasteryAPI) {
        const response = await window.AIMasteryAPI.settings.update(newSettings);
        if (response.success) {
          this.showSuccess('Settings saved successfully');
        }
      } else {
        // Save to localStorage in simulation mode
        localStorage.setItem('aiMasterySettings', JSON.stringify(newSettings));
        this.showSuccess('Settings saved locally');
      }
      
      this.closeModal(this.elements.settingsModal);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('Failed to save settings');
    }
  }

  async refreshStatus() {
    if (!this.elements.statusContent) return;
    
    try {
      this.elements.statusContent.innerHTML = '<div class="loading">Loading status...</div>';
      
      if (!window.AIMasteryAPI) {
        this.showSimulationStatus();
        return;
      }
      
      const response = await window.AIMasteryAPI.reports.getStatus();
      
      if (response.success && response.report) {
        this.displayStatusReport(response.report);
      } else {
        throw new Error('Failed to fetch status');
      }
      
    } catch (error) {
      console.error('Failed to refresh status:', error);
      this.elements.statusContent.innerHTML = '<div class="error">Failed to load status information</div>';
    }
  }

  showSimulationStatus() {
    const statusHTML = `
      <div class="status-grid">
        <div class="status-card">
          <div class="status-header">
            <div class="status-icon"></div>
            <div class="status-title">System Status</div>
          </div>
          <div class="status-value">Simulation Mode</div>
          <div class="status-detail">Running without API connection</div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <div class="status-icon"></div>
            <div class="status-title">The Doctor</div>
          </div>
          <div class="status-value">Operational</div>
          <div class="status-detail">Humor Level: ${this.state.settings.humorLevel}/10</div>
        </div>
      </div>
    `;
    
    this.elements.statusContent.innerHTML = statusHTML;
  }

  displayStatusReport(report) {
    const statusHTML = `
      <div class="status-grid">
        <div class="status-card">
          <div class="status-header">
            <div class="status-icon"></div>
            <div class="status-title">Progress</div>
          </div>
          <div class="status-value">${report.totalLessons || 0}/60</div>
          <div class="status-detail">Average Score: ${(report.averageScore || 0).toFixed(1)}/10</div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <div class="status-icon"></div>
            <div class="status-title">The Doctor</div>
          </div>
          <div class="status-value">${report.doctor?.status || 'Unknown'}</div>
          <div class="status-detail">Humor Level: ${report.doctor?.humorLevel || 7}/10</div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <div class="status-icon ${report.systemHealth?.database === 'Connected' ? '' : 'error'}"></div>
            <div class="status-title">Database</div>
          </div>
          <div class="status-value">${report.systemHealth?.database || 'Unknown'}</div>
          <div class="status-detail">Storing educational records</div>
        </div>
        <div class="status-card">
          <div class="status-header">
            <div class="status-icon ${report.comics?.enabled ? '' : 'warning'}"></div>
            <div class="status-title">Comics</div>
          </div>
          <div class="status-value">${report.comics?.enabled ? 'Enabled' : 'Disabled'}</div>
          <div class="status-detail">${report.comics?.comicsGenerated || 0} generated</div>
        </div>
      </div>
    `;
    
    this.elements.statusContent.innerHTML = statusHTML;
  }

  // Notification System
  showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notification
    if (this.currentNotification) {
      this.currentNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">${this.getNotificationTitle(type)}</div>
        <button class="notification-close">×</button>
      </div>
      <div class="notification-body">${this.escapeHtml(message)}</div>
    `;
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
      this.currentNotification = null;
    });
    
    document.body.appendChild(notification);
    this.currentNotification = notification;
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
          if (this.currentNotification === notification) {
            this.currentNotification = null;
          }
        }
      }, duration);
    }
  }

  getNotificationTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type] || 'Notification';
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error', 8000);
  }

  showWarning(message) {
    this.showNotification(message, 'warning', 6000);
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showLoading(message) {
    this.showNotification(message, 'info', 0); // No auto-dismiss
  }

  hideLoading() {
    if (this.currentNotification) {
      this.currentNotification.remove();
      this.currentNotification = null;
    }
  }

  // Utility Methods
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // Global Methods for External Access
  getCurrentLesson() {
    return this.state.currentLesson;
  }

  getSettings() {
    return { ...this.state.settings };
  }

  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.applySettings();
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.AIMasteryApp = new AIMasteryApp();
  window.AIMasteryApp.initialize();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.AIMasteryApp) {
    // Refresh status when page becomes visible again
    window.AIMasteryApp.loadProgressData();
  }
});

// Handle connection status changes
window.addEventListener('online', () => {
  if (window.AIMasteryApp) {
    window.AIMasteryApp.showInfo('Connection restored - The Doctor is back online');
    window.AIMasteryApp.checkServerStatus();
  }
});

window.addEventListener('offline', () => {
  if (window.AIMasteryApp) {
    window.AIMasteryApp.showWarning('Connection lost - Operating in simulation mode');
  }
});
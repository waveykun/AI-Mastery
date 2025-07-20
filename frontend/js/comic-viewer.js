// frontend/js/comic-viewer.js - Enhanced Comic Viewer
class ComicViewer {
  constructor(app) {
    this.app = app;
    this.currentComic = null;
    this.viewerMode = 'normal'; // normal, fullscreen, panel-by-panel
    this.currentPanel = 0;
    this.isFullscreen = false;
    this.zoomLevel = 1;
    this.maxZoom = 3;
    this.minZoom = 0.5;
    
    this.setupComicViewer();
    console.log('🎭 Enhanced Comic Viewer initialized');
  }

  setupComicViewer() {
    // Create enhanced comic viewer structure
    this.createComicViewerElements();
    
    // Setup event listeners
    this.setupComicEventListeners();
    
    // Setup fullscreen handlers
    this.setupFullscreenHandlers();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
  }

  createComicViewerElements() {
    const comicSection = this.app.elements.comicSection;
    if (!comicSection) return;
    
    // Only create if not already present
    if (!comicSection.querySelector('.comic-viewer-enhanced')) {
      const enhancedViewer = document.createElement('div');
      enhancedViewer.className = 'comic-viewer-enhanced';
      enhancedViewer.innerHTML = this.getEnhancedViewerHTML();
      
      // Insert after existing content
      comicSection.appendChild(enhancedViewer);
    }
  }

  getEnhancedViewerHTML() {
    return `
      <div class="comic-controls-enhanced">
        <div class="comic-control-group">
          <button class="comic-control-btn" id="comicPrevPanel" title="Previous Panel">
            ⬅️ Previous
          </button>
          <span class="comic-panel-counter" id="comicPanelCounter">1 / 4</span>
          <button class="comic-control-btn" id="comicNextPanel" title="Next Panel">
            Next ➡️
          </button>
        </div>
        
        <div class="comic-control-group">
          <button class="comic-control-btn" id="comicZoomOut" title="Zoom Out">
            🔍-
          </button>
          <span class="zoom-indicator" id="zoomIndicator">100%</span>
          <button class="comic-control-btn" id="comicZoomIn" title="Zoom In">
            🔍+
          </button>
        </div>
        
        <div class="comic-control-group">
          <button class="comic-control-btn" id="comicPanelMode" title="Panel-by-Panel Mode">
            📖 Panels
          </button>
          <button class="comic-control-btn" id="comicFullscreen" title="Fullscreen">
            🖼️ Fullscreen
          </button>
          <button class="comic-control-btn" id="comicDownload" title="Download">
            💾 Download
          </button>
        </div>
      </div>
      
      <div class="comic-viewer-container" id="comicViewerContainer">
        <div class="comic-loading" id="comicLoading" style="display: none;">
          <div class="loading-spinner"></div>
          <p>Loading comic...</p>
        </div>
        
        <div class="comic-error" id="comicError" style="display: none;">
          <p>Failed to load comic. Using fallback display.</p>
        </div>
        
        <div class="comic-display" id="comicDisplay">
          <!-- Comic content will be inserted here -->
        </div>
      </div>
      
      <div class="comic-info-panel" id="comicInfoPanel" style="display: none;">
        <div class="comic-metadata">
          <div class="comic-title" id="comicTitle"></div>
          <div class="comic-details" id="comicDetails"></div>
        </div>
      </div>
    `;
  }

  setupComicEventListeners() {
    // Navigation controls
    this.addComicEventListener('comicPrevPanel', () => this.previousPanel());
    this.addComicEventListener('comicNextPanel', () => this.nextPanel());
    
    // Zoom controls
    this.addComicEventListener('comicZoomIn', () => this.zoomIn());
    this.addComicEventListener('comicZoomOut', () => this.zoomOut());
    
    // View mode controls
    this.addComicEventListener('comicPanelMode', () => this.togglePanelMode());
    this.addComicEventListener('comicFullscreen', () => this.toggleFullscreen());
    this.addComicEventListener('comicDownload', () => this.downloadComic());
    
    // Click to show/hide info panel
    this.addComicEventListener('comicDisplay', (e) => {
      if (e.target.classList.contains('comic-image')) {
        this.toggleInfoPanel();
      }
    });
  }

  addComicEventListener(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', handler);
    }
  }

  setupFullscreenHandlers() {
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.updateFullscreenButton();
    });

    // Escape key to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Only handle if comic is visible and focused
      if (!this.isComicVisible() || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          this.previousPanel();
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          this.nextPanel();
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          this.zoomOut();
          break;
        case 'f':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'i':
          e.preventDefault();
          this.toggleInfoPanel();
          break;
        case 'r':
          e.preventDefault();
          this.resetView();
          break;
      }
    });
  }

  // Main display method
  async displayComic(comicData) {
    this.currentComic = comicData;
    this.currentPanel = 0;
    this.zoomLevel = 1;
    
    console.log('🎭 Displaying comic:', comicData);
    
    // Show loading state
    this.showLoading();
    
    try {
      if (comicData.image_url && !comicData.fallback_used) {
        await this.displayImageComic(comicData);
      } else {
        this.displayFallbackComic(comicData);
      }
      
      // Update controls
      this.updateControls();
      
      // Show comic info
      this.updateComicInfo(comicData);
      
    } catch (error) {
      console.error('Comic display failed:', error);
      this.showError();
    } finally {
      this.hideLoading();
    }
  }

  async displayImageComic(comicData) {
    const container = document.getElementById('comicDisplay');
    if (!container) return;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        container.innerHTML = `
          <div class="comic-image-wrapper">
            <img src="${comicData.image_url}" 
                 alt="Educational Comic for Lesson ${comicData.lesson_number}" 
                 class="comic-image main-comic-image"
                 style="transform: scale(${this.zoomLevel})"
                 draggable="false">
          </div>
          <div class="comic-description">
            <p>${this.escapeHtml(comicData.description || '')}</p>
          </div>
        `;
        
        // Setup image interactions
        this.setupImageInteractions(container.querySelector('.comic-image'));
        resolve();
      };
      
      img.onerror = () => {
        console.error('Failed to load comic image');
        this.displayFallbackComic(comicData);
        resolve();
      };
      
      img.src = comicData.image_url;
    });
  }

  displayFallbackComic(comicData) {
    const container = document.getElementById('comicDisplay');
    if (!container) return;
    
    const panels = comicData.panels || [];
    this.totalPanels = panels.length;
    
    if (this.viewerMode === 'panel-by-panel') {
      this.displaySinglePanel(panels[this.currentPanel] || panels[0], this.currentPanel);
    } else {
      this.displayAllPanels(panels);
    }
  }

  displaySinglePanel(panel, index) {
    const container = document.getElementById('comicDisplay');
    if (!container || !panel) return;
    
    container.innerHTML = `
      <div class="comic-panel-single">
        <div class="panel-header">
          <span class="panel-number">Panel ${index + 1}</span>
          <span class="panel-focus">${this.escapeHtml(panel.focus || '')}</span>
        </div>
        <div class="panel-scene">
          <div class="scene-description">${this.escapeHtml(panel.scene || '')}</div>
          <div class="scene-visual-placeholder">
            <div class="scene-icon">🎭</div>
            <div class="scene-text">Visual Scene</div>
          </div>
        </div>
        <div class="panel-dialogue">
          ${panel.dialogue ? panel.dialogue.map(line => `
            <div class="dialogue-bubble">
              <span class="dialogue-text">${this.escapeHtml(line)}</span>
            </div>
          `).join('') : ''}
        </div>
      </div>
    `;
  }

  displayAllPanels(panels) {
    const container = document.getElementById('comicDisplay');
    if (!container) return;
    
    container.innerHTML = `
      <div class="comic-panels-grid">
        ${panels.map((panel, index) => `
          <div class="comic-panel-card ${index === this.currentPanel ? 'active' : ''}" data-panel="${index}">
            <div class="panel-header">
              <span class="panel-number">Panel ${index + 1}</span>
              <span class="panel-focus">${this.escapeHtml(panel.focus || '')}</span>
            </div>
            <div class="panel-content">
              <div class="panel-scene">
                <div class="scene-visual">
                  <div class="scene-icon">🎭</div>
                </div>
                <div class="scene-description">${this.escapeHtml(panel.scene || '')}</div>
              </div>
              <div class="panel-dialogue">
                ${panel.dialogue ? panel.dialogue.map(line => `
                  <div class="dialogue-line">"${this.escapeHtml(line)}"</div>
                `).join('') : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add click handlers for panel navigation
    container.querySelectorAll('.comic-panel-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        this.currentPanel = index;
        this.updateControls();
        this.highlightActivePanel();
      });
    });
  }

  setupImageInteractions(img) {
    if (!img) return;
    
    // Mouse wheel zoom
    img.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    });
    
    // Double click to reset zoom
    img.addEventListener('dblclick', () => {
      this.resetZoom();
    });
    
    // Drag to pan (if zoomed)
    let isDragging = false;
    let lastX, lastY;
    
    img.addEventListener('mousedown', (e) => {
      if (this.zoomLevel > 1) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        img.style.cursor = 'grabbing';
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        const wrapper = img.closest('.comic-image-wrapper');
        if (wrapper) {
          wrapper.scrollLeft -= deltaX;
          wrapper.scrollTop -= deltaY;
        }
        
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      img.style.cursor = 'grab';
    });
  }

  // Navigation methods
  nextPanel() {
    if (!this.currentComic) return;
    
    const maxPanels = this.getTotalPanels();
    if (this.currentPanel < maxPanels - 1) {
      this.currentPanel++;
      this.updateDisplay();
      this.updateControls();
    }
  }

  previousPanel() {
    if (!this.currentComic) return;
    
    if (this.currentPanel > 0) {
      this.currentPanel--;
      this.updateDisplay();
      this.updateControls();
    }
  }

  // Zoom methods
  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.zoomLevel * 1.2, this.maxZoom);
      this.updateZoom();
    }
  }

  zoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.zoomLevel / 1.2, this.minZoom);
      this.updateZoom();
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.updateZoom();
  }

  updateZoom() {
    const img = document.querySelector('.main-comic-image');
    if (img) {
      img.style.transform = `scale(${this.zoomLevel})`;
    }
    
    // Update zoom indicator
    const indicator = document.getElementById('zoomIndicator');
    if (indicator) {
      indicator.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  // View mode methods
  togglePanelMode() {
    if (!this.currentComic || !this.currentComic.panels) return;
    
    this.viewerMode = this.viewerMode === 'panel-by-panel' ? 'normal' : 'panel-by-panel';
    this.updateDisplay();
    this.updatePanelModeButton();
  }

  toggleFullscreen() {
    const container = document.getElementById('comicViewerContainer');
    if (!container) return;
    
    if (!this.isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      this.exitFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  resetView() {
    this.resetZoom();
    this.currentPanel = 0;
    this.updateDisplay();
    this.updateControls();
  }

  // UI update methods
  updateDisplay() {
    if (!this.currentComic) return;
    
    if (this.currentComic.image_url && !this.currentComic.fallback_used) {
      // Image comic - no need to update display
      return;
    }
    
    // Fallback comic - update based on view mode
    if (this.viewerMode === 'panel-by-panel') {
      const panels = this.currentComic.panels || [];
      this.displaySinglePanel(panels[this.currentPanel], this.currentPanel);
    } else {
      this.highlightActivePanel();
    }
  }

  updateControls() {
    this.updatePanelCounter();
    this.updateNavigationButtons();
    this.updatePanelModeButton();
    this.updateFullscreenButton();
  }

  updatePanelCounter() {
    const counter = document.getElementById('comicPanelCounter');
    if (counter) {
      const total = this.getTotalPanels();
      counter.textContent = `${this.currentPanel + 1} / ${total}`;
    }
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('comicPrevPanel');
    const nextBtn = document.getElementById('comicNextPanel');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPanel === 0;
    }
    
    if (nextBtn) {
      const total = this.getTotalPanels();
      nextBtn.disabled = this.currentPanel >= total - 1;
    }
  }

  updatePanelModeButton() {
    const panelModeBtn = document.getElementById('comicPanelMode');
    if (panelModeBtn) {
      panelModeBtn.textContent = this.viewerMode === 'panel-by-panel' ? '📖 All' : '📱 Panels';
      panelModeBtn.title = this.viewerMode === 'panel-by-panel' ? 'Show All Panels' : 'Panel-by-Panel Mode';
    }
  }

  updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('comicFullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = this.isFullscreen ? '🗖 Exit' : '🖼️ Full';
      fullscreenBtn.title = this.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
    }
  }

  highlightActivePanel() {
    const panels = document.querySelectorAll('.comic-panel-card');
    panels.forEach((panel, index) => {
      panel.classList.toggle('active', index === this.currentPanel);
    });
  }

  // Comic info methods
  updateComicInfo(comicData) {
    const infoPanel = document.getElementById('comicInfoPanel');
    const title = document.getElementById('comicTitle');
    const details = document.getElementById('comicDetails');
    
    if (title) {
      title.textContent = `Lesson ${comicData.lesson_number}: ${comicData.lesson_topic || 'Educational Comic'}`;
    }
    
    if (details) {
      const detailsHTML = `
        <div class="comic-detail-item">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${comicData.fallback_used ? 'Text-based' : 'Generated Image'}</span>
        </div>
        <div class="comic-detail-item">
          <span class="detail-label">Characters:</span>
          <span class="detail-value">${(comicData.characters_featured || []).join(', ') || 'Unknown'}</span>
        </div>
        <div class="comic-detail-item">
          <span class="detail-label">Provider:</span>
          <span class="detail-value">${comicData.provider || 'Unknown'}</span>
        </div>
        <div class="comic-detail-item">
          <span class="detail-label">Generated:</span>
          <span class="detail-value">${this.formatDate(comicData.generated_at)}</span>
        </div>
      `;
      details.innerHTML = detailsHTML;
    }
  }

  toggleInfoPanel() {
    const infoPanel = document.getElementById('comicInfoPanel');
    if (infoPanel) {
      const isVisible = infoPanel.style.display !== 'none';
      infoPanel.style.display = isVisible ? 'none' : 'block';
    }
  }

  // Loading and error states
  showLoading() {
    const loading = document.getElementById('comicLoading');
    const display = document.getElementById('comicDisplay');
    const error = document.getElementById('comicError');
    
    if (loading) loading.style.display = 'block';
    if (display) display.style.display = 'none';
    if (error) error.style.display = 'none';
  }

  hideLoading() {
    const loading = document.getElementById('comicLoading');
    const display = document.getElementById('comicDisplay');
    
    if (loading) loading.style.display = 'none';
    if (display) display.style.display = 'block';
  }

  showError() {
    const loading = document.getElementById('comicLoading');
    const display = document.getElementById('comicDisplay');
    const error = document.getElementById('comicError');
    
    if (loading) loading.style.display = 'none';
    if (display) display.style.display = 'none';
    if (error) error.style.display = 'block';
  }

  // Download functionality
  async downloadComic() {
    if (!this.currentComic) return;
    
    try {
      if (this.currentComic.image_url) {
        // Download image comic
        await this.downloadImage(this.currentComic.image_url, `comic-lesson-${this.currentComic.lesson_number || 'unknown'}.png`);
      } else {
        // Download text comic as JSON or HTML
        this.downloadTextComic();
      }
      
      this.app.showSuccess('Comic downloaded successfully!');
    } catch (error) {
      console.error('Comic download failed:', error);
      this.app.showError('Failed to download comic.');
    }
  }

  async downloadImage(url, filename) {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  }

  downloadTextComic() {
    const comicData = {
      lesson_number: this.currentComic.lesson_number,
      lesson_topic: this.currentComic.lesson_topic,
      description: this.currentComic.description,
      panels: this.currentComic.panels,
      characters_featured: this.currentComic.characters_featured,
      generated_at: this.currentComic.generated_at
    };
    
    const dataStr = JSON.stringify(comicData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comic-lesson-${this.currentComic.lesson_number || 'unknown'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  }

  // Utility methods
  getTotalPanels() {
    if (!this.currentComic) return 0;
    
    if (this.currentComic.panels) {
      return this.currentComic.panels.length;
    }
    
    return 1; // Single image comic
  }

  isComicVisible() {
    const comicSection = this.app.elements.comicSection;
    return comicSection && comicSection.style.display !== 'none';
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Unknown';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Cleanup
  cleanup() {
    this.currentComic = null;
    this.currentPanel = 0;
    this.zoomLevel = 1;
    this.viewerMode = 'normal';
    
    // Exit fullscreen if active
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
    
    console.log('🎭 Comic Viewer cleaned up');
  }

  // Configuration
  setMaxZoom(maxZoom) {
    this.maxZoom = Math.max(1, maxZoom);
  }

  setMinZoom(minZoom) {
    this.minZoom = Math.max(0.1, Math.min(minZoom, 1));
  }

  // Get viewer statistics
  getViewerStats() {
    return {
      currentComic: this.currentComic?.lesson_number || null,
      currentPanel: this.currentPanel,
      totalPanels: this.getTotalPanels(),
      viewerMode: this.viewerMode,
      zoomLevel: this.zoomLevel,
      isFullscreen: this.isFullscreen
    };
  }
}

// Make available globally for other components
window.ComicViewer = ComicViewer;
/**
 * AIA Workshop Slides - Navigation Controller
 * Handles keyboard, scroll, touch navigation and progress tracking
 */

class SlideController {
  constructor(options = {}) {
    this.container = document.querySelector('.slides-container');
    this.slides = document.querySelectorAll('.slide');
    this.currentSlide = 0;
    this.isAnimating = false;
    this.touchStartY = 0;
    this.touchEndY = 0;

    this.options = {
      showProgress: options.showProgress !== false,
      showDots: options.showDots !== false,
      showNumber: options.showNumber !== false,
      showKeyboardHint: options.showKeyboardHint !== false,
      showFullscreenBtn: options.showFullscreenBtn !== false,
      ...options
    };

    this.init();
  }

  init() {
    if (!this.container || this.slides.length === 0) {
      console.warn('SlideController: No slides found');
      return;
    }

    this.createUI();
    this.bindEvents();
    this.updateVisibility();
    this.updateProgress();

    // Handle initial hash
    if (window.location.hash) {
      const slideIndex = parseInt(window.location.hash.replace('#slide-', '')) - 1;
      if (slideIndex >= 0 && slideIndex < this.slides.length) {
        this.goToSlide(slideIndex, false);
      }
    }
  }

  createUI() {
    // Progress bar
    if (this.options.showProgress) {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'progress-bar';
      document.body.appendChild(this.progressBar);
    }

    // Navigation dots
    if (this.options.showDots && this.slides.length <= 30) {
      this.navDots = document.createElement('div');
      this.navDots.className = 'nav-dots';

      this.slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'nav-dot';
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => this.goToSlide(index));
        this.navDots.appendChild(dot);
      });

      document.body.appendChild(this.navDots);
    }

    // Slide number
    if (this.options.showNumber) {
      this.slideNumber = document.createElement('div');
      this.slideNumber.className = 'slide-number';
      document.body.appendChild(this.slideNumber);
    }

    // Keyboard hint
    if (this.options.showKeyboardHint) {
      this.keyboardHint = document.createElement('div');
      this.keyboardHint.className = 'keyboard-hint';
      this.keyboardHint.innerHTML = `
        <span class="key">↑</span>
        <span class="key">↓</span>
        <span>or</span>
        <span class="key">Space</span>
        <span>to navigate</span>
      `;
      document.body.appendChild(this.keyboardHint);
    }

    // Back button
    this.backBtn = document.createElement('a');
    this.backBtn.className = 'back-btn';
    this.backBtn.href = '../../index.html';
    this.backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5m0 0l7 7m-7-7l7-7"/>
      </svg>
      <span>All Slides</span>
    `;
    document.body.appendChild(this.backBtn);

    // Fullscreen button
    if (this.options.showFullscreenBtn) {
      this.fullscreenBtn = document.createElement('button');
      this.fullscreenBtn.className = 'fullscreen-btn';
      this.fullscreenBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      this.fullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen');
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      document.body.appendChild(this.fullscreenBtn);
    }
  }

  bindEvents() {
    // Scroll detection
    let scrollTimeout;
    this.container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 50);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Touch navigation
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    }, { passive: true });

    // Window resize
    window.addEventListener('resize', () => {
      this.goToSlide(this.currentSlide, false);
    });

    // Visibility change (for pausing animations when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateVisibility();
      }
    });
  }

  handleScroll() {
    const scrollTop = this.container.scrollTop;
    const slideHeight = window.innerHeight;
    const newSlide = Math.round(scrollTop / slideHeight);

    if (newSlide !== this.currentSlide && newSlide >= 0 && newSlide < this.slides.length) {
      this.currentSlide = newSlide;
      this.updateVisibility();
      this.updateProgress();
      this.updateHash();
    }
  }

  handleKeydown(e) {
    if (this.isAnimating) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        this.nextSlide();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        this.prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.slides.length - 1);
        break;
      case 'f':
        this.toggleFullscreen();
        break;
    }
  }

  handleSwipe() {
    const diff = this.touchStartY - this.touchEndY;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    }
  }

  goToSlide(index, animate = true) {
    if (index < 0 || index >= this.slides.length) return;
    if (this.isAnimating && animate) return;

    this.isAnimating = true;
    this.currentSlide = index;

    const targetY = index * window.innerHeight;

    if (animate) {
      this.container.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });

      setTimeout(() => {
        this.isAnimating = false;
      }, 500);
    } else {
      this.container.scrollTop = targetY;
      this.isAnimating = false;
    }

    this.updateVisibility();
    this.updateProgress();
    this.updateHash();
  }

  updateVisibility() {
    this.slides.forEach((slide, index) => {
      const isVisible = index === this.currentSlide;
      slide.classList.toggle('visible', isVisible);

      // Update ARIA
      slide.setAttribute('aria-hidden', !isVisible);
    });

    // Update nav dots
    if (this.navDots) {
      const dots = this.navDots.querySelectorAll('.nav-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentSlide);
      });
    }

    // Update slide number
    if (this.slideNumber) {
      this.slideNumber.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
    }
  }

  updateProgress() {
    if (this.progressBar) {
      const progress = ((this.currentSlide + 1) / this.slides.length) * 100;
      this.progressBar.style.width = `${progress}%`;
    }
  }

  updateHash() {
    const hash = `#slide-${this.currentSlide + 1}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, null, hash);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Public API
  getCurrentSlide() {
    return this.currentSlide;
  }

  getTotalSlides() {
    return this.slides.length;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.slideController = new SlideController();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlideController;
}

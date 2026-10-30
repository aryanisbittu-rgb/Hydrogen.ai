/**
 * Utility Functions Module
 * Common helper functions for the Hydrogen.ai Math Worksheet Studio
 * 
 * @module utils
 */

/**
 * Application State
 * @typedef {Object} AppState
 * @property {Array<Object>} currentProblems - Current worksheet problems
 * @property {Object|null} currentMeta - Current worksheet metadata
 * @property {string} viewMode - Current view mode ('worksheet' or 'solutions')
 * @property {Array<Object>} chatHistory - AI tutor chat history
 * @property {string} tutorError - Current tutor error message
 * @property {boolean} tutorBusy - Whether tutor is processing a request
 * @property {boolean} isGenerating - Whether worksheet is being generated
 * @property {number} lastRequestTime - Timestamp of last API request for rate limiting
 */

/** @type {AppState} */
window.HydrogenState = {
  currentProblems: [],
  currentMeta: null,
  viewMode: 'worksheet',
  chatHistory: [],
  tutorError: '',
  tutorBusy: false,
  isGenerating: false,
  lastRequestTime: 0
};

// Shortcut to access state
const state = window.HydrogenState;

/**
 * Get DOM element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} DOM element
 * @function
 */
window.$ = function(id) {
  return document.getElementById(id);
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} s - String to escape
 * @returns {string} Escaped string
 * @function
 */
window.escapeHtml = function(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
};

/**
 * Sanitize HTML using DOMPurify with fallback to escapeHtml
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 * @function
 */
window.clean = function(html) {
  if (window.DOMPurify) {
    return DOMPurify.sanitize(String(html ?? ''), {
      USE_PROFILES: { html: true, svg: true, svgFilters: true }
    });
  }
  return window.escapeHtml(html);
};

/**
 * Typeset MathJax equations in element
 * @param {HTMLElement|null} el - Element to typeset (optional)
 * @function
 */
window.typeset = function(el) {
  if (!window.MathJax || !MathJax.typesetPromise) return;
  MathJax.typesetPromise(el ? [el] : undefined).catch(() => {});
};

/**
 * Store data in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} val - Value to store
 * @function
 */
window.store = function(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

/**
 * Load data from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {*} Parsed data or null
 * @function
 */
window.load = function(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
};

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in milliseconds (default: 4000)
 * @function
 */
window.showToast = function(message, type = 'info', duration = 4000) {
  const toast = $('toast');
  if (!toast) return;

  // Remove previous toast
  toast.classList.add('hidden');
  toast.innerHTML = '';

  const types = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const toastHtml = `
    <div class="flex items-center space-x-2.5 p-3 rounded-xl border ${types[type] || types.info} shadow-lg">
      <span class="flex-shrink-0" aria-hidden="true">${icons[type] || icons.info}</span>
      <span class="text-sm font-medium">${window.escapeHtml(message)}</span>
    </div>
  `;

  toast.innerHTML = toastHtml;
  toast.classList.remove('hidden');

  // Auto-hide after duration
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
};

/**
 * Enforce rate limiting for API calls
 * @returns {Promise<void>} Resolves when enough time has passed
 * @async
 * @function
 */
window.enforceRateLimit = async function() {
  const CONFIG = window.HydrogenConfig;
  const now = Date.now();
  const timeSinceLastRequest = now - state.lastRequestTime;
  
  if (timeSinceLastRequest < CONFIG.RATE_LIMIT_DELAY_MS) {
    const delay = CONFIG.RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  state.lastRequestTime = Date.now();
};

/**
 * Fetch with retry logic and timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retriesLeft - Number of retries remaining
 * @returns {Promise<Response>} Fetch response
 * @async
 * @function
 */
window.fetchWithRetry = async function(url, options = {}, retriesLeft = window.HydrogenConfig.MAX_RETRIES) {
  const CONFIG = window.HydrogenConfig;
  
  try {
    await window.enforceRateLimit();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `Server returned status ${response.status}`);
      error.status = response.status;
      throw error;
    }
    
    return response;
  } catch (error) {
    if (retriesLeft > 0 && error.name !== 'AbortError') {
      console.warn(`Request failed, retrying (${retriesLeft} attempts left):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return window.fetchWithRetry(url, options, retriesLeft - 1);
    }
    throw error;
  }
};

/**
 * Trap focus within an element (for modals/drawers)
 * @param {HTMLElement} element - Element to trap focus within
 * @function
 */
window.trapFocus = function(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  if (!firstFocusable) return;
  
  element.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });
  
  // Focus first element when trap is set up
  firstFocusable.focus();
};

/**
 * Initialize accessibility features
 * @function
 */
window.initAccessibility = function() {
  // Set up focus traps for modal
  const modal = $('modalOverlay');
  if (modal) {
    const dialog = modal.querySelector('[role="dialog"]');
    if (dialog) {
      // Set up focus trap when modal opens
      const originalOpenModal = window.openModal;
      window.openModal = function() {
        originalOpenModal();
        setTimeout(() => window.trapFocus(dialog), 100);
      };
    }
  }
  
  // Set up focus traps for tutor drawer
  const drawer = $('tutorDrawer');
  if (drawer) {
    const originalToggleTutor = window.toggleTutor;
    window.toggleTutor = function(force) {
      originalToggleTutor(force);
      if (!force && !drawer.classList.contains('translate-x-full')) {
        setTimeout(() => window.trapFocus(drawer), 100);
      }
    };
  }
};

/**
 * Set up global keyboard shortcuts
 * @function
 */
window.setupKeyboardShortcuts = function() {
  document.addEventListener('keydown', e => {
    // Escape key: Close modals and drawers
    if (e.key === 'Escape') {
      window.closeModal();
      window.toggleTutor(false);
      window.toggleSidebar(false);
      return;
    }
    
    // Ctrl/Cmd + Enter: Submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const activeElement = document.activeElement;
      
      // Check if we're in the generator modal
      if (activeElement && activeElement.closest('#generatorForm')) {
        const form = $('generatorForm');
        if (form && !state.isGenerating) {
          form.dispatchEvent(new Event('submit'));
          e.preventDefault();
        }
      }
      
      // Check if we're in the tutor input
      if (activeElement && activeElement.id === 'tutorInput') {
        const form = $('tutorForm');
        if (form && !state.tutorBusy) {
          form.dispatchEvent(new Event('submit'));
          e.preventDefault();
        }
      }
    }
    
    // Ctrl/Cmd + K: Open AI Tutor
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.altKey) {
      window.toggleTutor();
      e.preventDefault();
    }
    
    // Ctrl/Cmd + N: Open new worksheet modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.altKey) {
      window.openModal();
      e.preventDefault();
    }
    
    // Ctrl/Cmd + P: Print student copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey && !e.altKey) {
      window.printSheet(false);
      e.preventDefault();
    }
    
    // Ctrl/Cmd + Shift + P: Print with answers
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P' && !e.altKey) {
      window.printSheet(true);
      e.preventDefault();
    }
  });
};

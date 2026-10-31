/**
 * Main Application Module
 * Core functionality for the Hydrogen.ai Math Worksheet Studio
 * 
 * @module app
 */

// ============================================
// UI TOGGLE FUNCTIONS
// ============================================

/**
 * Open the worksheet generation modal
 * @function
 */
window.openModal = function() {
  const state = window.HydrogenState;
  
  if (state.currentMeta) {
    $('topicInput').value = state.currentMeta.topic;
    $('gradeInput').value = state.currentMeta.grade;
    $('difficultyInput').value = state.currentMeta.difficulty;
    $('worksheetTypeInput').value = state.currentMeta.type;
    $('numProblemsInput').value = state.currentMeta.num;
  }
  
  window.toggleSidebar(false);
  const modal = $('modalOverlay');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  
  // Focus first focusable element in modal
  const firstFocusable = modal.querySelector('[autofocus], input, select, button');
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  // Update ARIA for main content
  document.querySelector('main').setAttribute('aria-hidden', 'true');
};

/**
 * Close the worksheet generation modal
 * @function
 */
window.closeModal = function() {
  const modal = $('modalOverlay');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  
  // Return focus to the button that opened the modal
  const newButton = document.querySelector('[onclick="openModal()"]');
  if (newButton) {
    newButton.focus();
  }
  
  // Restore ARIA for main content
  document.querySelector('main').setAttribute('aria-hidden', 'false');
};

/**
 * Set the topic input value
 * @param {string} t - Topic to set
 * @function
 */
window.setTopic = function(t) {
  $('topicInput').value = t;
};

/**
 * Toggle sidebar visibility
 * @param {boolean} force - Force open or close (optional)
 * @function
 */
window.toggleSidebar = function(force) {
  const sidebar = $('sidebar');
  const backdrop = $('sidebarBackdrop');
  const isCurrentlyOpen = !sidebar.classList.contains('-translate-x-full');
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  
  sidebar.classList.toggle('-translate-x-full', !shouldOpen);
  backdrop.classList.toggle('hidden', !shouldOpen);
  
  // Update ARIA attributes
  sidebar.setAttribute('aria-hidden', !shouldOpen);
  backdrop.setAttribute('aria-hidden', shouldOpen);
  
  // Update button aria-expanded
  const menuButton = document.querySelector('[onclick="toggleSidebar()"]');
  if (menuButton) {
    menuButton.setAttribute('aria-expanded', shouldOpen);
  }
};

/**
 * Toggle AI tutor drawer
 * @param {boolean} force - Force open or close (optional)
 * @function
 */
window.toggleTutor = function(force) {
  const drawer = $('tutorDrawer');
  const isCurrentlyOpen = drawer.classList.contains('translate-x-full');
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  
  drawer.classList.toggle('translate-x-full', !shouldOpen);
  drawer.setAttribute('aria-hidden', !shouldOpen);
  
  // Update button aria-expanded
  const tutorButton = document.querySelector('[onclick="toggleTutor()"]');
  if (tutorButton) {
    tutorButton.setAttribute('aria-expanded', shouldOpen);
  }
  
  if (shouldOpen) {
    window.renderChat();
    const input = $('tutorInput');
    if (input) {
      input.focus();
      // Update ARIA for main content
      document.querySelector('main').setAttribute('aria-hidden', 'true');
    }
  } else {
    // Restore ARIA for main content
    document.querySelector('main').setAttribute('aria-hidden', 'false');
  }
};

// ============================================
// VIEW & PRINTING FUNCTIONS
// ============================================

/**
 * Toggle solution visibility for a problem
 * @param {HTMLElement} btn - Button element that was clicked
 * @function
 */
window.toggleSolution = function(btn) {
  const box = btn.nextElementSibling;
  const hidden = box.classList.toggle('hidden');
  btn.textContent = hidden ? '› Show solution' : '‹ Hide solution';
  btn.setAttribute('aria-expanded', !hidden);
};

/**
 * Switch between worksheet and solutions view
 * @param {string} mode - View mode ('worksheet' or 'solutions')
 * @function
 */
window.switchView = function(mode) {
  const state = window.HydrogenState;
  state.viewMode = mode;
  
  const on = "px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-900";
  const off = "px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500";
  
  $('viewWorksheetBtn').className = mode === 'worksheet' ? on : off;
  $('viewSolutionsBtn').className = mode === 'solutions' ? on : off;
  
  // Update aria-pressed
  $('viewWorksheetBtn').setAttribute('aria-pressed', mode === 'worksheet');
  $('viewSolutionsBtn').setAttribute('aria-pressed', mode === 'solutions');
  
  document.querySelectorAll('.solution-box').forEach(b => {
    b.classList.toggle('hidden', mode === 'worksheet');
  });
  
  document.querySelectorAll('.sol-btn').forEach(b => {
    const isHidden = mode === 'worksheet';
    b.textContent = isHidden ? '› Show solution' : '‹ Hide solution';
    b.setAttribute('aria-expanded', !isHidden);
  });
};

/**
 * Print the worksheet (student copy or with answers)
 * @param {boolean} withAnswers - Whether to include answers
 * @function
 */
window.printSheet = function(withAnswers) {
  const state = window.HydrogenState;
  
  if (!state.currentProblems.length) {
    window.openModal();
    return;
  }
  
  document.body.classList.toggle('print-answers', !!withAnswers);
  
  const afterPrintHandler = () => {
    document.body.classList.remove('print-answers');
    document.removeEventListener('afterprint', afterPrintHandler);
  };
  
  window.addEventListener('afterprint', afterPrintHandler);
  setTimeout(() => window.print(), 50);
};

// ============================================
// RENDERING FUNCTIONS
// ============================================

/**
 * Apply metadata to UI elements
 * @param {Object|null} m - Worksheet metadata
 * @function
 */
window.applyMeta = function(m) {
  const t = m ? m.topic : 'Worksheets';
  
  $('sheetMainTitle').textContent = t;
  $('paperTitle').textContent = m ? m.topic : 'Untitled';
  $('paperBadgeType').textContent = m ? `HYDROGEN ${m.type.toUpperCase()}` : 'HYDROGEN WORKSHEET';
  $('sheetMetaSubtitle').textContent = m ? `Grade ${m.grade} • ${m.num} questions • ${m.type}` : 'Generate a worksheet to get started';
  $('paperGrade').textContent = m ? `Grade ${m.grade} • ${m.difficulty} ${m.type}` : '';
  $('sidebarSessionTitle').textContent = m ? m.topic : 'No worksheet yet';
  $('sidebarSessionSub').textContent = m ? `Grade ${m.grade} • ${m.type}` : 'Create one to begin';
};

/**
 * Render the entire worksheet with problems, diagrams, and solutions
 * @param {Array<Object>} problems - Array of problem objects
 * @function
 */
window.renderWorksheet = function(problems) {
  const state = window.HydrogenState;
  const c = $('questionsContainer');
  if (!c) return;
  
  c.innerHTML = '';
  
  if (!problems.length) {
    c.innerHTML = `<div class="text-center text-sm text-slate-400 py-16" role="status" aria-live="polite">No worksheet yet. Tap <b>+ New</b> to generate one.</div>`;
    return;
  }
  
  // Show loading skeleton while rendering
  c.innerHTML = `<div class="space-y-8" aria-busy="true">
    ${Array.from({ length: Math.min(problems.length, 5) }).map(() => `
      <div class="problem-item space-y-3 pt-6 border-t border-slate-200/80 first:pt-0 first:border-0">
        <div class="flex items-start space-x-3.5">
          <span class="font-mono font-bold text-slate-400 text-sm select-none">00</span>
          <div class="flex-1 min-w-0">
            <div class="h-4 skeleton rounded-full w-3/4 mb-2"></div>
            <div class="h-4 skeleton rounded-full w-1/2 mb-4"></div>
            <div class="h-32 skeleton rounded-xl"></div>
          </div>
        </div>
        <div class="h-16 rounded-xl border border-dashed border-slate-300 skeleton"></div>
      </div>
    `).join('')}
  </div>`;
  
  // Render problems after a brief delay to allow DOM to update
  setTimeout(() => {
    c.innerHTML = '';
    
    problems.forEach((item, i) => {
      const d = document.createElement('div');
      d.className = "problem-item space-y-3 pt-6 border-t border-slate-200/80 first:pt-0 first:border-0";
      d.setAttribute('role', 'article');
      d.setAttribute('aria-label', `Question ${i + 1}`);
      
      d.innerHTML = `
        <div class="flex items-start space-x-3.5 text-sm md:text-base leading-relaxed">
          <span class="font-mono font-bold text-slate-400 text-sm select-none" aria-label="Question number">${String(i + 1).padStart(2, '0')}</span>
          <div class="flex-1 min-w-0">
            ${window.badgesHTML(item)}
            <div class="q-text text-slate-900 overflow-x-auto" aria-label="Question text">${window.renderProblemHTML(item.problem_text)}</div>
          </div>
        </div>
        ${window.buildDiagram(item.diagram || window.inferSolid(item.problem_text) || window.inferDiagram(item.problem_text))}
        <div class="h-16 rounded-xl border border-dashed border-slate-300" role="textbox" aria-label="Space for answer"></div>
        <div class="no-print-btn">
          <button 
            type="button" 
            onclick="toggleSolution(this)" 
            class="sol-btn no-print cursor-pointer text-xs font-semibold text-slate-500 hover:text-brand-600"
            aria-expanded="false"
            aria-label="Show solution for question ${i + 1}"
          >› Show solution</button>
          <div class="solution-box hidden mt-2.5 p-3.5 bg-slate-50 rounded-xl border-l-2 border-brand-600 text-xs text-slate-800 leading-relaxed font-mono overflow-x-auto" aria-label="Solution">${window.clean(item.solution_text)}</div>
        </div>`;
      
      c.appendChild(d);
    });
    
    window.switchView(state.viewMode);
    window.typeset(c);
    
    // Notify screen readers that content has loaded
    c.setAttribute('aria-busy', 'false');
  }, 100);
};

// ============================================
// WORKSHEET GENERATION
// ============================================

/**
 * Show generation error with sample worksheet option
 * @param {Error} err - Error object
 * @function
 */
window.showGenError = function(err) {
  const CONFIG = window.HydrogenConfig;
  let msg = err.message;
  
  if (err.name === 'AbortError') {
    msg = "The server took too long to respond. Please try again.";
  } else if (err instanceof TypeError) {
    msg = `Couldn't reach the server at ${CONFIG.BACKEND_URL}. ` +
          "This could be due to CORS restrictions or the server being down.";
  } else if (err.status === 429) {
    msg = "Too many requests. Please wait a moment and try again.";
  } else if (err.status >= 500) {
    msg = "Server error. Please try again later.";
  }
  
  const box = $('genError');
  if (box) {
    box.innerHTML = window.escapeHtml(msg) + 
      ' <button type="button" onclick="loadSample()" class="underline font-semibold hover:text-brand-600">Load a sample worksheet instead</button>';
    box.classList.remove('hidden');
  }
  
  window.showToast(msg, 'error');
};

/**
 * Load sample worksheet for demonstration
 * @function
 */
window.loadSample = function() {
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig;
  
  state.currentProblems = [
    {
      problem_text: "Find the roots of $2x^2 - 5x + 3 = 0$ using the quadratic formula.",
      solution_text: "$D = 25 - 24 = 1$, so $x = \\frac{5 \\pm 1}{4}$, giving $x = \\frac{3}{2}$ or $x = 1$."
    },
    {
      problem_text: "A tower casts a shadow $30\\text{ m}$ long when the angle of elevation of the sun is $30^\\circ$. Find its height.",
      solution_text: "$\\tan 30^\\circ = \\frac{h}{30} \\implies h = 10\\sqrt{3} \\approx 17.32\\text{ m}$"
    },
    {
      question_type: "Word Problem",
      points: 3,
      problem_text: "If the sides of a triangle are $x$, $x + 2$ and $x + 4$ and the perimeter is $33\\text{ cm}$, find the shortest side.",
      solution_text: "$3x + 6 = 33 \\implies x = 9$, so the shortest side is $9\\text{ cm}$.",
      diagram: {
        points: [
          {label:"E",x:4.96,y:7.51},
          {label:"A",x:0,y:0},
          {label:"R",x:13,y:0}
        ],
        sides: ["x","x + 4","x + 2"]
      }
    },
    {
      question_type: "Mensuration",
      points: 4,
      problem_text: "A solid cylinder has base radius $r = 7\\text{ cm}$ and height $h = 10\\text{ cm}$. Find its volume. (Take $\\pi = \\frac{22}{7}$)",
      solution_text: "$V = \\pi r^2 h = \\frac{22}{7} \\times 49 \\times 10 = 1540\\text{ cm}^3$"
    },
    {
      problem_text: "Find the sum of the first $15$ terms of the AP $3, 7, 11, \\dots$",
      solution_text: "$a_{15} = 3 + 14(4) = 59$, so $S_{15} = \\frac{15}{2}(3 + 59) = 465$."
    }
  ];
  
  state.currentMeta = {
    topic: "Sample: Mixed Review",
    grade: 10,
    difficulty: "Medium",
    type: "Assignment",
    num: 5
  };
  
  window.applyMeta(state.currentMeta);
  window.renderWorksheet(state.currentProblems);
  window.closeModal();
  
  window.store(CONFIG.STORE_KEY, { meta: state.currentMeta, problems: state.currentProblems });
  window.showToast('Sample worksheet loaded!', 'success');
};

/**
 * Handle worksheet generation form submission
 * @param {Event} e - Form submit event
 * @function
 */
window.handleGenerateForm = async function(e) {
  e.preventDefault();
  
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig;
  
  if (state.isGenerating) return;
  
  const num = Math.min(15, Math.max(1, parseInt($('numProblemsInput').value) || 10));
  const meta = {
    topic: $('topicInput').value.trim(),
    grade: parseInt($('gradeInput').value),
    difficulty: $('difficultyInput').value,
    type: $('worksheetTypeInput').value,
    num
  };
  
  const style = $('styleInput').value;
  const btn = $('generateBtn');
  
  // Hide previous error
  $('genError').classList.add('hidden');
  
  // Set loading state
  state.isGenerating = true;
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = "Generating...";
  
  // Set timeout for slow response message
  const slowTimer = setTimeout(() => {
    btn.textContent = "Waking server… up to a minute";
  }, CONFIG.SLOW_RESPONSE_MS);
  
  // Set timeout for request abort
  const ctrl = new AbortController();
  const killTimer = setTimeout(() => ctrl.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  
  try {
    const res = await window.fetchWithRetry(CONFIG.API_ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade_level: meta.grade,
        topic: meta.topic,
        num_problems: num,
        difficulty: meta.difficulty,
        question_type: style,
        worksheet_type: meta.type
      })
    });
    
    const data = await res.json();
    
    if (!Array.isArray(data.worksheet) || !data.worksheet.length) {
      throw new Error("Server returned an empty worksheet.");
    }
    
    state.currentProblems = data.worksheet;
    state.currentMeta = meta;
    
    window.applyMeta(meta);
    window.renderWorksheet(state.currentProblems);
    window.store(CONFIG.STORE_KEY, { meta, problems: state.currentProblems });
    
    window.closeModal();
    window.showToast(`Worksheet generated: ${num} problems on ${meta.topic}`, 'success');
    
  } catch (err) {
    window.showGenError(err);
    // Re-enable the button on error
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    btn.textContent = "Generate Sheet";
  } finally {
    clearTimeout(killTimer);
    clearTimeout(slowTimer);
    state.isGenerating = false;
    
    // Ensure button is re-enabled
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    if (btn.textContent.includes('Waking') || btn.textContent.includes('Generating')) {
      btn.textContent = "Generate Sheet";
    }
  }
};

// ============================================
// AI TUTOR
// ============================================

/**
 * Generate context string from current worksheet problems
 * @returns {string} Worksheet context for AI tutor
 * @function
 */
window.worksheetContext = function() {
  const state = window.HydrogenState;
  
  return state.currentProblems.map((p, i) =>
    `Q${i + 1}: ` + String(p.problem_text || '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  ).join('\n').slice(0, 6000);
};

/**
 * Render chat messages in the tutor drawer
 * @function
 */
window.renderChat = function() {
  const state = window.HydrogenState;
  
  const bubble = (cls, html) => `<div class="text-xs p-3 rounded-2xl pre-wrap leading-relaxed ${cls}" role="status">${html}</div>`;
  
  let html = bubble(
    'bg-brand-50 text-brand-800 border border-brand-100',
    "Hi! I'm your math tutor. Ask me about any problem or step on this worksheet, and I'll help you work through it!"
  );
  
  state.chatHistory.forEach(m => {
    html += m.role === 'user'
      ? bubble('bg-brand-600 text-white ml-6', window.escapeHtml(m.content))
      : bubble('bg-slate-100 text-slate-800 mr-6', window.clean(m.content));
  });
  
  if (state.tutorBusy) {
    html += bubble('bg-slate-100 text-slate-400 mr-6', 'Thinking…');
  }
  
  if (state.tutorError) {
    html += bubble('bg-red-50 text-red-700 border border-red-100', window.escapeHtml(state.tutorError));
  }
  
  const box = $('chatMessages');
  if (box) {
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
    window.typeset(box);
  }
};

/**
 * Handle tutor form submission
 * @param {Event} e - Form submit event
 * @function
 */
window.handleTutorForm = async function(e) {
  e.preventDefault();
  
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig;
  
  if (state.tutorBusy) return;
  
  const input = $('tutorInput');
  const msg = input.value.trim();
  
  if (!msg) return;
  
  state.tutorError = '';
  state.chatHistory.push({ role: 'user', content: msg });
  input.value = '';
  
  state.tutorBusy = true;
  const sendBtn = $('tutorSendBtn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.setAttribute('aria-busy', 'true');
  }
  
  window.renderChat();
  
  try {
    const res = await window.fetchWithRetry(CONFIG.TUTOR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade_level: state.currentMeta ? state.currentMeta.grade : parseInt($('gradeInput').value),
        messages: state.chatHistory,
        worksheet_context: window.worksheetContext()
      })
    });
    
    const data = await res.json();
    
    if (typeof data.reply !== 'string' || !data.reply) {
      throw new Error("The tutor sent an empty reply.");
    }
    
    state.chatHistory.push({ role: 'model', content: data.reply });
    window.showToast('Tutor response received', 'success');
    
  } catch (err) {
    // Remove the user message that wasn't answered
    state.chatHistory.pop();
    input.value = msg; // Let the user retry
    state.tutorError = "Tutor error: " + err.message;
    window.showToast(state.tutorError, 'error');
  } finally {
    state.tutorBusy = false;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.setAttribute('aria-busy', 'false');
    }
    window.renderChat();
  }
};

// ============================================
// SUPABASE AUTHENTICATION
// ============================================

window.supabaseState = {
  isSignedIn: false,
  user: null
};

/**
 * Initialize Supabase authentication
 * @function
 */
async function initSupabase() {
  try {
    const CONFIG = window.HydrogenConfig;
    const supabaseUrl = CONFIG?.SUPABASE_URL;
    const supabaseKey = CONFIG?.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_ACTUAL_SUPABASE')) {
      console.warn('Supabase URL or anon key not configured. Authentication will be disabled.');
      return;
    }
    
    if (window.supabase) {
      // Create client instance globally on window.supabaseClient
      window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      
      // Get initial session
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      updateAuthUI(session);

      // Set up auth state listener
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Supabase auth state change:', event);
        updateAuthUI(session);
      });
      
      console.log('Supabase authentication initialized successfully');
    } else {
      console.warn('Supabase CDN SDK not loaded.');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
}

/**
 * Update UI based on auth state (matches DOM IDs in index.html)
 * @function
 */
function updateAuthUI(session) {
  const buttonText = document.getElementById('clerkButtonText');
  const userInfo = document.getElementById('clerkUserInfo');
  
  const user = session ? session.user : null;
  window.supabaseState.isSignedIn = !!session;
  window.supabaseState.user = user;

  if (buttonText) {
    if (session && user) {
      buttonText.textContent = 'Sign Out';
      if (userInfo) {
        userInfo.textContent = `Signed in as: ${user.email || 'User'}`;
        userInfo.style.display = 'block';
      }
    } else {
      buttonText.textContent = 'Sign In / Sign Up';
      if (userInfo) {
        userInfo.textContent = '';
        userInfo.style.display = 'none';
      }
    }
  }
}

/**
 * Handle Sign In / Sign Out Click (triggers on onclick="handleClerkAuth()" from HTML)
 * @function
 */
window.handleClerkAuth = async function() {
  const client = window.supabaseClient;

  if (!client) {
    alert('Sign in failed: Supabase not initialized. Please verify your SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js.');
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();

    if (session) {
      // Sign out
      await client.auth.signOut();
      window.location.reload();
    } else {
      // Sign in via Google OAuth
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Supabase authentication error:', error);
    alert('Authentication error: ' + error.message);
  }
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 * @function
 */
window.initApp = function() {
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig;
  
  // Initialize Supabase authentication
  initSupabase();
  
  // Initialize grade select
  (function () {
    const g = $('gradeInput');
    if (g) {
      for (let i = 1; i <= 12; i++) {
        g.insertAdjacentHTML('beforeend', `<option value="${i}" ${i === 10 ? 'selected' : ''}>Grade ${i}</option>`);
      }
    }
  })();
  
  // Load saved worksheet
  const saved = window.load(CONFIG.STORE_KEY);
  if (saved && saved.meta && Array.isArray(saved.problems) && saved.problems.length) {
    state.currentMeta = saved.meta;
    state.currentProblems = saved.problems;
  }
  
  // Apply metadata and render worksheet
  window.applyMeta(state.currentMeta);
  window.renderWorksheet(state.currentProblems);
  window.renderChat();
  
  // Set up event listeners
  const generatorForm = $('generatorForm');
  if (generatorForm) {
    generatorForm.addEventListener('submit', window.handleGenerateForm);
  }
  
  const tutorForm = $('tutorForm');
  if (tutorForm) {
    tutorForm.addEventListener('submit', window.handleTutorForm);
  }
  
  // Set up keyboard shortcuts
  window.setupKeyboardShortcuts();
  
  // Initialize accessibility
  window.initAccessibility();
  
  // Initialize MathJax
  window.addEventListener('load', () => {
    if (window.MathJax && MathJax.startup) {
      MathJax.startup.promise.then(() => window.typeset()).catch(() => {});
    }
  });
  
  // Set initial ARIA attributes
  document.querySelectorAll('[aria-pressed]').forEach(el => {
    el.setAttribute('aria-pressed', el.classList.contains('bg-slate-100'));
  });
  
  // Log initialization
  console.log('Hydrogen.ai Math Worksheet Studio initialized');
  console.log('Backend URL:', CONFIG.BACKEND_URL);
  console.log('You can override the backend URL with ?backend_url=https://your-api.example.com');
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', window.initApp);

// Fallback for older browsers
window.addEventListener('load', window.initApp);

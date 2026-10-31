/**
 * Main Application Module
 * Core functionality for the Hydrogen.ai Math Worksheet Studio
 * 
 * @module app
 */

// ============================================
// UI TOGGLE FUNCTIONS
// ============================================

window.openModal = function() {
  const state = window.HydrogenState;
  
  if (state && state.currentMeta) {
    if ($('topicInput')) $('topicInput').value = state.currentMeta.topic;
    if ($('gradeInput')) $('gradeInput').value = state.currentMeta.grade;
    if ($('difficultyInput')) $('difficultyInput').value = state.currentMeta.difficulty;
    if ($('worksheetTypeInput')) $('worksheetTypeInput').value = state.currentMeta.type;
    if ($('numProblemsInput')) $('numProblemsInput').value = state.currentMeta.num;
  }
  
  window.toggleSidebar(false);
  const modal = $('modalOverlay');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    const firstFocusable = modal.querySelector('[autofocus], input, select, button');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }
  
  const mainContent = document.querySelector('main');
  if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
};

window.closeModal = function() {
  const modal = $('modalOverlay');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  
  const mainContent = document.querySelector('main');
  if (mainContent) mainContent.setAttribute('aria-hidden', 'false');
};

window.setTopic = function(t) {
  if ($('topicInput')) $('topicInput').value = t;
};

window.toggleSidebar = function(force) {
  const sidebar = $('sidebar');
  const backdrop = $('sidebarBackdrop');
  if (!sidebar) return;
  
  const isCurrentlyOpen = !sidebar.classList.contains('-translate-x-full');
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  
  sidebar.classList.toggle('-translate-x-full', !shouldOpen);
  if (backdrop) backdrop.classList.toggle('hidden', !shouldOpen);
  
  sidebar.setAttribute('aria-hidden', !shouldOpen);
  if (backdrop) backdrop.setAttribute('aria-hidden', shouldOpen);
};

window.toggleTutor = function(force) {
  const drawer = $('tutorDrawer');
  if (!drawer) return;
  
  const isCurrentlyOpen = !drawer.classList.contains('translate-x-full');
  const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;
  
  drawer.classList.toggle('translate-x-full', !shouldOpen);
  drawer.setAttribute('aria-hidden', !shouldOpen);
  
  const mainContent = document.querySelector('main');
  if (shouldOpen) {
    window.renderChat();
    const input = $('tutorInput');
    if (input) {
      input.focus();
      if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
    }
  } else {
    if (mainContent) mainContent.setAttribute('aria-hidden', 'false');
  }
};

// ============================================
// VIEW & PRINTING FUNCTIONS
// ============================================

window.toggleSolution = function(btn) {
  const box = btn.nextElementSibling;
  if (!box) return;
  const hidden = box.classList.toggle('hidden');
  btn.textContent = hidden ? '› Show solution' : '‹ Hide solution';
  btn.setAttribute('aria-expanded', !hidden);
};

window.switchView = function(mode) {
  const state = window.HydrogenState;
  state.viewMode = mode;
  
  const on = "px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-900";
  const off = "px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500";
  
  if ($('viewWorksheetBtn')) $('viewWorksheetBtn').className = mode === 'worksheet' ? on : off;
  if ($('viewSolutionsBtn')) $('viewSolutionsBtn').className = mode === 'solutions' ? on : off;
  
  document.querySelectorAll('.solution-box').forEach(b => {
    b.classList.toggle('hidden', mode === 'worksheet');
  });
  
  document.querySelectorAll('.sol-btn').forEach(b => {
    const isHidden = mode === 'worksheet';
    b.textContent = isHidden ? '› Show solution' : '‹ Hide solution';
    b.setAttribute('aria-expanded', !isHidden);
  });
};

window.printSheet = function(withAnswers) {
  const state = window.HydrogenState;
  
  if (!state.currentProblems || !state.currentProblems.length) {
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

window.applyMeta = function(m) {
  const t = m ? m.topic : 'Worksheets';
  
  if ($('sheetMainTitle')) $('sheetMainTitle').textContent = t;
  if ($('paperTitle')) $('paperTitle').textContent = m ? m.topic : 'Untitled';
  if ($('paperBadgeType')) $('paperBadgeType').textContent = m ? `HYDROGEN ${m.type.toUpperCase()}` : 'HYDROGEN WORKSHEET';
  if ($('sheetMetaSubtitle')) $('sheetMetaSubtitle').textContent = m ? `Grade ${m.grade} • ${m.num} questions • ${m.type}` : 'Generate a worksheet to get started';
  if ($('paperGrade')) $('paperGrade').textContent = m ? `Grade ${m.grade} • ${m.difficulty} ${m.type}` : '';
  if ($('sidebarSessionTitle')) $('sidebarSessionTitle').textContent = m ? m.topic : 'No worksheet yet';
  if ($('sidebarSessionSub')) $('sidebarSessionSub').textContent = m ? `Grade ${m.grade} • ${m.type}` : 'Create one to begin';
};

window.renderWorksheet = function(problems) {
  const state = window.HydrogenState;
  const c = $('questionsContainer');
  if (!c) return;
  
  c.innerHTML = '';
  
  if (!problems || !problems.length) {
    c.innerHTML = `<div class="text-center text-sm text-slate-400 py-16" role="status" aria-live="polite">No worksheet yet. Tap <b>+ New</b> to generate one.</div>`;
    return;
  }
  
  problems.forEach((item, i) => {
    const d = document.createElement('div');
    d.className = "problem-item space-y-3 pt-6 border-t border-slate-200/80 first:pt-0 first:border-0";
    d.setAttribute('role', 'article');
    d.setAttribute('aria-label', `Question ${i + 1}`);
    
    const badgeHtml = typeof window.badgesHTML === 'function' ? window.badgesHTML(item) : '';
    const probText = typeof window.renderProblemHTML === 'function' ? window.renderProblemHTML(item.problem_text) : item.problem_text;
    const diag = typeof window.buildDiagram === 'function' ? window.buildDiagram(item.diagram || (typeof window.inferSolid === 'function' && window.inferSolid(item.problem_text)) || (typeof window.inferDiagram === 'function' && window.inferDiagram(item.problem_text))) : '';
    const sol = typeof window.clean === 'function' ? window.clean(item.solution_text) : item.solution_text;

    d.innerHTML = `
      <div class="flex items-start space-x-3.5 text-sm md:text-base leading-relaxed">
        <span class="font-mono font-bold text-slate-400 text-sm select-none" aria-label="Question number">${String(i + 1).padStart(2, '0')}</span>
        <div class="flex-1 min-w-0">
          ${badgeHtml}
          <div class="q-text text-slate-900 overflow-x-auto" aria-label="Question text">${probText}</div>
        </div>
      </div>
      ${diag}
      <div class="h-16 rounded-xl border border-dashed border-slate-300" role="textbox" aria-label="Space for answer"></div>
      <div class="no-print-btn">
        <button 
          type="button" 
          onclick="toggleSolution(this)" 
          class="sol-btn no-print cursor-pointer text-xs font-semibold text-slate-500 hover:text-brand-600"
          aria-expanded="false"
          aria-label="Show solution for question ${i + 1}"
        >› Show solution</button>
        <div class="solution-box hidden mt-2.5 p-3.5 bg-slate-50 rounded-xl border-l-2 border-brand-600 text-xs text-slate-800 leading-relaxed font-mono overflow-x-auto" aria-label="Solution">${sol}</div>
      </div>`;
    
    c.appendChild(d);
  });
  
  window.switchView(state.viewMode);
  if (typeof window.typeset === 'function') window.typeset(c);
};

// ============================================
// WORKSHEET GENERATION & TUTOR
// ============================================

window.showGenError = function(err) {
  const CONFIG = window.HydrogenConfig || {};
  let msg = err.message;
  
  if (err.name === 'AbortError') {
    msg = "The server took too long to respond. Please try again.";
  } else if (err instanceof TypeError) {
    msg = `Couldn't reach the server at ${CONFIG.BACKEND_URL || 'backend'}. This could be due to CORS restrictions or the server being down.`;
  }
  
  const box = $('genError');
  if (box) {
    box.innerHTML = (typeof window.escapeHtml === 'function' ? window.escapeHtml(msg) : msg) + 
      ' <button type="button" onclick="loadSample()" class="underline font-semibold hover:text-brand-600">Load a sample worksheet instead</button>';
    box.classList.remove('hidden');
  }
  
  if (typeof window.showToast === 'function') window.showToast(msg, 'error');
};

window.loadSample = function() {
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig || {};
  
  state.currentProblems = [
    {
      problem_text: "Find the roots of $2x^2 - 5x + 3 = 0$ using the quadratic formula.",
      solution_text: "$D = 25 - 24 = 1$, so $x = \\frac{5 \\pm 1}{4}$, giving $x = \\frac{3}{2}$ or $x = 1$."
    },
    {
      problem_text: "A tower casts a shadow $30\\text{ m}$ long when the angle of elevation of the sun is $30^\\circ$. Find its height.",
      solution_text: "$\\tan 30^\\circ = \\frac{h}{30} \\implies h = 10\\sqrt{3} \\approx 17.32\\text{ m}$"
    }
  ];
  
  state.currentMeta = {
    topic: "Sample: Mixed Review",
    grade: 10,
    difficulty: "Medium",
    type: "Assignment",
    num: 2
  };
  
  window.applyMeta(state.currentMeta);
  window.renderWorksheet(state.currentProblems);
  window.closeModal();
  
  if (typeof window.store === 'function') {
    window.store(CONFIG.STORE_KEY || 'hydrogen.sheet.v2', { meta: state.currentMeta, problems: state.currentProblems });
  }
  if (typeof window.showToast === 'function') window.showToast('Sample worksheet loaded!', 'success');
};

window.handleGenerateForm = async function(e) {
  e.preventDefault();
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig || {};
  if (state.isGenerating) return;
  
  const num = Math.min(15, Math.max(1, parseInt($('numProblemsInput')?.value) || 10));
  const meta = {
    topic: $('topicInput')?.value.trim() || 'Math Review',
    grade: parseInt($('gradeInput')?.value) || 10,
    difficulty: $('difficultyInput')?.value || 'Medium',
    type: $('worksheetTypeInput')?.value || 'Assignment',
    num
  };
  
  const style = $('styleInput')?.value || 'Mixed';
  const btn = $('generateBtn');
  
  if ($('genError')) $('genError').classList.add('hidden');
  state.isGenerating = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating...";
  }
  
  try {
    const fetchFunc = window.fetchWithRetry || fetch;
    const res = await fetchFunc(CONFIG.API_ENDPOINT || 'https://my-math.onrender.com/generate', {
      method: 'POST',
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
    if (typeof window.store === 'function') {
      window.store(CONFIG.STORE_KEY || 'hydrogen.sheet.v2', { meta, problems: state.currentProblems });
    }
    window.closeModal();
    if (typeof window.showToast === 'function') window.showToast(`Worksheet generated: ${num} problems`, 'success');
  } catch (err) {
    window.showGenError(err);
  } finally {
    state.isGenerating = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Generate Sheet";
    }
  }
};

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

window.renderChat = function() {
  const state = window.HydrogenState;
  const bubble = (cls, html) => `<div class="text-xs p-3 rounded-2xl pre-wrap leading-relaxed ${cls}" role="status">${html}</div>`;
  
  let html = bubble(
    'bg-brand-50 text-brand-800 border border-brand-100',
    "Hi! I'm your math tutor. Ask me about any problem or step on this worksheet, and I'll help you work through it!"
  );
  
  state.chatHistory.forEach(m => {
    const escaped = typeof window.escapeHtml === 'function' ? window.escapeHtml(m.content) : m.content;
    const cleaned = typeof window.clean === 'function' ? window.clean(m.content) : m.content;
    html += m.role === 'user'
      ? bubble('bg-brand-600 text-white ml-6', escaped)
      : bubble('bg-slate-100 text-slate-800 mr-6', cleaned);
  });
  
  if (state.tutorBusy) {
    html += bubble('bg-slate-100 text-slate-400 mr-6', 'Thinking…');
  }
  
  if (state.tutorError) {
    html += bubble('bg-red-50 text-red-700 border border-red-100', typeof window.escapeHtml === 'function' ? window.escapeHtml(state.tutorError) : state.tutorError);
  }
  
  const box = $('chatMessages');
  if (box) {
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
    if (typeof window.typeset === 'function') window.typeset(box);
  }
};

window.handleTutorForm = async function(e) {
  e.preventDefault();
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig || {};
  if (state.tutorBusy) return;
  
  const input = $('tutorInput');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;
  
  state.tutorError = '';
  state.chatHistory.push({ role: 'user', content: msg });
  input.value = '';
  
  state.tutorBusy = true;
  const sendBtn = $('tutorSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  
  window.renderChat();
  
  try {
    const fetchFunc = window.fetchWithRetry || fetch;
    const res = await fetchFunc(CONFIG.TUTOR_ENDPOINT || 'https://my-math.onrender.com/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade_level: state.currentMeta ? state.currentMeta.grade : parseInt($('gradeInput')?.value || 10),
        messages: state.chatHistory,
        worksheet_context: window.worksheetContext()
      })
    });
    
    const data = await res.json();
    if (typeof data.reply !== 'string' || !data.reply) {
      throw new Error("The tutor sent an empty reply.");
    }
    
    state.chatHistory.push({ role: 'model', content: data.reply });
    if (typeof window.showToast === 'function') window.showToast('Tutor response received', 'success');
  } catch (err) {
    state.chatHistory.pop();
    input.value = msg;
    state.tutorError = "Tutor error: " + err.message;
    if (typeof window.showToast === 'function') window.showToast(state.tutorError, 'error');
  } finally {
    state.tutorBusy = false;
    if (sendBtn) sendBtn.disabled = false;
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

async function initSupabase() {
  try {
    const CONFIG = window.HydrogenConfig || {};
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const supabaseKey = CONFIG.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_ACTUAL_SUPABASE')) {
      return;
    }
    
    if (window.supabase) {
      window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      updateAuthUI(session);

      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        updateAuthUI(session);
      });
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
}

function updateAuthUI(session) {
  const buttonText = $('clerkButtonText');
  const userInfo = $('clerkUserInfo');
  
  const user = session ? session.user : null;
  window.supabaseState.isSignedIn = !!session;
  window.supabaseState.user = user;

  if (buttonText) {
    if (session && user) {
      buttonText.textContent = 'Sign Out';
      if (userInfo) {
        userInfo.textContent = `Signed in: ${user.email || user.user_metadata?.user_name || 'User'}`;
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

window.handleClerkAuth = async function() {
  const client = window.supabaseClient;

  if (!client) {
    if (typeof window.openAuthModal === 'function') {
      window.openAuthModal();
    }
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();

    if (session) {
      await client.auth.signOut();
      window.location.reload();
    } else {
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal();
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    alert('Authentication error: ' + error.message);
  }
};

// ============================================
// INITIALIZATION
// ============================================

window.initApp = function() {
  const state = window.HydrogenState;
  const CONFIG = window.HydrogenConfig || {};
  
  initSupabase();
  
  (function () {
    const g = $('gradeInput');
    if (g && g.children.length === 0) {
      for (let i = 1; i <= 12; i++) {
        g.insertAdjacentHTML('beforeend', `<option value="${i}" ${i === 10 ? 'selected' : ''}>Grade ${i}</option>`);
      }
    }
  })();
  
  const saved = typeof window.load === 'function' ? window.load(CONFIG.STORE_KEY || 'hydrogen.sheet.v2') : null;
  if (saved && saved.meta && Array.isArray(saved.problems) && saved.problems.length) {
    state.currentMeta = saved.meta;
    state.currentProblems = saved.problems;
  }
  
  window.applyMeta(state.currentMeta);
  window.renderWorksheet(state.currentProblems);
  window.renderChat();
  
  const generatorForm = $('generatorForm');
  if (generatorForm) {
    generatorForm.addEventListener('submit', window.handleGenerateForm);
  }
  
  const tutorForm = $('tutorForm');
  if (tutorForm) {
    tutorForm.addEventListener('submit', window.handleTutorForm);
  }
  
  if (typeof window.setupKeyboardShortcuts === 'function') window.setupKeyboardShortcuts();
  if (typeof window.initAccessibility === 'function') window.initAccessibility();
};

document.addEventListener('DOMContentLoaded', window.initApp);

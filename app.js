// EduTwin - Master Application Logic
// Single Page Application with full reactivity, REST API integration, and SVG visualizations

const API_BASE = '/api';

// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
  currentRoute: 'landing', // 'landing', 'onboarding', 'dashboard', 'twin', 'skill-gap', 'ai-recommendations', 'roadmap', 'career', 'simulation', 'progress', 'profile'
  user: null,
  student: null,
  learningPlan: null,
  token: localStorage.getItem('edutwin_token') || null,
  isDemoMode: false,
  authModalMode: null, // null, 'login', 'signup', 'forgot'
  theme: localStorage.getItem('edutwin_theme') || 'light',
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  // Onboarding wizard state
  onboardingStep: 1,
  onboardingData: {
    name: '',
    age: 20,
    college: '',
    degree: 'B.Tech',
    branch: 'Computer Science and Engineering',
    academicYear: '3rd Year',
    cgpa: 8.0,
    maxCgpa: 10.0,
    attendance: 85,
    subjectMarks: {
      'Programming': 85,
      'Data Structures': 80,
      'DBMS': 75,
      'Operating Systems': 75,
      'Computer Networks': 70,
      'Mathematics': 80
    },
    skills: {
      'Python': 70,
      'Java': 60,
      'C': 65,
      'HTML': 85,
      'CSS': 80,
      'JavaScript': 65,
      'React': 35,
      'Node.js': 25,
      'SQL': 60,
      'Git': 45
    },
    interests: ['Web Development'],
    careerGoal: 'Full Stack Developer',
    targetDescription: ''
  },
  isOnboardingSubmitting: false,

  // Simulation state
  simulationData: {
    selectedCareer: 'Full Stack Developer',
    sliders: {},
    result: null,
    isSimulating: false
  },

  // Skill gap filter state
  skillGapFilter: 'all',
  skillGapSort: 'gap-desc',
  selectedCareerForGap: 'Full Stack Developer',

  // Active AI tab
  activeAiTab: 'all'
};

// Initialize theme
if (state.theme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-indigo-600 text-white',
    warning: 'bg-amber-600 text-white'
  };

  toast.className = `${bgColors[type] || bgColors.success} px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-2 hover:opacity-75 focus:outline-none" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// API CLIENT
// ==========================================
const api = {
  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  async getMe() {
    return this.request('/auth/me');
  },

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async signup(name, email, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  async googleAuth(profile) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ profile })
    });
  },

  async demoLogin() {
    return this.request('/auth/demo', { method: 'POST' });
  },

  async forgotPassword(email, newPassword = null) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword })
    });
  },

  async createStudent(studentData) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  async updateStudent(id, studentData) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
  },

  async getSkillGaps(skills, careerGoal) {
    return this.request('/ai/skill-gap', {
      method: 'POST',
      body: JSON.stringify({ skills, careerGoal })
    });
  },

  async getAiRecommendations(student) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ student })
    });
  },

  async getCareerMatches(student) {
    return this.request('/ai/career', {
      method: 'POST',
      body: JSON.stringify({ student })
    });
  },

  async getLearningPlan(student) {
    return this.request('/ai/learning-plan', {
      method: 'POST',
      body: JSON.stringify({ student })
    });
  },

  async toggleTask(taskId, status) {
    return this.request(`/learning-plan/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async runSimulation(simulatedChanges, careerGoal, currentReadiness) {
    return this.request('/ai/simulation', {
      method: 'POST',
      body: JSON.stringify({
        student: state.student,
        simulatedChanges,
        careerGoal,
        currentReadiness
      })
    });
  },

  async getProgress() {
    return this.request('/progress');
  },

  async resetDemo() {
    return this.request('/demo/reset', { method: 'POST' });
  }
};

// ==========================================
// AUTHENTICATION HANDLERS
// ==========================================
window.handleDemoStudent = async function () {
  try {
    const res = await api.demoLogin();
    state.token = res.token;
    localStorage.setItem('edutwin_token', res.token);
    state.user = res.user;
    state.student = res.student;
    state.isDemoMode = true;
    state.selectedCareerForGap = res.student.careerGoal;
    state.simulationData.selectedCareer = res.student.careerGoal;
    
    // Fetch learning plan
    const planRes = await api.getLearningPlan(res.student);
    state.learningPlan = planRes;

    state.currentRoute = 'dashboard';
    showToast(`Welcome ${res.student.name}! Demo mode activated.`);
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleGoogleSignIn = async function () {
  try {
    // Graceful Google OAuth Flow Simulation
    const mockGoogleProfile = {
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    };
    const res = await api.googleAuth(mockGoogleProfile);
    state.token = res.token;
    localStorage.setItem('edutwin_token', res.token);
    state.user = res.user;
    state.student = res.student;
    state.isDemoMode = false;
    state.authModalMode = null;

    if (res.student) {
      state.currentRoute = 'dashboard';
      showToast(`Welcome back, ${res.user.name}!`);
    } else {
      state.onboardingData.name = res.user.name;
      state.currentRoute = 'onboarding';
      state.onboardingStep = 1;
      showToast(`Google account linked! Let's build your Digital Twin.`);
    }
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleEmailAuth = async function (e, mode) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    if (mode === 'signup') {
      const name = form.name.value.trim();
      const confirmPassword = form.confirmPassword.value;
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
      const res = await api.signup(name, email, password);
      state.token = res.token;
      localStorage.setItem('edutwin_token', res.token);
      state.user = res.user;
      state.onboardingData.name = name;
      state.authModalMode = null;
      state.currentRoute = 'onboarding';
      state.onboardingStep = 1;
      showToast('Account created! Now build your Digital Twin.');
    } else {
      const res = await api.login(email, password);
      state.token = res.token;
      localStorage.setItem('edutwin_token', res.token);
      state.user = res.user;
      state.student = res.student;
      state.authModalMode = null;

      if (res.student) {
        state.currentRoute = 'dashboard';
        showToast(`Welcome back, ${res.user.name}!`);
      } else {
        state.currentRoute = 'onboarding';
        state.onboardingStep = 1;
      }
    }
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleForgotPassword = async function (e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const newPassword = form.newPassword.value;

  try {
    const res = await api.forgotPassword(email, newPassword);
    showToast(res.message, 'success');
    state.authModalMode = 'login';
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleLogout = function () {
  state.token = null;
  state.user = null;
  state.student = null;
  state.isDemoMode = false;
  localStorage.removeItem('edutwin_token');
  state.currentRoute = 'landing';
  showToast('Logged out successfully.');
  render();
};

window.toggleTheme = function () {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('edutwin_theme', state.theme);
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  render();
};

window.navigate = function (route) {
  // Route guarding
  if (['dashboard', 'twin', 'skill-gap', 'ai-recommendations', 'roadmap', 'career', 'simulation', 'progress', 'profile'].includes(route)) {
    if (!state.student && !state.isDemoMode) {
      state.authModalMode = 'login';
      showToast('Please log in or try Demo Mode first.', 'info');
      render();
      return;
    }
  }

  state.currentRoute = route;
  state.mobileMenuOpen = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
};

window.openAuthModal = function (mode) {
  state.authModalMode = mode;
  render();
};

window.closeAuthModal = function () {
  state.authModalMode = null;
  render();
};

// ==========================================
// ONBOARDING WIZARD HANDLERS
// ==========================================
window.setOnboardingStep = function (step) {
  state.onboardingStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
};

window.updateOnboardingField = function (field, value) {
  state.onboardingData[field] = value;
};

window.updateOnboardingSubject = function (subj, val) {
  state.onboardingData.subjectMarks[subj] = Number(val);
  const el = document.getElementById(`subj-val-${subj}`);
  if (el) el.textContent = `${val}%`;
};

window.updateOnboardingSkill = function (skill, val) {
  state.onboardingData.skills[skill] = Number(val);
  const el = document.getElementById(`skill-val-${skill}`);
  const badge = document.getElementById(`skill-badge-${skill}`);
  if (el) el.textContent = val;
  if (badge) {
    let text = 'Beginner';
    let cls = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (val >= 80) { text = 'Advanced'; cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'; }
    else if (val >= 60) { text = 'Intermediate'; cls = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'; }
    else if (val >= 35) { text = 'Developing'; cls = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'; }
    badge.textContent = text;
    badge.className = `text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`;
  }
};

window.toggleInterest = function (interest) {
  const list = state.onboardingData.interests;
  const idx = list.indexOf(interest);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(interest);
  render();
};

window.selectCareerGoal = function (career) {
  state.onboardingData.careerGoal = career;
  render();
};

window.submitOnboarding = async function () {
  state.isOnboardingSubmitting = true;
  render();

  try {
    // Artificial delay to show realistic AI building animation
    await new Promise(r => setTimeout(r, 1800));

    const res = await api.createStudent(state.onboardingData);
    state.student = res.student;
    state.isOnboardingSubmitting = false;
    state.currentRoute = 'dashboard';
    
    // Celebration confetti
    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
    showToast('Your Digital Twin has been created successfully!');
    render();
  } catch (err) {
    state.isOnboardingSubmitting = false;
    showToast(err.message, 'error');
    render();
  }
};

// ==========================================
// ROADMAP & TASK COMPLETION HANDLER
// ==========================================
window.toggleTaskStatus = async function (taskId, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'in-progress' : 'completed';
  try {
    const res = await api.toggleTask(taskId, newStatus);
    state.learningPlan = res.plan;
    if (newStatus === 'completed' && window.confetti) {
      window.confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    }
    showToast(`Task marked as ${newStatus}!`);
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ==========================================
// WHAT-IF SIMULATION HANDLERS
// ==========================================
window.updateSimulationSlider = function (skill, val) {
  state.simulationData.sliders[skill] = Number(val);
  const valEl = document.getElementById(`sim-val-${skill}`);
  if (valEl) valEl.textContent = val;
};

window.runSimulationAction = async function () {
  state.simulationData.isSimulating = true;
  render();

  try {
    const res = await api.runSimulation(
      state.simulationData.sliders,
      state.simulationData.selectedCareer,
      state.student.careerReadiness
    );
    state.simulationData.result = res;
    state.simulationData.isSimulating = false;
    
    if (window.confetti && res.delta > 0) {
      window.confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    }
    showToast(`Simulation complete! Career Readiness jumped by +${res.delta} pts.`);
    render();
  } catch (err) {
    state.simulationData.isSimulating = false;
    showToast(err.message, 'error');
    render();
  }
};

window.resetSimulationAction = function () {
  state.simulationData.sliders = {};
  state.simulationData.result = null;
  render();
};

window.setSkillGapCareer = function (career) {
  state.selectedCareerForGap = career;
  render();
};

window.setSkillGapFilter = function (filter) {
  state.skillGapFilter = filter;
  render();
};

window.setSkillGapSort = function (sort) {
  state.skillGapSort = sort;
  render();
};

// ==========================================
// RENDERERS
// ==========================================

function getSkillLevelLabel(val) {
  if (val >= 80) return { label: 'Advanced', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
  if (val >= 60) return { label: 'Intermediate', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' };
  if (val >= 35) return { label: 'Developing', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
  return { label: 'Beginner', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
}

// 1. LANDING PAGE
function renderLandingPage() {
  return `
    <!-- Top Nav -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer" onclick="navigate('landing')">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <i data-lucide="sparkles" class="w-6 h-6"></i>
          </div>
          <div>
            <span class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">EduTwin</span>
            <span class="block text-[10px] font-semibold tracking-wider text-slate-600 dark:text-slate-300 uppercase -mt-1">AI Digital Student Twin</span>
          </div>
        </div>

        <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <a href="#features" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
          <a href="#how-it-works" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</a>
          <a href="#simulation" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">What-If Simulation</a>
          <a href="#faq" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a>
        </nav>

        <div class="flex items-center gap-3">
          <button onclick="toggleTheme()" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
            <i data-lucide="${state.theme === 'dark' ? 'sun' : 'moon'}" class="w-5 h-5"></i>
          </button>
          
          <button onclick="handleDemoStudent()" class="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all">
            <i data-lucide="zap" class="w-4 h-4 text-amber-600"></i> Try Demo Student
          </button>

          <button onclick="openAuthModal('login')" class="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Log In
          </button>

          <button onclick="openAuthModal('signup')" class="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center gap-2">
            Create My Twin <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-16 pb-24 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/15 to-teal-400/10 rounded-full blur-3xl"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center max-w-3xl mx-auto">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide uppercase mb-6 animate-pulse">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Venture-Grade EdTech AI Innovation
          </div>
          
          <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Meet Your AI-Powered <br/>
            <span class="bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">Digital Student Twin.</span>
          </h1>

          <p class="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Understand your strengths, discover your skill gaps, and build a personalized path toward your dream career. EduTwin simulates your future readiness before you even take a course.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onclick="openAuthModal('signup')" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-3">
              <i data-lucide="user-plus" class="w-5 h-5"></i> Create My Digital Twin
            </button>
            <button onclick="handleDemoStudent()" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-md transition-all flex items-center justify-center gap-3">
              <i data-lucide="play-circle" class="w-5 h-5 text-amber-500"></i> Explore Live Demo (Rahul Kumar)
            </button>
          </div>

          <p class="mt-4 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-500"></i> Personalized insights • Measurable progress • A clearer career path
          </p>
        </div>

        <!-- Hero Visualization Preview Mockup -->
        <div class="mt-14 max-w-5xl mx-auto rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-indigo-500/20 via-slate-200/40 dark:via-slate-800/40 to-transparent border border-indigo-500/30 shadow-2xl backdrop-blur-xl">
          <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-inner">
            <div class="flex flex-wrap items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  RK
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Rahul Kumar <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">CSE 3rd Year</span>
                  </h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Targeting: <strong class="text-indigo-600 dark:text-indigo-400">Full Stack Developer</strong></p>
                </div>
              </div>

              <div class="flex items-center gap-6">
                <div class="text-right">
                  <span class="text-xs uppercase font-bold text-slate-600 dark:text-slate-300">Career Readiness</span>
                  <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">65%</div>
                </div>
                <div class="text-right">
                  <span class="text-xs uppercase font-bold text-slate-600 dark:text-slate-300">Digital Twin Health</span>
                  <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400">84/100</div>
                </div>
              </div>
            </div>

            <!-- Mini Preview Dashboard Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <!-- Visual Twin Node Column -->
              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <div class="relative w-36 h-36 flex items-center justify-center mb-3">
                  <div class="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400/40 animate-spin" style="animation-duration: 20s"></div>
                  <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    <div class="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                      <i data-lucide="cpu" class="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-pulse"></i>
                    </div>
                  </div>
                </div>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">Neural Digital Twin Active</span>
                <span class="text-xs text-slate-500 mt-1">95% Profile Synchronization</span>
              </div>

              <!-- Priority Skill Gaps Column -->
              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Top Skill Gaps for Target</span>
                  <div class="space-y-3 mt-3">
                    <div>
                      <div class="flex justify-between text-xs font-bold mb-1">
                        <span>Node.js</span> <span class="text-rose-500">20 / 75 (Gap: 55)</span>
                      </div>
                      <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-rose-500 h-full rounded-full" style="width: 27%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs font-bold mb-1">
                        <span>React</span> <span class="text-rose-500">30 / 80 (Gap: 50)</span>
                      </div>
                      <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-rose-500 h-full rounded-full" style="width: 38%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-xs font-bold mb-1">
                        <span>JavaScript</span> <span class="text-amber-500">60 / 85 (Gap: 25)</span>
                      </div>
                      <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div class="bg-amber-500 h-full rounded-full" style="width: 70%"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button onclick="handleDemoStudent()" class="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  Analyze All 8 Gaps <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              <!-- AI Guidance Column -->
              <div class="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200/70 dark:border-indigo-800/70 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
                    <i data-lucide="bot" class="w-4 h-4"></i> AI Recommendation
                  </div>
                  <p class="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">
                    "Your HTML (90%) and CSS (85%) fundamentals are top-tier. Shifting your focus to React state patterns and Node.js REST services will fast-track your Full Stack readiness by <strong>+24%</strong>."
                  </p>
                </div>
                <button onclick="handleDemoStudent()" class="mt-4 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5">
                  Launch 30-Day Plan <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-slate-50/70 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Core Architecture</span>
          <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">Engineered For Measurable Student Growth</h2>
          <p class="text-slate-600 dark:text-slate-300 mt-3 text-sm">Four intelligent pillars working in harmony to map, guide, and accelerate your engineering career.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Card 1 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i data-lucide="brain-circuit" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">AI Student Analysis</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Consolidates academic performance, subject marks, attendance, and hands-on skills into a cohesive computational twin.
            </p>
          </div>

          <!-- Card 2 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i data-lucide="crosshair" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Smart Skill Gap Analysis</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Calculates mathematically precise gaps against verified industry benchmarks using weighted career matrices.
            </p>
          </div>

          <!-- Card 3 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i data-lucide="compass" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Personalized Guidance</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Generates structured 30-day learning roadmaps with realistic daily tasks and curated portfolio project ideas.
            </p>
          </div>

          <!-- Card 4 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i data-lucide="sparkles" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">What-If Simulation</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Interactively adjust skills with live sliders to forecast your future career readiness and uncover top ROI learning targets.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Signature Journey</span>
          <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">How EduTwin Transforms Your Learning</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <!-- Step 1 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center relative">
            <div class="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">1</div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-2">Build Profile</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Provide academic metrics, subject marks, interests, and current skill ratings.</p>
          </div>
          <!-- Step 2 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center relative">
            <div class="w-10 h-10 rounded-full bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">2</div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-2">Generate Twin</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">AI creates a living neural model showing your abilities, radar, and readiness score.</p>
          </div>
          <!-- Step 3 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center relative">
            <div class="w-10 h-10 rounded-full bg-teal-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">3</div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-2">Discover Gaps</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Benchmark yourself against Full Stack, AI Engineer, Cloud, and Cybersecurity roles.</p>
          </div>
          <!-- Step 4 -->
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center relative">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">4</div>
            <h4 class="font-bold text-slate-900 dark:text-white mb-2">Simulate & Grow</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Run What-If scenarios, complete 30-day roadmap tasks, and watch your twin evolve.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Student Transformation Card -->
    <section class="py-16 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">Sample Student Transformation</h3>
          <p class="text-xs text-slate-500 mt-1">See how Rahul evolved his Digital Twin across 30 days of targeted learning</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold uppercase tracking-wider text-rose-500">Day 1 • Before EduTwin</span>
            <div class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>• Unsure which full-stack frameworks to study</p>
              <p>• Strong HTML/CSS but zero backend and weak React</p>
              <p>• Career Readiness: <strong class="text-slate-800 dark:text-slate-200">65%</strong></p>
              <p>• No clear day-by-day roadmap</p>
            </div>
          </div>
          <div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-teal-50/80 dark:from-indigo-950/40 dark:to-teal-950/40 border border-indigo-300 dark:border-indigo-800">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Day 30 • With EduTwin</span>
            <div class="mt-4 space-y-2 text-sm text-slate-800 dark:text-slate-200">
              <p>• Completed 8 structured roadmap milestones</p>
              <p>• React boosted 30 → 75%, Node.js 20 → 70%</p>
              <p>• Career Readiness: <strong class="text-emerald-600 dark:text-emerald-400">89% (+24 pts)</strong></p>
              <p>• Full-stack portfolio project deployed with REST API</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
        <p class="text-xs text-slate-500 mt-2">Everything you need to know about your Digital Twin</p>
      </div>

      <div class="space-y-4">
        <details class="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 cursor-pointer group">
          <summary class="font-bold text-slate-900 dark:text-white flex items-center justify-between">
            What is a Digital Student Twin?
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform"></i>
          </summary>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            A dynamic, computational representation of your academic and technical capabilities. It tracks subject marks, coding skills, and career goals to identify exact skill gaps and forecast your job readiness over time.
          </p>
        </details>

        <details class="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 cursor-pointer group">
          <summary class="font-bold text-slate-900 dark:text-white flex items-center justify-between">
            How is Career Readiness calculated?
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform"></i>
          </summary>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            Career Readiness combines a weighted alignment of your current skills against industry requirements (80% weight) and core academic health from your CGPA and attendance (20% weight), mapped directly to transparent role benchmarks.
          </p>
        </details>

        <details class="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 cursor-pointer group">
          <summary class="font-bold text-slate-900 dark:text-white flex items-center justify-between">
            Does the What-If Simulation require external AI services?
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform"></i>
          </summary>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            No! EduTwin includes a deterministic, offline-capable calculation engine that guarantees instant, reliable, zero-latency simulation calculations for any student profile, even during network failures.
          </p>
        </details>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">ET</div>
          <span class="font-bold text-slate-800 dark:text-slate-200">EduTwin</span> — AI-Powered Digital Student Twin
        </div>
        <div>
          © 2026 EduTwin. Built for Hackathon Excellence. Open Innovation / AI / Education.
        </div>
      </div>
    </footer>
  `;
}

// 2. AUTH MODAL
function renderAuthModal() {
  if (!state.authModalMode) return '';

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div class="bg-white dark:bg-[#111827] w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button onclick="closeAuthModal()" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">✕</button>

        <div class="text-center mb-6">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <i data-lucide="sparkles" class="w-6 h-6"></i>
          </div>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">
            ${state.authModalMode === 'login' ? 'Welcome Back' : (state.authModalMode === 'signup' ? 'Create Your Account' : 'Reset Password')}
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            ${state.authModalMode === 'login' ? 'Log in to access your digital student twin' : (state.authModalMode === 'signup' ? 'Start your journey towards your dream career' : 'Enter your email to reset credentials')}
          </p>
        </div>

        <!-- Google OAuth Button -->
        <button onclick="handleGoogleSignIn()" class="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-sm font-bold flex items-center justify-center gap-3 transition-colors shadow-sm mb-4">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div class="relative my-4 text-center">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
          <span class="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-bold uppercase text-slate-400">or with email</span>
        </div>

        ${state.authModalMode === 'forgot' ? `
          <form onsubmit="handleForgotPassword(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" name="email" required placeholder="student@university.edu" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input type="password" name="newPassword" required placeholder="Minimum 6 characters" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <button type="submit" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all">
              Reset Password
            </button>
            <div class="text-center text-xs">
              <a href="#" onclick="openAuthModal('login')" class="text-indigo-600 font-bold hover:underline">Back to Login</a>
            </div>
          </form>
        ` : `
          <form onsubmit="handleEmailAuth(event, '${state.authModalMode}')" class="space-y-3.5">
            ${state.authModalMode === 'signup' ? `
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input type="text" name="name" required placeholder="e.g. Rahul Kumar" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
            ` : ''}

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" name="email" required placeholder="student@university.edu" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                ${state.authModalMode === 'login' ? `
                  <a href="#" onclick="openAuthModal('forgot')" class="text-[11px] font-bold text-indigo-600 hover:underline">Forgot?</a>
                ` : ''}
              </div>
              <input type="password" name="password" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            ${state.authModalMode === 'signup' ? `
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
            ` : ''}

            <button type="submit" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all">
              ${state.authModalMode === 'login' ? 'Sign In' : 'Create Student Account'}
            </button>
          </form>

          <div class="mt-4 text-center text-xs text-slate-500">
            ${state.authModalMode === 'login' ? `
              Don't have an account? <a href="#" onclick="openAuthModal('signup')" class="text-indigo-600 font-bold hover:underline">Sign up</a>
            ` : `
              Already have an account? <a href="#" onclick="openAuthModal('login')" class="text-indigo-600 font-bold hover:underline">Sign in</a>
            `}
          </div>
        `}

        <!-- One Click Demo Mode Shortcut -->
        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button onclick="handleDemoStudent()" class="w-full py-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2">
            <i data-lucide="zap" class="w-4 h-4 text-amber-600"></i> Instantly Explore with Demo Student (Rahul)
          </button>
        </div>
      </div>
    </div>
  `;
}

// 3. MULTI-STEP ONBOARDING WIZARD
function renderOnboardingWizard() {
  if (state.isOnboardingSubmitting) {
    return `
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="text-center max-w-md p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl animate-pulse">
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-teal-400 p-1 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 animate-spin" style="animation-duration: 8s">
            <div class="w-full h-full bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center">
              <i data-lucide="sparkles" class="w-10 h-10 text-indigo-600"></i>
            </div>
          </div>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">EduTwin AI is Building Your Twin</h3>
          <p class="text-xs text-slate-500 mt-2">Computing neural skill topology, benchmarks, and your 30-day personalized roadmap...</p>
          <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-6">
            <div class="bg-indigo-600 h-full rounded-full animate-pulse" style="width: 85%"></div>
          </div>
        </div>
      </div>
    `;
  }

  const d = state.onboardingData;
  const step = state.onboardingStep;

  return `
    <div class="max-w-3xl mx-auto px-4 py-12">
      <!-- Onboarding Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3">
          Step ${step} of 5
        </div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white">
          ${step === 1 ? 'Personal Information' : (step === 2 ? 'Academic Performance' : (step === 3 ? 'Technical Skills Rating' : (step === 4 ? 'Interests & Specializations' : 'Your Career Goal')))}
        </h2>
        <p class="text-xs text-slate-500 mt-1">
          ${step === 1 ? 'Tell us about your college and degree' : (step === 2 ? 'Enter your CGPA and core subject marks' : (step === 3 ? 'Slide to rate your current comfort level from 0 to 100' : (step === 4 ? 'Select the domains you are passionate about exploring' : 'Define your target professional role to generate skill gaps')))}
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-300" style="width: ${step * 20}%"></div>
      </div>

      <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl">
        <!-- STEP 1: Personal Info -->
        ${step === 1 ? `
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input type="text" value="${d.name}" oninput="updateOnboardingField('name', this.value)" placeholder="e.g. Rahul Kumar" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Age</label>
                <input type="number" value="${d.age}" oninput="updateOnboardingField('age', this.value)" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College / University</label>
              <input type="text" value="${d.college}" oninput="updateOnboardingField('college', this.value)" placeholder="e.g. National Institute of Technology" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Degree</label>
                <select onchange="updateOnboardingField('degree', this.value)" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="B.Tech" ${d.degree === 'B.Tech' ? 'selected' : ''}>B.Tech</option>
                  <option value="B.E" ${d.degree === 'B.E' ? 'selected' : ''}>B.E</option>
                  <option value="BCA" ${d.degree === 'BCA' ? 'selected' : ''}>BCA</option>
                  <option value="MCA" ${d.degree === 'MCA' ? 'selected' : ''}>MCA</option>
                  <option value="B.Sc CS" ${d.degree === 'B.Sc CS' ? 'selected' : ''}>B.Sc CS</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                <input type="text" value="${d.branch}" oninput="updateOnboardingField('branch', this.value)" placeholder="e.g. Computer Science (CSE)" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                <select onchange="updateOnboardingField('academicYear', this.value)" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="1st Year" ${d.academicYear === '1st Year' ? 'selected' : ''}>1st Year</option>
                  <option value="2nd Year" ${d.academicYear === '2nd Year' ? 'selected' : ''}>2nd Year</option>
                  <option value="3rd Year" ${d.academicYear === '3rd Year' ? 'selected' : ''}>3rd Year</option>
                  <option value="4th Year" ${d.academicYear === '4th Year' ? 'selected' : ''}>4th Year</option>
                </select>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- STEP 2: Academic Info -->
        ${step === 2 ? `
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CGPA</label>
                <input type="number" step="0.1" min="0" max="10" value="${d.cgpa}" oninput="updateOnboardingField('cgpa', this.value)" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500 font-bold">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CGPA Scale</label>
                <input type="number" value="${d.maxCgpa}" readonly class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Attendance (%)</label>
                <input type="number" min="0" max="100" value="${d.attendance}" oninput="updateOnboardingField('attendance', this.value)" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-indigo-500 font-bold">
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Core Subject Marks (%)</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${Object.entries(d.subjectMarks).map(([subj, mark]) => `
                  <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <div class="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span>${subj}</span>
                      <span id="subj-val-${subj}" class="text-indigo-600 font-mono">${mark}%</span>
                    </div>
                    <input type="range" min="30" max="100" value="${mark}" oninput="updateOnboardingSubject('${subj}', this.value)" class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer">
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- STEP 3: Skills -->
        ${step === 3 ? `
          <div class="space-y-4">
            <p class="text-xs text-slate-500 mb-2">Adjust each slider based on your confidence level (0: Absolute Beginner, 100: Production Expert).</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${Object.entries(d.skills).map(([skill, val]) => {
                const info = getSkillLevelLabel(val);
                return `
                  <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${skill}</span>
                      <div class="flex items-center gap-2">
                        <span id="skill-badge-${skill}" class="text-xs px-2.5 py-0.5 rounded-full font-medium ${info.cls}">${info.label}</span>
                        <span id="skill-val-${skill}" class="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 w-6 text-right">${val}</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value="${val}" oninput="updateOnboardingSkill('${skill}', this.value)" class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer">
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- STEP 4: Interests -->
        ${step === 4 ? `
          <div>
            <p class="text-xs text-slate-500 mb-4">Select domains you are passionate about (click to toggle):</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              ${[
                { id: 'Web Development', icon: 'globe' },
                { id: 'AI / Machine Learning', icon: 'brain' },
                { id: 'Data Science', icon: 'bar-chart' },
                { id: 'Cybersecurity', icon: 'shield' },
                { id: 'Cloud Computing', icon: 'cloud' },
                { id: 'Mobile Development', icon: 'smartphone' },
                { id: 'Software Development', icon: 'code' },
                { id: 'UI/UX Design', icon: 'layout' }
              ].map(item => {
                const isSelected = d.interests.includes(item.id);
                return `
                  <button type="button" onclick="toggleInterest('${item.id}')" class="p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-md' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400'}">
                    <i data-lucide="${item.icon}" class="w-6 h-6 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}"></i>
                    <span class="text-xs">${item.id}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- STEP 5: Career Goal -->
        ${step === 5 ? `
          <div class="space-y-6">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Select Target Career Track</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${[
                  'Full Stack Developer',
                  'AI Engineer',
                  'Data Scientist',
                  'Cybersecurity Engineer',
                  'Cloud Engineer',
                  'Software Developer',
                  'Data Analyst',
                  'Not Sure Yet'
                ].map(c => `
                  <button type="button" onclick="selectCareerGoal('${c}')" class="p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${d.careerGoal === c ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-md' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400'}">
                    <span class="text-sm">${c}</span>
                    ${d.careerGoal === c ? '<i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-600"></i>' : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Optional Career Notes / Aspirations</label>
              <textarea oninput="updateOnboardingField('targetDescription', this.value)" rows="3" placeholder="e.g. Seeking high-scale product engineering roles with microservices and frontend architectures." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs focus:ring-2 focus:ring-indigo-500">${d.targetDescription || ''}</textarea>
            </div>
          </div>
        ` : ''}

        <!-- Wizard Navigation Footer -->
        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          ${step > 1 ? `
            <button onclick="setOnboardingStep(${step - 1})" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
              <i data-lucide="arrow-left" class="w-4 h-4"></i> Back
            </button>
          ` : `<div></div>`}

          ${step < 5 ? `
            <button onclick="setOnboardingStep(${step + 1})" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2">
              Continue <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          ` : `
            <button onclick="submitOnboarding()" class="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 hover:opacity-95 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center gap-2">
              <i data-lucide="sparkles" class="w-5 h-5"></i> Generate My Digital Twin
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

// 4. APP SHELL (Sidebar + Header + Page Layout)
function renderAppShell(contentHtml, activeTab) {
  const s = state.student || {};
  const isDemo = state.isDemoMode;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'twin', label: 'Digital Twin', icon: 'cpu' },
    { id: 'skill-gap', label: 'Skill Gap Analysis', icon: 'crosshair' },
    { id: 'ai-recommendations', label: 'AI Guidance', icon: 'bot' },
    { id: 'career', label: 'Career Guidance', icon: 'compass' },
    { id: 'roadmap', label: 'Learning Roadmap', icon: 'calendar' },
    { id: 'simulation', label: 'What-If Simulation', icon: 'sparkles', highlight: true },
    { id: 'progress', label: 'Progress Tracking', icon: 'trending-up' },
    { id: 'profile', label: 'Profile & Settings', icon: 'user' }
  ];

  return `
    <div class="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B1120]">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex flex-col w-64 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 transition-all">
        <!-- Logo -->
        <div class="h-20 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <div>
            <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">EduTwin</span>
            <span class="block text-[9px] font-bold text-slate-400 tracking-wider uppercase -mt-1">Student Twin AI</span>
          </div>
        </div>

        <!-- Demo Mode Indicator Pill -->
        ${isDemo ? `
          <div class="mx-4 mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <span class="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
              <i data-lucide="zap" class="w-3.5 h-3.5"></i> Demo Student Active
            </span>
            <button onclick="api.resetDemo().then(() => { showToast('Demo data reset!'); render(); })" class="text-[10px] font-bold text-amber-700 underline hover:opacity-80">Reset</button>
          </div>
        ` : ''}

        <!-- Navigation Links -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          ${navItems.map(item => {
            const isActive = activeTab === item.id;
            return `
              <button onclick="navigate('${item.id}')" class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : (item.highlight ? 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white')}">
                <i data-lucide="${item.icon}" class="w-4 h-4 ${isActive ? 'text-white' : (item.highlight ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400')}"></i>
                <span>${item.label}</span>
                ${item.highlight ? '<span class="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-extrabold uppercase">WOW</span>' : ''}
              </button>
            `;
          }).join('')}
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div class="flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
            <span>Theme</span>
            <button onclick="toggleTheme()" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <i data-lucide="${state.theme === 'dark' ? 'sun' : 'moon'}" class="w-4 h-4"></i>
            </button>
          </div>
          <button onclick="handleLogout()" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
            <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top App Bar -->
        <header class="h-20 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div class="flex items-center gap-3">
            <!-- Mobile Menu Toggle -->
            <button onclick="state.mobileMenuOpen = !state.mobileMenuOpen; render();" class="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white capitalize">
                ${navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <span class="text-xs text-slate-500">Goal: <strong class="text-indigo-600 dark:text-indigo-400">${s.careerGoal || 'Full Stack Developer'}</strong></span>
            </div>
          </div>

          <!-- User Menu & Next Action CTA -->
          <div class="flex items-center gap-4">
            <button onclick="navigate('simulation')" class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 transition-colors">
              <i data-lucide="sparkles" class="w-4 h-4 text-violet-600"></i> What-If Simulation
            </button>

            <div class="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer" onclick="navigate('profile')">
              <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                ${s.name ? s.name.split(' ').map(n => n[0]).join('') : 'ST'}
              </div>
              <div class="hidden md:block text-left">
                <span class="block text-xs font-bold text-slate-900 dark:text-white leading-tight">${s.name || 'Student'}</span>
                <span class="block text-[10px] text-slate-400 font-medium">CGPA ${s.cgpa || 8.0} • CSE</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Mobile Drawer -->
        ${state.mobileMenuOpen ? `
          <div class="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" onclick="state.mobileMenuOpen = false; render();">
            <div class="w-64 bg-white dark:bg-[#111827] h-full p-4 space-y-2 shadow-2xl flex flex-col justify-between" onclick="event.stopPropagation()">
              <div>
                <div class="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span class="font-extrabold text-lg text-indigo-600">EduTwin Menu</span>
                  <button onclick="state.mobileMenuOpen = false; render();" class="text-slate-400">✕</button>
                </div>
                ${navItems.map(item => `
                  <button onclick="navigate('${item.id}')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 ${activeTab === item.id ? 'bg-indigo-600 text-white' : ''}">
                    <i data-lucide="${item.icon}" class="w-4 h-4"></i> ${item.label}
                  </button>
                `).join('')}
              </div>
              <button onclick="handleLogout()" class="w-full py-2.5 text-xs font-bold text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl">Sign Out</button>
            </div>
          </div>
        ` : ''}

        <!-- Main Body Content -->
        <main class="flex-1 p-4 sm:p-8 overflow-y-auto">
          ${contentHtml}
        </main>
      </div>
    </div>
  `;
}

// 5. DASHBOARD VIEW
function renderDashboardView() {
  const s = state.student || {};
  const skills = s.skills || {};
  const plan = state.learningPlan || { tasks: [] };
  const completedTasks = plan.tasks.filter(t => t.status === 'completed');
  const taskProgressPct = plan.tasks.length ? Math.round((completedTasks.length / plan.tasks.length) * 100) : 0;

  // Top 3 priority skill gaps for current career
  const gapMap = {
    'JavaScript': { cur: skills['JavaScript'] || 60, req: 85, why: 'Essential for dynamic asynchronous web apps.' },
    'React': { cur: skills['React'] || 30, req: 80, why: 'Industry standard for declarative frontend UI state.' },
    'Node.js': { cur: skills['Node.js'] || 20, req: 75, why: 'Powers server-side REST APIs and microservices.' }
  };

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Welcome Banner -->
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 text-white shadow-xl shadow-indigo-500/15 relative overflow-hidden">
        <div class="relative z-10 max-w-2xl">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Digital Twin Online
          </span>
          <h1 class="text-2xl sm:text-4xl font-black tracking-tight">Welcome back, ${s.name || 'Rahul'}!</h1>
          <p class="text-sm text-indigo-100 mt-2 leading-relaxed">
            Your Digital Twin is active with a <strong class="text-white">${s.careerReadiness || 65}% Career Readiness score</strong> toward your <strong class="text-white">${s.careerGoal || 'Full Stack Developer'}</strong> goal.
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <button onclick="navigate('simulation')" class="px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 shadow-md transition-all flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-violet-600"></i> Explore What-If Simulation
            </button>
            <button onclick="navigate('roadmap')" class="px-5 py-2.5 rounded-xl bg-indigo-900/60 text-white text-xs font-bold hover:bg-indigo-900/80 border border-white/20 transition-all flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4"></i> View 30-Day Plan (${completedTasks.length}/${plan.tasks.length} Done)
            </button>
          </div>
        </div>
      </div>

      <!-- 4 Summary Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Metric 1: CGPA -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-bold uppercase tracking-wider">Academic CGPA</span>
            <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <i data-lucide="graduation-cap" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-900 dark:text-white">${s.cgpa || 8.2}</span>
            <span class="text-xs font-bold text-slate-400">/ 10.0</span>
          </div>
          <div class="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ${s.attendance || 88}% Attendance recorded
          </div>
        </div>

        <!-- Metric 2: Overall Skill Score -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-bold uppercase tracking-wider">Skill Index</span>
            <div class="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
              <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-900 dark:text-white">${s.overallSkillScore || 60}</span>
            <span class="text-xs font-bold text-slate-400">/ 100</span>
          </div>
          <div class="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
            <i data-lucide="layers" class="w-3.5 h-3.5"></i> Across 10 active skill ratings
          </div>
        </div>

        <!-- Metric 3: Career Readiness -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-bold uppercase tracking-wider">Career Readiness</span>
            <div class="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <i data-lucide="target" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-teal-600 dark:text-teal-400">${s.careerReadiness || 65}%</span>
          </div>
          <div class="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            Benchmark: <strong class="text-slate-800 dark:text-slate-200">${s.careerGoal || 'Full Stack'}</strong>
          </div>
        </div>

        <!-- Metric 4: Learning Progress -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-slate-500 mb-2">
            <span class="text-xs font-bold uppercase tracking-wider">Roadmap Progress</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <i data-lucide="check-square" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-900 dark:text-white">${taskProgressPct}%</span>
          </div>
          <div class="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-bold">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${completedTasks.length} tasks verified done
          </div>
        </div>
      </div>

      <!-- Main Visual Section: Charts & Priority Skill Gaps -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Visualizations Column (2 cols) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Skill Distribution Chart -->
          <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Technical Skill Distribution</h3>
                <p class="text-xs text-slate-500">Current competence scores across evaluated technologies (0-100)</p>
              </div>
              <button onclick="navigate('skill-gap')" class="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                Full Gap View <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <div class="space-y-3.5">
              ${Object.entries(skills).slice(0, 7).map(([sk, val]) => {
                let barColor = val >= 75 ? 'bg-emerald-500' : (val >= 50 ? 'bg-indigo-500' : 'bg-rose-500');
                return `
                  <div>
                    <div class="flex justify-between items-center text-xs font-bold mb-1">
                      <span class="text-slate-800 dark:text-slate-200">${sk}</span>
                      <span class="font-mono text-slate-500">${val} / 100</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${val}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Weekly Learning Activity Chart -->
          <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Weekly Learning Activity</h3>
                <p class="text-xs text-slate-500">Logged study & practice hours across current week</p>
              </div>
              <span class="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">18.5 Total Hours</span>
            </div>

            <!-- CSS Bar Chart for Weekly Activity -->
            <div class="grid grid-cols-7 gap-3 pt-4 text-center items-end h-40">
              ${[
                { day: 'Mon', hrs: 2.5 },
                { day: 'Tue', hrs: 3.5 },
                { day: 'Wed', hrs: 1.5 },
                { day: 'Thu', hrs: 4.0 },
                { day: 'Fri', hrs: 3.0 },
                { day: 'Sat', hrs: 2.0 },
                { day: 'Sun', hrs: 2.0 }
              ].map(item => `
                <div class="flex flex-col items-center h-full justify-end group">
                  <div class="text-[10px] font-bold text-slate-400 mb-1 group-hover:text-indigo-600">${item.hrs}h</div>
                  <div class="w-full bg-indigo-500/20 group-hover:bg-indigo-600 rounded-t-lg transition-all" style="height: ${(item.hrs / 4.0) * 100}px"></div>
                  <span class="text-[11px] font-bold text-slate-500 mt-2">${item.day}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Priority Gaps & AI Recommendation (1 col) -->
        <div class="space-y-8">
          <!-- Priority Skill Gaps Card -->
          <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Priority Skill Gaps</h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 uppercase">Action Needed</span>
            </div>
            <p class="text-xs text-slate-500 mb-5">Top 3 deficits holding back your ${s.careerGoal || 'Full Stack'} readiness:</p>

            <div class="space-y-4">
              ${Object.entries(gapMap).map(([sk, g]) => {
                const diff = g.req - g.cur;
                return `
                  <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-xs font-bold text-slate-900 dark:text-white">${sk}</span>
                      <span class="text-xs font-bold text-rose-500 font-mono">Gap: -${diff} pts</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                      <div class="bg-rose-500 h-full rounded-full" style="width: ${(g.cur / g.req) * 100}%"></div>
                    </div>
                    <p class="text-[11px] text-slate-500">${g.why}</p>
                  </div>
                `;
              }).join('')}
            </div>

            <button onclick="navigate('skill-gap')" class="mt-6 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
              Analyze All Gaps <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- AI Recommendation Card -->
          <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <i data-lucide="bot" class="w-4 h-4"></i> EduTwin AI Recommendation
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">Accelerate Frontend-to-Backend Bridging</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              "Your HTML and CSS fundamentals are strong. Improving JavaScript, React, Node.js, and SQL will help you progress directly toward your Full Stack Developer goal (+24% simulated jump)."
            </p>
            <button onclick="navigate('roadmap')" class="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
              View Personalized Plan <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 6. DIGITAL TWIN SIGNATURE PAGE
function renderDigitalTwinView() {
  const s = state.student || {};
  const skills = s.skills || {};

  // 6 Axis Radar points computation
  const radarAxes = [
    { label: 'Programming', val: skills['Python'] || 80 },
    { label: 'Web Dev', val: Math.round(((skills['HTML'] || 90) + (skills['CSS'] || 85) + (skills['JavaScript'] || 60)) / 3) },
    { label: 'Database', val: skills['SQL'] || 55 },
    { label: 'Problem Solving', val: s.subjectMarks?.['Data Structures'] || 82 },
    { label: 'Communication', val: 78 },
    { label: 'AI/ML', val: 50 }
  ];

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Signature Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Signature Student Representation</span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Your Dynamic Digital Twin</h1>
          <p class="text-xs text-slate-500">Live computational model evolving with every course, assessment, and practice session.</p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="navigate('simulation')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2">
            <i data-lucide="sparkles" class="w-4 h-4"></i> Run What-If Simulation
          </button>
        </div>
      </div>

      <!-- Identity & Academic Health Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Identity Card -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            RK
          </div>
          <div>
            <h3 class="text-lg font-black text-slate-900 dark:text-white">${s.name || 'Rahul Kumar'}</h3>
            <p class="text-xs text-slate-500">${s.degree || 'B.Tech'} in ${s.branch || 'CSE'} • ${s.academicYear || '3rd Year'}</p>
            <p class="text-xs font-bold text-indigo-600 mt-1">${s.college || 'National Institute of Technology'}</p>
          </div>
        </div>

        <!-- Academic Health Gauge -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Health</span>
            <div class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${s.academicHealth || 84}/100</div>
            <p class="text-[11px] text-slate-400 mt-1">CGPA ${s.cgpa || 8.2} • ${s.attendance || 88}% Attendance</p>
          </div>
          <div class="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-600">
            Solid
          </div>
        </div>

        <!-- Career Readiness Gauge -->
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Career Readiness</span>
            <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">${s.careerReadiness || 65}%</div>
            <p class="text-[11px] text-slate-400 mt-1">Goal: ${s.careerGoal || 'Full Stack'}</p>
          </div>
          <div class="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center font-bold text-xs text-indigo-600">
            65%
          </div>
        </div>
      </div>

      <!-- Centerpiece: Neural Visual Twin + Radar Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Interactive Neural Twin Avatar Visualization -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div class="w-full flex justify-between items-center mb-4">
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">Dynamic Skill Silhouette</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Synchronized</span>
          </div>

          <!-- Dynamic SVG Network Silhouette -->
          <div class="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-4">
            <!-- Pulsing outer orbit -->
            <div class="absolute inset-0 rounded-full border border-indigo-500/20 animate-subtle-pulse"></div>
            <div class="absolute inset-8 rounded-full border border-dashed border-violet-500/30 animate-spin" style="animation-duration: 40s"></div>

            <!-- SVG Silhouette with interconnected skill nodes -->
            <svg class="w-64 h-64 text-indigo-600" viewBox="0 0 200 200" fill="none">
              <!-- Background mesh lines -->
              <line x1="100" y1="30" x2="40" y2="80" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="3 3"/>
              <line x1="100" y1="30" x2="160" y2="80" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="3 3"/>
              <line x1="40" y1="80" x2="60" y2="160" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"/>
              <line x1="160" y1="80" x2="140" y2="160" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"/>
              <line x1="60" y1="160" x2="140" y2="160" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"/>
              <line x1="100" y1="100" x2="100" y2="30" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>
              <line x1="100" y1="100" x2="40" y2="80" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>
              <line x1="100" y1="100" x2="160" y2="80" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>
              <line x1="100" y1="100" x2="60" y2="160" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>
              <line x1="100" y1="100" x2="140" y2="160" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>

              <!-- Central core -->
              <circle cx="100" cy="100" r="16" fill="url(#coreGradient)" class="animate-pulse"/>
              
              <!-- Skill Nodes -->
              <!-- Python (Top) -->
              <circle cx="100" cy="30" r="10" fill="#10B981" class="cursor-pointer hover:r-12 transition-all"/>
              <text x="100" y="20" fill="currentColor" font-size="8" font-weight="bold" text-anchor="middle">Python 80</text>

              <!-- HTML/CSS (Left) -->
              <circle cx="40" cy="80" r="11" fill="#10B981" class="cursor-pointer"/>
              <text x="30" y="98" fill="currentColor" font-size="8" font-weight="bold" text-anchor="middle">HTML 90</text>

              <!-- JS (Right) -->
              <circle cx="160" cy="80" r="9" fill="#F59E0B" class="cursor-pointer"/>
              <text x="170" y="98" fill="currentColor" font-size="8" font-weight="bold" text-anchor="middle">JS 60</text>

              <!-- React (Bottom Left) -->
              <circle cx="60" cy="160" r="7" fill="#EF4444" class="cursor-pointer"/>
              <text x="50" y="176" fill="currentColor" font-size="8" font-weight="bold" text-anchor="middle">React 30</text>

              <!-- Node.js (Bottom Right) -->
              <circle cx="140" cy="160" r="6" fill="#EF4444" class="cursor-pointer"/>
              <text x="150" y="176" fill="currentColor" font-size="8" font-weight="bold" text-anchor="middle">Node 20</text>

              <defs>
                <linearGradient id="coreGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#4F46E5"/>
                  <stop offset="100%" stop-color="#7C3AED"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div class="flex items-center justify-center gap-6 text-[11px] font-bold text-slate-500 mt-2">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Strong (>=75)</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Intermediate (50-74)</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Development Area (&lt;50)</span>
          </div>
        </div>

        <!-- 6-Axis Skill Radar Visualization -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white">6-Axis Competency Radar</h3>
              <span class="text-xs text-slate-400">Target Benchmark: 80%</span>
            </div>
            <p class="text-xs text-slate-500 mb-6">Holistic profile distribution covering fundamental computer science disciplines.</p>

            <!-- SVG Radar Web -->
            <div class="flex items-center justify-center py-4">
              <svg class="w-64 h-64" viewBox="0 0 200 200">
                <!-- Outer polygon (100%) -->
                <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="1"/>
                <!-- Mid polygon (50%) -->
                <polygon points="100,60 135,80 135,120 100,140 65,120 65,80" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-width="1"/>

                <!-- Actual Student Data Polygon -->
                <polygon points="100,36 155,70 145,125 100,150 50,122 45,72" fill="#4F46E5" fill-opacity="0.3" stroke="#4F46E5" stroke-width="2.5"/>

                <!-- Data Points & Labels -->
                <circle cx="100" cy="36" r="4" fill="#4F46E5"/>
                <text x="100" y="14" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">Programming (80)</text>

                <circle cx="155" cy="70" r="4" fill="#4F46E5"/>
                <text x="180" y="66" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">Web (78)</text>

                <circle cx="145" cy="125" r="4" fill="#4F46E5"/>
                <text x="175" y="142" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">Database (55)</text>

                <circle cx="100" cy="150" r="4" fill="#4F46E5"/>
                <text x="100" y="194" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">Problem Solving (82)</text>

                <circle cx="50" cy="122" r="4" fill="#4F46E5"/>
                <text x="15" y="142" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">Communication (78)</text>

                <circle cx="45" cy="72" r="4" fill="#4F46E5"/>
                <text x="20" y="66" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">AI/ML (50)</text>
              </svg>
            </div>
          </div>

          <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300">
            <strong>Key Insight:</strong> High computational aptitude in Programming and Problem Solving. Primary acceleration priority is expanding Database & Web integration.
          </div>
        </div>
      </div>

      <!-- Strengths vs Development Areas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Strengths -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-4">
            <i data-lucide="check-circle-2" class="w-4 h-4"></i> Identified Core Strengths
          </div>
          <div class="space-y-3">
            <div class="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
              <div class="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>HTML & Semantic Web</span>
                <span class="text-emerald-600 font-mono">90 / 100</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Excellent grasp of structure, accessibility, and modern responsive DOM markup.</p>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
              <div class="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>CSS & Modern Layouts</span>
                <span class="text-emerald-600 font-mono">85 / 100</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Strong styling capability with Flexbox, CSS Grid, and responsive design systems.</p>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
              <div class="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>Python Programming</span>
                <span class="text-emerald-600 font-mono">80 / 100</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Solid foundations in scripting, algorithms, and computational logic.</p>
            </div>
          </div>
        </div>

        <!-- Development Areas -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-4">
            <i data-lucide="alert-circle" class="w-4 h-4"></i> Areas Needing Development
          </div>
          <div class="space-y-3">
            <div class="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
              <div class="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>Node.js & Server APIs</span>
                <span class="text-rose-600 font-mono">20 / 100 (Target: 75)</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Need to practice Express routing, JWT authorization, and middleware architecture.</p>
            </div>

            <div class="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
              <div class="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>React State & Hooks</span>
                <span class="text-rose-600 font-mono">30 / 100 (Target: 80)</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Build components using custom hooks, Context API, and state lifecycles.</p>
            </div>

            <div class="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <div class="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>Git Version Control</span>
                <span class="text-amber-600 font-mono">40 / 100 (Target: 70)</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Adopt multi-branch Git flows, pull requests, and automated GitHub Actions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 7. SKILL GAP ANALYSIS VIEW
function renderSkillGapView() {
  const s = state.student || {};
  const currentSkills = s.skills || {};
  const selectedCareer = state.selectedCareerForGap || s.careerGoal || 'Full Stack Developer';

  // Career benchmarks
  const benchmarkReqs = {
    'Full Stack Developer': { HTML: 85, CSS: 80, JavaScript: 85, React: 80, 'Node.js': 75, SQL: 75, Git: 70, Python: 50 },
    'AI Engineer': { Python: 90, 'Data Structures': 80, Mathematics: 85, SQL: 70, Git: 70, JavaScript: 40 },
    'Data Scientist': { Python: 85, SQL: 80, Mathematics: 85, DBMS: 75, Git: 65 },
    'Cybersecurity Engineer': { 'Computer Networks': 85, 'Operating Systems': 80, Python: 70, C: 70, Git: 65 },
    'Cloud Engineer': { 'Operating Systems': 80, 'Computer Networks': 80, Python: 75, Git: 80, SQL: 70 },
    'Software Developer': { 'Data Structures': 85, Java: 80, Python: 75, SQL: 75, Git: 75, C: 70 },
    'Data Analyst': { SQL: 85, Python: 75, Mathematics: 70, DBMS: 75, Git: 60 }
  };

  const reqs = benchmarkReqs[selectedCareer] || benchmarkReqs['Full Stack Developer'];

  const gaps = Object.entries(reqs).map(([sk, req]) => {
    const cur = currentSkills[sk] || (s.subjectMarks?.[sk]) || 0;
    const gap = Math.max(0, req - cur);
    let priority = 'Achieved';
    let pCls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    if (gap >= 35) { priority = 'High'; pCls = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'; }
    else if (gap >= 15) { priority = 'Medium'; pCls = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'; }
    else if (gap > 0) { priority = 'Low'; pCls = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'; }

    return { skill: sk, current: cur, required: req, gap, priority, pCls };
  });

  // Filter & Sort
  let filtered = gaps;
  if (state.skillGapFilter === 'critical') filtered = filtered.filter(g => g.gap >= 35);
  else if (state.skillGapFilter === 'actionable') filtered = filtered.filter(g => g.gap > 0);
  else if (state.skillGapFilter === 'achieved') filtered = filtered.filter(g => g.gap === 0);

  if (state.skillGapSort === 'gap-desc') filtered.sort((a, b) => b.gap - a.gap);
  else if (state.skillGapSort === 'gap-asc') filtered.sort((a, b) => a.gap - b.gap);
  else if (state.skillGapSort === 'skill-name') filtered.sort((a, b) => a.skill.localeCompare(b.skill));

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Mathematical Benchmark Comparison</span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Smart Skill Gap Analysis</h1>
          <p class="text-xs text-slate-500">Formula: <code class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-indigo-600">Skill Gap = max(0, Required − Current)</code></p>
        </div>

        <!-- Career Selector Dropdown -->
        <div class="flex items-center gap-3">
          <label class="text-xs font-bold text-slate-500 whitespace-nowrap">Target Career:</label>
          <select onchange="setSkillGapCareer(this.value)" class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500">
            ${Object.keys(benchmarkReqs).map(c => `
              <option value="${c}" ${c === selectedCareer ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Filters & Sorting Bar -->
      <div class="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500 mr-1">Filter:</span>
          ${[
            { id: 'all', label: 'All Skills' },
            { id: 'critical', label: 'High Priority (Gap ≥ 35)' },
            { id: 'actionable', label: 'All Unmet Gaps' },
            { id: 'achieved', label: 'Achieved Benchmarks' }
          ].map(f => `
            <button onclick="setSkillGapFilter('${f.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${state.skillGapFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}">
              ${f.label}
            </button>
          `).join('')}
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Sort:</span>
          <select onchange="setSkillGapSort(this.value)" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <option value="gap-desc" ${state.skillGapSort === 'gap-desc' ? 'selected' : ''}>Largest Gap First</option>
            <option value="gap-asc" ${state.skillGapSort === 'gap-asc' ? 'selected' : ''}>Smallest Gap First</option>
            <option value="skill-name" ${state.skillGapSort === 'skill-name' ? 'selected' : ''}>Skill Name (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Skill Gap Comparison Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${filtered.map(item => `
          <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex justify-between items-center mb-3">
              <div>
                <h4 class="text-base font-extrabold text-slate-900 dark:text-white">${item.skill}</h4>
                <span class="text-[11px] text-slate-400">Required: ${item.required} • Current: ${item.current}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${item.pCls}">${item.priority}</span>
                <span class="text-xs font-mono font-black ${item.gap > 0 ? 'text-rose-500' : 'text-emerald-500'}">
                  ${item.gap > 0 ? `-${item.gap} pts` : '✓ Met'}
                </span>
              </div>
            </div>

            <!-- Double Bar Visual (Current vs Required) -->
            <div class="space-y-2 mt-4">
              <div>
                <div class="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>Current Ability</span>
                  <span class="font-mono">${item.current}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full" style="width: ${item.current}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>Target Benchmark</span>
                  <span class="font-mono text-slate-400">${item.required}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-slate-300 dark:bg-slate-600 h-full rounded-full" style="width: ${item.required}%"></div>
                </div>
              </div>
            </div>

            ${item.gap > 0 ? `
              <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span class="text-slate-500">Estimated Effort: <strong>${Math.round(item.gap * 0.4)} Study Hours</strong></span>
                <button onclick="navigate('roadmap')" class="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  Add to Roadmap <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            ` : `
              <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <i data-lucide="check" class="w-4 h-4"></i> Fully aligns with ${selectedCareer} standard.
              </div>
            `}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 8. AI RECOMMENDATIONS VIEW
function renderAiRecommendationsView() {
  const s = state.student || {};
  const skills = s.skills || {};

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Personalized Intelligence</span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">AI Career & Learning Guidance</h1>
          <p class="text-xs text-slate-500">Deep algorithmic insights structured across your strengths, gaps, and study roadmap.</p>
        </div>
      </div>

      <!-- Top Summary Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Target Role</span>
          <h3 class="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">${s.careerGoal || 'Full Stack Developer'}</h3>
          <p class="text-xs text-slate-500 mt-1">Suitability Score: <strong class="text-slate-900 dark:text-white">${s.careerReadiness || 65}%</strong></p>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Strategy</span>
          <h3 class="text-xl font-black text-slate-900 dark:text-white mt-1">12-15 Hours / Week</h3>
          <p class="text-xs text-slate-500 mt-1">4 Focused Weekly Sprints</p>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Expected Readiness Dividend</span>
          <h3 class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">+24% Increase</h3>
          <p class="text-xs text-slate-500 mt-1">Upon 30-day plan completion</p>
        </div>
      </div>

      <!-- Actionable Advice Cards -->
      <div class="space-y-4">
        <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Actionable Next Steps</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-4">
              <i data-lucide="layers" class="w-5 h-5"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">1. Master React State & Hooks</h4>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              Your React score is currently 30/100. Build 3 mini-apps focusing on useState, useEffect, and custom hooks to close the 50-point gap.
            </p>
            <span class="inline-block mt-4 text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">High Impact (+12% Readiness)</span>
          </div>

          <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 flex items-center justify-center mb-4">
              <i data-lucide="server" class="w-5 h-5"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">2. Build REST APIs with Node.js</h4>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              Node.js sits at 20/100. Implement Express routing, JSON Web Tokens, and database queries to achieve backend maturity.
            </p>
            <span class="inline-block mt-4 text-[11px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950 px-2.5 py-1 rounded-lg">High Impact (+10% Readiness)</span>
          </div>

          <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center mb-4">
              <i data-lucide="git-branch" class="w-5 h-5"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">3. Daily GitHub Hygiene</h4>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              Level up Git from 40 to 70 by adopting standard branch workflows, pull requests, and commit hygiene on your GitHub profile.
            </p>
            <span class="inline-block mt-4 text-[11px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-lg">Medium Impact (+8% Readiness)</span>
          </div>
        </div>
      </div>

      <!-- Strategic Reasoning Card -->
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/70 to-violet-50/70 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-800 shadow-sm">
        <h4 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <i data-lucide="compass" class="w-5 h-5 text-indigo-600"></i> Career Suitability Rationale
        </h4>
        <p class="text-xs text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
          "Rahul's academic transcript shows exceptional computational aptitude in Programming (${s.subjectMarks?.Programming || 88}%) and Mathematics (${s.subjectMarks?.Mathematics || 85}%). Coupled with high frontend mastery in HTML (90%) and CSS (85%), Full Stack Development represents his highest ROI trajectory. Shifting time allocation from syntax review to end-to-end full-stack integration will quickly elevate him to top-tier campus placement eligibility."
        </p>
      </div>
    </div>
  `;
}

// 9. PERSONALIZED LEARNING ROADMAP VIEW
function renderLearningRoadmapView() {
  const plan = state.learningPlan || { tasks: [] };
  const tasks = plan.tasks || [];
  const completed = tasks.filter(t => t.status === 'completed');
  const pct = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

  // Group tasks by week
  const weeks = [1, 2, 3, 4];

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Roadmap Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Structured Curriculum</span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">30-Day Personalized Learning Roadmap</h1>
          <p class="text-xs text-slate-500">Targeting: <strong>${plan.careerGoal || 'Full Stack Developer'}</strong> • Check items off to update your Digital Twin</p>
        </div>

        <div class="flex items-center gap-4 bg-white dark:bg-[#111827] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div class="text-xs font-bold text-slate-500">Roadmap Progress</div>
            <div class="text-lg font-black text-indigo-600 dark:text-indigo-400">${pct}% Done</div>
          </div>
          <div class="w-20 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>

      <!-- Weekly Sprints Container -->
      <div class="space-y-6">
        ${weeks.map(weekNum => {
          const weekTasks = tasks.filter(t => t.week === weekNum);
          if (weekTasks.length === 0) return '';
          const weekDone = weekTasks.filter(t => t.status === 'completed').length;
          
          return `
            <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                    W${weekNum}
                  </div>
                  <div>
                    <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">
                      ${weekNum === 1 ? 'Week 1: JavaScript Modern Async Patterns' : (weekNum === 2 ? 'Week 2: React Component Architecture' : (weekNum === 3 ? 'Week 3: Node.js & Database Engineering' : 'Week 4: Full Stack Integration & Portfolio'))}
                    </h3>
                    <span class="text-[11px] text-slate-400">${weekDone}/${weekTasks.length} Milestones Completed</span>
                  </div>
                </div>

                <span class="text-xs font-bold px-2.5 py-1 rounded-full ${weekDone === weekTasks.length ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">
                  ${weekDone === weekTasks.length ? 'Completed' : 'In Progress'}
                </span>
              </div>

              <!-- Task List for this week -->
              <div class="space-y-3">
                ${weekTasks.map(t => {
                  const isDone = t.status === 'completed';
                  return `
                    <div class="p-4 rounded-2xl border transition-all flex items-start gap-4 ${isDone ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}">
                      <button onclick="toggleTaskStatus('${t.id}', '${t.status}')" class="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-600'}">
                        ${isDone ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
                      </button>

                      <div class="flex-1">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <h4 class="text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}">
                            ${t.title}
                          </h4>
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">${t.estimatedHours || 6} Hours</span>
                            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}">${t.status}</span>
                          </div>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">${t.description}</p>
                        ${t.resource ? `
                          <div class="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                            <i data-lucide="book-open" class="w-3 h-3"></i> Recommended: ${t.resource}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// 10. CAREER GUIDANCE VIEW
function renderCareerGuidanceView() {
  const s = state.student || {};

  const careers = [
    {
      title: 'Full Stack Developer',
      match: 88,
      isPrimary: true,
      desc: 'Builds end-to-end applications combining dynamic frontend UX and robust backend services.',
      strengths: ['HTML (90%)', 'CSS (85%)', 'Python (80%)'],
      gaps: ['Node.js (Gap: 55)', 'React (Gap: 50)'],
      projects: ['Real-Time Team Collaboration Kanban Board', 'E-Commerce Marketplace with Stripe']
    },
    {
      title: 'Software Developer',
      match: 82,
      isPrimary: false,
      desc: 'Focuses on core algorithms, object-oriented systems, and enterprise business logic.',
      strengths: ['Programming (88%)', 'Data Structures (82%)', 'Java (65%)'],
      gaps: ['Advanced SQL Queries', 'System Architecture'],
      projects: ['Distributed In-Memory Key-Value Store with Raft Consensus', 'Desktop Task Engine']
    },
    {
      title: 'AI Engineer',
      match: 76,
      isPrimary: false,
      desc: 'Designs machine learning pipelines, fine-tunes neural models, and builds LLM systems.',
      strengths: ['Python (80%)', 'Mathematics (85%)'],
      gaps: ['PyTorch / TensorFlow', 'Vector Databases & Embeddings'],
      projects: ['Multimodal RAG Chatbot with FAISS', 'Autonomous Image Detection Pipeline']
    },
    {
      title: 'Data Analyst',
      match: 74,
      isPrimary: false,
      desc: 'Transforms business databases into executive dashboards, KPIs, and actionable reports.',
      strengths: ['Mathematics (85%)', 'Python (80%)'],
      gaps: ['Advanced SQL JOINs', 'Tableau / PowerBI'],
      projects: ['E-Commerce Retention Cohort Dashboard', 'Customer Churn Predictor']
    }
  ];

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Pathways & Alternatives</span>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Career Guidance & Discovery</h1>
        <p class="text-xs text-slate-500">Transparent match algorithms comparing your profile against 7 technical roles.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${careers.map(c => `
          <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border ${c.isPrimary ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'} shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h3 class="text-lg font-black text-slate-900 dark:text-white">${c.title}</h3>
                  ${c.isPrimary ? '<span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">Current Target</span>' : ''}
                </div>
                <div class="text-right">
                  <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${c.match}%</span>
                  <span class="block text-[10px] uppercase font-bold text-slate-400">Match</span>
                </div>
              </div>

              <p class="text-xs text-slate-500 mt-2 leading-relaxed">${c.desc}</p>

              <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-[10px] uppercase font-bold text-emerald-600">Your Strengths</span>
                  <div class="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">${c.strengths.join(', ')}</div>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold text-rose-500">Priority Gaps</span>
                  <div class="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">${c.gaps.join(', ')}</div>
                </div>
              </div>

              <div class="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span class="text-[10px] uppercase font-bold text-slate-500">Recommended Portfolio Project</span>
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">${c.projects[0]}</p>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              ${c.isPrimary ? `
                <button onclick="navigate('roadmap')" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2">
                  View 30-Day Plan <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              ` : `
                <button onclick="api.updateStudent(state.student.id, { careerGoal: '${c.title}' }).then(res => { state.student = res.student; showToast('Target Career updated to ${c.title}!'); render(); })" class="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Switch Target to ${c.title}
                </button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 11. WHAT-IF DIGITAL TWIN SIMULATION VIEW (THE WOW FEATURE)
function renderSimulationView() {
  const s = state.student || {};
  const currentSkills = s.skills || {};
  const sim = state.simulationData;
  const currentReadiness = s.careerReadiness || 65;

  // Key skills for target career to simulate
  const skillsToSimulate = ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'];

  // Initialize sliders if empty
  skillsToSimulate.forEach(sk => {
    if (sim.sliders[sk] === undefined) {
      sim.sliders[sk] = currentSkills[sk] || 40;
    }
  });

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Title & WOW Header -->
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-800 text-white shadow-xl shadow-violet-500/15">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Hackathon Signature Feature
        </div>
        <h1 class="text-2xl sm:text-4xl font-black tracking-tight">What If I Learn This Skill?</h1>
        <p class="text-xs sm:text-sm text-indigo-100 mt-2 max-w-2xl leading-relaxed">
          Explore how improving selected skills could change your future career-readiness profile. Adjust the sliders below and click <strong>Simulate Future</strong> to project your trajectory.
        </p>
      </div>

      <!-- Side-by-Side Current Twin vs Simulated Future Twin -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Current Twin Column -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div class="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Baseline State</span>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Current Digital Twin</h3>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-slate-400">Current Readiness</span>
              <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400">${currentReadiness}%</div>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="text-xs font-bold text-slate-500 uppercase">Current Skill Competencies</h4>
            ${skillsToSimulate.map(sk => `
              <div>
                <div class="flex justify-between text-xs font-bold mb-1">
                  <span class="text-slate-800 dark:text-slate-200">${sk}</span>
                  <span class="font-mono text-slate-500">${currentSkills[sk] || 0} / 100</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full" style="width: ${currentSkills[sk] || 0}%"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 leading-relaxed">
            Baseline computed from verified assignments, academic CGPA (8.2), and self-assessment scores.
          </div>
        </div>

        <!-- Simulated Future Twin Column -->
        <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border-2 border-violet-500/40 shadow-xl shadow-violet-500/5 space-y-6">
          <div class="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-violet-600">Hypothetical Growth</span>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Simulated Future Twin</h3>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-slate-400">Simulated Readiness</span>
              <div class="text-3xl font-black text-violet-600 dark:text-violet-400">
                ${sim.result ? `${sim.result.simulatedReadiness}%` : '--%'}
              </div>
            </div>
          </div>

          <!-- Sliders -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold text-slate-500 uppercase">Boost Proposed Skills</h4>
            ${skillsToSimulate.map(sk => {
              const currentVal = currentSkills[sk] || 0;
              const simVal = sim.sliders[sk] || currentVal;
              return `
                <div class="p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">${sk}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] text-slate-400">${currentVal} →</span>
                      <span id="sim-val-${sk}" class="text-xs font-black font-mono text-violet-600 dark:text-violet-400">${simVal}</span>
                    </div>
                  </div>
                  <input type="range" min="${currentVal}" max="100" value="${simVal}" oninput="updateSimulationSlider('${sk}', this.value)" class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-violet-600">
                </div>
              `;
            }).join('')}
          </div>

          <!-- Actions -->
          <div class="pt-2 flex items-center gap-3">
            <button onclick="runSimulationAction()" class="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all">
              <i data-lucide="sparkles" class="w-4 h-4"></i> ${sim.isSimulating ? 'Simulating...' : 'Simulate Future'}
            </button>
            <button onclick="resetSimulationAction()" class="px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Simulation Result Showcase -->
      ${sim.result ? `
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-indigo-500/10 to-violet-500/10 border border-violet-300 dark:border-violet-800 shadow-xl space-y-6 animate-fadeIn">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Simulation Projections</span>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-1">Readiness Increased by +${sim.result.delta} Percentage Points!</h3>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">${sim.result.summary}</p>
            </div>
            <div class="flex items-center gap-4 bg-white dark:bg-[#111827] px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="text-center">
                <span class="text-[10px] uppercase font-bold text-slate-400">Before</span>
                <div class="text-xl font-black text-slate-700 dark:text-slate-300">${sim.result.currentReadiness}%</div>
              </div>
              <i data-lucide="arrow-right" class="w-5 h-5 text-violet-500"></i>
              <div class="text-center">
                <span class="text-[10px] uppercase font-bold text-emerald-600">After</span>
                <div class="text-2xl font-black text-emerald-600">${sim.result.simulatedReadiness}%</div>
              </div>
            </div>
          </div>

          <!-- Skill Contributions Ranking -->
          <div class="pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <h4 class="text-xs font-bold uppercase text-slate-500 mb-3">Which improvements gave the highest dividend?</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              ${(sim.result.contributions || []).map(c => `
                <div class="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div class="flex justify-between items-center text-xs font-bold">
                    <span>${c.skill}</span>
                    <span class="text-emerald-600 font-mono">+${c.readinessContribution}%</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-1">Grew from ${c.oldVal} to ${c.newVal} (+${c.skillDiff} pts)</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span class="text-xs text-slate-700 dark:text-slate-300">
              <strong>Next Action:</strong> ${sim.result.recommendedNextStep}
            </span>
            <button onclick="navigate('roadmap')" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors">
              Apply to 30-Day Plan
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// 12. PROGRESS TRACKING VIEW
function renderProgressTrackingView() {
  const s = state.student || {};
  const history = [
    { skill: 'JavaScript', prev: 40, cur: 60, date: '2026-09-15', src: 'Assignment 2' },
    { skill: 'HTML', prev: 75, cur: 90, date: '2026-09-20', src: 'Web Lab Exam' },
    { skill: 'CSS', prev: 70, cur: 85, date: '2026-09-22', src: 'Sprint 1' },
    { skill: 'SQL', prev: 35, cur: 55, date: '2026-10-01', src: 'DBMS Midterm' },
    { skill: 'React', prev: 15, cur: 30, date: '2026-10-06', src: 'Lab Module' }
  ];

  return `
    <div class="max-w-7xl mx-auto space-y-8">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Verifiable History</span>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Recorded Progress & Skill Growth</h1>
        <p class="text-xs text-slate-500">Every score update is logged with dates and assessment verification sources.</p>
      </div>

      <!-- Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Skills Improved</span>
          <div class="text-3xl font-black text-emerald-600 mt-1">5</div>
          <p class="text-xs text-slate-400 mt-1">Measured growth logged</p>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Tasks Completed</span>
          <div class="text-3xl font-black text-indigo-600 mt-1">3 / 8</div>
          <p class="text-xs text-slate-400 mt-1">From 30-day curriculum</p>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Logged Hours</span>
          <div class="text-3xl font-black text-violet-600 mt-1">19.0 hrs</div>
          <p class="text-xs text-slate-400 mt-1">Productive study time</p>
        </div>
        <div class="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Career Readiness</span>
          <div class="text-3xl font-black text-teal-600 mt-1">65%</div>
          <p class="text-xs text-slate-400 mt-1">Current trajectory</p>
        </div>
      </div>

      <!-- Before & After Progression Table -->
      <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-4">Historical Assessment Log</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th class="py-3 px-4">Skill</th>
                <th class="py-3 px-4">Previous</th>
                <th class="py-3 px-4">Current</th>
                <th class="py-3 px-4">Growth</th>
                <th class="py-3 px-4">Assessment Source</th>
                <th class="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${history.map(h => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white">${h.skill}</td>
                  <td class="py-3.5 px-4 font-mono text-slate-400">${h.prev}</td>
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">${h.cur}</td>
                  <td class="py-3.5 px-4 font-mono font-bold text-emerald-600">+${h.cur - h.prev} pts</td>
                  <td class="py-3.5 px-4 text-slate-500">${h.src}</td>
                  <td class="py-3.5 px-4 text-slate-400">${h.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 13. PROFILE & SETTINGS VIEW
function renderProfileSettingsView() {
  const s = state.student || {};

  return `
    <div class="max-w-4xl mx-auto space-y-8">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Account & Preferences</span>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Profile & Settings</h1>
        <p class="text-xs text-slate-500">Manage your student profile, security, and appearance settings.</p>
      </div>

      <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 class="text-base font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Personal & Academic Details</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Student Name</label>
            <input type="text" value="${s.name || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold" readonly>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">College</label>
            <input type="text" value="${s.college || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold" readonly>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Degree & Branch</label>
            <input type="text" value="${s.degree || ''} in ${s.branch || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold" readonly>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Target Career Goal</label>
            <input type="text" value="${s.careerGoal || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-indigo-600" readonly>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Appearance Mode</span>
            <p class="text-[11px] text-slate-400">Toggle dark mode and light mode</p>
          </div>
          <button onclick="toggleTheme()" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
            Current: ${state.theme === 'dark' ? 'Dark 🌙' : 'Light ☀️'}
          </button>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Demo Data Management</span>
            <p class="text-[11px] text-slate-400">Restore demo student Rahul Kumar to pristine initial values</p>
          </div>
          <button onclick="api.resetDemo().then(() => { showToast('Demo data restored!'); render(); })" class="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20">
            Reset Demo Student
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// MASTER RENDER DISPATCHER
// ==========================================
export function render() {
  const app = document.getElementById('app');
  if (!app) return;

  let viewHtml = '';

  switch (state.currentRoute) {
    case 'landing':
      viewHtml = renderLandingPage();
      break;
    case 'onboarding':
      viewHtml = renderOnboardingWizard();
      break;
    case 'dashboard':
      viewHtml = renderAppShell(renderDashboardView(), 'dashboard');
      break;
    case 'twin':
      viewHtml = renderAppShell(renderDigitalTwinView(), 'twin');
      break;
    case 'skill-gap':
      viewHtml = renderAppShell(renderSkillGapView(), 'skill-gap');
      break;
    case 'ai-recommendations':
      viewHtml = renderAppShell(renderAiRecommendationsView(), 'ai-recommendations');
      break;
    case 'career':
      viewHtml = renderAppShell(renderCareerGuidanceView(), 'career');
      break;
    case 'roadmap':
      viewHtml = renderAppShell(renderLearningRoadmapView(), 'roadmap');
      break;
    case 'simulation':
      viewHtml = renderAppShell(renderSimulationView(), 'simulation');
      break;
    case 'progress':
      viewHtml = renderAppShell(renderProgressTrackingView(), 'progress');
      break;
    case 'profile':
      viewHtml = renderAppShell(renderProfileSettingsView(), 'profile');
      break;
    default:
      viewHtml = renderLandingPage();
  }

  // Inject view html and append Auth modal if active
  app.innerHTML = viewHtml + renderAuthModal();

  // Re-initialize Lucide Icons across rendered DOM
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Auto-check session on initial launch
async function init() {
  if (state.token) {
    try {
      const res = await api.getMe();
      state.user = res.user;
      state.student = res.student;
      state.isDemoMode = res.user.isDemo || false;
      if (res.student) {
        state.currentRoute = 'dashboard';
        const planRes = await api.getLearningPlan(res.student);
        state.learningPlan = planRes;
      }
    } catch (e) {
      localStorage.removeItem('edutwin_token');
      state.token = null;
    }
  }
  render();
}

init();

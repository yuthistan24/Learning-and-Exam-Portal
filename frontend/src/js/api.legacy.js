/**
 * Global API Client v2 — used by all plain HTML pages.
 * Includes: authentication, exam/question/answer/result management,
 *           AI evaluation endpoints, OCR, toast notifications, and theme system.
 */

const API_URL =
  (window.location.port === '' || window.location.port === '80') &&
  !window.location.pathname.includes('Global')
    ? '/api'
    : 'http://localhost:5000/api';

// ═══════════════════════════════════════════════════════════════
// Toast Notification System
// ═══════════════════════════════════════════════════════════════
const Toast = (() => {
  let container;

  function ensure() {
    if (container) return;
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }

  function show(message, type = 'info', duration = 4000) {
    ensure();
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle',
                    warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}" style="color:var(--${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'});flex-shrink:0"></i>
      <span style="flex:1">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:0.875rem;padding:0;"><i class="fas fa-times"></i></button>
    `;
    container.prepend(toast);
    if (duration > 0) setTimeout(() => toast.remove(), duration);
    return toast;
  }

  return {
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error',   d),
    warning: (m, d) => show(m, 'warning', d),
    info:    (m, d) => show(m, 'info',    d),
  };
})();

// ═══════════════════════════════════════════════════════════════
// API Client
// ═══════════════════════════════════════════════════════════════
class APIClient {
  constructor() {
    this.token = localStorage.getItem('token');
    this.initTheme();
  }

  // ── Theme ─────────────────────────────────────────────────────
  initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    this._updateThemeIcon(theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next    = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    this._updateThemeIcon(next);
  }

  _updateThemeIcon(theme) {
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
      icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    });
  }

  // ── Core request ──────────────────────────────────────────────
  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    };
    if (data) options.body = JSON.stringify(data);

    let response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, options);
    } catch (networkErr) {
      throw new Error('Cannot reach server. Please check that all services are running.');
    }

    let result;
    try { result = await response.json(); }
    catch (_) { throw new Error(`Server error (${response.status}): Response was not valid JSON.`); }

    if (!response.ok)
      throw new Error(result.error?.message || result.message || `Error ${response.status}`);

    return result;
  }

  // ── Auth ──────────────────────────────────────────────────────
  async login(email, password) {
    const result = await this.request('POST', '/auth/login', { email, password });
    if (result.token) {
      this.token = result.token;
      localStorage.setItem('token', result.token);
    }
    return result;
  }

  async register(email, password, name, role) {
    const result = await this.request('POST', '/auth/register', { email, password, name, role });
    if (result.token) {
      this.token = result.token;
      localStorage.setItem('token', result.token);
    }
    return result;
  }

  async getCurrentUser() { return this.request('GET', '/auth/me'); }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }

  // ── Exams ─────────────────────────────────────────────────────
  async getExams()                        { return this.request('GET', '/exams'); }
  async getExamById(id)                   { return this.request('GET', `/exams/${id}`); }
  async createExam(data)                  { return this.request('POST', '/exams', data); }
  async updateExam(id, data)              { return this.request('PUT', `/exams/${id}`, data); }
  async publishExam(id)                   { return this.request('POST', `/exams/${id}/publish`, {}); }
  async deleteExam(id)                    { return this.request('DELETE', `/exams/${id}`); }

  // ── Questions ─────────────────────────────────────────────────
  async addQuestion(examId, qData)        { return this.request('POST', `/exams/${examId}/questions`, qData); }
  async bulkAddQuestions(examId, qs)      { return this.request('POST', `/exams/${examId}/questions/bulk-add`, { questions: qs }); }
  async getQuestions(examId)              { return this.request('GET', `/exams/${examId}/questions`); }
  async updateQuestion(qId, qData)        { return this.request('PUT', `/exams/questions/${qId}`, qData); }
  async deleteQuestion(qId)               { return this.request('DELETE', `/exams/questions/${qId}`); }

  // ── Answers ───────────────────────────────────────────────────
  async submitAnswer(examId, qId, text)   { return this.request('POST', `/answers/${examId}/${qId}`, { answerText: text }); }
  async submitExam(examId)                { return this.request('POST', `/answers/${examId}/submit`, {}); }
  async getExamAnswers(examId)            { return this.request('GET', `/answers/${examId}/my-answers`); }
  async runCode(examId, qId, code, input) { return this.request('POST', '/answers/run-code', { examId, questionId: qId, code, input: input || '' }); }

  // ── Results ───────────────────────────────────────────────────
  async getResult(examId)                        { return this.request('GET', `/results/${examId}`); }
  async initializeResult(examId, payload = {})   { return this.request('POST', `/results/${examId}/initialize`, payload); }
  async initializeResultWithMeta(examId, payload){ return this.request('POST', `/results/${examId}/initialize`, payload); }
  async getExamResults(examId)                   { return this.request('GET', `/results/exam/${examId}`); }
  async getResultReport(examId, studentId = null){
    const path = studentId ? `/results/${examId}/report/${studentId}` : `/results/${examId}/report`;
    return this.request('GET', path);
  }
  async getStudentResults()                      { return this.request('GET', '/results/my-results'); }

  // ── AI Evaluation (Teacher actions) ───────────────────────────
  async reEvaluate(examId, studentId)   { return this.request('POST', `/evaluation/${examId}/re-evaluate/${studentId}`); }
  async overrideScore(examId, studentId, questionId, score, feedback) {
    return this.request('PATCH', `/evaluation/${examId}/override/${studentId}/${questionId}`, { score, feedback });
  }
  async getEvaluationStatus(examId)     { return this.request('GET', `/evaluation/${examId}/status`); }

  // ── Stats ─────────────────────────────────────────────────────
  async getStudentStats()  { return this.request('GET', '/stats/my-stats'); }
  async getGlobalStats()   { return this.request('GET', '/stats/global'); }

  // ── Courses ───────────────────────────────────────────────────
  async getCourses(semester = null) {
    return this.request('GET', `/courses${semester ? `?semester=${semester}` : ''}`);
  }
  async getCourse(id)                  { return this.request('GET', `/courses/${id}`); }
  async getCourseProgress(id)          { return this.request('GET', `/courses/${id}/progress`); }
  async updateCourseProgress(id, unitKey, completed) {
    return this.request('POST', `/courses/${id}/progress`, { unitKey, completed });
  }

  // ── PDF / OCR ─────────────────────────────────────────────────
  async uploadPDF(file) {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await fetch(`${API_URL}/pdf/upload`, {
      method: 'POST',
      headers: { ...(this.token && { Authorization: `Bearer ${this.token}` }) },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'PDF upload failed');
    return result;
  }

  async ocrImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const ocrUrl = (window.location.port === '' || window.location.port === '80')
      ? '/python/ocr/image'
      : 'http://localhost:8000/api/ocr/image';
    const response = await fetch(ocrUrl, {
      method: 'POST',
      headers: { ...(this.token && { Authorization: `Bearer ${this.token}` }) },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'OCR failed');
    return result;
  }

  async ocrStatus() {
    try {
      const ocrUrl = (window.location.port === '' || window.location.port === '80')
        ? '/python/ocr/status'
        : 'http://localhost:8000/api/ocr/status';
      const response = await fetch(ocrUrl);
      return await response.json();
    } catch { return { pytesseractAvailable: false }; }
  }

  // ── Admin ─────────────────────────────────────────────────────
  async getAdminStats()              { return this.request('GET', '/admin/stats'); }
  async getUsers()                   { return this.request('GET', '/admin/users'); }
  async createUser(data)             { return this.request('POST', '/admin/users', data); }
  async updateUserRole(id, role)     { return this.request('PUT', `/admin/users/${id}/role`, { role }); }
  async deleteUser(id)               { return this.request('DELETE', `/admin/users/${id}`); }

  // ── Chat ──────────────────────────────────────────────────────
  async sendChatMessage(message, context = null) {
    return this.request('POST', '/chat', { message, context });
  }

  // ── Helpers ───────────────────────────────────────────────────
  parsePDFText(text) { return this.request('POST', '/pdf/parse', { text }); }

  requireAuth(redirectTo = 'login.html') {
    if (!this.token) { window.location.href = redirectTo; return false; }
    return true;
  }

  requireRole(user, roles, redirectTo = 'dashboard.html') {
    if (!roles.includes(user.role)) { window.location.href = redirectTo; return false; }
    return true;
  }
}

// Helpers exposed globally
function logout() {
  localStorage.removeItem('token');
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function scoreColor(pct) {
  if (pct >= 70) return 'score-high';
  if (pct >= 40) return 'score-medium';
  return 'score-low';
}

function confidenceBadgeClass(confidence) {
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.45) return 'medium';
  return 'low';
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Expose globally
window.APIClient = APIClient;
window.Toast     = Toast;
window.logout    = logout;
window.scoreColor = scoreColor;
window.confidenceBadgeClass = confidenceBadgeClass;
window.formatDuration = formatDuration;
window.relativeTime   = relativeTime;

// Create singleton
window.api = new APIClient();

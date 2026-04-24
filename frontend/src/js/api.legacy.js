// Legacy (non-module) API client for plain HTML pages.
// Keeps the same behavior as `api.js` but avoids ESM exports.
//
// Note: Vue/Vite code should import from `frontend/src/js/api.js` instead.

// Auto-detect: if served via Nginx on port 80 with no project path, use relative /api
// Otherwise (XAMPP local dev), point directly at the backend port
const API_URL =
  (window.location.port === "" || window.location.port === "80") &&
  !window.location.pathname.includes("Global")
    ? "/api"
    : "http://localhost:5000/api";

class APIClient {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    let response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, options);
    } catch (networkErr) {
      console.error("Network error:", networkErr);
      throw new Error(
        "Cannot reach server. Please check that all services are running."
      );
    }

    let result;
    try {
      result = await response.json();
    } catch (parseErr) {
      throw new Error(
        `Server error (${response.status}): Response was not valid JSON. Check backend logs.`
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error?.message || result.message || `Error ${response.status}`
      );
    }

    return result;
  }

  // Auth endpoints
  async login(email, password) {
    const result = await this.request("POST", "/auth/login", { email, password });
    if (result.token) {
      this.token = result.token;
      localStorage.setItem("token", result.token);
    }
    return result;
  }

  async register(email, password, name, role) {
    const result = await this.request("POST", "/auth/register", {
      email,
      password,
      name,
      role,
    });
    if (result.token) {
      this.token = result.token;
      localStorage.setItem("token", result.token);
    }
    return result;
  }

  async getCurrentUser() {
    return this.request("GET", "/auth/me");
  }

  // Exam endpoints
  async getExams() {
    return this.request("GET", "/exams");
  }

  async getExamById(examId) {
    return this.request("GET", `/exams/${examId}`);
  }

  async createExam(examData) {
    return this.request("POST", "/exams", examData);
  }

  async updateExam(examId, examData) {
    return this.request("PUT", `/exams/${examId}`, examData);
  }

  async publishExam(examId) {
    return this.request("POST", `/exams/${examId}/publish`, {});
  }

  // Question endpoints (mounted under /api/exams)
  async addQuestion(examId, questionData) {
    return this.request("POST", `/exams/${examId}/questions`, questionData);
  }

  async bulkAddQuestions(examId, questions) {
    return this.request("POST", `/exams/${examId}/questions/bulk-add`, {
      questions,
    });
  }

  async getQuestions(examId) {
    return this.request("GET", `/exams/${examId}/questions`);
  }

  async updateQuestion(questionId, questionData) {
    return this.request("PUT", `/exams/questions/${questionId}`, questionData);
  }

  async deleteQuestion(questionId) {
    return this.request("DELETE", `/exams/questions/${questionId}`);
  }

  // Answer endpoints
  async submitAnswer(examId, questionId, answerText) {
    return this.request("POST", `/answers/${examId}/${questionId}`, {
      answerText,
    });
  }

  async submitExam(examId) {
    return this.request("POST", `/answers/${examId}/submit`, {});
  }

  async runCode(examId, questionId, code) {
    return this.request("POST", "/answers/run-code", {
      examId,
      questionId,
      code,
    });
  }

  async getExamAnswers(examId) {
    return this.request("GET", `/answers/${examId}/my-answers`);
  }

  // Result endpoints
  async getResult(examId) {
    return this.request("GET", `/results/${examId}`);
  }

  async initializeResult(examId) {
    return this.request("POST", `/results/${examId}/initialize`, {});
  }

  async initializeResultWithMeta(examId, payload) {
    return this.request("POST", `/results/${examId}/initialize`, payload);
  }

  async getExamResults(examId) {
    return this.request("GET", `/results/exam/${examId}`);
  }

  async getResultReport(examId, studentId = null) {
    const path = studentId
      ? `/results/${examId}/report/${studentId}`
      : `/results/${examId}/report`;
    return this.request("GET", path);
  }

  // Stats endpoints
  async getStudentStats() {
    return this.request("GET", "/stats/my-stats");
  }

  async getGlobalStats() {
    return this.request("GET", "/stats/global");
  }

  // PDF upload and parsing
  async uploadPDF(file) {
    const formData = new FormData();
    formData.append("pdf", file);

    const options = {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        // Content-Type is automatically set to multipart/form-data by browser when using FormData
      },
      body: formData,
    };

    const response = await fetch(`${API_URL}/pdf/upload`, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "PDF upload failed");
    return result;
  }

  async parsePDFText(text) {
    return this.request("POST", "/pdf/parse", { text });
  }

  logout() {
    this.token = null;
    localStorage.removeItem("token");
  }
}

// Make available globally for legacy HTML pages
window.APIClient = APIClient;
window.api = new APIClient();

// Auto-detect: if served via Nginx on port 80 with no project path, use relative /api
// Otherwise (XAMPP local dev), point directly at the backend port
const API_URL = (window.location.port === '' || window.location.port === '80') && !window.location.pathname.includes('Global')
    ? '/api'
    : 'http://localhost:5000/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        let response;
        try {
            response = await fetch(`${API_URL}${endpoint}`, options);
        } catch (networkErr) {
            // Network error — backend is unreachable
            console.error('Network error:', networkErr);
            throw new Error('Cannot reach server. Please check that all services are running.');
        }

        // Safely parse JSON — server might return HTML on 502/503
        let result;
        try {
            result = await response.json();
        } catch (parseErr) {
            throw new Error(`Server error (${response.status}): Response was not valid JSON. Check backend logs.`);
        }

        if (!response.ok) {
            throw new Error(result.error?.message || result.message || `Error ${response.status}`);
        }

        return result;
    }

    // Auth endpoints
    async login(email, password) {
        const result = await this.request('POST', '/auth/login', { email, password });
        if (result.token) {
            this.token = result.token;
            localStorage.setItem('token', result.token);
        }
        return result;
    }

    async register(email, password, name, role) {
        const result = await this.request('POST', '/auth/register', {
            email, password, name, role
        });
        if (result.token) {
            this.token = result.token;
            localStorage.setItem('token', result.token);
        }
        return result;
    }

    async getCurrentUser() {
        return this.request('GET', '/auth/me');
    }

    // Exam endpoints
    async getExams() {
        return this.request('GET', '/exams');
    }

    async getExamById(examId) {
        return this.request('GET', `/exams/${examId}`);
    }

    async createExam(examData) {
        return this.request('POST', '/exams', examData);
    }

    async publishExam(examId) {
        return this.request('POST', `/exams/${examId}/publish`, {});
    }

    // Question endpoints
    async addQuestion(examId, questionData) {
        return this.request('POST', `/exams/${examId}/questions`, questionData);
    }

    async getQuestions(examId) {
        return this.request('GET', `/exams/${examId}/questions`);
    }

    // Answer endpoints
    async submitAnswer(examId, questionId, answerText) {
        return this.request('POST', `/answers/${examId}/${questionId}`, {
            answerText
        });
    }

    async submitExam(examId) {
        return this.request('POST', `/answers/${examId}/submit`, {});
    }

    async getExamAnswers(examId) {
        return this.request('GET', `/answers/${examId}/my-answers`);
    }

    // Result endpoints
    async getResult(examId) {
        return this.request('GET', `/results/${examId}`);
    }

    async initializeResult(examId) {
        return this.request('POST', `/results/${examId}/initialize`, {});
    }

    async getExamResults(examId) {
        return this.request('GET', `/results/exam/${examId}`);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }
}

// Note: APIClient is instantiated per-page or from app.js
// Do NOT redeclare 'const api' here as it conflicts with app.js

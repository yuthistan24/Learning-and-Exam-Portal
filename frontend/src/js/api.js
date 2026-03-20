const API_URL = 'http://localhost:5000/api';

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

        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || `Error: ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }
}

const api = new APIClient();

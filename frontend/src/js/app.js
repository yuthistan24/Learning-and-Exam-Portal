let currentUser = null;
let currentExam = null;
let examStartTime = null;
let examDuration = 0;
let timerInterval = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await api.getCurrentUser();
            currentUser = response.user;
            showDashboard();
        } catch (error) {
            console.error('Failed to load user:', error);
            logout();
        }
    }
}

function toggleAuthForm() {
    const title = document.getElementById('auth-title');
    const nameInput = document.getElementById('name');
    const roleSelect = document.getElementById('role');
    
    if (title.textContent === 'Login') {
        title.textContent = 'Sign Up';
        nameInput.style.display = 'block';
        nameInput.parentElement.style.display = 'block';
        roleSelect.parentElement.style.display = 'block';
        document.querySelector('button[type="submit"]').textContent = 'Sign Up';
    } else {
        title.textContent = 'Login';
        nameInput.style.display = 'none';
        nameInput.parentElement.style.display = 'none';
        roleSelect.parentElement.style.display = 'none';
        document.querySelector('button[type="submit"]').textContent = 'Login';
    }
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const title = document.getElementById('auth-title').textContent;
    
    try {
        if (title === 'Login') {
            await api.login(email, password);
        } else {
            const name = document.getElementById('name').value;
            const role = document.getElementById('role').value;
            await api.register(email, password, name, role);
        }
        
        const response = await api.getCurrentUser();
        currentUser = response.user;
        showDashboard();
    } catch (error) {
        alert('Authentication failed: ' + error.message);
    }
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Show appropriate dashboard
    if (currentUser.role === 'student') {
        loadStudentExams();
        document.getElementById('student-dashboard').classList.remove('hidden');
    } else {
        loadTeacherExams();
        document.getElementById('teacher-dashboard').classList.remove('hidden');
    }
}

async function loadStudentExams() {
    try {
        const response = await api.getExams();
        const examsList = document.getElementById('exams-list');
        
        examsList.innerHTML = '';
        response.exams.forEach(exam => {
            const examCard = document.createElement('div');
            examCard.className = 'exam-card';
            examCard.innerHTML = `
                <h3>${exam.title}</h3>
                <p>${exam.description}</p>
                <p><strong>Duration:</strong> ${exam.duration} minutes</p>
                <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
                <p><strong>Status:</strong> ${exam.status}</p>
                <button onclick="startExam('${exam._id}')" class="btn btn-primary" ${exam.status !== 'active' ? 'disabled' : ''}>
                    Start Exam
                </button>
            `;
            examsList.appendChild(examCard);
        });
    } catch (error) {
        console.error('Failed to load exams:', error);
    }
}

async function loadTeacherExams() {
    try {
        const response = await api.getExams();
        const examsList = document.getElementById('teacher-exams-list');
        
        examsList.innerHTML = '';
        response.exams.forEach(exam => {
            const examCard = document.createElement('div');
            examCard.className = 'exam-card';
            examCard.innerHTML = `
                <h3>${exam.title}</h3>
                <p>${exam.description}</p>
                <p><strong>Status:</strong> ${exam.status}</p>
                <div class="exam-actions">
                    <button onclick="editExam('${exam._id}')" class="btn btn-secondary">Edit</button>
                    <button onclick="viewResults('${exam._id}')" class="btn btn-secondary">View Results</button>
                </div>
            `;
            examsList.appendChild(examCard);
        });
    } catch (error) {
        console.error('Failed to load exams:', error);
    }
}

async function startExam(examId) {
    try {
        const response = await api.getExamById(examId);
        currentExam = response;
        examDuration = response.duration;
        examStartTime = Date.now();
        
        // Hide dashboard, show exam
        document.getElementById('student-dashboard').classList.add('hidden');
        document.getElementById('exam-section').classList.remove('hidden');
        
        // Load exam title and questions
        document.getElementById('exam-title').textContent = response.title;
        loadQuestions(examId);
        startTimer();
    } catch (error) {
        alert('Failed to start exam: ' + error.message);
    }
}

async function loadQuestions(examId) {
    try {
        const response = await api.getQuestions(examId);
        const container = document.getElementById('questions-container');
        
        container.innerHTML = '';
        response.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <div class="question-number">Question ${index + 1} (${question.marks} marks)</div>
                <div class="question-text">${question.text}</div>
            `;
            
            // Add answer input based on question type
            if (question.type === 'mcq') {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'options';
                question.options.forEach(option => {
                    const label = document.createElement('label');
                    label.innerHTML = `
                        <input type="radio" name="q${question._id}" value="${option.text}">
                        ${option.text}
                    `;
                    optionsDiv.appendChild(label);
                });
                questionDiv.appendChild(optionsDiv);
            } else {
                const textarea = document.createElement('textarea');
                textarea.id = `q${question._id}`;
                textarea.placeholder = 'Type your answer here...';
                textarea.rows = 4;
                textarea.onchange = () => submitAnswerToServer(examId, question._id, textarea.value);
                questionDiv.appendChild(textarea);
            }
            
            container.appendChild(questionDiv);
        });
    } catch (error) {
        console.error('Failed to load questions:', error);
    }
}

async function submitAnswerToServer(examId, questionId, answerText) {
    try {
        await api.submitAnswer(examId, questionId, answerText);
    } catch (error) {
        console.error('Failed to save answer:', error);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
        const remaining = examDuration * 60 - elapsed;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            submitExam();
        } else {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            document.getElementById('exam-timer').textContent = 
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

async function submitExam() {
    if (!confirm('Are you sure you want to submit the exam?')) {
        return;
    }
    
    try {
        clearInterval(timerInterval);
        const examId = currentExam._id;
        await api.submitExam(examId);
        await api.initializeResult(examId);
        
        document.getElementById('exam-section').classList.add('hidden');
        showResults(examId);
    } catch (error) {
        alert('Failed to submit exam: ' + error.message);
    }
}

async function showResults(examId) {
    try {
        const response = await api.getResult(examId);
        
        document.getElementById('results-section').classList.remove('hidden');
        const container = document.getElementById('results-container');
        
        container.innerHTML = `
            <div class="result-summary">
                <h3>Exam: ${response.examId.title}</h3>
                <p><strong>Total Score:</strong> ${response.totalScore} / ${response.totalMarks}</p>
                <p><strong>Percentage:</strong> ${response.percentage.toFixed(2)}%</p>
                <p><strong>Status:</strong> ${response.status}</p>
            </div>
            <div class="result-details">
                ${response.answers.map((ans, idx) => `
                    <div class="result-item">
                        <h4>Question ${idx + 1}</h4>
                        <p><strong>Score:</strong> ${ans.score} / ${ans.maxScore}</p>
                        <p><strong>Feedback:</strong> ${ans.feedback}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Failed to load results:', error);
    }
}

function logout() {
    api.logout();
    currentUser = null;
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('auth-form').reset();
}

// Placeholder functions for future implementation
function showCreateExamForm() {
    alert('Create exam form - coming soon');
}

function editExam(examId) {
    alert('Edit exam feature - coming soon');
}

function viewResults(examId) {
    alert('View results feature - coming soon');
}

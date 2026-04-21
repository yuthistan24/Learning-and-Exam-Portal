const api = new APIClient();
let currentUser = null;
let currentExam = null;
let currentQuestions = [];
let examStartTime = null;
let examDuration = 0;
let timerInterval = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    // For legacy parts referencing initApp
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
    if (!window.location.pathname.includes('exam.html')) {
        window.location.href = `/exam.html?id=${examId}`;
        return;
    }
    
    try {
        const response = await api.getExamById(examId);
        currentExam = response;
        examDuration = response.duration;
        examStartTime = Date.now();
        
        // Start Proctoring
        try {
            await proctor.start();
        } catch (e) {
            console.warn("Proctoring failed to start properly:", e);
        }

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
        currentQuestions = Array.isArray(response) ? response : [];
        const container = document.getElementById('questions-container');
        
        container.innerHTML = '';
        currentQuestions.forEach((question, index) => {
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
                    const inputId = `q${question._id}_${option.text.replace(/\s+/g, '_')}`;
                    label.innerHTML = `
                        <input type="radio" id="${inputId}" name="q${question._id}" value="${option.text}">
                        ${option.text}
                    `;
                    const input = label.querySelector('input');
                    input.addEventListener('change', () => {
                        submitAnswerToServer(examId, question._id, input.value);
                    });
                    optionsDiv.appendChild(label);
                });
                questionDiv.appendChild(optionsDiv);
            } else if (question.type === 'programming') {
                const editorContainer = document.createElement('div');
                editorContainer.className = 'code-editor-container';
                const textarea = document.createElement('textarea');
                textarea.id = `q${question._id}`;
                textarea.className = 'code-textarea';
                textarea.placeholder = '# Write your python code here...\n\n';
                textarea.rows = 15;
                textarea.style.fontFamily = 'monospace';
                textarea.onchange = () => submitAnswerToServer(examId, question._id, textarea.value);
                editorContainer.appendChild(textarea);
                questionDiv.appendChild(editorContainer);
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

async function submitExam(force = false) {
    if (!force && !confirm('Are you sure you want to submit the exam?')) {
        return;
    }
    
    try {
        clearInterval(timerInterval);
        const examId = currentExam._id;
        await collectAndSaveAnswers(examId);
        await api.submitExam(examId);
        const timeTakenSeconds = Math.max(0, Math.floor((Date.now() - examStartTime) / 1000));
        const malpractice = typeof proctor?.getSummary === 'function'
            ? proctor.getSummary()
            : { violations: 0, flags: [] };
        await api.initializeResultWithMeta(examId, { timeTakenSeconds, malpractice });
        
        // Stop Proctoring
        proctor.stop();

        document.getElementById('exam-section').classList.add('hidden');
        showResults(examId);
    } catch (error) {
        alert('Failed to submit exam: ' + error.message);
    }
}

async function collectAndSaveAnswers(examId) {
    if (!currentQuestions || currentQuestions.length === 0) return;

    const saveOps = [];
    currentQuestions.forEach(question => {
        if (question.type === 'mcq') {
            const selected = document.querySelector(`input[name="q${question._id}"]:checked`);
            if (selected && selected.value) {
                saveOps.push(submitAnswerToServer(examId, question._id, selected.value));
            }
        } else {
            const textarea = document.getElementById(`q${question._id}`);
            const value = textarea ? textarea.value.trim() : '';
            if (value) {
                saveOps.push(submitAnswerToServer(examId, question._id, value));
            }
        }
    });

    if (saveOps.length > 0) {
        await Promise.all(saveOps);
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

// --- Teacher Functions ---

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showCreateExamForm() {
    document.getElementById('create-exam-modal').classList.remove('hidden');
    document.getElementById('create-exam-form').reset();
}

async function handleCreateExamSubmit(event) {
    event.preventDefault();
    const title = document.getElementById('exam-title-input').value;
    const description = document.getElementById('exam-desc-input').value;
    const duration = document.getElementById('exam-duration-input').value;

    try {
        await api.createExam({
            title,
            description,
            duration: parseInt(duration),
            rules: []
        });
        closeModal('create-exam-modal');
        loadTeacherExams(); // refresh list
    } catch (error) {
        alert('Failed to create exam: ' + error.message);
    }
}

let activeEditExamId = null;

async function editExam(examId) {
    activeEditExamId = examId;
    document.getElementById('edit-exam-modal').classList.remove('hidden');
    
    // Load existing questions
    try {
        const questions = await api.getQuestions(examId);
        const listContainer = document.getElementById('existing-questions-list');
        listContainer.innerHTML = '';
        if (questions.length === 0) {
            listContainer.innerHTML = '<p>No questions added yet.</p>';
        } else {
            questions.forEach((q, idx) => {
                listContainer.innerHTML += `<div><strong>Q${idx+1}:</strong> ${q.text} (${q.marks} marks)</div>`;
            });
        }
        
        // Check if we can publish it
        const examData = await api.getExamById(examId);
        if (examData.status === 'draft') {
            listContainer.innerHTML += `<button class="btn btn-primary" onclick="publishExam('${examId}')" style="margin-top: 10px;">Publish Exam</button>`;
        }
    } catch (error) {
        console.error(error);
    }
}

async function publishExam(examId) {
    try {
        await api.publishExam(examId);
        alert('Exam published successfully!');
        closeModal('edit-exam-modal');
        loadTeacherExams();
    } catch (error) {
        alert('Could not publish: ' + error.message);
    }
}

function toggleOptionFields() {
    const type = document.getElementById('q-type-input').value;
    const optionsContainer = document.getElementById('mcq-options-container');
    if (type === 'mcq') {
        optionsContainer.style.display = 'block';
    } else {
        optionsContainer.style.display = 'none';
    }
}

async function handleAddQuestionSubmit(event) {
    event.preventDefault();
    const type = document.getElementById('q-type-input').value;
    const text = document.getElementById('q-text-input').value;
    const marks = document.getElementById('q-marks-input').value;
    const expectedRaw = document.getElementById('q-expected-input').value;
    
    let expectedAnswers = expectedRaw.split(',').map(s => s.trim());
    let options = [];

    if (type === 'mcq') {
        const optionsRaw = document.getElementById('q-options-input').value;
        options = optionsRaw.split(',').map(s => ({ text: s.trim() }));
    }

    const newQuestion = {
        type, text, marks: parseInt(marks), expectedAnswers, options
    };

    try {
        await api.addQuestion(activeEditExamId, newQuestion);
        document.getElementById('add-question-form').reset();
        editExam(activeEditExamId); // Refresh list
    } catch (error) {
        alert('Failed to add question: ' + error.message);
    }
}

async function viewResults(examId) {
    try {
        const results = await api.getExamResults(examId);
        const modal = document.getElementById('teacher-results-modal');
        const container = document.getElementById('teacher-results-container');
        
        container.innerHTML = '';
        if (results.length === 0) {
            container.innerHTML = '<p>No results yet for this exam.</p>';
        } else {
            results.forEach(res => {
                container.innerHTML += `
                    <div style="border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 10px;">
                        <h4>Student: ${res.studentId.name} (${res.studentId.email})</h4>
                        <p>Score: ${res.totalScore} / ${res.totalMarks} (${res.percentage.toFixed(2)}%)</p>
                        <p>Status: ${res.status}</p>
                        <a class="btn btn-secondary" style="margin-top:8px;" href="/result-report.html?examId=${examId}&studentId=${res.studentId._id}">View Report</a>
                    </div>
                `;
            });
        }
        modal.classList.remove('hidden');
    } catch (error) {
        alert('Failed to load results: ' + error.message);
    }
}

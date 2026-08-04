const axios = require('axios');
const Answer = require('../models/Answer');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const canManageExam = (req, exam) => (
  req.user.role === 'admin' || exam.createdBy.toString() === req.user.userId
);

// Submit/save answer
exports.submitAnswer = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const { answerText } = req.body;
    const studentId = req.user.userId;

    if (req.user.role !== 'student') {
      throw new AppError('Only students can submit exam answers', 403);
    }

    // Validate exam and question exist
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }
    if (!question.examId || question.examId.toString() !== examId) {
      throw new AppError('Question does not belong to this exam', 400);
    }

    // Auto-enroll student on first answer if not enrolled
    if (!exam.enrolledStudents.some(id => id.toString() === studentId)) {
      exam.enrolledStudents.push(studentId);
      await exam.save();
    }

    // Check if exam is active
    if (exam.status !== 'active') {
      throw new AppError('Exam is not active', 400);
    }

    // Find existing answer
    let answer = await Answer.findOne({
      examId,
      questionId,
      studentId
    });

    if (answer && answer.isLocked) {
      throw new AppError('Exam has been submitted and answered cannot be changed', 400);
    }

    if (answer) {
      // Update existing answer
      answer.answerText = answerText;
      answer.updatedAt = new Date();
    } else {
      // Create new answer
      answer = new Answer({
        examId,
        questionId,
        studentId,
        answerText,
        submittedAt: new Date()
      });
    }

    await answer.save();

    logger.info(`Answer saved - Student: ${studentId}, Question: ${questionId}`);

    res.json({
      message: 'Answer saved successfully',
      answer: answer.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Get student's answers for exam
exports.getStudentAnswers = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.userId;

    const answers = await Answer.find({ examId, studentId }).sort({ submittedAt: -1 });

    res.json(answers);
  } catch (error) {
    throw error;
  }
};

// Get all answers for a question (teacher)
exports.getQuestionAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Verify teacher authorization
    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const exam = await Exam.findById(question.examId);
    if (!exam || !canManageExam(req, exam)) {
      throw new AppError('Not authorized', 403);
    }

    const answers = await Answer.find({ questionId })
      .populate('studentId', 'name email');

    res.json(answers);
  } catch (error) {
    throw error;
  }
};

// Get all answers for exam (teacher)
exports.getExamAnswers = async (req, res) => {
  try {
    const { examId } = req.params;

    // Verify teacher authorization
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (!canManageExam(req, exam)) {
      throw new AppError('Not authorized', 403);
    }

    const answers = await Answer.find({ examId })
      .populate('studentId', 'name email')
      .populate('questionId', 'text marks')
      .sort({ submittedAt: -1 });

    res.json(answers);
  } catch (error) {
    throw error;
  }
};

// Submit exam (lock all answers)
exports.submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.userId;
    const { timeTakenSeconds, malpractice } = req.body || {};

    if (req.user.role !== 'student') {
      throw new AppError('Only students can submit exams', 403);
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    // Get all student answers
    const answers = await Answer.find({ examId, studentId });

    if (answers.length === 0) {
      throw new AppError('No answers found for this exam', 404);
    }

    // Lock all answers
    await Answer.updateMany(
      { examId, studentId },
      { isLocked: true }
    );

    logger.info(`Exam submitted - Student: ${studentId}, Exam: ${examId}`);

    res.json({
      message: 'Exam submitted successfully',
      totalAnswers: answers.length,
      submittedAt: new Date(),
      timeTakenSeconds: timeTakenSeconds || null,
      malpractice: malpractice || null
    });
  } catch (error) {
    throw error;
  }
};

// Run code (student testing)
exports.runCode = async (req, res) => {
  try {
    const { code, input = '', questionId } = req.body;
    
    if (!code) {
      throw new AppError('Code is required', 400);
    }
    if (code.length > 20000) {
      throw new AppError('Code is too large to execute safely', 400);
    }

    let rubric = { method: 'programming' };
    
    // If questionId is provided, get the rubric (test cases)
    if (questionId) {
      const question = await Question.findById(questionId);
      if (question && (question.rubric || question.test_cases)) {
        rubric = question.rubric || { test_cases: question.test_cases };
      }
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    // Convert test_cases to testCases for FastAPI schema
    const rawTestCases = rubric.test_cases || rubric.testCases || [{ input, expected_output: '', weight: 1 }];
    const testCases = rawTestCases.map(tc => ({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || tc.expected_output || '',
      weight: tc.weight || 1
    }));

    const response = await axios.post(`${pythonServiceUrl}/api/evaluate`, {
      answer: code,
      question: questionId ? (await Question.findById(questionId))?.text || '' : '',
      question_type: 'programming',
      rubric: {
        ...rubric,
        method: 'programming',
        testCases: testCases
      }
    }, {
      timeout: parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 30000
    });

    res.json(response.data);
  } catch (error) {
    logger.error(`Code execution error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      message: 'Failed to execute code',
      error: error.response?.data || error.message
    });
  }
};

// Evaluate practice answer (short/long text)
exports.evaluatePractice = async (req, res) => {
  try {
    const { answerText, questionId } = req.body;
    
    if (!answerText) {
      throw new AppError('Answer text is required', 400);
    }

    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${pythonServiceUrl}/api/evaluate`, {
      answer: answerText,
      question: question.text || '',
      question_type: question.type || 'short_answer',
      rubric: question.rubric || {}
    }, {
      timeout: parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 30000
    });

    res.json(response.data);
  } catch (error) {
    logger.error(`Evaluation error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      message: 'Failed to evaluate answer',
      error: error.response?.data || error.message
    });
  }
};

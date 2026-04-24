const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const { authenticateToken } = require('../middleware/auth');

// Submit exam (lock answers) - MUST BE BEFORE /:examId/:questionId to avoid "submit" being treated as questionId
router.post('/:examId/submit', authenticateToken, answerController.submitExam);

// Save/submit answer (student)
router.post('/:examId/:questionId', authenticateToken, answerController.submitAnswer);

// Get student's answers for exam
router.get('/:examId/my-answers', authenticateToken, answerController.getStudentAnswers);

// Get all answers for a question (teacher)
router.get('/question/:questionId', authenticateToken, answerController.getQuestionAnswers);

// Get all answers for exam (teacher)
router.get('/exam/:examId', authenticateToken, answerController.getExamAnswers);

// Run code (student testing)
router.post('/run-code', authenticateToken, answerController.runCode);

module.exports = router;

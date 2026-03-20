const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const { authenticateToken } = require('../middleware/auth');

// Save/submit answer (student)
router.post('/:examId/:questionId', authenticateToken, answerController.submitAnswer);

// Get student's answers for exam
router.get('/:examId/my-answers', authenticateToken, answerController.getStudentAnswers);

// Submit exam (lock answers)
router.post('/:examId/submit', authenticateToken, answerController.submitExam);

// Get all answers for a question (teacher)
router.get('/question/:questionId', authenticateToken, answerController.getQuestionAnswers);

// Get all answers for exam (teacher)
router.get('/exam/:examId', authenticateToken, answerController.getExamAnswers);

module.exports = router;

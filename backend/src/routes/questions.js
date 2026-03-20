const express = require('express');
const router = express.Router({ mergeParams: true });
const questionController = require('../controllers/questionController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Add question to exam (teacher only)
router.post('/:examId/questions', authenticateToken, authorizeRole('teacher', 'admin'), questionController.addQuestion);

// Get all questions for exam
router.get('/:examId/questions', authenticateToken, questionController.getQuestionsByExam);

// Get question by ID
router.get('/questions/:questionId', authenticateToken, questionController.getQuestionById);

// Update question (teacher only)
router.put('/questions/:questionId', authenticateToken, authorizeRole('teacher', 'admin'), questionController.updateQuestion);

// Delete question (teacher only)
router.delete('/questions/:questionId', authenticateToken, authorizeRole('teacher', 'admin'), questionController.deleteQuestion);

// Reorder questions (teacher only)
router.post('/:examId/questions/reorder', authenticateToken, authorizeRole('teacher', 'admin'), questionController.reorderQuestions);

module.exports = router;

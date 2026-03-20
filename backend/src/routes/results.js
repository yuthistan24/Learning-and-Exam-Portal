const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get student's result for exam
router.get('/:examId', authenticateToken, resultController.getStudentResult);

// Initialize result after submission
router.post('/:examId/initialize', authenticateToken, resultController.initializeResult);

// Update result with scores
router.put('/:examId', authenticateToken, resultController.updateResultScores);

// Get all results for student
router.get('/my-results', authenticateToken, resultController.getStudentResults);

// Get all results for exam (teacher)
router.get('/exam/:examId', authenticateToken, authorizeRole('teacher', 'admin'), resultController.getExamResults);

module.exports = router;

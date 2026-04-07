const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Create exam (teacher only)
router.post('/', authenticateToken, authorizeRole('teacher', 'admin'), examController.createExam);

// Get all exams (students see active exams, teachers see all)
router.get('/', authenticateToken, examController.getAllExams);

// Get exam by ID
router.get('/:examId', authenticateToken, examController.getExamById);

// Update exam (teacher only, draft only)
router.put('/:examId', authenticateToken, authorizeRole('teacher', 'admin'), examController.updateExam);

// Publish exam (teacher only)
router.post('/:examId/publish', authenticateToken, authorizeRole('teacher', 'admin'), examController.publishExam);

// Delete exam (teacher only)
router.delete('/:examId', authenticateToken, authorizeRole('teacher', 'admin'), examController.deleteExam);

// Enroll students (teacher only)
router.post('/:examId/enroll', authenticateToken, authorizeRole('teacher', 'admin'), examController.enrollStudents);

// Get exam analytics (teacher only)
router.get('/:examId/analytics', authenticateToken, authorizeRole('teacher', 'admin'), examController.getExamAnalytics);

module.exports = router;

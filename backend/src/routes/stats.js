const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get current student's stats
router.get('/my-stats', authenticateToken, authorizeRole('student'), statsController.getStudentStats);

// Get global stats (teacher/admin)
router.get('/global', authenticateToken, authorizeRole('teacher', 'admin'), statsController.getGlobalStats);

module.exports = router;

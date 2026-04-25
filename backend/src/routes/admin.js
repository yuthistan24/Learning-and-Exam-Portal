const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Admin-only routes (require admin role)
router.get('/dashboard', authenticateToken, authorizeRole('admin'), adminController.getAdminDashboard);
router.get('/users', authenticateToken, authorizeRole('admin'), adminController.getUsers);
router.get('/users/:userId', authenticateToken, authorizeRole('admin'), adminController.getUserDetails);
router.post('/users', authenticateToken, authorizeRole('admin'), adminController.createUser);
router.put('/users/:userId', authenticateToken, authorizeRole('admin'), adminController.updateUser);
router.delete('/users/:userId', authenticateToken, authorizeRole('admin'), adminController.deleteUser);
router.post('/users/:userId/courses', authenticateToken, authorizeRole('admin'), adminController.assignCourseToUser);
router.delete('/users/:userId/courses/:courseId', authenticateToken, authorizeRole('admin'), adminController.removeCourseFromUser);

// Teacher can manage their own exams
router.get('/exams/managed', authenticateToken, authorizeRole('teacher', 'admin'), adminController.getManagedExams);
router.get('/stats', authenticateToken, authorizeRole('admin', 'teacher'), adminController.getStats);

module.exports = router;

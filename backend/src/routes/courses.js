const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticateToken } = require('../middleware/auth');

// Get all courses (syllabus)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { semester } = req.query;
    const query = semester ? { semester } : {};
    const courses = await Course.find(query).sort({ semester: 1, code: 1 });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific course
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get practice questions for a topic
const Question = require('../models/Question');
router.get('/questions/:courseId/:topic', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.params;
    const questions = await Question.find({ topic: { $regex: topic, $options: 'i' } }).limit(10);
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

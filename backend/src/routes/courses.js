const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Course = require('../models/Course');
const Question = require('../models/Question');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const topicMatches = (topic) => ({
  $or: [
    { topic: { $regex: escapeRegex(topic), $options: 'i' } },
    { text: { $regex: escapeRegex(topic), $options: 'i' } }
  ]
});

// Get all courses from the seeded syllabus.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { semester, q } = req.query;
    const query = { status: 'active' };
    if (semester) query.semester = Number(semester);
    if (q) {
      const safeQuery = escapeRegex(q);
      query.$or = [
        { code: { $regex: safeQuery, $options: 'i' } },
        { title: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } }
      ];
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'student') {
      query._id = { $in: user.enrolledCourses || [] };
    } else if (user.role === 'teacher' && user.department) {
      const deptStr = user.department.toUpperCase();
      let regexStr = null;
      if (deptStr === 'CSE') regexStr = 'CS';
      else if (deptStr === 'MATHS') regexStr = 'MA|MN';
      else if (deptStr === 'PHYSICS') regexStr = 'PH';
      else if (deptStr === 'CHEMISTRY') regexStr = 'CY';
      else if (deptStr === 'ENGLISH') regexStr = 'EG';

      if (regexStr) {
        if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [
            { $or: existingOr },
            { code: { $regex: regexStr, $options: 'i' } }
          ];
        } else {
          query.code = { $regex: regexStr, $options: 'i' };
        }
      }
    }

    const courses = await Course.find(query).sort({ semester: 1, code: 1 });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get practice questions for a course topic.
router.get('/questions/:courseId/:topic', authenticateToken, async (req, res) => {
  try {
    const { courseId, topic } = req.params;
    const { category = 'practice', difficulty } = req.query;
    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }

    const query = {
      courseId,
      category,
      ...topicMatches(topic)
    };
    
    if (difficulty) {
       query.difficulty = Number(difficulty);
    }

    let questions = await Question.find(query).limit(12);
    
    // Adaptive fallback: if no questions found at this difficulty, fetch any
    if (questions.length === 0 && difficulty) {
        delete query.difficulty;
        questions = await Question.find(query).limit(12);
    }

    const safeQuestions = questions.map(question => {
      const q = question.toObject();
      if (q.type === 'mcq') {
        q.options = (q.options || []).map(({ text }) => ({ text }));
      }
      return q;
    });

    res.json({ success: true, questions: safeQuestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get homework questions for a course unit.
router.get('/homework/:courseId/:unit', authenticateToken, async (req, res) => {
  try {
    const { courseId, unit } = req.params;
    if (!isObjectId(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }

    const questions = await Question.find({
      courseId,
      category: 'homework',
      unit: { $regex: escapeRegex(unit), $options: 'i' }
    });

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's progress for a course.
router.get('/:id/progress', authenticateToken, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const progress = user.courseProgress.find(item => item.courseId?.toString() === req.params.id);
    res.json({
      success: true,
      completedUnits: progress?.completedUnits || [],
      score: progress?.score || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark or unmark a lesson/topic as complete.
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { unitKey, completed = true } = req.body;
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }
    if (!unitKey || typeof unitKey !== 'string') {
      return res.status(400).json({ success: false, message: 'unitKey is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.enrolledCourses.some(id => (id?._id ? id._id.toString() : id?.toString()) === course._id.toString())) {
      user.enrolledCourses.push(course._id);
    }

    let progress = user.courseProgress.find(item => item.courseId?.toString() === course._id.toString());
    if (!progress) {
      user.courseProgress.push({ courseId: course._id, completedUnits: [], score: 0 });
      progress = user.courseProgress[user.courseProgress.length - 1];
    }

    const existing = new Set(progress.completedUnits || []);
    if (completed) existing.add(unitKey);
    else existing.delete(unitKey);

    progress.completedUnits = Array.from(existing);
    const lessonCount = Math.max(course.lessons?.length || course.units?.length || 1, 1);
    progress.score = Math.round((progress.completedUnits.length / lessonCount) * 100);

    await user.save();

    res.json({
      success: true,
      completedUnits: progress.completedUnits,
      score: progress.score
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Log time spent on a lesson/topic.
router.post('/:id/time', authenticateToken, async (req, res) => {
  try {
    const { unitKey, timeSpentSeconds } = req.body;
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }
    if (!unitKey) {
      return res.status(400).json({ success: false, message: 'unitKey is required' });
    }
    
    const user = await User.findById(req.user.userId);
    let progress = user.courseProgress.find(item => item.courseId?.toString() === req.params.id);
    if (!progress) {
      user.courseProgress.push({ courseId: req.params.id, completedUnits: [], score: 0, timeSpentPerUnit: {} });
      progress = user.courseProgress[user.courseProgress.length - 1];
    }
    
    if (!progress.timeSpentPerUnit) progress.timeSpentPerUnit = new Map();
    const current = progress.timeSpentPerUnit.get(unitKey) || 0;
    progress.timeSpentPerUnit.set(unitKey, current + (timeSpentSeconds || 0));
    
    await user.save();
    res.json({ success: true, timeSpentSeconds: progress.timeSpentPerUnit.get(unitKey) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific course.
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

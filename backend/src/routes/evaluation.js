const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const resultController = require('../controllers/resultController');

// Re-evaluate a student's exam result using AI
// POST /api/evaluation/:examId/re-evaluate/:studentId
router.post(
  '/:examId/re-evaluate/:studentId',
  authenticate,
  authorize('teacher', 'admin'),
  resultController.reEvaluate
);

// Override a specific question's score
// PATCH /api/evaluation/:examId/override/:studentId/:questionId
router.patch(
  '/:examId/override/:studentId/:questionId',
  authenticate,
  authorize('teacher', 'admin'),
  resultController.overrideScore
);

// Get evaluation status for all students in an exam
// GET /api/evaluation/:examId/status
router.get(
  '/:examId/status',
  authenticate,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const Result = require('../models/Result');
      const Exam   = require('../models/Exam');
      const { AppError } = require('../middleware/errorHandler');

      const exam = await Exam.findById(req.params.examId);
      if (!exam) throw new AppError('Exam not found', 404);

      const isManager = req.user.role === 'admin' ||
        exam.createdBy.toString() === req.user.userId;
      if (!isManager) throw new AppError('Not authorized', 403);

      const results = await Result.find({ examId: req.params.examId })
        .populate('studentId', 'name email')
        .select('studentId totalScore totalMarks percentage status gradedAt answers');

      const summary = results.map(r => ({
        studentId:    r.studentId?._id,
        studentName:  r.studentId?.name,
        studentEmail: r.studentId?.email,
        totalScore:   r.totalScore,
        totalMarks:   r.totalMarks,
        percentage:   r.percentage,
        status:       r.status,
        gradedAt:     r.gradedAt,
        avgConfidence: r.answers.length > 0
          ? Math.round(r.answers.reduce((s, a) => s + (a.confidence || 0), 0) / r.answers.length * 100) / 100
          : 0,
        modelsUsed: [...new Set(r.answers.map(a => a.modelUsed).filter(m => m && m !== 'none'))],
      }));

      res.json({ examId: req.params.examId, totalStudents: results.length, results: summary });
    } catch (error) { throw error; }
  }
);

module.exports = router;

const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Result = require('../models/Result');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const canManageExam = (req, exam) => (
  req.user.role === 'admin' || exam.createdBy.toString() === req.user.userId
);

const studentSafeQuestion = (question) => {
  const plain = typeof question.toObject === 'function' ? question.toObject() : question;
  if (plain.type === 'mcq') {
    plain.options = (plain.options || []).map(({ text }) => ({ text }));
  }
  delete plain.rubric;
  return plain;
};

const studentSafeExam = (exam) => {
  const plain = typeof exam.toObject === 'function' ? exam.toObject() : exam;
  plain.questionIds = (plain.questionIds || []).map(studentSafeQuestion);
  return plain;
};

// Create exam
exports.createExam = async (req, res) => {
  try {
    const { title, description, duration, totalMarks, instructions, subject } = req.body;

    if (!title || !duration || totalMarks === undefined || totalMarks === null) {
      throw new AppError('Title, duration, and totalMarks are required', 400);
    }

    const exam = new Exam({
      title,
      description,
      subject: subject || '',
      duration,
      totalMarks,
      instructions,
      createdBy: req.user.userId,
      status: 'draft',
      shuffleQuestions: false,
      showFeedback: true
    });

    await exam.save();
    logger.info(`Exam created: ${exam._id} by ${req.user.email}`);

    res.status(201).json({
      message: 'Exam created successfully',
      exam: exam.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Get all exams (paginated) - role-based filtering
exports.getAllExams = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    const role = req.user?.role || 'student';

    // Filter based on role.
    const filter = {};
    if (role === 'student') {
      filter.status = 'active';
    } else if (role === 'teacher') {
      filter.createdBy = req.user.userId;
      filter.status = { $in: ['draft', 'active', 'closed'] };
    } else if (role === 'admin') {
      filter.status = { $in: ['draft', 'active', 'closed'] };
    }
    if (status && role !== 'student') {
      filter.status = status;
    }

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Exam.countDocuments(filter);

    res.json({
      exams,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    throw error;
  }
};

// Get exam by ID with questions
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('createdBy', 'name email')
      .populate('questionIds');

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    const isManager = canManageExam(req, exam);
    if (!isManager && exam.status !== 'active') {
      throw new AppError('Exam not found', 404);
    }

    res.json(isManager ? exam.toObject() : studentSafeExam(exam));
  } catch (error) {
    throw error;
  }
};

// Update exam
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    // Only creator can update
    if (!canManageExam(req, exam)) {
      throw new AppError('Not authorized to update this exam', 403);
    }

    // Only draft exams can be updated
    if (exam.status !== 'draft') {
      throw new AppError('Only draft exams can be updated', 400);
    }

    const allowedFields = [
      'title',
      'description',
      'subject',
      'duration',
      'totalMarks',
      'instructions',
      'shuffleQuestions',
      'showFeedback',
      'startTime',
      'endTime'
    ];
    allowedFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        exam[field] = req.body[field];
      }
    });
    await exam.save();

    logger.info(`Exam updated: ${exam._id}`);

    res.json({
      message: 'Exam updated successfully',
      exam: exam.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Publish exam (change status to active)
exports.publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (!canManageExam(req, exam)) {
      throw new AppError('Not authorized', 403);
    }

    if (exam.status !== 'draft') {
      throw new AppError('Only draft exams can be published', 400);
    }

    // Check if exam has questions
    if (exam.questionIds.length === 0) {
      throw new AppError('Exam must have at least one question', 400);
    }

    exam.status = 'active';
    exam.startTime = new Date();
    await exam.save();

    logger.info(`Exam published: ${exam._id}`);

    res.json({
      message: 'Exam published successfully',
      exam: exam.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Delete exam
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (!canManageExam(req, exam)) {
      throw new AppError('Not authorized', 403);
    }

    // Delete dependent data so stale questions, answers, and results cannot leak.
    const [questions, answers, results] = await Promise.all([
      Question.deleteMany({ examId: exam._id }),
      Answer.deleteMany({ examId: exam._id }),
      Result.deleteMany({ examId: exam._id })
    ]);

    await Exam.findByIdAndDelete(req.params.examId);

    logger.info(`Exam deleted: ${exam._id}`);

    res.json({
      message: 'Exam deleted successfully',
      deleted: {
        questions: questions.deletedCount || 0,
        answers: answers.deletedCount || 0,
        results: results.deletedCount || 0
      }
    });
  } catch (error) {
    throw error;
  }
};

// Enroll students in exam
exports.enrollStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (!canManageExam(req, exam)) {
      throw new AppError('Not authorized', 403);
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new AppError('studentIds must be a non-empty array', 400);
    }

    // Add new students (avoid duplicates)
    exam.enrolledStudents = [...new Set([...exam.enrolledStudents, ...studentIds])];
    await exam.save();

    logger.info(`Students enrolled in exam ${exam._id}: ${studentIds.length}`);

    res.json({
      message: `${studentIds.length} students enrolled`,
      exam: exam.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Get exam analytics (teacher only)
exports.getExamAnalytics = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (!canManageExam(req, exam)) {
      throw new AppError('Not authorized', 403);
    }

    const results = await Result.find({ examId: exam._id });
    const totalStudents = exam.enrolledStudents.length;
    
    // Aggregates
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length
      : 0;
    const passRate = results.length > 0
      ? (results.filter(r => (r.percentage || 0) >= 40).length / results.length) * 100
      : 0;

    // Score Distribution (0-20, 21-40, 41-60, 61-80, 81-100)
    const distribution = [0, 0, 0, 0, 0];
    results.forEach(r => {
      const p = r.percentage || 0;
      if (p <= 20) distribution[0]++;
      else if (p <= 40) distribution[1]++;
      else if (p <= 60) distribution[2]++;
      else if (p <= 80) distribution[3]++;
      else distribution[4]++;
    });

    // Question-wise Performance (Optimized via Aggregation)
    const aggregatedStats = await Result.aggregate([
      { $match: { examId: exam._id } },
      { $unwind: "$answers" },
      { $group: {
          _id: "$answers.questionId",
          avgScore: { $avg: "$answers.score" }
        }
      }
    ]);
    
    const statsMap = {};
    aggregatedStats.forEach(s => { statsMap[s._id.toString()] = s.avgScore; });

    const questions = await Question.find({ examId: exam._id }).select('text marks type');
    const questionStats = questions.map(q => {
      const qAvgScore = statsMap[q._id.toString()] || 0;
      const qSuccessRate = q.marks > 0 ? (qAvgScore / q.marks) * 100 : 0;
      
      return {
        questionId: q._id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        avgScore: Number(qAvgScore.toFixed(2)),
        successRate: Number(qSuccessRate.toFixed(2))
      };
    });

    // Malpractice count
    const malpracticeCount = results.filter(r => r.malpractice?.violations > 0).length;

    res.json({
      examId: exam._id,
      title: exam.title,
      totalStudents,
      attempts: results.length,
      avgScore: Number(avgScore.toFixed(2)),
      passRate: Number(passRate.toFixed(2)),
      distribution,
      malpracticeCount,
      questionWisePerformance: questionStats
    });
  } catch (error) {
    throw error;
  }
};

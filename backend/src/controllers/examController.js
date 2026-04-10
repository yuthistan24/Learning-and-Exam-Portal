const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Create exam
exports.createExam = async (req, res) => {
  try {
    const { title, description, duration, totalMarks, instructions, subject } = req.body;

    if (!title || !duration || !totalMarks) {
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

    // Filter based on role
    const filter = { status: 'active' }; // Students only see active exams
    if (role === 'teacher' || role === 'admin') {
      filter.status = { $in: ['draft', 'active', 'closed'] };
    }
    if (status && role === 'student') {
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

    res.json(exam.toObject());
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
    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized to update this exam', 403);
    }

    // Only draft exams can be updated
    if (exam.status !== 'draft') {
      throw new AppError('Only draft exams can be updated', 400);
    }

    Object.assign(exam, req.body);
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

    if (exam.createdBy.toString() !== req.user.userId) {
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

    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    // Delete all questions related to exam
    await Question.deleteMany({ examId: exam._id });

    await Exam.findByIdAndDelete(req.params.examId);

    logger.info(`Exam deleted: ${exam._id}`);

    res.json({ message: 'Exam deleted successfully' });
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

    if (exam.createdBy.toString() !== req.user.userId) {
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

    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    // Placeholder for analytics
    res.json({
      examId: exam._id,
      title: exam.title,
      totalStudents: exam.enrolledStudents.length,
      avgScore: 0,
      passRate: 0,
      questionWisePerformance: []
    });
  } catch (error) {
    throw error;
  }
};

const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Course = require('../models/Course');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Get admin dashboard metrics
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalExams = await Exam.countDocuments();
    const totalCourses = await Course.countDocuments({ status: 'active' });
    const totalResults = await Result.countDocuments();

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const examStats = await Result.aggregate([
      {
        $group: {
          _id: '$examId',
          attempts: { $sum: 1 },
          avgScore: { $avg: '$percentage' }
        }
      }
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalExams,
      totalCourses,
      totalResults,
      usersByRole,
      examStats
    });
  } catch (error) {
    throw error;
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-passwordHash')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    throw error;
  }
};

// Get specific user details
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-passwordHash')
      .populate('enrolledCourses', 'title code');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const exams = await Exam.find({ createdBy: req.params.userId });
    const results = await Result.find({ userId: req.params.userId }).populate('examId', 'title');

    res.json({
      user,
      exams,
      results
    });
  } catch (error) {
    throw error;
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, role, department } = req.body;

    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400);
    }
    if (String(password).length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const validRoles = ['student', 'teacher', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'student';

    const newUser = new User({
      email,
      passwordHash: password,
      name,
      role: userRole,
      department
    });

    await newUser.save();
    logger.info(`Admin created user: ${email} with role: ${userRole}`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (error) {
    throw error;
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, role, department, isActive } = req.body;
    const userId = req.params.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(role && { role }),
        ...(department && { department }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    logger.info(`Admin updated user: ${user.email}`);

    res.json({
      message: 'User updated successfully',
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    throw error;
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (user._id?.toString() === req.user.userId) {
      throw new AppError('You cannot delete your own admin account', 400);
    }

    // Cascade delete: remove results and answers
    // If it's a student, remove their results. 
    // If it's a teacher, we might keep their exams but they'll be orphaned. 
    // Better to prevent deletion or reassign if there are active exams, 
    // but for this implementation we'll allow it and just clean up results.
    await Promise.all([
      Result.deleteMany({ userId: user._id }),
      Answer.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(req.params.userId)
    ]);

    logger.info(`Admin deleted user: ${user.email} and all associated data.`);

    res.json({
      message: 'User and associated data deleted successfully',
      deletedUser: user.email
    });
  } catch (error) {
    throw error;
  }
};

// Get managed exams (for teachers and admins)
exports.getManagedExams = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query.createdBy = req.user.userId;
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      exams
    });
  } catch (error) {
    throw error;
  }
};

// Assign a course to a user
exports.assignCourseToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { courseId } = req.body;

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'User already enrolled in this course' });
    }

    user.enrolledCourses.push(courseId);
    await user.save();

    logger.info(`Admin assigned course ${course.code} to user ${user.email}`);

    res.json({ message: 'Course assigned successfully', user });
  } catch (error) {
    throw error;
  }
};

// Remove a course from a user
exports.removeCourseFromUser = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    user.enrolledCourses = (user.enrolledCourses || []).filter(id => id && id.toString() !== courseId);
    await user.save();

    logger.info(`Admin removed course ${courseId} from user ${user.email}`);

    res.json({ message: 'Course removed successfully', user });
  } catch (error) {
    throw error;
  }
};

// Get statistics
exports.getStats = async (req, res) => {
  try {
    let query = {};

    // If teacher, only show their exams
    if (req.user.role === 'teacher') {
      const teacherExams = await Exam.find({ createdBy: req.user.userId }).select('_id');
      const examIds = teacherExams.map(e => e._id);
      query.examId = { $in: examIds };
    }

    const stats = {
      totalExams: await Exam.countDocuments(req.user.role === 'teacher' ? { createdBy: req.user.userId } : {}),
      totalStudents: await User.countDocuments({ role: 'student' }),
      totalResults: await Result.countDocuments(query),
      avgScore: await Result.aggregate([
        { $match: query },
        { $group: { _id: null, avg: { $avg: '$percentage' } } }
      ])
    };

    res.json(stats);
  } catch (error) {
    throw error;
  }
};

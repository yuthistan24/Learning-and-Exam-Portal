const User = require('../models/User');
const { generateToken } = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400);
    }

    if (String(password).length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Public registration is student-first. Teacher/admin accounts should be
    // provisioned by admins unless explicitly enabled for a trusted deployment.
    const requestedRole = role || 'student';
    if (requestedRole === 'admin') {
      throw new AppError('Admin accounts must be created by an existing admin', 403);
    }
    if (requestedRole === 'teacher' && process.env.ALLOW_TEACHER_SIGNUP !== 'true') {
      throw new AppError('Teacher accounts must be created by an admin', 403);
    }

    const userRole = requestedRole === 'teacher' ? 'teacher' : 'student';

    // Create new user
    const newUser = new User({
      email,
      passwordHash: password,
      name,
      role: userRole
    });

    await newUser.save();
    logger.info(`User registered: ${email} with role: ${userRole}`);

    // Generate token
    const token = generateToken(newUser._id, newUser.role, newUser.email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department || null
      }
    });
  } catch (error) {
    throw error;
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account has been disabled. Contact an administrator.', 403);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    logger.info(`User logged in: ${email} with role: ${user.role}`);

    // Generate token
    const token = generateToken(user._id, user.role, user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department || null
      }
    });
  } catch (error) {
    throw error;
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
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

// Logout (client-side only, token is not revoked on server)
exports.logout = (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  res.json({ message: 'Logged out successfully' });
};

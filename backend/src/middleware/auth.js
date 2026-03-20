const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { logger } = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Token verification failed:', err.message);
        throw new AppError('Invalid or expired token', 401);
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRole };

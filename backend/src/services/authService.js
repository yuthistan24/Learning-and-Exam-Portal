const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new AppError('JWT_SECRET must be configured in production', 500);
  }
  return secret || 'dev-only-change-this-secret-before-production';
};

const generateToken = (userId, role, email) => {
  return jwt.sign(
    { userId, role, email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
};

module.exports = {
  generateToken,
  verifyToken
};

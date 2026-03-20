const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (userId, role, email) => {
  return jwt.sign(
    { userId, role, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
};

module.exports = {
  generateToken,
  verifyToken
};

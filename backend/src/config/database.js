const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  const atlasUri  = process.env.MONGODB_URI;
  const dockerUri = 'mongodb://host.docker.internal:27017/global-exams';
  const localUri  = 'mongodb://127.0.0.1:27017/global-exams';

  const sanitize = (uri) =>
    uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : '(none)';

  // Atlas via SRV — Mongoose handles TLS automatically for mongodb+srv://
  const atlasOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  const localOptions = { serverSelectionTimeoutMS: 3000 };

  // 1. Try MongoDB Atlas (cloud)
  if (atlasUri && atlasUri.startsWith('mongodb')) {
    try {
      logger.info(`Attempting MongoDB Atlas connection...`);
      await mongoose.connect(atlasUri, atlasOptions);
      logger.info('✓ Connected to MongoDB Atlas!');
      return mongoose.connection;
    } catch (err) {
      logger.warn(`Atlas failed (${err.code || err.message.substring(0, 80)}). Trying local fallback...`);
    }
  }

  // 2. Docker host gateway (running inside Docker)
  try {
    logger.info(`Trying Docker host MongoDB at ${sanitize(dockerUri)}...`);
    await mongoose.connect(dockerUri, localOptions);
    logger.info('✓ Docker host MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    logger.warn(`Docker host MongoDB failed: ${err.message.substring(0, 60)}`);
  }

  // 3. Local fallback
  try {
    logger.info(`Trying local MongoDB at ${sanitize(localUri)}...`);
    await mongoose.connect(localUri, localOptions);
    logger.info('✓ Local MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    logger.error('All MongoDB connection attempts failed.');
    throw err;
  }
};

module.exports = connectDB;

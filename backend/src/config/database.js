const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/global-exams';
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
    });

    logger.info(`MongoDB connected: ${mongoUri}`);
    return mongoose.connection;
  } catch (error) {
    logger.warn(`Local MongoDB server not detected at ${mongoUri}. Continuing server startup without active MongoDB.`);
    return null;
  }
};

module.exports = connectDB;

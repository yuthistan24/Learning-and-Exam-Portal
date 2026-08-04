const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global-exams';
    const isCloud = mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb.net');
    const safeUriLog = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    
    await mongoose.connect(mongoUri);

    logger.info(`MongoDB connected [${isCloud ? 'CLOUD (Atlas)' : 'LOCAL'}]: ${safeUriLog}`);
    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv://')) {
      logger.error('Tip: Make sure your IP address is whitelisted in MongoDB Atlas Network Access.');
    } else {
      logger.error('Tip: Ensure your local MongoDB service is running (e.g. net start MongoDB or mongod).');
    }
    throw error;
  }
};

module.exports = connectDB;

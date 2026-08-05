const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

let mongoMemoryServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global-exams';
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });

    logger.info(`MongoDB connected to local instance: ${mongoUri}`);
    return mongoose.connection;
  } catch (error) {
    logger.warn(`Local MongoDB server not detected at ${mongoUri}. Starting in-memory MongoDB fallback...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      
      await mongoose.connect(memUri);
      logger.info(`MongoDB connected to in-memory instance: ${memUri}`);
      return mongoose.connection;
    } catch (memErr) {
      logger.error('Failed to connect to MongoDB (both local instance and in-memory server failed):', memErr);
      return null;
    }
  }
};

module.exports = connectDB;


const app = require('./src/app');
const connectDB = require('./src/config/database');
const { logger } = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Database: ${process.env.MONGODB_URI}`);
  });
}).catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

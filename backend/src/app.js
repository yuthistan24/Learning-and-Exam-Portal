const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('express-async-errors');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth');
const examRoutes = require('./src/routes/exams');
const questionRoutes = require('./src/routes/questions');
const answerRoutes = require('./src/routes/answers');
const resultRoutes = require('./src/routes/results');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { logger } = require('./src/utils/logger');

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exams', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/results', resultRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// MUST be required before routes to catch async errors
require('express-async-errors');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const resultRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');
const pdfRoutes = require('./routes/pdf');
const courseRoutes = require('./routes/courses');

// Import middleware

const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  // Accept any localhost origin (port 80, 3000, 5173, etc) + any configured origins
  origin: function(origin, callback) {
    const allowed = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [];
    // Allow requests with no origin (mobile apps, curl, Postman)
    // Allow any localhost or 127.0.0.1 origin automatically
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
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
app.use('/api/admin', adminRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/courses', courseRoutes);
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// 404 handler

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

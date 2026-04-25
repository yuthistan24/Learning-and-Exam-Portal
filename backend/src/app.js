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
const statsRoutes = require('./routes/stats');
const chatRoutes = require('./routes/chat');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Create Express app
const app = express();
app.disable('x-powered-by');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  next();
});
app.use((req, res, next) => {
  const hasUnsafeKeys = (value) => {
    if (!value || typeof value !== 'object') return false;
    return Object.keys(value).some(key =>
      key.startsWith('$') ||
      key.includes('.') ||
      hasUnsafeKeys(value[key])
    );
  };

  if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query)) {
    return res.status(400).json({ error: { message: 'Invalid request payload', statusCode: 400 } });
  }
  next();
});
app.use(cors({
  origin: function(origin, callback) {
    const allowed = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [];
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
app.use('/api/exams', questionRoutes); // Registered first to handle /questions/:id before /:examId
app.use('/api/exams', examRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

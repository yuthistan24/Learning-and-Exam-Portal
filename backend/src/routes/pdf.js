const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfController = require('../controllers/pdfController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 80);
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `${Date.now()}_${safeBase}${ext}`);
  }
});

function pdfFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isPdf = ext === '.pdf' && mime.includes('pdf');
  if (!isPdf) {
    return cb(new AppError('Only PDF files are allowed', 400));
  }
  cb(null, true);
}

// Configure multer for temporary PDF storage with validation
const upload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

// Upload PDF and extract raw text
router.post('/upload', authenticateToken, authorizeRole('teacher', 'admin'), upload.single('pdf'), pdfController.uploadAndExtractText);

// Parse raw text into structured questions
router.post('/parse', authenticateToken, authorizeRole('teacher', 'admin'), pdfController.parseTextToQuestions);

module.exports = router;

const axios = require('axios');
const { logger } = require('../utils/logger');

const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const timeout = parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 90000;

const pythonClient = axios.create({
  baseURL: pythonServiceUrl,
  timeout,
});

// ── Evaluate single answer ─────────────────────────────────────────────────
const evaluateAnswer = async (evaluationData) => {
  try {
    const response = await pythonClient.post('/api/evaluate', evaluationData);
    return response.data;
  } catch (error) {
    logger.error('Python evaluation service error:', error.message);
    throw error;
  }
};

// ── Batch evaluate answers ─────────────────────────────────────────────────
const batchEvaluate = async (answers, examId) => {
  try {
    const response = await pythonClient.post('/api/evaluate/batch', { answers, examId });
    return response.data;
  } catch (error) {
    logger.error('Batch evaluation error:', error.message);
    throw error;
  }
};

// ── Health check ───────────────────────────────────────────────────────────
const healthCheck = async () => {
  try {
    const response = await pythonClient.get('/api/health');
    return response.data;
  } catch (error) {
    logger.error('Python service health check failed:', error.message);
    return { status: 'unavailable', ollamaAvailable: false };
  }
};

// ── OCR: extract text from PDF (raw bytes) ─────────────────────────────────
const ocrExtract = async (pdfBuffer) => {
  try {
    const response = await pythonClient.post('/api/ocr/extract', pdfBuffer, {
      headers: { 'Content-Type': 'application/pdf' },
    });
    return response.data;
  } catch (error) {
    logger.error('OCR PDF extraction error:', error.message);
    throw error;
  }
};

// ── OCR: extract text from image file ─────────────────────────────────────
const ocrExtractImage = async (imageBuffer, mimeType = 'image/png', filename = 'upload.png') => {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename,
      contentType: mimeType,
    });
    const response = await pythonClient.post('/api/ocr/image', form, {
      headers: { ...form.getHeaders() },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    logger.error('OCR image extraction error:', error.message);
    throw error;
  }
};

// ── OCR service status ─────────────────────────────────────────────────────
const ocrStatus = async () => {
  try {
    const response = await pythonClient.get('/api/ocr/status');
    return response.data;
  } catch (error) {
    logger.error('OCR status check failed:', error.message);
    return { pytesseractAvailable: false, pymupdfAvailable: false };
  }
};

module.exports = {
  evaluateAnswer,
  batchEvaluate,
  healthCheck,
  ocrExtract,
  ocrExtractImage,
  ocrStatus,
};

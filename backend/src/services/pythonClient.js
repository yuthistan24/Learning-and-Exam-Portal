const axios = require('axios');
const { logger } = require('../utils/logger');

const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const timeout = parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 30000;

const pythonClient = axios.create({
  baseURL: pythonServiceUrl,
  timeout
});

// Evaluate single answer
const evaluateAnswer = async (evaluationData) => {
  try {
    const response = await pythonClient.post('/api/evaluate', evaluationData);
    return response.data;
  } catch (error) {
    logger.error('Python evaluation service error:', error.message);
    throw error;
  }
};

// Batch evaluate answers
const batchEvaluate = async (answers, examId) => {
  try {
    const response = await pythonClient.post('/api/evaluate/batch', {
      answers,
      examId
    });
    return response.data;
  } catch (error) {
    logger.error('Batch evaluation error:', error.message);
    throw error;
  }
};

// Check service health
const healthCheck = async () => {
  try {
    const response = await pythonClient.get('/api/health');
    return response.data;
  } catch (error) {
    logger.error('Python service health check failed:', error.message);
    return { status: 'unavailable' };
  }
};

// OCR extract text from scanned PDF (raw bytes)
const ocrExtract = async (pdfBuffer) => {
  try {
    const response = await pythonClient.post('/api/ocr/extract', pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('OCR extraction error:', error.message);
    throw error;
  }
};

module.exports = {
  evaluateAnswer,
  batchEvaluate,
  healthCheck,
  ocrExtract
};
